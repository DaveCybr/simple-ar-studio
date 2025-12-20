import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Loader2,
  Plus,
  FolderPlus,
  X,
  FileVideo,
  Image,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Slider } from "@/components/ui/slider";

interface MarkerData {
  id: string;
  name: string;
  markerFile: File | null;
  contentFile: File | null;
  contentType: "video" | "image";
  scale: number;
}

interface ARProjectFormProps {
  onSuccess?: () => void;
  maxMarkers?: number;
}

const createEmptyMarker = (): MarkerData => ({
  id: crypto.randomUUID(),
  name: "",
  markerFile: null,
  contentFile: null,
  contentType: "video",
  scale: 1.0,
});

export const ARProjectForm = ({
  onSuccess,
  maxMarkers = 3,
}: ARProjectFormProps) => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [markers, setMarkers] = useState<MarkerData[]>([createEmptyMarker()]);
  const [mindFile, setMindFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const { toast } = useToast();

  const uploadToCloudinary = async (
    file: File,
    resourceType: string,
    folder: string
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("resource_type", resourceType);
    formData.append("folder", folder);

    const { data, error } = await supabase.functions.invoke(
      "upload-cloudinary",
      {
        body: formData,
      }
    );

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

  const updateMarker = (index: number, updated: Partial<MarkerData>) => {
    const newMarkers = [...markers];
    newMarkers[index] = { ...newMarkers[index], ...updated };
    setMarkers(newMarkers);
  };

  const validateForm = (): boolean => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Nama project harus diisi",
        variant: "destructive",
      });
      return false;
    }

    if (!mindFile) {
      toast({
        title: "Error",
        description: "File .mind harus diupload",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      if (!m.name || !m.markerFile || !m.contentFile) {
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setUploading(true);

    try {
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

      setUploadProgress("Uploading .mind file...");
      const mindUrl = await uploadToCloudinary(
        mindFile!,
        "raw",
        "ar-mind-files"
      );

      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];

        setUploadProgress(`Marker ${i + 1}: Uploading marker image...`);
        const markerUrl = await uploadToCloudinary(
          marker.markerFile!,
          "image",
          "ar-markers"
        );

        setUploadProgress(
          `Marker ${i + 1}: Uploading ${marker.contentType}...`
        );
        const contentResourceType =
          marker.contentType === "video" ? "video" : "image";
        const contentUrl = await uploadToCloudinary(
          marker.contentFile!,
          contentResourceType,
          "ar-content"
        );

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

      setProjectName("");
      setMarkers([createEmptyMarker()]);
      setMindFile(null);
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
          Multi-target AR: Upload {markers.length} marker dengan 1 file .mind
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <Alert className="border-primary/20 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-semibold text-foreground">
                Cara Membuat File .mind Multi-Target:
              </p>
              <ol className="list-decimal list-inside text-sm space-y-1.5 text-muted-foreground">
                <li>Buka MindAR Compiler di link bawah</li>
                <li>
                  Upload <strong>SEMUA</strong> marker images sekaligus
                </li>
                <li>
                  Klik <strong>Start</strong> untuk compile
                </li>
                <li>
                  Download file{" "}
                  <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    .mind
                  </code>{" "}
                  yang dihasilkan
                </li>
                <li>Upload file tersebut di form ini</li>
              </ol>
              <a
                href="https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-2"
              >
                <ExternalLink className="w-4 h-4" />
                Buka MindAR Compiler
              </a>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="mindFile">
            Combined .mind File (untuk semua marker)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="mindFile"
              type="file"
              accept=".mind"
              onChange={(e) => setMindFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
            {mindFile && (
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload file .mind yang sudah dikompilasi dari MindAR Compiler
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">
              Markers ({markers.length}/{maxMarkers})
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addMarker}
              disabled={uploading || markers.length >= maxMarkers}
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </Button>
          </div>

          <div className="space-y-4">
            {markers.map((marker, index) => (
              <Card key={marker.id} className="border-2 border-dashed">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Marker {index + 1}</span>
                    {markers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMarker(index)}
                        disabled={uploading}
                        className="h-8 w-8 text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Nama</Label>
                    <Input
                      value={marker.name}
                      onChange={(e) =>
                        updateMarker(index, { name: e.target.value })
                      }
                      placeholder={`Marker ${index + 1}`}
                      disabled={uploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Marker Image</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          updateMarker(index, {
                            markerFile: e.target.files?.[0] || null,
                          })
                        }
                        disabled={uploading}
                      />
                      {marker.markerFile && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gambar yang sama dengan yang di-compile di MindAR
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={
                        marker.contentType === "video" ? "default" : "outline"
                      }
                      onClick={() =>
                        updateMarker(index, { contentType: "video" })
                      }
                      disabled={uploading}
                      className="flex-1"
                    >
                      <FileVideo className="w-4 h-4 mr-2" />
                      Video
                    </Button>
                    <Button
                      type="button"
                      variant={
                        marker.contentType === "image" ? "default" : "outline"
                      }
                      onClick={() =>
                        updateMarker(index, { contentType: "image" })
                      }
                      disabled={uploading}
                      className="flex-1"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Content File</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept={
                          marker.contentType === "video" ? "video/*" : "image/*"
                        }
                        onChange={(e) =>
                          updateMarker(index, {
                            contentFile: e.target.files?.[0] || null,
                          })
                        }
                        disabled={uploading}
                      />
                      {marker.contentFile && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
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
                      disabled={uploading}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
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
      </CardContent>
    </Card>
  );
};
