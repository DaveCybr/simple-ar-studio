// src/types/ar.ts
export type ARLibrary = "mindar" | "arjs";

export interface MarkerDataBase {
  id: string;
  name: string;
  contentFile: File | null;
  contentType: "video" | "image";
  scale: number;
}

export interface MindARMarker extends MarkerDataBase {
  library: "mindar";
  markerFile: File | null; // Image untuk tracking
  mindFile?: File | null; // Compiled .mind file (optional per marker)
}

export interface ARJSMarker extends MarkerDataBase {
  library: "arjs";
  patternFile: File | null; // .patt file atau akan di-generate
  markerType: "pattern" | "barcode" | "hiro" | "kanji";
  barcodeValue?: number; // Untuk barcode marker (0-63)
}

export type MarkerData = MindARMarker | ARJSMarker;

// Database schema addition
export interface ARContentDB {
  id: string;
  name: string;
  library: ARLibrary;
  marker_url: string;
  marker_data: string; // JSON: { type, value, etc }
  content_url: string;
  content_type: string;
  scale: number;
  project_id: string | null;
  user_id: string | null;
  created_at: string;
}
