import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Scan, Upload, List, ArrowLeft } from "lucide-react";
import { ARUploadForm } from "@/components/ARUploadForm";
import { ARContentList } from "@/components/ARContentList";

interface ARContent {
  id: string;
  name: string;
  marker_url: string;
  mind_file_url: string;
  content_url: string;
  content_type: string;
  created_at: string;
}

const Index = () => {
  const [selectedContent, setSelectedContent] = useState<ARContent | null>(null);
  const [showAR, setShowAR] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectContent = (content: ARContent) => {
    setSelectedContent(content);
    setShowAR(true);
  };

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (showAR && selectedContent) {
    return (
      <div className="relative w-full h-screen">
        <iframe
          src={`/ar-viewer.html?mind=${encodeURIComponent(selectedContent.mind_file_url)}&content=${encodeURIComponent(selectedContent.content_url)}&type=${selectedContent.content_type}`}
          className="w-full h-full border-0"
          allow="camera; gyroscope; accelerometer; autoplay"
        />
        <Button
          onClick={() => setShowAR(false)}
          className="absolute top-4 left-4 z-10"
          variant="secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium">
          {selectedContent.name}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Scan className="w-12 h-12 text-primary" />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Web <span className="text-primary">AR</span> Manager
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Upload marker dan konten AR Anda. Mendukung video dan gambar sebagai konten yang ditampilkan di atas marker.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              AR Content
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Baru
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <ARContentList onSelect={handleSelectContent} refresh={refreshKey} />
          </TabsContent>

          <TabsContent value="upload" className="flex justify-center">
            <ARUploadForm onSuccess={handleUploadSuccess} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Instructions */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Cara Menggunakan</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Siapkan Marker", desc: "Gambar JPG/PNG yang akan di-scan" },
              { step: "2", title: "Compile .mind", desc: "Generate file di MindAR Compiler" },
              { step: "3", title: "Upload Konten", desc: "Video atau gambar yang tampil" },
              { step: "4", title: "Scan & Lihat!", desc: "Arahkan kamera ke marker" },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-accent/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              Butuh file .mind? Gunakan{" "}
              <a
                href="https://hiukim.github.io/mind-ar-js-doc/tools/compile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline font-medium"
              >
                MindAR Image Targets Compiler
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Dibuat dengan MindAR.js, A-Frame & Cloudinary</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
