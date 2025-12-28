// supabase/functions/stripe-webhook/index.ts
// ✅ IMPROVED VERSION with better plan detection

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("📨 Webhook request received");

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // ✅ HELPER FUNCTION: Detect plan from Price ID
  const getPlanFromPriceId = (priceId: string): string => {
    // Match dengan Price IDs di Pricing.tsx
    const PRICE_ID_MAP: Record<string, string> = {
      price_1SjLcR2LSlGk7TpHhY1p4qsC: "pro",
      price_1SjLd62LSlGk7TpH1yaPXeVN: "pro_plus",
    };

    return PRICE_ID_MAP[priceId] || "demo";
  };

  // ✅ HELPER FUNCTION: Get quota for plan
  const getQuotaForPlan = (plan: string): number => {
    const quotas: Record<string, number> = {
      demo: 999999,
      pro: 20,
      pro_plus: 30,
    };
    return quotas[plan] || 3;
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan || "demo";

        console.log("💳 Checkout completed:", { userId, plan });

        if (!userId) {
          console.warn("⚠️ No user_id in metadata");
          break;
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: plan,
            upload_quota: getQuotaForPlan(plan),
            stripe_customer_id: session.customer as string,
            is_trial_active: false,
            trial_ends_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;
        console.log(`✅ User ${userId} upgraded to ${plan}`);
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

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          console.warn("⚠️ No profile found for customer:", customerId);
          break;
        }

        // ✅ IMPROVED: Try multiple ways to detect plan
        let detectedPlan = "demo";

        // 1. Try metadata first
        if (subscription.metadata?.plan) {
          detectedPlan = subscription.metadata.plan;
          console.log("📋 Plan from metadata:", detectedPlan);
        }
        // 2. Try Price ID as fallback
        else if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          detectedPlan = getPlanFromPriceId(priceId);
          console.log("💰 Plan from Price ID:", priceId, "→", detectedPlan);
        }

        // Only update if subscription is active
        if (subscription.status === "active") {
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: detectedPlan,
              upload_quota: getQuotaForPlan(detectedPlan),
              is_trial_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) throw error;
          console.log(`✅ Subscription updated for user ${profile.id}`);
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
          .single();

        if (profile) {
          // Downgrade to trial/demo
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: "demo",
              upload_quota: 999999,
              is_trial_active: true,
              trial_ends_at: new Date(
                Date.now() + 14 * 24 * 60 * 60 * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          if (error) throw error;
          console.log(`✅ User ${profile.id} downgraded to demo`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`✅ Payment succeeded: ${invoice.id}`);
        // Additional logic if needed
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
          .single();

        if (profile) {
          // Optionally downgrade or mark as payment issue
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "demo",
              upload_quota: 999999,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          console.log(`⚠️ User ${profile.id} marked as payment failed`);
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
