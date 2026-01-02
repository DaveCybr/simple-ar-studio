// src/types/ar.ts - Updated to match database schema
export type ARLibrary = "mindar" | "arjs";

// Subscription tier type matching database enum
export type SubscriptionTier = "free" | "pro" | "enterprise";

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
  markerFile: File | null;
  mindFile?: File | null;
}

export interface ARJSMarker extends MarkerDataBase {
  library: "arjs";
  patternFile?: File | null;
  markerType: "pattern" | "barcode" | "hiro" | "kanji";
  barcodeValue?: number;
  markerImageFile?: File | null;
}

export type MarkerData = MindARMarker | ARJSMarker;

// Database schema for ar_content table
export interface ARContentDB {
  id: string;
  name: string;
  marker_url: string;
  mind_file_url: string;
  content_url: string;
  content_type: string;
  scale: number;
  project_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// AR Marker type for ViewAR page
export interface ARMarker {
  id: string;
  name: string;
  marker_url: string;
  mind_file_url: string;
  content_url: string;
  content_type: string;
  scale: number;
  project_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// Marker type for project list display
export interface Marker {
  id: string;
  name: string;
  marker_url: string;
  mind_file_url: string;
  content_url: string;
  content_type: string;
  scale: number;
  project_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// Profile type matching database schema
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  upload_quota: number;
  uploads_used: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}
