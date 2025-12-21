// src/types/ar.ts - RECOMMENDED VERSION
export type ARLibrary = "mindar" | "arjs";

export interface MarkerDataBase {
  id: string;
  name: string;
  contentFile: File | null;
  contentType: "video" | "image";
  scale: number;
  library: ARLibrary; // ✅ PENTING: Tambahkan ini
}

export interface MindARMarker extends MarkerDataBase {
  library: "mindar";
  markerFile: File | null; // Image untuk tracking
  mindFile?: File | null; // Compiled .mind file (optional per marker)
}

export interface ARJSMarker extends MarkerDataBase {
  library: "arjs";
  patternFile?: File | null; // ✅ Made optional (tidak semua type butuh .patt)
  markerType: "pattern" | "barcode" | "hiro" | "kanji";
  barcodeValue?: number; // Untuk barcode marker (0-63)
  markerImageFile?: File | null; // ✅ NEW: Untuk preview di project list
}

export type MarkerData = MindARMarker | ARJSMarker;

// Database schema
export interface ARContentDB {
  id: string;
  name: string;
  library: ARLibrary;
  marker_url: string | null; // ✅ Made nullable
  marker_data: any; // ✅ Changed from string to any (Supabase handles JSON)
  content_url: string;
  content_type: string;
  scale: number;
  project_id: string | null;
  user_id: string | null;
  created_at: string;
}
