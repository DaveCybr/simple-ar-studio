import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { FileVideo, Image, CheckCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export interface MarkerData {
  id: string;
  name: string;
  markerFile: File | null;
  mindFile: File | null;
  contentFile: File | null;
  contentType: "video" | "image";
  scale: number;
}

interface MarkerInputProps {
  marker: MarkerData;
  index: number;
  onChange: (marker: MarkerData) => void;
  onRemove: () => void;
  disabled?: boolean;
  canRemove?: boolean;
}

export const MarkerInput = ({
  marker,
  index,
  onChange,
  onRemove,
  disabled = false,
  canRemove = true,
}: MarkerInputProps) => {
  const [expanded, setExpanded] = useState(true);

  const updateField = <K extends keyof MarkerData>(field: K, value: MarkerData[K]) => {
    onChange({ ...marker, [field]: value });
  };

  return (
    <Card className="border-2 border-dashed border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            className="flex items-center gap-2 text-left flex-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="font-medium">Marker {index + 1}</span>
            {marker.name && (
              <span className="text-sm text-muted-foreground">- {marker.name}</span>
            )}
          </button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={disabled}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {expanded && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Marker</Label>
              <Input
                value={marker.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Contoh: Cover Depan"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Marker Image (JPG/PNG)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateField("markerFile", e.target.files?.[0] || null)}
                  disabled={disabled}
                  className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {marker.markerFile && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>.mind File</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".mind"
                  onChange={(e) => updateField("mindFile", e.target.files?.[0] || null)}
                  disabled={disabled}
                  className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {marker.mindFile && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Buat di{" "}
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
                  variant={marker.contentType === "video" ? "default" : "outline"}
                  onClick={() => updateField("contentType", "video")}
                  disabled={disabled}
                  className="flex-1"
                >
                  <FileVideo className="w-4 h-4 mr-2" />
                  Video
                </Button>
                <Button
                  type="button"
                  variant={marker.contentType === "image" ? "default" : "outline"}
                  onClick={() => updateField("contentType", "image")}
                  disabled={disabled}
                  className="flex-1"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {marker.contentType === "video" ? "Video File (MP4)" : "Image File (JPG/PNG)"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept={marker.contentType === "video" ? "video/*" : "image/*"}
                  onChange={(e) => updateField("contentFile", e.target.files?.[0] || null)}
                  disabled={disabled}
                  className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {marker.contentFile && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ukuran AR Content</Label>
                <span className="text-sm font-medium text-primary">{marker.scale.toFixed(1)}x</span>
              </div>
              <Slider
                value={[marker.scale]}
                onValueChange={(value) => updateField("scale", value[0])}
                min={0.5}
                max={3}
                step={0.1}
                disabled={disabled}
                className="w-full"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
