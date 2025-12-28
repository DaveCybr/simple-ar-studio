// supabase/functions/create-checkout/index.ts
// ✅ FIXED VERSION - Konsisten dengan stripe-webhook

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ 1. Initialize Stripe dengan nama variable yang konsisten
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

    // ✅ 2. Get authenticated user
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Supabase not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Authentication failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📝 Creating checkout for user: ${user.id}`);

    // ✅ 3. Get request body
    const { priceId, plan } = await req.json();

    if (!priceId || !plan) {
      return new Response(
        JSON.stringify({
          error: "Price ID and plan are required",
          received: { priceId, plan },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`💳 Plan selected: ${plan}, Price ID: ${priceId}`);

    // ✅ 4. Get or create Stripe customer
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("❌ Profile fetch error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log("🆕 Creating new Stripe customer");

      try {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            supabase_user_id: user.id,
          },
        });

        customerId = customer.id;

        // Save customer ID to database
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("⚠️ Failed to save customer ID:", updateError);
          // Continue anyway, customer is created in Stripe
        }

        console.log(`✅ Created Stripe customer: ${customerId}`);
      } catch (stripeError: any) {
        console.error("❌ Stripe customer creation failed:", stripeError);
        return new Response(
          JSON.stringify({
            error: "Failed to create Stripe customer",
            message: stripeError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.log(`✅ Using existing Stripe customer: ${customerId}`);
    }

    // ✅ 5. Create checkout session with proper error handling
    console.log("🛒 Creating checkout session...");

    const origin = req.headers.get("origin") || "http://localhost:3000";

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          user_id: user.id,
          plan: plan,
        },
        // ✅ Enable customer portal for subscription management
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan: plan,
          },
        },
        // ✅ Allow promotion codes
        allow_promotion_codes: true,
        // ✅ Billing address collection
        billing_address_collection: "auto",
      });

      console.log(`✅ Checkout session created: ${session.id}`);

      return new Response(
        JSON.stringify({
          sessionId: session.id,
          url: session.url,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (stripeError: any) {
      console.error("❌ Checkout session creation failed:", stripeError);
      return new Response(
        JSON.stringify({
          error: "Failed to create checkout session",
          message: stripeError.message,
          type: stripeError.type,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
