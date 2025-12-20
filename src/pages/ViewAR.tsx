import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Home } from "lucide-react";

interface ARMarker {
  id: string;
  name: string;
  marker_url: string;
  mind_file_url: string;
  content_url: string;
  content_type: string;
  scale: number;
}

interface ARProject {
  id: string;
  name: string;
  markers: ARMarker[];
}

const ViewAR = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ARProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        setError("ID tidak valid");
        setLoading(false);
        return;
      }

      // First try to fetch as a project
      const { data: projectData, error: projectError } = await supabase
        .from("ar_projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (projectData) {
        // Fetch all markers for this project
        const { data: markersData, error: markersError } = await supabase
          .from("ar_content")
          .select("*")
          .eq("project_id", id);

        if (markersError || !markersData || markersData.length === 0) {
          setError("Tidak ada marker dalam project ini");
          setLoading(false);
          return;
        }

        setProject({
          id: projectData.id,
          name: projectData.name,
          markers: markersData,
        });
        setLoading(false);
        return;
      }

      // Fallback: try to fetch as single ar_content (backward compatibility)
      const { data: contentData, error: contentError } = await supabase
        .from("ar_content")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (contentError || !contentData) {
        setError("Konten AR tidak ditemukan");
        setLoading(false);
        return;
      }

      // Single marker fallback
      setProject({
        id: contentData.id,
        name: contentData.name,
        markers: [contentData],
      });
      setLoading(false);
    };

    fetchProject();
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

  if (error || !project) {
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

  // Build URL params for multi-marker
  const markersParam = encodeURIComponent(
    JSON.stringify(
      project.markers.map((m) => ({
        mind: m.mind_file_url,
        content: m.content_url,
        type: m.content_type,
        scale: m.scale || 1,
        name: m.name,
      }))
    )
  );

  // FIXED: Use absolute path instead of relative
  const arViewerUrl = `${window.location.origin}/ar-viewer.html?markers=${markersParam}`;

  return (
    <div className="relative w-full h-screen">
      <iframe
        src={arViewerUrl}
        className="w-full h-full border-0"
        allow="camera; gyroscope; accelerometer; autoplay"
        title={`AR Viewer - ${project.name}`}
      />
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Link to="/">
          <Button variant="secondary" size="sm">
            <Home className="w-4 h-4 mr-2" />
            Beranda
          </Button>
        </Link>
        <div className="bg-background/80 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium">
          {project.name} ({project.markers.length} marker)
        </div>
      </div>
    </div>
  );
};

export default ViewAR;
