// src/lib/fileValidation.ts - FIXED VERSION
// ✅ Type-safe dengan proper error handling

export const FILE_LIMITS = {
  VIDEO: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ] as const,
    ALLOWED_EXTENSIONS: [".mp4", ".webm", ".mov", ".avi"] as const,
    MAX_DURATION: 120, // 2 minutes
    RECOMMENDED_RESOLUTION: { width: 1280, height: 720 },
    MAX_RESOLUTION: { width: 1920, height: 1080 },
  },
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"] as const,
    MIN_RESOLUTION: { width: 512, height: 512 },
    MAX_RESOLUTION: { width: 4096, height: 4096 },
  },
  MARKER: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/png"] as const,
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png"] as const,
    RECOMMENDED_RESOLUTION: { width: 1024, height: 1024 },
    MIN_RESOLUTION: { width: 300, height: 300 },
  },
  PATTERN: {
    MAX_SIZE: 1 * 1024 * 1024, // 1MB
    ALLOWED_TYPES: ["text/plain", "application/octet-stream"] as const,
    ALLOWED_EXTENSIONS: [".patt"] as const,
  },
  MIND: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["application/octet-stream"] as const,
    ALLOWED_EXTENSIONS: [".mind"] as const,
  },
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    aspectRatio?: string;
    fileSize?: string;
    quality?: "excellent" | "good" | "fair" | "poor";
  };
}

// ========================================
// Helper Functions
// ========================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : "";
}

// ========================================
// Video Validation
// ========================================

export async function validateVideo(file: File): Promise<ValidationResult> {
  const warnings: string[] = [];

  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  // Extension check
  const extension = getFileExtension(file.name);
  if (!FILE_LIMITS.VIDEO.ALLOWED_EXTENSIONS.includes(extension as any)) {
    return {
      valid: false,
      error: `Format video tidak didukung. Gunakan: ${FILE_LIMITS.VIDEO.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  // MIME type check
  if (!FILE_LIMITS.VIDEO.ALLOWED_TYPES.includes(file.type as any)) {
    warnings.push(`MIME type tidak standar (${file.type}), akan tetap dicoba`);
  }

  // Size check
  if (file.size > FILE_LIMITS.VIDEO.MAX_SIZE) {
    return {
      valid: false,
      error: `Video terlalu besar (${formatFileSize(
        file.size
      )}). Maksimal ${formatFileSize(FILE_LIMITS.VIDEO.MAX_SIZE)}`,
    };
  }

  // Get metadata
  try {
    const metadata = await getVideoMetadata(file);

    // Duration check
    if (metadata.duration > FILE_LIMITS.VIDEO.MAX_DURATION) {
      return {
        valid: false,
        error: `Video terlalu panjang (${Math.round(
          metadata.duration
        )}s). Maksimal ${FILE_LIMITS.VIDEO.MAX_DURATION} detik`,
      };
    }

    if (metadata.duration < 1) {
      warnings.push("Video terlalu pendek (< 1 detik)");
    }

    // Resolution checks
    const { width, height } = FILE_LIMITS.VIDEO.RECOMMENDED_RESOLUTION;
    const { MAX_RESOLUTION } = FILE_LIMITS.VIDEO;

    if (
      metadata.width > MAX_RESOLUTION.width ||
      metadata.height > MAX_RESOLUTION.height
    ) {
      warnings.push(
        `Resolusi sangat tinggi (${metadata.width}x${metadata.height}). Akan dikompres ke ${MAX_RESOLUTION.width}x${MAX_RESOLUTION.height}`
      );
    } else if (metadata.width > width * 1.5 || metadata.height > height * 1.5) {
      warnings.push(
        `Resolusi tinggi (${metadata.width}x${metadata.height}). Rekomendasi: ${width}x${height}`
      );
    } else if (metadata.width < 640 || metadata.height < 480) {
      warnings.push(`Resolusi rendah (${metadata.width}x${metadata.height})`);
    }

    // Quality assessment
    let quality: "excellent" | "good" | "fair" | "poor" = "good";
    if (
      metadata.width >= 1920 &&
      metadata.height >= 1080 &&
      metadata.duration <= 60
    ) {
      quality = "excellent";
    } else if (metadata.width >= 1280 && metadata.height >= 720) {
      quality = "good";
    } else if (metadata.width >= 640 && metadata.height >= 480) {
      quality = "fair";
    } else {
      quality = "poor";
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        duration: Math.round(metadata.duration * 10) / 10,
        aspectRatio: calculateAspectRatio(metadata.width, metadata.height),
        fileSize: formatFileSize(file.size),
        quality,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Gagal membaca video: ${
        error instanceof Error ? error.message : "Format tidak valid"
      }`,
    };
  }
}

// ========================================
// Image Validation
// ========================================

export async function validateImage(
  file: File,
  type: "content" | "marker"
): Promise<ValidationResult> {
  const limits = type === "marker" ? FILE_LIMITS.MARKER : FILE_LIMITS.IMAGE;
  const warnings: string[] = [];

  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  // Extension check
  const extension = getFileExtension(file.name);
  if (!limits.ALLOWED_EXTENSIONS.includes(extension as any)) {
    return {
      valid: false,
      error: `Format gambar tidak didukung. Gunakan: ${limits.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  // MIME type check
  if (!limits.ALLOWED_TYPES.includes(file.type as any)) {
    warnings.push(`MIME type tidak standar (${file.type})`);
  }

  // Size check
  if (file.size > limits.MAX_SIZE) {
    return {
      valid: false,
      error: `Gambar terlalu besar (${formatFileSize(
        file.size
      )}). Maksimal ${formatFileSize(limits.MAX_SIZE)}`,
    };
  }

  // Get metadata
  try {
    const metadata = await getImageMetadata(file);

    // Resolution checks
    if ("MIN_RESOLUTION" in limits) {
      if (
        metadata.width < limits.MIN_RESOLUTION.width ||
        metadata.height < limits.MIN_RESOLUTION.height
      ) {
        return {
          valid: false,
          error: `Resolusi terlalu kecil (${metadata.width}x${metadata.height}). Minimal ${limits.MIN_RESOLUTION.width}x${limits.MIN_RESOLUTION.height}px`,
        };
      }
    }

    if ("MAX_RESOLUTION" in limits) {
      if (
        metadata.width > limits.MAX_RESOLUTION.width ||
        metadata.height > limits.MAX_RESOLUTION.height
      ) {
        warnings.push(
          `Resolusi sangat tinggi (${metadata.width}x${metadata.height}). Akan dikompres.`
        );
      }
    }

    // Marker-specific validation
    if (type === "marker") {
      const aspectRatio = metadata.width / metadata.height;
      if (Math.abs(aspectRatio - 1) > 0.2) {
        warnings.push(
          `Marker tidak persegi (${metadata.width}x${metadata.height}). Sebaiknya 1:1`
        );
      }

      if (metadata.width < 512 || metadata.height < 512) {
        warnings.push(
          "Resolusi marker rendah. Rekomendasi: minimal 1024x1024px"
        );
      }

      const hasGoodContrast = await checkImageContrast(file);
      if (!hasGoodContrast) {
        warnings.push(
          "⚠️ Marker memiliki kontras rendah. Gunakan perbedaan warna yang jelas"
        );
      }

      const complexity = await checkImageComplexity(file);
      if (complexity === "too-simple") {
        warnings.push(
          "Marker terlalu sederhana. Tambahkan detail untuk tracking lebih baik"
        );
      } else if (complexity === "too-complex") {
        warnings.push(
          "Marker sangat kompleks. Pertimbangkan menyederhanakan desain"
        );
      }
    }

    // Quality assessment
    let quality: "excellent" | "good" | "fair" | "poor" = "good";
    if (type === "marker") {
      if (metadata.width >= 1024 && metadata.height >= 1024)
        quality = "excellent";
      else if (metadata.width >= 512 && metadata.height >= 512)
        quality = "good";
      else quality = "fair";
    } else {
      if (metadata.width >= 1920 && metadata.height >= 1080)
        quality = "excellent";
      else if (metadata.width >= 1024 && metadata.height >= 1024)
        quality = "good";
      else if (metadata.width >= 512 && metadata.height >= 512)
        quality = "fair";
      else quality = "poor";
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: calculateAspectRatio(metadata.width, metadata.height),
        fileSize: formatFileSize(file.size),
        quality,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Gagal membaca gambar: ${
        error instanceof Error ? error.message : "Format tidak valid"
      }`,
    };
  }
}

// ========================================
// Pattern File Validation (.patt)
// ========================================

export function validatePattern(file: File): ValidationResult {
  const warnings: string[] = [];

  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  const extension = getFileExtension(file.name);
  if (extension !== ".patt") {
    return { valid: false, error: "File harus berformat .patt" };
  }

  if (file.size > FILE_LIMITS.PATTERN.MAX_SIZE) {
    return {
      valid: false,
      error: `File pattern terlalu besar (${formatFileSize(
        file.size
      )}). Maksimal ${formatFileSize(FILE_LIMITS.PATTERN.MAX_SIZE)}`,
    };
  }

  if (file.size < 1000) {
    warnings.push("File pattern sangat kecil. Pastikan file valid dan lengkap");
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: { fileSize: formatFileSize(file.size) },
  };
}

// ========================================
// Mind File Validation (.mind)
// ========================================

export function validateMindFile(file: File): ValidationResult {
  const warnings: string[] = [];

  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  const extension = getFileExtension(file.name);
  if (extension !== ".mind") {
    return { valid: false, error: "File harus berformat .mind" };
  }

  if (file.size > FILE_LIMITS.MIND.MAX_SIZE) {
    return {
      valid: false,
      error: `File .mind terlalu besar (${formatFileSize(
        file.size
      )}). Maksimal ${formatFileSize(FILE_LIMITS.MIND.MAX_SIZE)}`,
    };
  }

  if (file.size < 5000) {
    warnings.push("File .mind sangat kecil. Pastikan file valid");
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: { fileSize: formatFileSize(file.size) },
  };
}

// ========================================
// Metadata Helpers
// ========================================

async function getVideoMetadata(file: File): Promise<{
  width: number;
  height: number;
  duration: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Timeout: Video tidak bisa dibaca dalam 10 detik"));
    }, 10000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(video.src);

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error("Video corrupt atau tidak memiliki dimensi"));
        return;
      }

      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };

    video.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(video.src);
      reject(new Error("File video corrupt atau format tidak didukung"));
    };

    try {
      video.src = URL.createObjectURL(file);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

async function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Timeout: Gambar tidak bisa dibaca dalam 5 detik"));
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(img.src);

      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error("Gambar corrupt atau tidak memiliki dimensi"));
        return;
      }

      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(img.src);
      reject(new Error("File gambar corrupt atau format tidak didukung"));
    };

    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

async function checkImageContrast(file: File): Promise<boolean> {
  try {
    const img = await createImageBitmap(file, {
      resizeWidth: 100,
      resizeHeight: 100,
      resizeQuality: "low",
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;

    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);

    const imageData = ctx.getImageData(0, 0, 100, 100);
    const data = imageData.data;

    let minBrightness = 255;
    let maxBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
    }

    const contrast = maxBrightness - minBrightness;
    return contrast > 80;
  } catch {
    return true;
  }
}

async function checkImageComplexity(
  file: File
): Promise<"good" | "too-simple" | "too-complex"> {
  try {
    const img = await createImageBitmap(file, {
      resizeWidth: 50,
      resizeHeight: 50,
      resizeQuality: "low",
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "good";

    canvas.width = 50;
    canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);

    const imageData = ctx.getImageData(0, 0, 50, 50);
    const data = imageData.data;

    const colors = new Set<string>();
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor(data[i] / 32);
      const g = Math.floor(data[i + 1] / 32);
      const b = Math.floor(data[i + 2] / 32);
      colors.add(`${r}-${g}-${b}`);
    }

    const uniqueColors = colors.size;

    if (uniqueColors < 10) return "too-simple";
    if (uniqueColors > 200) return "too-complex";
    return "good";
  } catch {
    return "good";
  }
}
