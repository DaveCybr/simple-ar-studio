import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle, FileVideo, Image, Box } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ARUploadFormProps {
  onSuccess?: () => void;
}

export const ARUploadForm = ({ onSuccess }: ARUploadFormProps) => {
  const [name, setName] = useState("");
  const [markerFile, setMarkerFile] = useState<File | null>(null);
  const [mindFile, setMindFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<"video" | "image">("video");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const { toast } = useToast();

  const uploadToCloudinary = async (file: File, resourceType: string, folder: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resource_type', resourceType);
    formData.append('folder', folder);

    const { data, error } = await supabase.functions.invoke('upload-cloudinary', {
      body: formData,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !markerFile || !mindFile || !contentFile) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // Upload marker image
      setUploadProgress("Uploading marker image...");
      const markerUrl = await uploadToCloudinary(markerFile, 'image', 'ar-markers');
      
      // Upload .mind file
      setUploadProgress("Uploading .mind file...");
      const mindUrl = await uploadToCloudinary(mindFile, 'raw', 'ar-mind-files');
      
      // Upload content (video/image)
      setUploadProgress(`Uploading ${contentType}...`);
      const contentResourceType = contentType === 'video' ? 'video' : 'image';
      const contentUrl = await uploadToCloudinary(contentFile, contentResourceType, 'ar-content');
      
      // Save to database
      setUploadProgress("Saving to database...");
      const { error: dbError } = await supabase.from('ar_content').insert({
        name,
        marker_url: markerUrl,
        mind_file_url: mindUrl,
        content_url: contentUrl,
        content_type: contentType,
      });

      if (dbError) throw dbError;

      toast({
        title: "Berhasil!",
        description: "AR content berhasil diupload",
      });

      // Reset form
      setName("");
      setMarkerFile(null);
      setMindFile(null);
      setContentFile(null);
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
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
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload AR Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nama AR Content</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Promo Video 2024"
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marker">Marker Image (JPG/PNG)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="marker"
                type="file"
                accept="image/*"
                onChange={(e) => setMarkerFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {markerFile && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <p className="text-xs text-muted-foreground">Gambar yang akan di-scan oleh kamera</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mind">.mind File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="mind"
                type="file"
                accept=".mind"
                onChange={(e) => setMindFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {mindFile && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <p className="text-xs text-muted-foreground">
              File marker compiled. Buat di{" "}
              <a 
                href="https://hiukim.github.io/mind-ar-js-doc/tools/compile" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                MindAR Compiler
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Content Type</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={contentType === "video" ? "default" : "outline"}
                onClick={() => setContentType("video")}
                disabled={uploading}
                className="flex-1"
              >
                <FileVideo className="w-4 h-4 mr-2" />
                Video
              </Button>
              <Button
                type="button"
                variant={contentType === "image" ? "default" : "outline"}
                onClick={() => setContentType("image")}
                disabled={uploading}
                className="flex-1"
              >
                <Image className="w-4 h-4 mr-2" />
                Image
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              {contentType === "video" ? "Video File (MP4)" : "Image File (JPG/PNG)"}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="content"
                type="file"
                accept={contentType === "video" ? "video/*" : "image/*"}
                onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {contentFile && <CheckCircle className="w-5 h-5 text-green-500" />}
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
                Upload AR Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
