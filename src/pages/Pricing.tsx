// src/pages/Pricing.tsx - Fixed Version
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown, Sparkles } from "lucide-react";
import { GuestLayout } from "@/components/layouts/GuestLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      name: "Demo",
      price: "$0",
      period: "/month",
      description: "14 days without adding your card",
      priceId: null,
      plan: "demo",
      buttonText: "Start for FREE",
      buttonVariant: "outline" as const,
      features: [
        "Full access to the Pro functions",
        "Views / Scans QR - unlimited",
        "Number of projects / AR-photos - unlimited",
      ],
      limitations: [
        "Project storage - 20 days",
        "Access to the platform - 14 days",
        "Watermark - all projects",
        "Account Manager - no",
      ],
    },
    {
      name: "PRO",
      price: "$29",
      period: "/month",
      yearlyPrice: "$24/mo if billed year",
      priceId: "price_1SjLcR2LSlGk7TpHhY1p4qsC", // <-- Ganti dengan Price ID dari Stripe
      plan: "pro",
      popular: true,
      buttonText: "Buy now PRO",
      buttonVariant: "default" as const,
      features: [
        "Full access to the Pro functions",
        "Views / Scans QR per month - unlimited",
        "Number of projects /AR-photos - 20",
        "Project storage - unlimited",
        "Access to the platform - 1 month",
        "Watermark - no",
        "Account Manager - yes",
        "Top up of projects / photos - yes",
      ],
    },
    {
      name: "PRO+",
      price: "$39",
      period: "/month",
      yearlyPrice: "$32/mo if billed year",
      priceId: "price_1SjLd62LSlGk7TpH1yaPXeVN", // <-- Ganti dengan Price ID dari Stripe
      plan: "pro_plus",
      badge: "NEW",
      buttonText: "Buy now PRO+",
      buttonVariant: "default" as const,
      features: [
        "Full access to the Pro functions",
        "Views / Scans QR per month - unlimited",
        "Number of projects /AR-photos - 30",
        "Project storage - unlimited",
        "Access to the platform - 1 year",
        "Watermark - no",
        "Account Manager - yes",
        "Top up of projects / photos - yes",
        "Video Editor",
        "Instant Code Generation",
        "Priority Upload to Servers",
        "QR Placement on Photos",
        "Public Link",
        "Analytics",
      ],
    },
  ];

  const handleSubscribe = async (
    priceId: string | null,
    planType: string,
    planName: string
  ) => {
    // If free plan, just redirect to signup/dashboard
    if (!priceId) {
      if (!user) {
        navigate("/auth");
      } else {
        navigate("/dashboard");
      }
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login first to upgrade your plan",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(planType);

    try {
      console.log("Starting checkout with:", { priceId, plan: planType });

      // Call Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: {
            priceId,
            plan: planType,
          },
        }
      );

      if (error) {
        console.error("Checkout error details:", error);
        throw error;
      }

      if (!data?.url) {
        throw new Error("No checkout URL returned");
      }

      console.log("Redirecting to Stripe Checkout:", data.url);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <GuestLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-4">
                Simple Pricing
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Choose the Right Plan for You
              </h1>
              <p className="text-lg text-muted-foreground">
                Start free, upgrade anytime as your needs grow
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.popular
                      ? "border-primary shadow-lg shadow-primary/10 md:scale-105"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-orange-500">
                      <Crown className="w-3 h-3 mr-1" />
                      POPULAR
                    </Badge>
                  )}

                  {plan.badge && !plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-orange-500">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-sm mt-2">
                      {plan.description}
                    </CardDescription>
                    <div className="pt-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-base">
                          {plan.period}
                        </span>
                      </div>
                      {plan.yearlyPrice && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {plan.yearlyPrice}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <Button
                      variant={plan.buttonVariant}
                      className="w-full h-12 text-base font-semibold"
                      onClick={() =>
                        handleSubscribe(plan.priceId, plan.plan, plan.name)
                      }
                      disabled={loading === plan.plan}
                    >
                      {loading === plan.plan ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.buttonText
                      )}
                    </Button>

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="mt-0.5 p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm text-foreground/80 flex-1">
                            {feature}
                          </span>
                        </li>
                      ))}

                      {plan.limitations &&
                        plan.limitations.map((limitation, index) => (
                          <li
                            key={`limit-${index}`}
                            className="flex items-start gap-3 opacity-60"
                          >
                            <div className="mt-0.5 p-1 rounded-full bg-red-100 dark:bg-red-900/30">
                              <span className="text-xs text-red-600 dark:text-red-400">
                                ✗
                              </span>
                            </div>
                            <span className="text-sm line-through text-muted-foreground flex-1">
                              {limitation}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="max-w-2xl mx-auto space-y-6">
              {[
                {
                  q: "What counts as an upload?",
                  a: "An upload is each time you create a new AR marker with its content (video or image) on the platform.",
                },
                {
                  q: "Are AR views counted?",
                  a: "No! All plans include unlimited views. You and anyone can scan AR without limitations.",
                },
                {
                  q: "Can I upgrade or downgrade?",
                  a: "Yes, you can change your plan anytime through the Billing Portal. Changes will take effect in the next billing period.",
                },
                {
                  q: "How does payment work?",
                  a: "We use Stripe for secure payment processing. Accepts all major credit/debit cards.",
                },
                {
                  q: "Is there a long-term contract?",
                  a: "No, all plans are monthly-based and can be canceled anytime without penalty.",
                },
              ].map((faq) => (
                <Card key={faq.q} className="bg-card/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Secure Payment via Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Cancel Anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>14-Day Free Trial</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </GuestLayout>
  );
};

export default Pricing;
