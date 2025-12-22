// src/components/ARProjectEditForm.tsx
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

interface Marker {
  id: string;
  name: string;
  content_type: string;
  scale: number;
  content_url: string;
  marker_url: string;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update nama project dan konfigurasi markers
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading project...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Nama Project *</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nama project"
                disabled={saving}
              />
            </div>

            {/* Markers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Markers ({markers.length})</Label>
                <Alert className="w-auto p-2">
                  <AlertDescription className="text-xs">
                    Untuk mengganti content/marker file, buat project baru
                  </AlertDescription>
                </Alert>
              </div>

              {markers.map((marker, index) => (
                <Card key={marker.id} className="border-2">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Marker {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMarker(marker.id)}
                        disabled={saving || markers.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Marker Preview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Marker
                        </Label>
                        {marker.marker_url ? (
                          <img
                            src={marker.marker_url}
                            alt="Marker"
                            className="w-full h-24 object-cover rounded border mt-1"
                          />
                        ) : (
                          <div className="w-full h-24 bg-muted rounded border mt-1 flex items-center justify-center text-xs text-muted-foreground">
                            No preview
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Content
                        </Label>
                        {marker.content_type === "video" ? (
                          <video
                            src={marker.content_url}
                            className="w-full h-24 object-cover rounded border mt-1"
                            muted
                          />
                        ) : (
                          <img
                            src={marker.content_url}
                            alt="Content"
                            className="w-full h-24 object-cover rounded border mt-1"
                          />
                        )}
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-2">
                      <Label>Nama Marker</Label>
                      <Input
                        value={marker.name}
                        onChange={(e) =>
                          updateMarker(index, { name: e.target.value })
                        }
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Ukuran {marker.scale.toFixed(1)}x</Label>
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
                      />
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Type: {marker.content_type}</div>
                      <div className="truncate">
                        Content: {marker.content_url}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
