// src/pages/ViewAR.tsx - Updated with analytics tracking
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Home } from "lucide-react";

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

  // ✅ NEW: Get Supabase credentials from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

    // ✅ UPDATED: Add projectId for analytics tracking
    const params = new URLSearchParams({
      markers: markersParam,
      projectId: project.id,
      supabaseUrl: supabaseUrl,
      supabaseKey: supabaseKey,
    });

    viewerUrl = `/ar-viewer.html?${params.toString()}`;
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

    // ✅ UPDATED: Add projectId for analytics tracking
    const params = new URLSearchParams({
      markers: markersParam,
      projectId: project.id,
      supabaseUrl: supabaseUrl,
      supabaseKey: supabaseKey,
    });

    viewerUrl = `/arjs-viewer.html?${params.toString()}`;
  }

  return (
    <div className="relative w-full h-screen">
      <iframe
        src={viewerUrl}
        className="w-full h-full border-0"
        allow="camera; gyroscope; accelerometer; autoplay"
        title={`AR Viewer - ${project.name}`}
      />
    </div>
  );
};

export default ViewAR;
