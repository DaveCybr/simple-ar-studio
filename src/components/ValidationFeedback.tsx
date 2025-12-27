// src/components/ValidationFeedback.tsx
// UI Components for displaying validation results

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  FileVideo,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import type { ValidationResult } from "@/lib/fileValidation";

interface ValidationFeedbackProps {
  result: ValidationResult | null;
  fileName: string;
  fileType: "video" | "image" | "pattern" | "marker";
}

export const ValidationFeedback = ({
  result,
  fileName,
  fileType,
}: ValidationFeedbackProps) => {
  if (!result) return null;

  const getIcon = () => {
    switch (fileType) {
      case "video":
        return FileVideo;
      case "image":
      case "marker":
        return ImageIcon;
      case "pattern":
        return FileText;
      default:
        return Info;
    }
  };

  const Icon = getIcon();

  return (
    <div className="space-y-3 mt-3">
      {/* Success/Error Alert */}
      {!result.valid ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>File Tidak Valid</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">{fileName}</p>
              <p>{result.error}</p>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            File Valid
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="font-medium">{fileName}</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {result.valid && result.warnings && result.warnings.length > 0 && (
        <Alert
          variant="default"
          className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Peringatan
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Metadata Display */}
      {result.valid && result.metadata && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Info File</span>
            {result.metadata.quality && (
              <QualityBadge quality={result.metadata.quality} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {result.metadata.width && result.metadata.height && (
              <div>
                <span className="text-muted-foreground">Resolusi:</span>
                <p className="font-medium">
                  {result.metadata.width} × {result.metadata.height}
                </p>
              </div>
            )}

            {result.metadata.aspectRatio && (
              <div>
                <span className="text-muted-foreground">Rasio:</span>
                <p className="font-medium">{result.metadata.aspectRatio}</p>
              </div>
            )}

            {result.metadata.duration !== undefined && (
              <div>
                <span className="text-muted-foreground">Durasi:</span>
                <p className="font-medium">{result.metadata.duration}s</p>
              </div>
            )}

            {result.metadata.fileSize && (
              <div>
                <span className="text-muted-foreground">Ukuran:</span>
                <p className="font-medium">{result.metadata.fileSize}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface QualityBadgeProps {
  quality: "excellent" | "good" | "fair" | "poor";
}

const QualityBadge = ({ quality }: QualityBadgeProps) => {
  const configs = {
    excellent: {
      label: "Excellent",
      className: "bg-green-500 hover:bg-green-600",
      icon: "⭐",
    },
    good: {
      label: "Good",
      className: "bg-blue-500 hover:bg-blue-600",
      icon: "✓",
    },
    fair: {
      label: "Fair",
      className: "bg-yellow-500 hover:bg-yellow-600",
      icon: "~",
    },
    poor: {
      label: "Poor",
      className: "bg-red-500 hover:bg-red-600",
      icon: "!",
    },
  };

  const config = configs[quality];

  return (
    <Badge variant="default" className={config.className}>
      {config.icon} {config.label}
    </Badge>
  );
};

// Validation Progress Component
interface ValidationProgressProps {
  fileName: string;
  progress: number;
}

export const ValidationProgress = ({
  fileName,
  progress,
}: ValidationProgressProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground truncate flex-1">
          {fileName}
        </span>
        <span className="font-medium ml-2">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
