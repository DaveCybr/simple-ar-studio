// src/types/ar.ts - FIXED VERSION
// ✅ Aligned dengan database schema

export type ARLibrary = "mindar" | "arjs";

// ✅ FIXED: Match database enum EXACTLY
export type SubscriptionTier = "demo" | "pro" | "pro_plus";

// ========================================
// Database Row Types (dari Supabase)
// ========================================

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  upload_quota: number;
  uploads_used: number;
  stripe_customer_id: string | null;
  trial_ends_at: string | null;
  is_trial_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ARProjectRow {
  id: string;
  name: string;
  library: ARLibrary;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ARContentRow {
  id: string;
  name: string;
  library: ARLibrary;
  marker_url: string | null; // ✅ Nullable
  mind_file_url: string | null; // ✅ Nullable
  marker_data: MarkerData; // ✅ JSONB
  content_url: string;
  content_type: string;
  scale: number;
  project_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// ========================================
// Marker Data Types (for marker_data JSONB column)
// ========================================

export interface MindARMarkerData {
  library: "mindar";
  mindUrl: string;
  targetIndex?: number;
}

export interface ARJSPatternMarkerData {
  library: "arjs";
  markerType: "pattern";
  patternUrl: string;
}

export interface ARJSBarcodeMarkerData {
  library: "arjs";
  markerType: "barcode";
  barcodeValue: number; // 0-63
}

export interface ARJSPresetMarkerData {
  library: "arjs";
  markerType: "hiro" | "kanji";
  preset: "hiro" | "kanji";
}

export type ARJSMarkerData =
  | ARJSPatternMarkerData
  | ARJSBarcodeMarkerData
  | ARJSPresetMarkerData;

export type MarkerData = MindARMarkerData | ARJSMarkerData;

// ========================================
// Form/UI Types (for creating markers)
// ========================================

export interface MarkerDataBase {
  id: string;
  name: string;
  contentFile: File | null;
  contentType: "video" | "image";
  scale: number;
  library: ARLibrary;
}

export interface MindARMarker extends MarkerDataBase {
  library: "mindar";
  markerFile: File | null; // Preview image
  mindFile?: File | null; // .mind file (optional if URL provided)
}

export interface ARJSMarker extends MarkerDataBase {
  library: "arjs";
  markerType: "pattern" | "barcode" | "hiro" | "kanji";
  patternFile?: File | null; // .patt file for pattern type
  barcodeValue?: number; // 0-63 for barcode type
  markerImageFile?: File | null; // Preview image (optional for presets)
}

export type MarkerFormData = MindARMarker | ARJSMarker;

// ========================================
// Subscription & Quota Types
// ========================================

export interface SubscriptionConfig {
  tier: SubscriptionTier;
  name: string;
  quota: number;
  maxMarkers: number;
  features: string[];
  stripePriceId: string | null;
  price: number; // in dollars
}

export const SUBSCRIPTION_CONFIGS: Record<
  SubscriptionTier,
  SubscriptionConfig
> = {
  demo: {
    tier: "demo",
    name: "Demo (Free Trial)",
    quota: 5, // Unlimited during trial
    maxMarkers: 3,
    features: [
      "14-day free trial",
      "Full Pro features",
      "Unlimited views/scans",
      "Watermark on projects",
    ],
    stripePriceId: null,
    price: 0,
  },
  pro: {
    tier: "pro",
    name: "PRO",
    quota: 20,
    maxMarkers: 5,
    features: [
      "20 projects/month",
      "5 markers per project",
      "Unlimited views/scans",
      "No watermark",
      "Analytics",
      "Priority support",
    ],
    stripePriceId: "price_1SjLcR2LSlGk7TpHhY1p4qsC", // Replace with your actual Price ID
    price: 29,
  },
  pro_plus: {
    tier: "pro_plus",
    name: "PRO+",
    quota: 30,
    maxMarkers: 10,
    features: [
      "30 projects/month",
      "10 markers per project",
      "Unlimited views/scans",
      "No watermark",
      "Advanced analytics",
      "Video editor",
      "Code generation",
      "Priority upload",
      "Dedicated support",
    ],
    stripePriceId: "price_1SjLd62LSlGk7TpH1yaPXeVN", // Replace with your actual Price ID
    price: 39,
  },
};

// ========================================
// Type Guards
// ========================================

export function isMindARMarkerData(data: any): data is MindARMarkerData {
  return data?.library === "mindar" && typeof data?.mindUrl === "string";
}

export function isARJSMarkerData(data: any): data is ARJSMarkerData {
  return (
    data?.library === "arjs" &&
    ["pattern", "barcode", "hiro", "kanji"].includes(data?.markerType)
  );
}

export function isPatternMarker(data: any): data is ARJSPatternMarkerData {
  return (
    isARJSMarkerData(data) &&
    data.markerType === "pattern" &&
    typeof data.patternUrl === "string"
  );
}

export function isBarcodeMarker(data: any): data is ARJSBarcodeMarkerData {
  return (
    isARJSMarkerData(data) &&
    data.markerType === "barcode" &&
    typeof data.barcodeValue === "number"
  );
}

export function isPresetMarker(data: any): data is ARJSPresetMarkerData {
  return (
    isARJSMarkerData(data) &&
    (data.markerType === "hiro" || data.markerType === "kanji") &&
    typeof data.preset === "string"
  );
}

export function isMindARMarker(marker: MarkerFormData): marker is MindARMarker {
  return marker.library === "mindar";
}

export function isARJSMarker(marker: MarkerFormData): marker is ARJSMarker {
  return marker.library === "arjs";
}

// ========================================
// Helper Functions
// ========================================

export function getSubscriptionConfig(
  tier: SubscriptionTier
): SubscriptionConfig {
  return SUBSCRIPTION_CONFIGS[tier];
}

export function isTrialActive(profile: ProfileRow): boolean {
  if (!profile.is_trial_active || !profile.trial_ends_at) {
    return false;
  }
  return new Date(profile.trial_ends_at) > new Date();
}

export function getTrialDaysRemaining(profile: ProfileRow): number {
  if (!profile.trial_ends_at) return 0;
  const endDate = new Date(profile.trial_ends_at);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function canUpload(profile: ProfileRow): boolean {
  // Check if within quota
  if (profile.uploads_used >= profile.upload_quota) {
    return false;
  }

  // Check if trial is still valid (for demo tier)
  if (profile.subscription_tier === "demo") {
    return isTrialActive(profile);
  }

  return true;
}

// ========================================
// Validation Types
// ========================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface MarkerValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}
