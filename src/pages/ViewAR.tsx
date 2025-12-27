// src/pages/ViewAR.tsx - Fixed version
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Home } from "lucide-react";
import { ENV } from "@/lib/constants";

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

// ✅ FIXED: Remove async from component declaration
const ViewAR = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ARProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string>("");

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        setError("ID tidak valid");
        setLoading(false);
        return;
      }

      try {
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

          const projectObj: ARProject = {
            id: projectData.id,
            name: projectData.name,
            library: projectData.library || "mindar",
            markers: markersData,
          };

          setProject(projectObj);

          // ✅ Generate viewer URL after project is loaded
          await generateViewerUrl(projectObj);
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

        const projectObj: ARProject = {
          id: contentData.id,
          name: contentData.name,
          library: contentData.library || "mindar",
          markers: [contentData],
        };

        setProject(projectObj);

        // ✅ Generate viewer URL after project is loaded
        await generateViewerUrl(projectObj);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Terjadi kesalahan saat memuat project");
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // ✅ Separate function to generate viewer URL
  const generateViewerUrl = async (proj: ARProject) => {
    try {
      if (proj.library === "mindar") {
        // MindAR format
        const markersParam = encodeURIComponent(
          JSON.stringify(
            proj.markers.map((m) => ({
              mind: m.marker_data?.mindUrl || "",
              content: m.content_url,
              type: m.content_type,
              scale: m.scale || 1,
              name: m.name,
            }))
          )
        );

        // Generate secure token if function exists
        let token = "";
        try {
          const { data, error } = await supabase.functions.invoke(
            "generate-viewer-token",
            { body: { projectId: proj.id } }
          );
          if (!error && data?.token) {
            token = data.token;
          }
        } catch (err) {
          console.warn("Could not generate token:", err);
        }

        const params = new URLSearchParams({
          markers: markersParam,
          projectId: proj.id,
        });

        if (token) {
          params.append("token", token);
        }

        setViewerUrl(`/ar-viewer.html?${params.toString()}`);
      } else {
        // AR.js format
        const markersParam = encodeURIComponent(
          JSON.stringify(
            proj.markers.map((m) => ({
              name: m.name,
              markerData: m.marker_data,
              content: m.content_url,
              type: m.content_type,
              scale: m.scale || 1,
            }))
          )
        );

        const params = new URLSearchParams({
          markers: markersParam,
          projectId: proj.id,
          supabaseUrl: ENV.SUPABASE_URL,
          supabaseKey: ENV.SUPABASE_ANON_KEY,
        });

        setViewerUrl(`/arjs-viewer.html?${params.toString()}`);
      }
    } catch (err) {
      console.error("Error generating viewer URL:", err);
      setError("Gagal membuat URL viewer");
    }
  };

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

  if (error || !project || !viewerUrl) {
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
        src={viewerUrl}
        className="w-full h-full border-0"
        allow="camera; gyroscope; accelerometer; autoplay"
        title={`AR Viewer - ${project.name}`}
      />
    </div>
  );
};

export default ViewAR;
