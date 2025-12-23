// src/components/ARProjectList.tsx - Cleaned up (Analytics handled in ARProjectActions)
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Layers,
  QrCode,
  Calendar,
  Scan,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeModal } from "./QRCodeModal";
import { ARProjectActions } from "./ARProjectActions";

interface ARProject {
  id: string;
  name: string;
  library: string;
  created_at: string;
  marker_count: number;
  markers: {
    id: string;
    name: string;
    marker_url: string | null;
    content_type: string;
    library: string;
    marker_data: any;
  }[];
}

interface ARProjectListProps {
  onSelectProject: (projectId: string) => void;
  refresh?: number;
}

export const ARProjectList = ({
  onSelectProject,
  refresh,
}: ARProjectListProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ARProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    project: ARProject | null;
  }>({
    open: false,
    project: null,
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [refresh, user]);

  const fetchProjects = async () => {
    if (!user) return;

    setLoading(true);

    const { data: projectsData, error: projectsError } = await supabase
      .from("ar_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (projectsError || !projectsData) {
      setLoading(false);
      return;
    }

    const projectsWithMarkers: ARProject[] = [];

    for (const project of projectsData) {
      const { data: markersData } = await supabase
        .from("ar_content")
        .select("id, name, marker_url, content_type, library, marker_data")
        .eq("project_id", project.id);

      projectsWithMarkers.push({
        id: project.id,
        name: project.name,
        library: project.library,
        created_at: project.created_at,
        marker_count: markersData?.length || 0,
        markers: markersData || [],
      });
    }

    setProjects(projectsWithMarkers);
    setLoading(false);
  };

  // ✅ Generate fallback icon based on marker type
  const getMarkerFallback = (marker: ARProject["markers"][0]) => {
    if (marker.library === "arjs") {
      const markerType = marker.marker_data?.markerType;

      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <QrCode className="w-8 h-8 mb-2" />
          <span className="text-xs font-medium uppercase">
            {markerType === "pattern" && "Pattern"}
            {markerType === "barcode" &&
              `Barcode ${marker.marker_data?.barcodeValue || 0}`}
            {markerType === "hiro" && "Hiro"}
            {markerType === "kanji" && "Kanji"}
            {!markerType && "AR.js"}
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-600 text-white">
        <Scan className="w-8 h-8" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-32 bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Belum ada project AR. Buat sekarang!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Preview grid of markers */}
          <div className="relative aspect-video bg-muted overflow-hidden">
            {project.markers.length > 0 ? (
              <div
                className={`grid h-full w-full ${
                  project.markers.length === 1
                    ? "grid-cols-1"
                    : project.markers.length === 2
                    ? "grid-cols-2"
                    : project.markers.length === 3
                    ? "grid-cols-2"
                    : "grid-cols-2"
                } gap-0.5`}
              >
                {project.markers.slice(0, 4).map((marker, idx) => (
                  <div
                    key={marker.id}
                    className={`relative overflow-hidden ${
                      project.markers.length === 3 && idx === 2
                        ? "col-span-2"
                        : ""
                    }`}
                  >
                    {marker.marker_url ? (
                      <img
                        src={marker.marker_url}
                        alt={marker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getMarkerFallback(marker)
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Layers className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold truncate flex-1">{project.name}</h3>
              <ARProjectActions
                projectId={project.id}
                projectName={project.name}
                onDelete={() => fetchProjects()}
                onDuplicate={() => fetchProjects()}
                onEdit={() => fetchProjects()}
              />
            </div>
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(project.created_at).toLocaleDateString("id-ID")}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onSelectProject(project.id)}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-1" />
                Lihat AR
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQrModal({ open: true, project })}
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {qrModal.project && (
        <QRCodeModal
          open={qrModal.open}
          onOpenChange={(open) => setQrModal({ ...qrModal, open })}
          projectId={qrModal.project.id}
          projectName={qrModal.project.name}
        />
      )}
    </div>
  );
};
