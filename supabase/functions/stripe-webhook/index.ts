// supabase/functions/stripe-webhook/index.ts
// ✅ FIXED VERSION - Tanpa Authorization Header Check

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// ✅ Initialize Stripe
const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// ✅ WAJIB: Crypto provider untuk Deno
const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("📨 Webhook request received");

  // ✅ Get Stripe signature dari header (ini yang authenticate webhook)
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ No Stripe signature found in headers");
    return new Response(JSON.stringify({ error: "Missing Stripe signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("🔍 Stripe signature found, verifying...");

  // ✅ PENTING: Get raw body sebagai text (bukan JSON)
  const body = await req.text();
  let event: Stripe.Event;

  try {
    // ✅ Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");

    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SIGNING_SECRET not set");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log("✅ Webhook signature verified successfully");
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new Response(
      JSON.stringify({
        error: "Webhook signature verification failed",
        message: err.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(`📥 Received event: ${event.type} [${event.id}]`);

  // ✅ Initialize Supabase Admin Client (TIDAK perlu authorization header)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Supabase credentials not configured");
    return new Response(JSON.stringify({ error: "Supabase not configured" }), {
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

  // ✅ Handle different webhook event types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        console.log("Processing checkout.session.completed:", {
          userId,
          plan,
          customerId: session.customer,
          subscriptionId: session.subscription,
        });

        if (!userId || !plan) {
          console.warn("⚠️ Missing metadata in checkout session:", {
            userId,
            plan,
            metadata: session.metadata,
          });
          break;
        }

        // Determine upload quota based on plan
        let uploadQuota = 3; // default free
        if (plan === "demo") {
          uploadQuota = 999999;
        } else if (plan === "pro") {
          uploadQuota = 20;
        } else if (plan === "pro_plus") {
          uploadQuota = 30;
        }

        // Update user profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: plan,
            upload_quota: uploadQuota,
            stripe_customer_id: session.customer as string,
            is_trial_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error("❌ Database update error:", updateError);
          throw updateError;
        }

        console.log(`✅ Successfully updated user ${userId} to ${plan} plan`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Processing ${event.type}:`, {
          customerId,
          subscriptionId: subscription.id,
          status: subscription.status,
        });

        // Find user by Stripe customer ID
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (fetchError) {
          console.error("❌ Profile fetch error:", fetchError);
          throw fetchError;
        }

        if (!profile) {
          console.warn("⚠️ No profile found for customer:", customerId);
          break;
        }

        // Determine plan and quota
        let newTier = "free";
        let newQuota = 3;

        if (subscription.status === "active") {
          // Try to get plan from metadata
          const metadata = subscription.metadata;
          if (metadata?.plan) {
            newTier = metadata.plan;
            if (newTier === "pro") {
              newQuota = 20;
            } else if (newTier === "pro_plus") {
              newQuota = 30;
            } else if (newTier === "demo") {
              newQuota = 999999;
            }
          }
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: newTier,
            upload_quota: newQuota,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("❌ Subscription update error:", updateError);
          throw updateError;
        }

        console.log(`✅ Subscription updated for user ${profile.id}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Processing customer.subscription.deleted:", {
          customerId,
          subscriptionId: subscription.id,
        });

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // Downgrade to demo/free plan
          const { error: updateError } = await supabase
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

          if (updateError) {
            console.error("❌ Downgrade error:", updateError);
            throw updateError;
          }

          console.log(`✅ Subscription canceled for user ${profile.id}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`✅ Payment succeeded for invoice ${invoice.id}`);
        // Add any additional logic here if needed
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`❌ Payment failed for invoice ${invoice.id}`);

        // Optional: Mark subscription as past_due
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          console.log(`⚠️ User ${profile.id} marked as payment failed`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // ✅ Return success response
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
    console.error("❌ Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Webhook processing failed",
        message: error.message,
        type: error.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
