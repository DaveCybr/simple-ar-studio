import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, CheckCircle, AlertCircle, Wand2 } from "lucide-react";

export const ARJSPatternGenerator = ({ onPatternGenerated }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [markerPreview, setMarkerPreview] = useState(null);
  const [patternRatio, setPatternRatio] = useState(0.5);
  const [imageSize, setImageSize] = useState(512);
  const [borderColor, setBorderColor] = useState("black");
  const [fullImageMode, setFullImageMode] = useState(false);
  const [processing, setProcessing] = useState(false);

  // AR.js Pattern Encoding (simplified version)
  const encodeImage = (image) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 16;
    canvas.height = 16;

    let patternFileString = "";

    for (
      let orientation = 0;
      orientation > -2 * Math.PI;
      orientation -= Math.PI / 2
    ) {
      context.save();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(orientation);
      context.drawImage(
        image,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      );
      context.restore();

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (orientation !== 0) patternFileString += "\n";

      for (let channelOffset = 2; channelOffset >= 0; channelOffset--) {
        for (let y = 0; y < imageData.height; y++) {
          for (let x = 0; x < imageData.width; x++) {
            if (x !== 0) patternFileString += " ";
            const offset = y * imageData.width * 4 + x * 4 + channelOffset;
            const value = imageData.data[offset];
            patternFileString += String(value).padStart(3, " ");
          }
          patternFileString += "\n";
        }
      }
    }
    return patternFileString;
  };

  const buildFullMarker = (innerImage, callback) => {
    const whiteMargin = 0.1;
    const blackMargin = (1 - 2 * whiteMargin) * ((1 - patternRatio) / 2);
    const innerMargin = whiteMargin + blackMargin;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = canvas.height = imageSize;

    if (fullImageMode) {
      context.drawImage(innerImage, 0, 0, canvas.width, canvas.height);
    } else {
      // White background
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Black border
      context.fillStyle = borderColor;
      context.fillRect(
        whiteMargin * canvas.width,
        whiteMargin * canvas.height,
        canvas.width * (1 - 2 * whiteMargin),
        canvas.height * (1 - 2 * whiteMargin)
      );

      // White inner frame
      context.fillStyle = "white";
      context.fillRect(
        innerMargin * canvas.width,
        innerMargin * canvas.height,
        canvas.width * (1 - 2 * innerMargin),
        canvas.height * (1 - 2 * innerMargin)
      );

      // Inner image
      context.drawImage(
        innerImage,
        innerMargin * canvas.width,
        innerMargin * canvas.height,
        canvas.width * (1 - 2 * innerMargin),
        canvas.height * (1 - 2 * innerMargin)
      );
    }

    callback(canvas.toDataURL());
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      generateMarkerPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const generateMarkerPreview = (imageSrc) => {
    const img = new Image();
    img.onload = () => {
      buildFullMarker(img, (markerDataUrl) => {
        setMarkerPreview(markerDataUrl);
      });
    };
    img.src = imageSrc;
  };

  const handleGeneratePattern = async () => {
    if (!imagePreview) return;

    setProcessing(true);

    try {
      const img = new Image();
      img.src = imagePreview;

      await new Promise((resolve) => {
        if (img.complete) resolve();
        else img.onload = resolve;
      });

      // Generate .patt content
      const patternContent = encodeImage(img);

      // Create .patt file
      const pattBlob = new Blob([patternContent], { type: "text/plain" });
      const pattFile = new File([pattBlob], `marker-${Date.now()}.patt`, {
        type: "text/plain",
      });

      // Create marker image file
      const markerBlob = await fetch(markerPreview).then((r) => r.blob());
      const markerImageFile = new File(
        [markerBlob],
        `marker-image-${Date.now()}.png`,
        { type: "image/png" }
      );

      // Callback dengan kedua file
      onPatternGenerated({
        patternFile: pattFile,
        markerImageFile: markerImageFile,
        markerPreviewUrl: markerPreview,
      });
    } catch (error) {
      console.error("Error generating pattern:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Marker</CardTitle>
        <CardDescription>
          Upload gambar untuk membuat pattern marker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-2">
          <Label>Upload Gambar</Label>
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="marker-image-upload"
            />
            <label htmlFor="marker-image-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Klik untuk upload atau drag & drop
              </p>
            </label>
          </div>
        </div>

        {imagePreview && (
          <>
            {/* Settings */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Pattern Ratio</Label>
                  <span className="text-sm font-medium">
                    {patternRatio.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[patternRatio * 100]}
                  onValueChange={(val) => {
                    setPatternRatio(val[0] / 100);
                    if (imagePreview) generateMarkerPreview(imagePreview);
                  }}
                  min={0}
                  max={100}
                  step={1}
                  disabled={fullImageMode}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Image Size</Label>
                  <span className="text-sm font-medium">{imageSize}px</span>
                </div>
                <Slider
                  value={[imageSize]}
                  onValueChange={(val) => {
                    setImageSize(val[0]);
                    if (imagePreview) generateMarkerPreview(imagePreview);
                  }}
                  min={128}
                  max={2048}
                  step={128}
                />
              </div>

              <div className="space-y-2">
                <Label>Border Color</Label>
                <Input
                  value={borderColor}
                  onChange={(e) => {
                    setBorderColor(e.target.value);
                    if (imagePreview) generateMarkerPreview(imagePreview);
                  }}
                  placeholder="black, #000000, rgb(0,0,0)"
                  disabled={fullImageMode}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fullImageMode"
                  checked={fullImageMode}
                  onChange={(e) => {
                    setFullImageMode(e.target.checked);
                    if (imagePreview) generateMarkerPreview(imagePreview);
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor="fullImageMode" className="cursor-pointer">
                  Full Image Mode (No Border)
                </Label>
              </div>
            </div>

            {/* Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Original Image</Label>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Marker Preview</Label>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {markerPreview && (
                    <img
                      src={markerPreview}
                      alt="Marker"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Marker preview akan otomatis ter-generate. Klik tombol di bawah
                untuk menggunakan pattern ini.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGeneratePattern}
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Gunakan Pattern Ini
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Component untuk button trigger generator
export const PatternGeneratorButton = ({ onPatternGenerated, disabled }) => {
  const [open, setOpen] = useState(false);

  const handleGenerated = (data) => {
    onPatternGenerated(data);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        Generate Pattern dari Gambar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marker Generator</DialogTitle>
          </DialogHeader>
          <ARJSPatternGenerator onPatternGenerated={handleGenerated} />
        </DialogContent>
      </Dialog>
    </>
  );
};
