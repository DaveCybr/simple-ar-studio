// supabase/functions/stripe-webhook/index.ts
// ✅ FIXED VERSION - Compatible with database schema

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("📨 Webhook request received");

  // Validate Stripe API Key
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

  const cryptoProvider = Stripe.createSubtleCryptoProvider();

  // Validate signature
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("❌ No Stripe signature found");
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SIGNING_SECRET not configured");
    }

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

  // Initialize Supabase with service role for admin operations
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Supabase credentials not configured");
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // ✅ HELPER: Map plan names to valid database enum values
  // Database enum: 'free' | 'pro' | 'enterprise'
  type SubscriptionTier = "free" | "pro" | "enterprise";

  const mapPlanToTier = (plan: string): SubscriptionTier => {
    const planMap: Record<string, SubscriptionTier> = {
      free: "free",
      pro: "pro",
      pro_plus: "enterprise",
      enterprise: "enterprise",
      // Fallback mappings
      starter: "free",
      basic: "pro",
      premium: "enterprise",
    };
    return planMap[plan.toLowerCase()] || "free";
  };

  // ✅ HELPER: Get quota for subscription tier
  const getQuotaForTier = (tier: SubscriptionTier): number => {
    const quotas: Record<SubscriptionTier, number> = {
      free: 3,
      pro: 20,
      enterprise: 100,
    };
    return quotas[tier];
  };

  try {
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

        const tier = mapPlanToTier(planFromMetadata);
        const quota = getQuotaForTier(tier);

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: tier,
            upload_quota: quota,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("❌ Database update error:", error);
          throw error;
        }
        console.log(`✅ User ${userId} upgraded to ${tier} with quota ${quota}`);
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
          .select("id")
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

        // Get plan from subscription metadata
        const planFromMetadata = subscription.metadata?.plan || "pro";
        const tier = mapPlanToTier(planFromMetadata);
        const quota = getQuotaForTier(tier);

        // Only update if subscription is active
        if (subscription.status === "active") {
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: tier,
              upload_quota: quota,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) {
            console.error("❌ Database update error:", error);
            throw error;
          }
          console.log(`✅ Subscription active: user ${profile.id} → ${tier}`);
        } else {
          console.log(`ℹ️ Subscription status: ${subscription.status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("❌ Subscription canceled:", customerId);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          // Downgrade to free tier
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              upload_quota: 3,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) {
            console.error("❌ Downgrade error:", error);
            throw error;
          }
          console.log(`✅ User ${profile.id} downgraded to free`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`✅ Payment succeeded: ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`❌ Payment failed: ${invoice.id}`);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          // Downgrade to free on payment failure
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              upload_quota: 3,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) {
            console.error("❌ Payment failure downgrade error:", error);
          }
          console.log(`⚠️ User ${profile.id} downgraded due to payment failure`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event: ${event.type}`);
    }

    return new Response(
      JSON.stringify({
        received: true,
        eventId: event.id,
        eventType: event.type,
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
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
