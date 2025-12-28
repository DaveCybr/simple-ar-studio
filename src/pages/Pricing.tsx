// src/pages/Pricing.tsx - Updated with Stripe Integration
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
import { Scan, Check, ArrowLeft, Loader2, Crown } from "lucide-react";
import { GuestLayout } from "@/components/layouts/GuestLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  // Stripe Price IDs - GANTI INI DENGAN PRICE ID DARI STRIPE DASHBOARD
  const STRIPE_PRICES = {
    pro_monthly: "price_1234567890", // Ganti dengan Price ID Stripe mu
    enterprise_monthly: "price_0987654321", // Ganti dengan Price ID Stripe mu
  };

  const plans = [
    {
      name: "Free",
      price: "Rp 0",
      period: "/bulan",
      description: "Untuk pemula yang ingin mencoba",
      features: [
        "3 upload per bulan",
        "Lihat AR unlimited",
        "Dukungan video & gambar",
        "Akses web-based",
      ],
      buttonText: "Mulai Gratis",
      buttonVariant: "outline" as const,
      popular: false,
      priceId: null,
      tier: "free",
    },
    {
      name: "Pro",
      price: "Rp 99.000",
      period: "/bulan",
      description: "Untuk kreator dan bisnis kecil",
      features: [
        "50 upload per bulan",
        "Lihat AR unlimited",
        "Dukungan video & gambar",
        "Akses web-based",
        "Prioritas support",
        "Analytics dasar",
      ],
      buttonText: "Upgrade ke Pro",
      buttonVariant: "default" as const,
      popular: true,
      priceId: STRIPE_PRICES.pro_monthly,
      tier: "pro",
    },
    {
      name: "Enterprise",
      price: "Rp 499.000",
      period: "/bulan",
      description: "Untuk bisnis dan tim besar",
      features: [
        "Upload unlimited",
        "Lihat AR unlimited",
        "Dukungan video & gambar",
        "Akses web-based",
        "Prioritas support 24/7",
        "Analytics lengkap",
        "Custom branding",
        "API access",
      ],
      buttonText: "Upgrade ke Enterprise",
      buttonVariant: "outline" as const,
      popular: false,
      priceId: STRIPE_PRICES.enterprise_monthly,
      tier: "enterprise",
    },
  ];

  const handleSubscribe = async (
    priceId: string | null,
    tier: string,
    planName: string
  ) => {
    // If free plan, just redirect to signup
    if (!priceId) {
      navigate("/auth");
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Silakan login terlebih dahulu untuk melakukan upgrade",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(tier);

    try {
      // Call Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: {
            priceId,
            plan: tier,
          },
        }
      );

      if (error) throw error;

      if (!data?.url) {
        throw new Error("No checkout URL returned");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal membuat checkout session. Silakan coba lagi.",
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
                Pilih Paket yang Sesuai
              </h1>
              <p className="text-lg text-muted-foreground">
                Mulai gratis, upgrade kapanpun sesuai kebutuhan Anda
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.popular
                      ? "border-primary shadow-lg shadow-primary/10 scale-105"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
                      <Crown className="w-3 h-3 mr-1" />
                      Paling Populer
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <div className="p-1 rounded-full bg-primary/10">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.buttonVariant}
                      className="w-full"
                      onClick={() =>
                        handleSubscribe(plan.priceId, plan.tier, plan.name)
                      }
                      disabled={loading === plan.tier}
                    >
                      {loading === plan.tier ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.buttonText
                      )}
                    </Button>
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
              Pertanyaan Umum
            </h2>

            <div className="max-w-2xl mx-auto space-y-6">
              {[
                {
                  q: "Apa yang dimaksud dengan upload?",
                  a: "Upload adalah setiap kali Anda mengunggah marker baru beserta kontennya (video atau gambar) ke platform.",
                },
                {
                  q: "Apakah lihat AR dihitung?",
                  a: "Tidak! Semua paket termasuk unlimited views. Anda dan siapapun bisa scan AR tanpa batasan.",
                },
                {
                  q: "Bisa upgrade atau downgrade?",
                  a: "Ya, Anda bisa mengubah paket kapanpun melalui Billing Portal. Perubahan akan berlaku di periode billing berikutnya.",
                },
                {
                  q: "Bagaimana cara pembayaran?",
                  a: "Kami menggunakan Stripe untuk pemrosesan pembayaran yang aman. Menerima semua kartu kredit/debit utama.",
                },
                {
                  q: "Apakah ada kontrak jangka panjang?",
                  a: "Tidak, semua paket berbasis bulanan dan bisa dibatalkan kapan saja tanpa penalti.",
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
                  <span>30-Day Money Back</span>
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
