// src/pages/Landing.tsx - Refactored dengan Layout Component
import { Link } from "react-router-dom";
import { GuestLayout } from "@/components/layouts/GuestLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Eye,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Building2,
  GraduationCap,
  ShoppingBag,
  Palette,
  Star,
  Play,
  TrendingUp,
} from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Upload,
      title: "Upload Mudah",
      description:
        "Drag & drop marker dan konten dalam hitungan detik. Mendukung format JPG, PNG, MP4, dan WebM",
    },
    {
      icon: Eye,
      title: "Real-Time Preview",
      description:
        "Lihat hasil AR secara langsung tanpa perlu compile atau install aplikasi tambahan",
    },
    {
      icon: Zap,
      title: "Performance Tinggi",
      description:
        "Optimized dengan MindAR.js untuk loading cepat dan tracking akurat pada berbagai device",
    },
    {
      icon: Shield,
      title: "Keamanan Terjamin",
      description:
        "Enkripsi end-to-end, backup otomatis, dan compliance dengan standar keamanan data",
    },
    {
      icon: Globe,
      title: "Cross-Platform",
      description:
        "Bekerja di semua browser modern, iOS, Android tanpa install aplikasi apapun",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Track views, engagement, dan performa konten AR Anda dengan detail",
    },
  ];

  const useCases = [
    {
      icon: Building2,
      title: "Marketing & Branding",
      description:
        "Buat kampanye interaktif, product demo AR, dan pengalaman brand yang memorable",
      examples: [
        "Product Catalog AR",
        "Interactive Poster",
        "Brand Activation",
      ],
    },
    {
      icon: GraduationCap,
      title: "Pendidikan",
      description:
        "Transformasi materi pembelajaran dengan visualisasi 3D dan konten interaktif",
      examples: ["E-Learning AR", "Virtual Lab", "Interactive Textbook"],
    },
    {
      icon: ShoppingBag,
      title: "E-Commerce",
      description:
        "Try-before-you-buy experience dan product visualization untuk boost conversion",
      examples: ["Virtual Try-On", "Product Demo", "AR Packaging"],
    },
    {
      icon: Palette,
      title: "Kreative & Seni",
      description:
        "Exhibisi virtual, art installation AR, dan portfolio interaktif",
      examples: ["Virtual Gallery", "AR Art", "Portfolio Showcase"],
    },
  ];

  const stats = [
    { value: "1000+", label: "Active Users" },
    { value: "50K+", label: "AR Experiences" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9/5", label: "User Rating" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director, TechCorp",
      content:
        "Platform AR terbaik yang pernah kami gunakan. ROI campaign meningkat 300%!",
      avatar: "SJ",
    },
    {
      name: "Dr. Ahmad Rizki",
      role: "Lecturer, Universitas Indonesia",
      content:
        "Students lebih engaged dengan materi pembelajaran. Game changer untuk edukasi!",
      avatar: "AR",
    },
    {
      name: "Lisa Chen",
      role: "Creative Director, Studio XYZ",
      content:
        "Intuitive, powerful, dan hasil AR-nya stunning. Highly recommended!",
      avatar: "LC",
    },
  ];

  return (
    <GuestLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.2),transparent_50%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by 1000+ Companies & Creators
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Transform Ideas Into{" "}
              <span className="text-primary relative inline-block">
                Augmented Reality
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="12"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 10C60 2 140 2 198 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.3"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Platform Web AR profesional untuk bisnis, edukasi, dan kreator.
              Buat, kelola, dan distribusikan konten AR berkualitas tinggi tanpa
              coding.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="text-lg px-8 h-14 shadow-lg shadow-primary/25"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-14"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>3 projects/month free</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Create AR
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful tools dan features untuk membuat AR experience yang
              engaging
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border/50 hover:shadow-lg transition-all"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Use Cases
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect for Every Industry
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Dari marketing campaign hingga edukasi, AR solution untuk setiap
              kebutuhan
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {useCases.map((useCase) => (
              <Card key={useCase.title} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <useCase.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl mb-2">
                        {useCase.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {useCase.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {useCase.examples.map((example) => (
                          <Badge
                            key={example}
                            variant="secondary"
                            className="text-xs"
                          >
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Create AR in 3 Easy Steps
            </h2>
            <p className="text-muted-foreground text-lg">
              Dari upload sampai deploy, hanya butuh beberapa menit
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Upload Marker Image",
                desc: "Upload gambar yang akan dijadikan target AR. Bisa logo, poster, atau object apapun",
                icon: Upload,
              },
              {
                step: "02",
                title: "Add AR Content",
                desc: "Tambahkan video, gambar, atau 3D object yang akan muncul saat marker di-scan",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Share & Track",
                desc: "Generate link, QR code, atau embed. Monitor performance dengan real-time analytics",
                icon: TrendingUp,
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <Card className="border-border/50 hover:shadow-lg transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-4xl font-bold text-primary/20">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
                {item.step !== "03" && (
                  <div className="hidden md:block absolute top-1/2 -right-4 z-10">
                    <ArrowRight className="w-8 h-8 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/tutorial">
              <Button variant="outline" size="lg">
                Lihat Tutorial Lengkap
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Professionals
            </h2>
            <p className="text-muted-foreground text-lg">
              Apa kata user kami tentang platform ini
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
            <CardContent className="p-12 text-center relative z-10">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Create Amazing AR?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join 1000+ companies dan creators yang sudah menggunakan
                platform kami. Start your free trial today!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8 h-14">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 h-14"
                  >
                    Compare Plans
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • 3 projects free • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </GuestLayout>
  );
};

export default Landing;
