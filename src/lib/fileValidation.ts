// src/lib/fileValidation.ts
// ✅ Comprehensive file validation with detailed feedback

export const FILE_LIMITS = {
  VIDEO: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ],
    ALLOWED_EXTENSIONS: [".mp4", ".webm", ".mov", ".avi"],
    MAX_DURATION: 120, // 2 minutes
    RECOMMENDED_RESOLUTION: { width: 1280, height: 720 },
    MAX_RESOLUTION: { width: 1920, height: 1080 },
  },
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
    MIN_RESOLUTION: { width: 512, height: 512 },
    MAX_RESOLUTION: { width: 4096, height: 4096 },
  },
  MARKER: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/png"],
    ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png"],
    RECOMMENDED_RESOLUTION: { width: 1024, height: 1024 },
    MIN_RESOLUTION: { width: 300, height: 300 },
  },
  PATTERN: {
    MAX_SIZE: 1 * 1024 * 1024, // 1MB
    ALLOWED_TYPES: ["text/plain", "application/octet-stream"],
    ALLOWED_EXTENSIONS: [".patt"],
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

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Validate video file
export async function validateVideo(file: File): Promise<ValidationResult> {
  const warnings: string[] = [];

  // 1. Basic checks
  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  // 2. File extension check
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!FILE_LIMITS.VIDEO.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Format video tidak didukung. Gunakan: ${FILE_LIMITS.VIDEO.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  // 3. MIME type check
  if (!FILE_LIMITS.VIDEO.ALLOWED_TYPES.includes(file.type)) {
    warnings.push(
      `MIME type tidak standar (${file.type}), tapi akan tetap dicoba`
    );
  }

  // 4. Size check
  if (file.size > FILE_LIMITS.VIDEO.MAX_SIZE) {
    return {
      valid: false,
      error: `Video terlalu besar (${formatFileSize(
        file.size
      )}). Maksimal ${formatFileSize(FILE_LIMITS.VIDEO.MAX_SIZE)}`,
    };
  }

  // 5. Get video metadata
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
      warnings.push(
        "Video terlalu pendek (< 1 detik). Pastikan ini yang Anda inginkan."
      );
    }

    // Resolution checks
    const { width, height } = FILE_LIMITS.VIDEO.RECOMMENDED_RESOLUTION;
    const { MAX_RESOLUTION } = FILE_LIMITS.VIDEO;

    if (
      metadata.width > MAX_RESOLUTION.width ||
      metadata.height > MAX_RESOLUTION.height
    ) {
      warnings.push(
        `Resolusi sangat tinggi (${metadata.width}x${metadata.height}). Akan dikompres ke ${MAX_RESOLUTION.width}x${MAX_RESOLUTION.height} untuk performa optimal.`
      );
    } else if (metadata.width > width * 1.5 || metadata.height > height * 1.5) {
      warnings.push(
        `Resolusi tinggi (${metadata.width}x${metadata.height}). Rekomendasi: ${width}x${height} untuk performa AR terbaik.`
      );
    } else if (metadata.width < 640 || metadata.height < 480) {
      warnings.push(
        `Resolusi rendah (${metadata.width}x${metadata.height}). Hasil AR mungkin kurang tajam.`
      );
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

// Validate image file
export async function validateImage(
  file: File,
  type: "content" | "marker"
): Promise<ValidationResult> {
  const limits = type === "marker" ? FILE_LIMITS.MARKER : FILE_LIMITS.IMAGE;
  const warnings: string[] = [];

  // 1. Basic checks
  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  // 2. Extension check
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!limits.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Format gambar tidak didukung. Gunakan: ${limits.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  // 3. MIME type check
  if (!limits.ALLOWED_TYPES.includes(file.type)) {
    warnings.push(
      `MIME type tidak standar (${file.type}), tapi akan tetap dicoba`
    );
  }

  // 4. Size check
  if (file.size > limits.MAX_SIZE) {
    return {
      valid: false,
      error: `Gambar terlalu besar (${formatFileSize(
        file.size
      )}). Maksimal ${formatFileSize(limits.MAX_SIZE)}`,
    };
  }

  // 5. Get image metadata
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
          `Resolusi sangat tinggi (${metadata.width}x${metadata.height}). Akan dikompres otomatis.`
        );
      }
    }

    // Marker-specific validation
    if (type === "marker") {
      // Check aspect ratio (should be close to square)
      const aspectRatio = metadata.width / metadata.height;
      if (Math.abs(aspectRatio - 1) > 0.2) {
        warnings.push(
          `Marker tidak persegi (${metadata.width}x${metadata.height}). Sebaiknya gunakan aspek rasio 1:1 untuk hasil optimal.`
        );
      }

      // Check if image is too small for reliable tracking
      if (metadata.width < 512 || metadata.height < 512) {
        warnings.push(
          "Resolusi marker cukup rendah. Deteksi mungkin kurang akurat. Rekomendasi: minimal 1024x1024px."
        );
      }

      // Check image complexity (contrast)
      const hasGoodContrast = await checkImageContrast(file);
      if (!hasGoodContrast) {
        warnings.push(
          "⚠️ PENTING: Marker memiliki kontras rendah. Gunakan gambar dengan perbedaan warna yang jelas (gelap/terang) untuk tracking yang lebih baik."
        );
      }

      // Check if image has too much detail
      const complexity = await checkImageComplexity(file);
      if (complexity === "too-simple") {
        warnings.push(
          "Marker terlalu sederhana. Tambahkan detail atau pola unik untuk tracking yang lebih baik."
        );
      } else if (complexity === "too-complex") {
        warnings.push(
          "Marker sangat kompleks. Pertimbangkan menyederhanakan desain untuk tracking yang lebih stabil."
        );
      }
    }

    // Quality assessment
    let quality: "excellent" | "good" | "fair" | "poor" = "good";
    if (type === "marker") {
      if (metadata.width >= 1024 && metadata.height >= 1024) {
        quality = "excellent";
      } else if (metadata.width >= 512 && metadata.height >= 512) {
        quality = "good";
      } else {
        quality = "fair";
      }
    } else {
      if (metadata.width >= 1920 && metadata.height >= 1080) {
        quality = "excellent";
      } else if (metadata.width >= 1024 && metadata.height >= 1024) {
        quality = "good";
      } else if (metadata.width >= 512 && metadata.height >= 512) {
        quality = "fair";
      } else {
        quality = "poor";
      }
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

// Validate pattern file (.patt)
export function validatePattern(file: File): ValidationResult {
  const warnings: string[] = [];

  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (extension !== ".patt") {
    return {
      valid: false,
      error: "File harus berformat .patt",
    };
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
    warnings.push(
      "File pattern sangat kecil. Pastikan file valid dan lengkap."
    );
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      fileSize: formatFileSize(file.size),
    },
  };
}

// Helper: Get video metadata
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
      reject(
        new Error("File video corrupt atau format tidak didukung browser")
      );
    };

    try {
      video.src = URL.createObjectURL(file);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

// Helper: Get image metadata
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
      reject(
        new Error("File gambar corrupt atau format tidak didukung browser")
      );
    };

    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

// Helper: Check image contrast
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
    return contrast > 80; // Good contrast threshold
  } catch {
    return true; // If check fails, assume OK
  }
}

// Helper: Check image complexity
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

    // Count unique colors (simplified edge detection)
    let uniqueColors = new Set<string>();
    for (let i = 0; i < data.length; i += 4) {
      const color = `${Math.floor(data[i] / 32)},${Math.floor(
        data[i + 1] / 32
      )},${Math.floor(data[i + 2] / 32)}`;
      uniqueColors.add(color);
    }

    const uniqueCount = uniqueColors.size;

    if (uniqueCount < 10) return "too-simple";
    if (uniqueCount > 200) return "too-complex";
    return "good";
  } catch {
    return "good";
  }
}

// Helper: Calculate aspect ratio
function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}
