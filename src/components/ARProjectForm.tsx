// src/components/ARProjectForm.tsx
// ✅ Updated with comprehensive file validation

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Upload,
  Loader2,
  Plus,
  X,
  FileVideo,
  Image,
  CheckCircle,
  Scan,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Slider } from "@/components/ui/slider";
import { PatternGeneratorButton } from "./ARProjectPatternGenerator";
import { Badge } from "@/components/ui/badge";
import {
  validateVideo,
  validateImage,
  validatePattern,
  type ValidationResult,
} from "@/lib/fileValidation";
import { ValidationFeedback } from "@/components/ValidationFeedback";

interface Marker {
  id: string;
  name: string;
  contentFile: File | null;
  contentType: "video" | "image";
  scale: number;
  patternFile: File | null;
  markerType: "pattern" | "barcode" | "hiro" | "kanji";
  barcodeValue?: number;
  markerImageFile: File | null;
  // Validation results
  contentValidation: ValidationResult | null;
  patternValidation: ValidationResult | null;
  markerValidation: ValidationResult | null;
}

interface ARProjectFormProps {
  onSuccess?: () => void;
  maxMarkers?: number;
}

export const ARProjectForm = ({
  onSuccess,
  maxMarkers = 3,
}: ARProjectFormProps) => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [markers, setMarkers] = useState<Marker[]>([createEmptyMarker()]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [expandedMarkers, setExpandedMarkers] = useState<Set<string>>(
    new Set([markers[0]?.id])
  );
  const [validating, setValidating] = useState<string | null>(null);
  const { toast } = useToast();

  function createEmptyMarker(): Marker {
    return {
      id: crypto.randomUUID(),
      name: "",
      contentFile: null,
      contentType: "video",
      scale: 1.0,
      patternFile: null,
      markerType: "pattern",
      markerImageFile: null,
      contentValidation: null,
      patternValidation: null,
      markerValidation: null,
    };
  }

  const addMarker = () => {
    if (markers.length >= maxMarkers) {
      toast({
        title: "Batas Tercapai",
        description: `Maksimal ${maxMarkers} marker per project`,
        variant: "destructive",
      });
      return;
    }
    const newMarker = createEmptyMarker();
    setMarkers([...markers, newMarker]);
    setExpandedMarkers(new Set([...expandedMarkers, newMarker.id]));
  };

  const removeMarker = (index: number) => {
    if (markers.length <= 1) return;
    const newMarkers = markers.filter((_, i) => i !== index);
    setMarkers(newMarkers);
    const newExpanded = new Set(expandedMarkers);
    newExpanded.delete(markers[index].id);
    setExpandedMarkers(newExpanded);
  };

  const toggleMarkerExpanded = (id: string) => {
    const newExpanded = new Set(expandedMarkers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMarkers(newExpanded);
  };

  const updateMarker = (index: number, updated: Partial<Marker>) => {
    const newMarkers = [...markers];
    newMarkers[index] = { ...newMarkers[index], ...updated };
    setMarkers(newMarkers);
  };

  // ✅ NEW: Handle content file with validation
  const handleContentFileChange = async (index: number, file: File | null) => {
    if (!file) {
      updateMarker(index, {
        contentFile: null,
        contentValidation: null,
      });
      return;
    }

    const marker = markers[index];
    setValidating(`content-${index}`);

    try {
      const result =
        marker.contentType === "video"
          ? await validateVideo(file)
          : await validateImage(file, "content");

      if (!result.valid) {
        toast({
          title: "File Tidak Valid",
          description: result.error,
          variant: "destructive",
        });
        updateMarker(index, {
          contentFile: null,
          contentValidation: result,
        });
        return;
      }

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        toast({
          title: "Peringatan",
          description: result.warnings[0],
          variant: "default",
        });
      }

      updateMarker(index, {
        contentFile: file,
        contentValidation: result,
      });
    } catch (error) {
      toast({
        title: "Error Validasi",
        description: "Gagal memvalidasi file. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setValidating(null);
    }
  };

  // ✅ NEW: Handle pattern file with validation
  const handlePatternFileChange = async (index: number, file: File | null) => {
    if (!file) {
      updateMarker(index, {
        patternFile: null,
        patternValidation: null,
      });
      return;
    }

    setValidating(`pattern-${index}`);

    try {
      const result = validatePattern(file);

      if (!result.valid) {
        toast({
          title: "Pattern Tidak Valid",
          description: result.error,
          variant: "destructive",
        });
        updateMarker(index, {
          patternFile: null,
          patternValidation: result,
        });
        return;
      }

      if (result.warnings && result.warnings.length > 0) {
        toast({
          title: "Peringatan",
          description: result.warnings[0],
        });
      }

      updateMarker(index, {
        patternFile: file,
        patternValidation: result,
      });
    } finally {
      setValidating(null);
    }
  };

  // ✅ NEW: Handle marker image with validation
  const handleMarkerImageChange = async (index: number, file: File | null) => {
    if (!file) {
      updateMarker(index, {
        markerImageFile: null,
        markerValidation: null,
      });
      return;
    }

    setValidating(`marker-${index}`);

    try {
      const result = await validateImage(file, "marker");

      if (!result.valid) {
        toast({
          title: "Marker Tidak Valid",
          description: result.error,
          variant: "destructive",
        });
        updateMarker(index, {
          markerImageFile: null,
          markerValidation: result,
        });
        return;
      }

      if (result.warnings && result.warnings.length > 0) {
        // Show most important warning
        const importantWarning =
          result.warnings.find(
            (w) => w.includes("PENTING") || w.includes("kontras")
          ) || result.warnings[0];

        toast({
          title: "Peringatan Marker",
          description: importantWarning,
          variant: "default",
        });
      }

      updateMarker(index, {
        markerImageFile: file,
        markerValidation: result,
      });
    } catch (error) {
      toast({
        title: "Error Validasi",
        description: "Gagal memvalidasi marker. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setValidating(null);
    }
  };

  const isMarkerComplete = (marker: Marker): boolean => {
    // 1. Nama wajib diisi
    if (!marker.name) {
      return false;
    }

    // 2. Content file dan validasi wajib ada
    if (!marker.contentFile || !marker.contentValidation?.valid) {
      return false;
    }

    // 3. Cek berdasarkan marker type
    if (marker.markerType === "pattern") {
      // Pattern type WAJIB ada pattern file
      return !!marker.patternFile && marker.patternValidation?.valid === true;
    }

    // 4. Untuk barcode, hiro, kanji: tidak perlu pattern file
    // Marker-marker ini menggunakan preset bawaan AR.js
    return true;
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!projectName.trim();
      case 2:
        return markers.length > 0 && markers.every(isMarkerComplete);
      default:
        return false;
    }
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

  const validateForm = (): boolean => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Nama project harus diisi",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];

      if (!m.name) {
        toast({
          title: "Data Tidak Lengkap",
          description: `Marker ${i + 1}: Nama harus diisi`,
          variant: "destructive",
        });
        return false;
      }

      if (!m.contentFile || !m.contentValidation?.valid) {
        toast({
          title: "Data Tidak Lengkap",
          description: `Marker ${i + 1}: Content tidak valid atau belum diisi`,
          variant: "destructive",
        });
        return false;
      }

      // Hanya cek pattern file untuk marker type "pattern"
      if (m.markerType === "pattern") {
        if (!m.patternFile || !m.patternValidation?.valid) {
          toast({
            title: "Error",
            description: `Marker ${
              i + 1
            }: Pattern file tidak valid atau belum diisi`,
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
        .insert({ name: projectName, user_id: user?.id, library: "arjs" })
        .select()
        .single();

      if (projectError) throw projectError;
      const projectId = projectData.id;

      const totalSteps = markers.length * 3;
      let currentStepNum = 0;

      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];

        let markerUrl = "";
        let markerData: Record<string, any> = {
          library: "arjs",
          markerType: marker.markerType,
        };

        if (marker.markerImageFile) {
          setCurrentStep(`Marker ${i + 1}: Uploading marker preview...`);
          currentStepNum++;
          setUploadProgress(20 + (currentStepNum / totalSteps) * 60);

          markerUrl = await uploadToCloudinary(
            marker.markerImageFile,
            "image",
            "ar-markers"
          );
        }

        setCurrentStep(`Marker ${i + 1}: Processing pattern...`);
        currentStepNum++;
        setUploadProgress(20 + (currentStepNum / totalSteps) * 60);

        if (marker.markerType === "pattern" && marker.patternFile) {
          const patternUrl = await uploadToCloudinary(
            marker.patternFile,
            "raw",
            "ar-patterns"
          );
          markerData.patternUrl = patternUrl;
        } else if (marker.markerType === "barcode") {
          markerData.barcodeValue = marker.barcodeValue || 0;
        } else if (
          marker.markerType === "hiro" ||
          marker.markerType === "kanji"
        ) {
          markerData.preset = marker.markerType;
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
          library: "arjs",
          marker_url: markerUrl || null,
          marker_data: markerData,
          content_url: contentUrl,
          content_type: marker.contentType,
          user_id: user?.id,
          scale: marker.scale,
          project_id: projectId,
        });

        if (dbError) {
          console.error("Database insert error:", dbError);
          throw dbError;
        }
      }

      setUploadProgress(100);
      toast({
        title: "Berhasil!",
        description: `Project "${projectName}" dengan ${markers.length} marker berhasil dibuat`,
      });

      setProjectName("");
      setMarkers([createEmptyMarker()]);
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

  const getFilePreview = (file: File | null) => {
    if (!file) return null;
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const markerTypes = [
    {
      value: "pattern",
      label: "Custom Pattern",
      icon: Sparkles,
      desc: "Upload gambar khusus",
    },
    {
      value: "barcode",
      label: "Barcode",
      icon: Scan,
      desc: "Gunakan barcode 0-63",
    },
    {
      value: "hiro",
      label: "Hiro",
      icon: Image,
      desc: "Marker default",
    },
    {
      value: "kanji",
      label: "Kanji",
      icon: Image,
      desc: "Marker kanji",
    },
  ];

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scan className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Buat Project AR Baru</CardTitle>
              <CardDescription>
                Buat pengalaman augmented reality yang interaktif
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {markers.length}/{maxMarkers} Markers
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        <div className="flex items-center justify-between mb-8">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    isStepComplete(step)
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isStepComplete(step) ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className="text-xs mt-2 text-center font-medium">
                  {step === 1 && "Informasi Project"}
                  {step === 2 && "Konfigurasi Markers"}
                </span>
              </div>
              {step < 2 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-all ${
                    isStepComplete(step) ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {uploading && (
          <Alert className="border-primary bg-primary/5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{currentStep}</p>
                  <span className="text-sm font-semibold">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isStepComplete(1) ? "bg-primary text-white" : "bg-muted"
              }`}
            >
              1
            </div>
            <Label className="text-lg font-semibold">Nama Project</Label>
          </div>

          <div className="relative">
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Contoh: Buku Cerita Anak AR"
              disabled={uploading}
              className="pr-10 h-12 text-base"
            />
            {projectName && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isStepComplete(2) ? "bg-primary text-white" : "bg-muted"
                }`}
              >
                2
              </div>
              <Label className="text-lg font-semibold">
                Konfigurasi Markers
              </Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addMarker}
              disabled={uploading || markers.length >= maxMarkers}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Marker
            </Button>
          </div>

          <div className="space-y-3">
            {markers.map((marker, index) => {
              const isExpanded = expandedMarkers.has(marker.id);
              const isComplete = isMarkerComplete(marker);
              const isValidatingThis =
                validating?.startsWith(`content-${index}`) ||
                validating?.startsWith(`pattern-${index}`) ||
                validating?.startsWith(`marker-${index}`);

              return (
                <Card
                  key={marker.id}
                  className={`transition-all ${
                    isComplete
                      ? "border-green-500 bg-green-50/50"
                      : "border-dashed border-2"
                  }`}
                >
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors p-4"
                    onClick={() => toggleMarkerExpanded(marker.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isComplete ? "bg-green-500 text-white" : "bg-muted"
                          }`}
                        >
                          {isComplete ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {marker.name || `Marker ${index + 1}`}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {marker.contentFile?.name || "Belum ada content"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isValidatingThis && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {isComplete && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        )}
                        {!isComplete && marker.contentFile && (
                          <Badge variant="secondary">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Incomplete
                          </Badge>
                        )}
                        {markers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMarker(index);
                            }}
                            disabled={uploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="p-4 pt-0 space-y-4">
                      <div className="space-y-2">
                        <Label>Nama Marker *</Label>
                        <Input
                          value={marker.name}
                          onChange={(e) =>
                            updateMarker(index, { name: e.target.value })
                          }
                          placeholder={`Marker ${index + 1}`}
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Tipe Marker</Label>
                        <RadioGroup
                          value={marker.markerType}
                          onValueChange={(val) =>
                            updateMarker(index, {
                              markerType: val as any,
                            })
                          }
                          disabled={uploading}
                          className="grid grid-cols-2 gap-3"
                        >
                          {markerTypes.map((type) => {
                            const TypeIcon = type.icon;
                            return (
                              <Card
                                key={type.value}
                                className={`cursor-pointer transition-all hover:border-primary/50 ${
                                  marker.markerType === type.value
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : ""
                                }`}
                                onClick={() =>
                                  !uploading &&
                                  updateMarker(index, {
                                    markerType: type.value as any,
                                  })
                                }
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-2">
                                    <RadioGroupItem
                                      value={type.value}
                                      id={`${type.value}-${index}`}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <TypeIcon className="w-4 h-4" />
                                        <Label
                                          htmlFor={`${type.value}-${index}`}
                                          className="cursor-pointer font-semibold text-sm"
                                        >
                                          {type.label}
                                        </Label>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {type.desc}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </RadioGroup>
                      </div>

                      {marker.markerType === "pattern" && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Pattern File (.patt) *</Label>
                            <Input
                              type="file"
                              accept=".patt"
                              onChange={(e) =>
                                handlePatternFileChange(
                                  index,
                                  e.target.files?.[0] || null
                                )
                              }
                              disabled={
                                uploading || validating === `pattern-${index}`
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Upload file .patt yang sudah di-generate
                            </p>
                          </div>

                          {/* ✅ Pattern Validation Feedback */}
                          {marker.patternValidation && (
                            <ValidationFeedback
                              result={marker.patternValidation}
                              fileName={marker.patternFile?.name || ""}
                              fileType="pattern"
                            />
                          )}

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                Atau
                              </span>
                            </div>
                          </div>

                          <PatternGeneratorButton
                            disabled={uploading}
                            onPatternGenerated={async (data) => {
                              const [patternResult, markerResult] =
                                await Promise.all([
                                  validatePattern(data.patternFile),
                                  validateImage(data.markerImageFile, "marker"),
                                ]);
                              // 1. Set files dulu
                              updateMarker(index, {
                                patternFile: data.patternFile,
                                markerImageFile: data.markerImageFile,
                                patternValidation: patternResult,
                                markerValidation: markerResult,
                              });

                              // 2. Run validations secara parallel
                              try {
                                const [patternResult, markerResult] =
                                  await Promise.all([
                                    // Validate pattern
                                    (async () => {
                                      const result = validatePattern(
                                        data.patternFile
                                      );
                                      return result;
                                    })(),
                                    // Validate marker image
                                    validateImage(
                                      data.markerImageFile,
                                      "marker"
                                    ),
                                  ]);

                                // 3. Update dengan hasil validasi sekaligus
                                updateMarker(index, {
                                  patternFile: data.patternFile,
                                  markerImageFile: data.markerImageFile,
                                  patternValidation: patternResult,
                                  markerValidation: markerResult,
                                });

                                // 4. Show appropriate toast
                                if (patternResult.valid && markerResult.valid) {
                                  toast({
                                    title: "Pattern Generated!",
                                    description:
                                      "Pattern dan marker berhasil di-generate dan divalidasi",
                                  });
                                } else {
                                  const errors = [
                                    !patternResult.valid && patternResult.error,
                                    !markerResult.valid && markerResult.error,
                                  ].filter(Boolean);

                                  toast({
                                    title: "Validasi Gagal",
                                    description: errors.join(". "),
                                    variant: "destructive",
                                  });
                                }
                              } catch (error) {
                                console.error("Validation error:", error);
                                toast({
                                  title: "Error",
                                  description:
                                    "Gagal memvalidasi pattern yang di-generate",
                                  variant: "destructive",
                                });
                              }
                            }}
                          />
                        </div>
                      )}

                      {marker.markerType === "barcode" && (
                        <div className="space-y-2">
                          <Label>Barcode Value (0-63)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="63"
                            value={marker.barcodeValue || 0}
                            onChange={(e) =>
                              updateMarker(index, {
                                barcodeValue: parseInt(e.target.value),
                              })
                            }
                            disabled={uploading}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Preview Marker (Opsional)
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleMarkerImageChange(
                              index,
                              e.target.files?.[0] || null
                            )
                          }
                          disabled={
                            uploading || validating === `marker-${index}`
                          }
                        />

                        {marker.markerImageFile && (
                          <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-muted">
                            <img
                              src={getFilePreview(marker.markerImageFile)}
                              alt="Marker preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* ✅ Marker Validation Feedback */}
                        {marker.markerValidation && (
                          <ValidationFeedback
                            result={marker.markerValidation}
                            fileName={marker.markerImageFile?.name || ""}
                            fileType="marker"
                          />
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Tipe Content *</Label>
                          <RadioGroup
                            value={marker.contentType}
                            onValueChange={(val) =>
                              updateMarker(index, {
                                contentType: val as "video" | "image",
                                contentFile: null,
                                contentValidation: null,
                              })
                            }
                            disabled={uploading}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="video"
                                id={`video-${index}`}
                              />
                              <Label
                                htmlFor={`video-${index}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <FileVideo className="w-4 h-4" />
                                Video
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="image"
                                id={`image-${index}`}
                              />
                              <Label
                                htmlFor={`image-${index}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Image className="w-4 h-4" />
                                Image
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            {marker.contentType === "video"
                              ? "Video Content *"
                              : "Image Content *"}
                          </Label>
                          <Input
                            type="file"
                            accept={
                              marker.contentType === "video"
                                ? "video/*"
                                : "image/*"
                            }
                            onChange={(e) =>
                              handleContentFileChange(
                                index,
                                e.target.files?.[0] || null
                              )
                            }
                            disabled={
                              uploading || validating === `content-${index}`
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {marker.contentType === "video"
                              ? "Video akan ditampilkan saat marker terdeteksi"
                              : "Gambar akan ditampilkan saat marker terdeteksi"}
                          </p>
                        </div>

                        {/* Content Preview */}
                        {marker.contentFile && (
                          <div className="space-y-2">
                            <Label>Preview</Label>
                            <div className="w-full max-w-xs rounded-lg overflow-hidden border-2 border-muted">
                              {marker.contentType === "video" ? (
                                <video
                                  src={URL.createObjectURL(marker.contentFile)}
                                  controls
                                  className="w-full"
                                />
                              ) : (
                                <img
                                  src={getFilePreview(marker.contentFile)}
                                  alt="Content preview"
                                  className="w-full h-auto"
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* ✅ Content Validation Feedback */}
                        {marker.contentValidation && (
                          <ValidationFeedback
                            result={marker.contentValidation}
                            fileName={marker.contentFile?.name || ""}
                            fileType={marker.contentType}
                          />
                        )}
                      </div>

                      {/* Scale Slider */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Skala Content</Label>
                          <Badge variant="outline">
                            {marker.scale.toFixed(1)}x
                          </Badge>
                        </div>
                        <Slider
                          value={[marker.scale]}
                          onValueChange={(val) =>
                            updateMarker(index, { scale: val[0] })
                          }
                          min={0.1}
                          max={3.0}
                          step={0.1}
                          disabled={uploading}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Atur ukuran content relatif terhadap marker
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={uploading || !projectName || markers.length === 0}
            className="flex-1"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Buat Project ({markers.length} Marker
                {markers.length > 1 ? "s" : ""})
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Tips untuk hasil AR terbaik:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gunakan marker dengan kontras tinggi (gelap-terang)</li>
              <li>
                Hindari marker yang terlalu sederhana atau terlalu kompleks
              </li>
              <li>Video optimal: 720p-1080p, durasi {"<"} 2 menit</li>
              <li>Marker image: minimal 512x512px, idealnya 1024x1024px</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
