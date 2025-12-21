// src/pages/ViewAR.tsx - Updated with dual library support
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Home, Scan, QrCode } from "lucide-react";

interface ARMarker {
  id: string;
  name: string;
  library: "mindar" | "arjs";
  marker_url: string;
  marker_data: any;
  content_url: string;
  content_type: string;
  scale: number;
}

interface ARProject {
  id: string;
  name: string;
  library: "mindar" | "arjs";
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

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("ar_projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (projectData) {
        // Fetch markers
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
          library: projectData.library || "mindar",
          markers: markersData,
        });
        setLoading(false);
        return;
      }

      // Fallback: single marker (backward compatibility)
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

      setProject({
        id: contentData.id,
        name: contentData.name,
        library: contentData.library || "mindar",
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

  // Prepare markers data based on library
  let markersParam: string;
  let viewerUrl: string;

  if (project.library === "mindar") {
    // MindAR format
    markersParam = encodeURIComponent(
      JSON.stringify(
        project.markers.map((m) => ({
          mind: m.marker_data?.mindUrl || "",
          content: m.content_url,
          type: m.content_type,
          scale: m.scale || 1,
          name: m.name,
        }))
      )
    );
    viewerUrl = `/ar-viewer.html?markers=${markersParam}`;
  } else {
    // AR.js format
    markersParam = encodeURIComponent(
      JSON.stringify(
        project.markers.map((m) => ({
          name: m.name,
          markerData: m.marker_data,
          content: m.content_url,
          type: m.content_type,
          scale: m.scale || 1,
        }))
      )
    );
    viewerUrl = `/arjs-viewer.html?markers=${markersParam}`;
  }

  return (
    <div className="relative w-full h-screen">
      <iframe
        src={viewerUrl}
        className="w-full h-full border-0"
        allow="camera; gyroscope; accelerometer; autoplay"
        title={`AR Viewer - ${project.name}`}
      />

      {/* Header Overlay */}
      {/* <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
        <Link to="/">
          <Button variant="secondary" size="sm">
            <Home className="w-4 h-4 mr-2" />
            Beranda
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="backdrop-blur-sm bg-background/80"
          >
            {project.library === "mindar" ? (
              <>
                <Scan className="w-3 h-3 mr-1" />
                MindAR
              </>
            ) : (
              <>
                <QrCode className="w-3 h-3 mr-1" />
                AR.js
              </>
            )}
          </Badge>

          <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium border">
            {project.name}
          </div>

          <Badge
            variant="outline"
            className="backdrop-blur-sm bg-background/80"
          >
            {project.markers.length} marker
          </Badge>
        </div>
      </div> */}
    </div>
  );
};

export default ViewAR;
