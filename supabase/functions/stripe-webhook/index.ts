// supabase/functions/stripe-webhook/index.ts - FIXED VERSION
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    console.error("No Stripe signature found");
    return new Response(JSON.stringify({ error: "No Stripe signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("✅ Received event:", event.type);

  // Initialize Supabase client with SERVICE ROLE KEY (no auth needed)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // PENTING: Pakai SERVICE_ROLE_KEY
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Handle different event types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        console.log("Processing checkout.session.completed", {
          userId,
          plan,
          customerId: session.customer,
        });

        if (userId && plan) {
          // Determine upload quota based on plan
          let uploadQuota = 3; // default
          if (plan === "demo") uploadQuota = 999999;
          else if (plan === "pro") uploadQuota = 20;
          else if (plan === "pro_plus") uploadQuota = 30;

          // Update user subscription
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: plan,
              upload_quota: uploadQuota,
              stripe_customer_id: session.customer as string,
              is_trial_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) {
            console.error("Database update error:", error);
            throw error;
          }

          console.log(`✅ Updated user ${userId} to ${plan} plan`);
        } else {
          console.warn("Missing userId or plan in metadata", {
            userId,
            plan,
            metadata: session.metadata,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Processing customer.subscription.updated", {
          customerId,
          status: subscription.status,
        });

        // Get user from customer ID
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (fetchError) {
          console.error("Profile fetch error:", fetchError);
          throw fetchError;
        }

        if (profile) {
          let newTier = "demo";
          let newQuota = 999999;

          if (subscription.status === "active") {
            // Determine tier from subscription metadata or price
            const metadata = subscription.metadata;
            if (metadata?.plan) {
              newTier = metadata.plan;
              if (newTier === "pro") newQuota = 20;
              else if (newTier === "pro_plus") newQuota = 30;
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
            console.error("Update error:", updateError);
            throw updateError;
          }

          console.log(`✅ Subscription updated for user ${profile.id}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Processing customer.subscription.deleted", { customerId });

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // Downgrade to demo
          await supabase
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

          console.log(`✅ Subscription canceled for user ${profile.id}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`✅ Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`❌ Payment failed for invoice ${invoice.id}`);
        // TODO: Send email notification to user
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        type: error.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
