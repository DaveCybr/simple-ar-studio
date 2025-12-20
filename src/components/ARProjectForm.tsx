import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Loader2, Plus, FolderPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MarkerInput, MarkerData } from "./MarkerInput";

interface ARProjectFormProps {
  onSuccess?: () => void;
  maxMarkers?: number;
}

const createEmptyMarker = (): MarkerData => ({
  id: crypto.randomUUID(),
  name: "",
  markerFile: null,
  mindFile: null,
  contentFile: null,
  contentType: "video",
  scale: 1.0,
});

export const ARProjectForm = ({ onSuccess, maxMarkers = 3 }: ARProjectFormProps) => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [markers, setMarkers] = useState<MarkerData[]>([createEmptyMarker()]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const { toast } = useToast();

  const uploadToCloudinary = async (file: File, resourceType: string, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("resource_type", resourceType);
    formData.append("folder", folder);

    const { data, error } = await supabase.functions.invoke("upload-cloudinary", {
      body: formData,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return data.url;
  };

  const addMarker = () => {
    if (markers.length >= maxMarkers) {
      toast({
        title: "Batas Tercapai",
        description: `Maksimal ${maxMarkers} marker per project`,
        variant: "destructive",
      });
      return;
    }
    setMarkers([...markers, createEmptyMarker()]);
  };

  const removeMarker = (index: number) => {
    if (markers.length <= 1) return;
    setMarkers(markers.filter((_, i) => i !== index));
  };

  const updateMarker = (index: number, updated: MarkerData) => {
    const newMarkers = [...markers];
    newMarkers[index] = updated;
    setMarkers(newMarkers);
  };

  const validateMarkers = (): boolean => {
    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      if (!m.name || !m.markerFile || !m.mindFile || !m.contentFile) {
        toast({
          title: "Data Tidak Lengkap",
          description: `Lengkapi semua data untuk Marker ${i + 1}`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Nama project harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!validateMarkers()) return;

    setUploading(true);

    try {
      // Create project first
      setUploadProgress("Membuat project...");
      const { data: projectData, error: projectError } = await supabase
        .from("ar_projects")
        .insert({
          name: projectName,
          user_id: user?.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      const projectId = projectData.id;

      // Upload each marker
      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];
        
        setUploadProgress(`Marker ${i + 1}: Uploading marker image...`);
        const markerUrl = await uploadToCloudinary(marker.markerFile!, "image", "ar-markers");

        setUploadProgress(`Marker ${i + 1}: Uploading .mind file...`);
        const mindUrl = await uploadToCloudinary(marker.mindFile!, "raw", "ar-mind-files");

        setUploadProgress(`Marker ${i + 1}: Uploading ${marker.contentType}...`);
        const contentResourceType = marker.contentType === "video" ? "video" : "image";
        const contentUrl = await uploadToCloudinary(marker.contentFile!, contentResourceType, "ar-content");

        setUploadProgress(`Marker ${i + 1}: Saving to database...`);
        const { error: dbError } = await supabase.from("ar_content").insert({
          name: marker.name,
          marker_url: markerUrl,
          mind_file_url: mindUrl,
          content_url: contentUrl,
          content_type: marker.contentType,
          user_id: user?.id,
          scale: marker.scale,
          project_id: projectId,
        });

        if (dbError) throw dbError;
      }

      toast({
        title: "Berhasil!",
        description: `Project "${projectName}" dengan ${markers.length} marker berhasil dibuat`,
      });

      // Reset form
      setProjectName("");
      setMarkers([createEmptyMarker()]);
      onSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-primary" />
          Buat Project AR Baru
        </CardTitle>
        <CardDescription>
          Satu project dapat memiliki beberapa marker (maks {maxMarkers})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectName">Nama Project</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Contoh: Buku Cerita Anak"
              disabled={uploading}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Markers ({markers.length}/{maxMarkers})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMarker}
                disabled={uploading || markers.length >= maxMarkers}
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah Marker
              </Button>
            </div>

            <div className="space-y-4">
              {markers.map((marker, index) => (
                <MarkerInput
                  key={marker.id}
                  marker={marker}
                  index={index}
                  onChange={(updated) => updateMarker(index, updated)}
                  onRemove={() => removeMarker(index)}
                  disabled={uploading}
                  canRemove={markers.length > 1}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadProgress}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Buat Project ({markers.length} marker)
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
