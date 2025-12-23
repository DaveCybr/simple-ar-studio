import React, { useState, useRef } from "react";
import { Upload, Download, Image, FileText, AlertCircle } from "lucide-react";

const ARMarkerGenerator = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [patternRatio, setPatternRatio] = useState<number>(0.5);
  const [imageSize, setImageSize] = useState<number>(512);
  const [borderColor, setBorderColor] = useState<string>("#000000");
  const [patternData, setPatternData] = useState<string>("");
  const [fullMarkerUrl, setFullMarkerUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Encode image to pattern file format
  const encodeImage = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.crossOrigin = "Anonymous";

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const context = canvas.getContext("2d");

        if (!context) {
          reject("Cannot get canvas context");
          return;
        }

        context.drawImage(image, 0, 0, 16, 16);
        const imageData = context.getImageData(0, 0, 16, 16);

        // Convert to grayscale and build pattern string
        let patternString = "";
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const index = (y * 16 + x) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];
            const grayscale = Math.floor((r + g + b) / 3);
            patternString += grayscale + " ";
            if ((x + 1) % 16 === 0) patternString += "\n";
          }
        }

        resolve(patternString);
      };

      image.onerror = () => reject("Failed to load image");
      image.src = imageUrl;
    });
  };

  // Build full marker with border
  const buildFullMarker = (innerImageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.crossOrigin = "Anonymous";

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = imageSize;
        canvas.height = imageSize;
        const context = canvas.getContext("2d");

        if (!context) {
          reject("Cannot get canvas context");
          return;
        }

        // Fill background with border color
        context.fillStyle = borderColor;
        context.fillRect(0, 0, imageSize, imageSize);

        // Calculate inner image size based on pattern ratio
        const innerSize = imageSize * patternRatio;
        const offset = (imageSize - innerSize) / 2;

        // Draw inner image
        context.drawImage(image, offset, offset, innerSize, innerSize);

        resolve(canvas.toDataURL("image/png"));
      };

      image.onerror = () => reject("Failed to load image");
      image.src = innerImageUrl;
    });
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setImageUrl(url);
      processImage(url);
    };
    reader.readAsDataURL(file);
  };

  // Process uploaded image
  const processImage = async (url: string) => {
    setLoading(true);
    try {
      const pattern = await encodeImage(url);
      setPatternData(pattern);

      const fullMarker = await buildFullMarker(url);
      setFullMarkerUrl(fullMarker);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try another image.");
    }
    setLoading(false);
  };

  // Update full marker when settings change
  const updateMarker = async () => {
    if (!imageUrl) return;
    setLoading(true);
    try {
      const fullMarker = await buildFullMarker(imageUrl);
      setFullMarkerUrl(fullMarker);
    } catch (error) {
      console.error("Error updating marker:", error);
    }
    setLoading(false);
  };

  // Download pattern file
  const downloadPattern = () => {
    if (!patternData) return;

    const blob = new Blob([patternData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pattern-marker.patt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download marker image
  const downloadImage = () => {
    if (!fullMarkerUrl) return;

    const a = document.createElement("a");
    a.href = fullMarkerUrl;
    a.download = "marker-image.png";
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            AR.js Marker Generator
          </h1>
          <p className="text-gray-600">
            Upload an image and generate custom AR markers with pattern files
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload & Settings
            </h2>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Choose Image
              </button>
            </div>

            {/* Pattern Ratio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pattern Ratio: {patternRatio.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={patternRatio}
                onChange={(e) => setPatternRatio(parseFloat(e.target.value))}
                onMouseUp={updateMarker}
                onTouchEnd={updateMarker}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Size of inner image vs black border
              </p>
            </div>

            {/* Image Size */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Size: {imageSize}px
              </label>
              <select
                value={imageSize}
                onChange={(e) => {
                  setImageSize(parseInt(e.target.value));
                  setTimeout(updateMarker, 100);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="256">256px</option>
                <option value="512">512px</option>
                <option value="1024">1024px</option>
                <option value="2048">2048px</option>
              </select>
            </div>

            {/* Border Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Border Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  onBlur={updateMarker}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  onBlur={updateMarker}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="#000000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use dark colors for better tracking
              </p>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Tips for best results:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Use high contrast images</li>
                  <li>Avoid symmetrical patterns</li>
                  <li>Include enough detail</li>
                  <li>Dark borders work best</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Download */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Preview & Download
            </h2>

            {/* Preview */}
            <div className="mb-6">
              {loading ? (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                </div>
              ) : fullMarkerUrl ? (
                <img
                  src={fullMarkerUrl}
                  alt="Marker Preview"
                  className="w-full aspect-square object-contain bg-gray-50 rounded-lg border-2 border-gray-200"
                />
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Image className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>Upload an image to see preview</p>
                  </div>
                </div>
              )}
            </div>

            {/* Download Buttons */}
            <div className="space-y-3">
              <button
                onClick={downloadPattern}
                disabled={!patternData}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Download Pattern File (.patt)
              </button>

              <button
                onClick={downloadImage}
                disabled={!fullMarkerUrl}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Marker Image (.png)
              </button>
            </div>

            {/* Usage Example */}
            {patternData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Usage Example (A-Frame):
                </p>
                <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                  {`<a-marker type='pattern' 
  patternUrl='path/to/pattern-marker.patt'>
  <a-box position='0 0.5 0' 
    material='color: red;'>
  </a-box>
</a-marker>`}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};

export default ARMarkerGenerator;
