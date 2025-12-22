import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save, X, Trash2, Image, Video, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Marker {
  id: string;
  name: string;
  content_type: string;
  scale: number;
  content_url: string;
  marker_url: string;
  library: string;
}

interface ARProjectEditFormProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ARProjectEditForm = ({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: ARProjectEditFormProps) => {
  const [projectName, setProjectName] = useState("");
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && projectId) {
      fetchProjectData();
    }
  }, [open, projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("ar_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProjectName(projectData.name);

      // Fetch markers
      const { data: markersData, error: markersError } = await supabase
        .from("ar_content")
        .select("*")
        .eq("project_id", projectId);

      if (markersError) throw markersError;
      setMarkers(markersData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMarker = (index: number, updates: Partial<Marker>) => {
    const newMarkers = [...markers];
    newMarkers[index] = { ...newMarkers[index], ...updates };
    setMarkers(newMarkers);
  };

  const removeMarker = async (markerId: string) => {
    try {
      const { error } = await supabase
        .from("ar_content")
        .delete()
        .eq("id", markerId);

      if (error) throw error;

      setMarkers(markers.filter((m) => m.id !== markerId));
      toast({
        title: "Marker Dihapus",
        description: "Marker berhasil dihapus dari project",
      });
    } catch (error: any) {
      toast({
        title: "Gagal Menghapus",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Nama project harus diisi",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Update project name
      const { error: projectError } = await supabase
        .from("ar_projects")
        .update({ name: projectName })
        .eq("id", projectId);

      if (projectError) throw projectError;

      // Update markers
      for (const marker of markers) {
        const { error: markerError } = await supabase
          .from("ar_content")
          .update({
            name: marker.name,
            scale: marker.scale,
          })
          .eq("id", marker.id);

        if (markerError) throw markerError;
      }

      toast({
        title: "Berhasil!",
        description: "Project berhasil diupdate",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Gagal Update",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "image":
        return <Image className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl">Edit AR Project</DialogTitle>
          <DialogDescription className="text-base">
            Update nama project dan konfigurasi markers. Untuk mengganti file
            marker atau content, silakan buat project baru.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Memuat data project...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* Project Name Section */}
            <Card className="border-2 shadow-sm">
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Label
                    htmlFor="projectName"
                    className="text-base font-semibold"
                  >
                    Nama Project <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Masukkan nama project"
                    disabled={saving}
                    className="h-11 text-base"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Markers Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Daftar Markers</h3>
                <Badge variant="secondary" className="text-sm">
                  {markers.length} Marker{markers.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="space-y-4">
                {markers.map((marker, index) => (
                  <Card
                    key={marker.id}
                    className="border-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              Marker {index + 1}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getContentIcon(marker.content_type)}
                                <span className="ml-1 capitalize">
                                  {marker.content_type}
                                </span>
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {marker.library}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMarker(marker.id)}
                          disabled={saving || markers.length === 1}
                          className="hover:bg-destructive/10 hover:text-destructive"
                          title={
                            markers.length === 1
                              ? "Minimal 1 marker harus ada"
                              : "Hapus marker"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Separator className="my-4" />

                      {/* Preview Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Marker Image
                          </Label>
                          {marker.marker_url ? (
                            <div className="relative group">
                              <img
                                src={marker.marker_url}
                                alt="Marker"
                                className="w-full h-40 object-contain bg-gradient-to-br from-muted to-muted/50 rounded-lg border-2 p-2"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs">
                                  Preview Marker
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">
                                No preview available
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            {getContentIcon(marker.content_type)}
                            AR Content
                          </Label>
                          <div className="relative group">
                            {marker.content_type === "video" ? (
                              <video
                                src={marker.content_url}
                                className="w-full h-40 object-contain bg-gradient-to-br from-muted to-muted/50 rounded-lg border-2 p-2"
                                muted
                                loop
                                onMouseEnter={(e) => e.currentTarget.play()}
                                onMouseLeave={(e) => e.currentTarget.pause()}
                              />
                            ) : (
                              <img
                                src={marker.content_url}
                                alt="Content"
                                className="w-full h-40 object-contain bg-gradient-to-br from-muted to-muted/50 rounded-lg border-2 p-2"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs">
                                Preview Content
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Editable Fields */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor={`marker-name-${index}`}
                            className="text-sm font-medium"
                          >
                            Nama Marker
                          </Label>
                          <Input
                            id={`marker-name-${index}`}
                            value={marker.name}
                            onChange={(e) =>
                              updateMarker(index, { name: e.target.value })
                            }
                            disabled={saving}
                            placeholder="Beri nama marker"
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium">
                              Ukuran Content
                            </Label>
                            <Badge variant="secondary" className="font-mono">
                              {marker.scale.toFixed(1)}x
                            </Badge>
                          </div>
                          <Slider
                            value={[marker.scale]}
                            onValueChange={(val) =>
                              updateMarker(index, { scale: val[0] })
                            }
                            min={0.5}
                            max={3}
                            step={0.1}
                            disabled={saving}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0.5x (Kecil)</span>
                            <span>1.5x (Normal)</span>
                            <span>3.0x (Besar)</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Sticky Footer */}
        {!loading && (
          <div className="flex gap-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="flex-1 h-11"
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
