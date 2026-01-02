// supabase/functions/stripe-webhook/index.ts
// ✅ FIXED VERSION - Type-safe dengan proper error handling

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// ✅ Type-safe subscription tier mapping
type SubscriptionTier = "demo" | "pro" | "pro_plus";

interface TierConfig {
  tier: SubscriptionTier;
  quota: number;
}

// ✅ Map Stripe product/plan names to our database tiers
const TIER_MAPPING: Record<string, TierConfig> = {
  // Stripe metadata plan values
  demo: { tier: "demo", quota: 5 },
  free: { tier: "demo", quota: 5 },
  pro: { tier: "pro", quota: 20 },
  pro_plus: { tier: "pro_plus", quota: 30 },
  enterprise: { tier: "pro_plus", quota: 30 },

  // Fallback for old names
  starter: { tier: "demo", quota: 5 },
  basic: { tier: "pro", quota: 20 },
  premium: { tier: "pro_plus", quota: 30 },
};

function mapPlanToTier(planName: string): TierConfig {
  const normalized = planName.toLowerCase().trim();
  return TIER_MAPPING[normalized] || { tier: "demo", quota: 5 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("📨 Webhook request received");

  try {
    // ========================================
    // 1. Initialize Stripe
    // ========================================
    const stripeApiKey = Deno.env.get("STRIPE_API_KEY");
    if (!stripeApiKey) {
      console.error("❌ STRIPE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeApiKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // ========================================
    // 2. Verify Webhook Signature
    // ========================================
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("❌ No Stripe signature found");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SIGNING_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      const cryptoProvider = Stripe.createSubtleCryptoProvider();
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
      console.log("✅ Webhook verified:", event.type);
    } catch (err: any) {
      console.error("❌ Signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================
    // 3. Initialize Supabase Admin Client
    // ========================================
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ========================================
    // 4. Handle Webhook Events
    // ========================================
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planFromMetadata = session.metadata?.plan || "pro";

        console.log("💳 Checkout completed:", { userId, planFromMetadata });

        if (!userId) {
          console.warn("⚠️ No user_id in session metadata");
          break;
        }

        const config = mapPlanToTier(planFromMetadata);

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: config.tier,
            upload_quota: config.quota,
            stripe_customer_id: session.customer as string,
            is_trial_active: false, // ✅ Disable trial when upgrading
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("❌ Database update error:", error);
          throw error;
        }

        console.log(
          `✅ User ${userId} upgraded to ${config.tier} with quota ${config.quota}`
        );
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`🔄 Subscription ${event.type}:`, {
          customerId,
          status: subscription.status,
        });

        // Find user by stripe_customer_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profileError) {
          console.error("❌ Profile lookup error:", profileError);
          break;
        }

        if (!profile) {
          console.warn("⚠️ No profile found for customer:", customerId);
          break;
        }

        const planFromMetadata = subscription.metadata?.plan || "pro";
        const config = mapPlanToTier(planFromMetadata);

        // Only update if subscription is active
        if (subscription.status === "active") {
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: config.tier,
              upload_quota: config.quota,
              is_trial_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) {
            console.error("❌ Database update error:", error);
            throw error;
          }

          console.log(
            `✅ Subscription active: user ${profile.id} → ${config.tier}`
          );
        } else if (subscription.status === "past_due") {
          // Don't downgrade immediately on past_due, wait for payment_failed
          console.log(`⚠️ Subscription past_due for user ${profile.id}`);
        } else if (subscription.status === "canceled") {
          // Downgrade to demo
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "demo",
              upload_quota: 5,
              is_trial_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) {
            console.error("❌ Downgrade error:", error);
          } else {
            console.log(`✅ User ${profile.id} downgraded to demo (canceled)`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("❌ Subscription deleted:", customerId);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "demo",
              upload_quota: 5,
              is_trial_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) {
            console.error("❌ Downgrade error:", error);
          } else {
            console.log(`✅ User ${profile.id} downgraded to demo`);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`✅ Payment succeeded: ${invoice.id}`);

        // Optional: Send success email or notification
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`❌ Payment failed: ${invoice.id}`);

        // Find profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile && profile.subscription_tier !== "demo") {
          // Downgrade to demo after payment failure
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "demo",
              upload_quota: 5,
              is_trial_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) {
            console.error("❌ Payment failure downgrade error:", error);
          } else {
            console.log(
              `⚠️ User ${profile.id} downgraded to demo (payment failed)`
            );
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event: ${event.type}`);
    }

    // ========================================
    // 5. Return Success Response
    // ========================================
    return new Response(
      JSON.stringify({
        received: true,
        eventId: event.id,
        eventType: event.type,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        error: "Processing failed",
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
