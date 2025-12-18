import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Scan, Info } from "lucide-react";

const Index = () => {
  const [showAR, setShowAR] = useState(false);

  if (showAR) {
    return (
      <div className="relative w-full h-screen">
        <iframe
          src="/ar.html"
          className="w-full h-full border-0"
          allow="camera; gyroscope; accelerometer"
        />
        <Button
          onClick={() => setShowAR(false)}
          className="absolute top-4 left-4 z-10"
          variant="secondary"
        >
          ← Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-primary/10 animate-pulse-slow">
              <Scan className="w-16 h-16 text-primary" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Web <span className="text-primary">AR</span> Experience
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Augmented Reality berbasis marker menggunakan MindAR dan A-Frame. 
              Arahkan kamera ke marker untuk melihat objek 3D.
            </p>

            <Button 
              onClick={() => setShowAR(true)}
              size="lg"
              className="gap-2 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Camera className="w-5 h-5" />
              Mulai AR
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Cara Menggunakan
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Klik Mulai AR</h3>
              <p className="text-muted-foreground text-sm">
                Izinkan akses kamera saat diminta
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Arahkan ke Marker</h3>
              <p className="text-muted-foreground text-sm">
                Scan gambar marker dengan kamera
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Lihat AR</h3>
              <p className="text-muted-foreground text-sm">
                Objek 3D akan muncul di atas marker
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marker Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm mb-6">
            <Info className="w-4 h-4" />
            Marker yang digunakan
          </div>
          
          <div className="p-8 bg-card rounded-2xl border border-border">
            <img 
              src="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/examples/image-tracking/assets/card-example/card.png"
              alt="AR Marker"
              className="max-w-xs mx-auto rounded-lg shadow-md"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Print atau tampilkan gambar ini di layar lain, lalu scan dengan kamera
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Dibuat dengan MindAR.js & A-Frame</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
