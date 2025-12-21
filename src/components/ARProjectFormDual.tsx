// src/components/ARProjectFormDual.tsx
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Upload,
  Loader2,
  Plus,
  X,
  FileVideo,
  Image,
  CheckCircle,
  AlertCircle,
  Scan,
  QrCode,
  Info,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Slider } from "@/components/ui/slider";
import type { ARLibrary, MindARMarker, ARJSMarker } from "@/types/ar";

interface ARProjectFormDualProps {
  onSuccess?: () => void;
  maxMarkers?: number;
}

export const ARProjectFormDual = ({
  onSuccess,
  maxMarkers = 3,
}: ARProjectFormDualProps) => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [arLibrary, setARLibrary] = useState<ARLibrary>("mindar");
  const [markers, setMarkers] = useState<(MindARMarker | ARJSMarker)[]>([]);
  const [mindFile, setMindFile] = useState<File | null>(null); // For MindAR multi-target
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const { toast } = useToast();

  // Initialize with appropriate marker type
  const createEmptyMarker = (): MindARMarker | ARJSMarker => {
    const baseMarker = {
      id: crypto.randomUUID(),
      name: "",
      contentFile: null,
      contentType: "video" as const,
      scale: 1.0,
    };

    if (arLibrary === "mindar") {
      return {
        ...baseMarker,
        library: "mindar",
        markerFile: null,
        mindFile: null,
      } as MindARMarker;
    } else {
      return {
        ...baseMarker,
        library: "arjs",
        patternFile: null,
        markerType: "pattern",
      } as ARJSMarker;
    }
  };

  // Initialize markers when library changes
  const handleLibraryChange = (library: ARLibrary) => {
    setARLibrary(library);
    setMarkers([createEmptyMarker()]);
    setMindFile(null);
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

  const updateMarker = (
    index: number,
    updated: Partial<MindARMarker | ARJSMarker>
  ) => {
    const newMarkers = [...markers];
    newMarkers[index] = { ...newMarkers[index], ...updated };
    setMarkers(newMarkers);
  };

  const uploadToCloudinary = async (
    file: File,
    resourceType: string,
    folder: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("resource_type", resourceType);
    formData.append("folder", folder);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke(
      "upload-cloudinary",
      {
        body: formData,
        headers: { Authorization: `Bearer ${session.access_token}` },
      }
    );

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Upload failed");
    return data.url;
  };

  // Generate AR.js pattern file from image (client-side)
  const generateARJSPattern = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        try {
          // Simple pattern generation (in production, use proper AR.js pattern generator)
          const canvas = document.createElement("canvas");
          const size = 16; // AR.js pattern is 16x16
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          if (!ctx) throw new Error("Canvas context failed");

          ctx.drawImage(img, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size);

          // Generate pattern string (simplified - real implementation would be more complex)
          let pattern = "";
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const gray = Math.round((r + g + b) / 3);
            pattern += gray + " ";
            if ((i / 4 + 1) % size === 0) pattern += "\n";
          }

          resolve(pattern);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(imageFile);
    });
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

    if (arLibrary === "mindar" && markers.length > 1 && !mindFile) {
      toast({
        title: "Error",
        description: "Multi-target MindAR memerlukan file .mind",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      if (!m.name || !m.contentFile) {
        toast({
          title: "Data Tidak Lengkap",
          description: `Lengkapi data untuk Marker ${i + 1}`,
          variant: "destructive",
        });
        return false;
      }

      if (arLibrary === "mindar") {
        const mindMarker = m as MindARMarker;
        if (!mindMarker.markerFile && markers.length === 1) {
          toast({
            title: "Error",
            description: `Marker ${i + 1} memerlukan marker image`,
            variant: "destructive",
          });
          return false;
        }
      } else {
        const arjsMarker = m as ARJSMarker;
        if (arjsMarker.markerType === "pattern" && !arjsMarker.patternFile) {
          toast({
            title: "Error",
            description: `Marker ${i + 1} memerlukan pattern file atau image`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      setCurrentStep("Membuat project...");
      setUploadProgress(10);

      const { data: projectData, error: projectError } = await supabase
        .from("ar_projects")
        .insert({ name: projectName, user_id: user?.id })
        .select()
        .single();

      if (projectError) throw projectError;
      const projectId = projectData.id;

      let mindUrl = null;
      if (arLibrary === "mindar" && mindFile) {
        setCurrentStep("Uploading .mind file...");
        setUploadProgress(20);
        mindUrl = await uploadToCloudinary(mindFile, "raw", "ar-mind-files");
      }

      const totalSteps = markers.length * (arLibrary === "mindar" ? 2 : 3);
      let currentStepNum = 0;

      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];

        let markerUrl = "";
        let markerData: Record<string, any> = { library: arLibrary };

        if (arLibrary === "mindar") {
          const mindMarker = marker as MindARMarker;

          setCurrentStep(`Marker ${i + 1}: Uploading marker...`);
          currentStepNum++;
          setUploadProgress(20 + (currentStepNum / totalSteps) * 60);

          if (mindMarker.markerFile) {
            markerUrl = await uploadToCloudinary(
              mindMarker.markerFile,
              "image",
              "ar-markers"
            );
          }

          markerData.mindUrl =
            mindUrl ||
            (mindMarker.mindFile
              ? await uploadToCloudinary(
                  mindMarker.mindFile,
                  "raw",
                  "ar-mind-files"
                )
              : null);
        } else {
          const arjsMarker = marker as ARJSMarker;

          setCurrentStep(`Marker ${i + 1}: Processing pattern...`);
          currentStepNum++;
          setUploadProgress(20 + (currentStepNum / totalSteps) * 60);

          if (arjsMarker.markerType === "pattern" && arjsMarker.patternFile) {
            // Upload pattern file
            markerUrl = await uploadToCloudinary(
              arjsMarker.patternFile,
              "raw",
              "ar-patterns"
            );
            markerData.patternUrl = markerUrl;
          } else if (arjsMarker.markerType === "barcode") {
            markerData.barcodeValue = arjsMarker.barcodeValue || 0;
          } else {
            markerData.preset = arjsMarker.markerType; // 'hiro' or 'kanji'
          }

          markerData.markerType = arjsMarker.markerType;
        }

        setCurrentStep(`Marker ${i + 1}: Uploading content...`);
        currentStepNum++;
        setUploadProgress(20 + (currentStepNum / totalSteps) * 60);

        const contentResourceType =
          marker.contentType === "video" ? "video" : "image";
        const contentUrl = await uploadToCloudinary(
          marker.contentFile!,
          contentResourceType,
          "ar-content"
        );

        setCurrentStep(`Marker ${i + 1}: Saving...`);
        const { error: dbError } = await supabase.from("ar_content").insert({
          name: marker.name,
          library: arLibrary,
          marker_url: markerUrl,
          marker_data: JSON.stringify(markerData),
          content_url: contentUrl,
          content_type: marker.contentType,
          user_id: user?.id,
          scale: marker.scale,
          project_id: projectId,
        });

        if (dbError) throw dbError;
      }

      setUploadProgress(100);
      toast({
        title: "Berhasil!",
        description: `Project "${projectName}" dengan ${
          markers.length
        } marker (${arLibrary.toUpperCase()}) berhasil dibuat`,
      });

      setProjectName("");
      setMarkers([createEmptyMarker()]);
      setMindFile(null);
      onSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload gagal",
        description: error.message || "Terjadi kesalahan saat upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCurrentStep("");
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" />
          Buat Project AR Baru
        </CardTitle>
        <CardDescription>
          Pilih library AR dan buat marker sesuai kebutuhan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{currentStep}</p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Library Selection */}
        <div className="space-y-3">
          <Label className="text-base">Pilih AR Library</Label>
          <RadioGroup
            value={arLibrary}
            onValueChange={handleLibraryChange}
            disabled={uploading}
          >
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${
                  arLibrary === "mindar" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <CardContent
                  className="p-4 flex items-start gap-3"
                  onClick={() => handleLibraryChange("mindar")}
                >
                  <RadioGroupItem value="mindar" id="mindar" />
                  <div className="flex-1">
                    <Label
                      htmlFor="mindar"
                      className="cursor-pointer font-semibold"
                    >
                      MindAR.js
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Image tracking, support gambar kompleks
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  arLibrary === "arjs" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <CardContent
                  className="p-4 flex items-start gap-3"
                  onClick={() => handleLibraryChange("arjs")}
                >
                  <RadioGroupItem value="arjs" id="arjs" />
                  <div className="flex-1">
                    <Label
                      htmlFor="arjs"
                      className="cursor-pointer font-semibold"
                    >
                      AR.js
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pattern/Barcode, lebih cepat & ringan
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </RadioGroup>

          {/* Library Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {arLibrary === "mindar" ? (
                <div className="space-y-1">
                  <p>
                    <strong>MindAR.js:</strong> Cocok untuk poster, brosur, atau
                    gambar kompleks.
                  </p>
                  <p>
                    Perlu compile marker image ke .mind file di{" "}
                    <a
                      href="https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
                      target="_blank"
                      className="text-primary underline"
                    >
                      MindAR Compiler
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p>
                    <strong>AR.js:</strong> Cocok untuk QR code, barcode, atau
                    pattern sederhana.
                  </p>
                  <p>
                    Generate pattern di{" "}
                    <a
                      href="https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html"
                      target="_blank"
                      className="text-primary underline"
                    >
                      AR.js Generator
                    </a>
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectName">Nama Project *</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Contoh: Buku Cerita Anak"
            disabled={uploading}
          />
        </div>

        {/* MindAR specific: .mind file for multi-target */}
        {arLibrary === "mindar" && markers.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="mindFile">Combined .mind File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="mindFile"
                type="file"
                accept=".mind"
                onChange={(e) => setMindFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              {mindFile && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
          </div>
        )}

        {/* Markers */}
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
              <Plus className="w-4 h-4 mr-1" /> Tambah
            </Button>
          </div>

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
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Nama *</Label>
                  <Input
                    value={marker.name}
                    onChange={(e) =>
                      updateMarker(index, { name: e.target.value })
                    }
                    placeholder={`Marker ${index + 1}`}
                    disabled={uploading}
                  />
                </div>

                {/* MindAR Marker Fields */}
                {arLibrary === "mindar" && (
                  <div className="space-y-2">
                    <Label>Marker Image *</Label>
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
                  </div>
                )}

                {/* AR.js Marker Fields */}
                {arLibrary === "arjs" && (
                  <>
                    <div className="space-y-2">
                      <Label>Marker Type</Label>
                      <RadioGroup
                        value={(marker as ARJSMarker).markerType}
                        onValueChange={(val) =>
                          updateMarker(index, { markerType: val as any })
                        }
                        disabled={uploading}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="pattern"
                            id={`pattern-${index}`}
                          />
                          <Label htmlFor={`pattern-${index}`}>
                            Custom Pattern
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="barcode"
                            id={`barcode-${index}`}
                          />
                          <Label htmlFor={`barcode-${index}`}>
                            Barcode (0-63)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hiro" id={`hiro-${index}`} />
                          <Label htmlFor={`hiro-${index}`}>
                            Hiro (Default)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="kanji" id={`kanji-${index}`} />
                          <Label htmlFor={`kanji-${index}`}>Kanji</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {(marker as ARJSMarker).markerType === "pattern" && (
                      <div className="space-y-2">
                        <Label>Pattern File (.patt) *</Label>
                        <Input
                          type="file"
                          accept=".patt"
                          onChange={(e) =>
                            updateMarker(index, {
                              patternFile: e.target.files?.[0] || null,
                            })
                          }
                          disabled={uploading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Generate di{" "}
                          <a
                            href="https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html"
                            target="_blank"
                            className="text-primary underline"
                          >
                            AR.js Marker Training
                          </a>
                        </p>
                      </div>
                    )}

                    {(marker as ARJSMarker).markerType === "barcode" && (
                      <div className="space-y-2">
                        <Label>Barcode Value (0-63)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="63"
                          value={(marker as ARJSMarker).barcodeValue || 0}
                          onChange={(e) =>
                            updateMarker(index, {
                              barcodeValue: parseInt(e.target.value),
                            })
                          }
                          disabled={uploading}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Content Selection */}
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
                  <Label>Content File *</Label>
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

        <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {currentStep}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Buat Project ({markers.length} marker - {arLibrary.toUpperCase()})
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
