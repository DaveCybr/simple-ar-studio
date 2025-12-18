import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scan, Check, ArrowLeft } from "lucide-react";

const Pricing = () => {
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
        "Akses web-based"
      ],
      buttonText: "Mulai Gratis",
      buttonVariant: "outline" as const,
      popular: false
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
        "Analytics dasar"
      ],
      buttonText: "Pilih Pro",
      buttonVariant: "default" as const,
      popular: true
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
        "API access"
      ],
      buttonText: "Hubungi Kami",
      buttonVariant: "outline" as const,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Scan className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">AR Manager</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Masuk</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
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
                className={`relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/10 scale-105' : 'border-border'}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
                    Paling Populer
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
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
                  <Link to="/auth" className="block">
                    <Button variant={plan.buttonVariant} className="w-full">
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Pertanyaan Umum</h2>
          
          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                q: "Apa yang dimaksud dengan upload?",
                a: "Upload adalah setiap kali Anda mengunggah marker baru beserta kontennya (video atau gambar) ke platform."
              },
              {
                q: "Apakah lihat AR dihitung?",
                a: "Tidak! Semua paket termasuk unlimited views. Anda dan siapapun bisa scan AR tanpa batasan."
              },
              {
                q: "Bisa upgrade atau downgrade?",
                a: "Ya, Anda bisa mengubah paket kapanpun. Perubahan akan berlaku di periode billing berikutnya."
              },
              {
                q: "Bagaimana cara pembayaran?",
                a: "Kami menerima berbagai metode pembayaran termasuk kartu kredit, transfer bank, dan e-wallet. (Coming Soon)"
              }
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

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 Web AR Manager. Dibuat dengan MindAR.js & Cloudinary</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
