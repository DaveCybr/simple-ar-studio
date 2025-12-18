import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Scan, 
  Upload, 
  Eye, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  Check,
  Sparkles
} from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Upload,
      title: "Upload Mudah",
      description: "Upload marker dan konten dalam hitungan detik dengan drag & drop"
    },
    {
      icon: Eye,
      title: "Lihat AR Instan",
      description: "Scan marker langsung dari browser tanpa install aplikasi"
    },
    {
      icon: Zap,
      title: "Cepat & Ringan",
      description: "Teknologi MindAR.js yang dioptimasi untuk performa terbaik"
    },
    {
      icon: Shield,
      title: "Aman & Private",
      description: "Data Anda terenkripsi dan hanya dapat diakses oleh Anda"
    },
    {
      icon: Globe,
      title: "Akses Dimana Saja",
      description: "Berbasis web, akses dari perangkat apapun kapanpun"
    },
    {
      icon: Sparkles,
      title: "Video & Gambar",
      description: "Dukung berbagai format konten AR termasuk video dan gambar"
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
            <Link to="/pricing">
              <Button variant="ghost" size="sm">Harga</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Masuk</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.2),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Platform AR No. 1 di Indonesia
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Buat Pengalaman{" "}
              <span className="text-primary relative">
                AR
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/20 rounded-full blur-sm" />
              </span>{" "}
              dalam Hitungan Menit
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload marker, tambahkan konten video atau gambar, dan langsung bagikan pengalaman Augmented Reality Anda ke seluruh dunia.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 h-14 shadow-lg shadow-primary/25">
                  Mulai Gratis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  Lihat Harga
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              ✓ 3 Upload gratis setiap bulan &nbsp; ✓ Tidak perlu kartu kredit
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Semua yang Anda Butuhkan
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Platform lengkap untuk membuat, mengelola, dan membagikan konten AR
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cara Kerja
            </h2>
            <p className="text-muted-foreground text-lg">
              Hanya 3 langkah mudah untuk membuat AR
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Upload Marker", desc: "Upload gambar yang akan menjadi target scan AR" },
              { step: "2", title: "Tambah Konten", desc: "Pilih video atau gambar yang akan muncul di AR" },
              { step: "3", title: "Bagikan!", desc: "Scan marker dan bagikan pengalaman AR Anda" }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap Membuat AR Pertama Anda?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Mulai gratis hari ini dan lihat betapa mudahnya membuat pengalaman AR yang menakjubkan.
              </p>
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 h-14">
                  Daftar Gratis Sekarang
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
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

export default Landing;
