import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Home } from "lucide-react";

interface ARContent {
  id: string;
  name: string;
  marker_url: string;
  mind_file_url: string;
  content_url: string;
  content_type: string;
  scale: number;
}

const ViewAR = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<ARContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) {
        setError("ID tidak valid");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("ar_content")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("Konten AR tidak ditemukan");
        setLoading(false);
        return;
      }

      setContent(data);
      setLoading(false);
    };

    fetchContent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Memuat AR Experience...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">{error || "Terjadi Kesalahan"}</h1>
          <p className="text-muted-foreground">
            Konten AR yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Link to="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <iframe
        src={`/ar-viewer.html?mind=${encodeURIComponent(content.mind_file_url)}&content=${encodeURIComponent(content.content_url)}&type=${content.content_type}&scale=${content.scale || 1}`}
        className="w-full h-full border-0"
        allow="camera; gyroscope; accelerometer; autoplay"
      />
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Link to="/">
          <Button variant="secondary" size="sm">
            <Home className="w-4 h-4 mr-2" />
            Beranda
          </Button>
        </Link>
        <div className="bg-background/80 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium">
          {content.name}
        </div>
      </div>
    </div>
  );
};

export default ViewAR;
