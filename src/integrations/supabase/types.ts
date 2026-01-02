// src/integrations/supabase/types.ts - FIXED VERSION
// ✅ Aligned dengan database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ARLibrary = "mindar" | "arjs";

// ✅ FIXED: Match database enum
export type SubscriptionTier = "demo" | "pro" | "pro_plus";

// ========================================
// Marker Data Type Definitions
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
  barcodeValue: number;
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
// Database Tables
// ========================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: SubscriptionTier;
          upload_quota?: number;
          uploads_used?: number;
          stripe_customer_id?: string | null;
          trial_ends_at?: string | null;
          is_trial_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: SubscriptionTier;
          upload_quota?: number;
          uploads_used?: number;
          stripe_customer_id?: string | null;
          trial_ends_at?: string | null;
          is_trial_active?: boolean | null;
          updated_at?: string;
        };
      };
      ar_projects: {
        Row: {
          id: string;
          name: string;
          library: ARLibrary;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          library?: ARLibrary;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          library?: ARLibrary;
          updated_at?: string;
        };
      };
      ar_content: {
        Row: {
          id: string;
          name: string;
          library: ARLibrary;
          marker_url: string | null;
          mind_file_url: string | null;
          marker_data: Json;
          content_url: string;
          content_type: string;
          scale: number;
          project_id: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          library?: ARLibrary;
          marker_url?: string | null;
          mind_file_url?: string | null;
          marker_data?: Json;
          content_url: string;
          content_type: string;
          scale?: number;
          project_id?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          library?: ARLibrary;
          marker_url?: string | null;
          mind_file_url?: string | null;
          marker_data?: Json;
          content_url?: string;
          content_type?: string;
          scale?: number;
          updated_at?: string;
        };
      };
      ar_analytics: {
        Row: {
          id: string;
          project_id: string | null;
          user_id: string | null;
          session_id: string;
          event_type: string;
          marker_name: string | null;
          device_type: string | null;
          user_agent: string | null;
          duration: number | null;
          ip_address: string | null;
          country: string | null;
          city: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          user_id?: string | null;
          session_id: string;
          event_type: string;
          marker_name?: string | null;
          device_type?: string | null;
          user_agent?: string | null;
          duration?: number | null;
          ip_address?: string | null;
          country?: string | null;
          city?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          metadata?: Json;
        };
      };
    };
    Views: {
      mindar_markers_v2: {
        Row: {
          id: string;
          name: string;
          marker_url: string | null;
          mind_file_url: string | null;
          marker_data: Json;
          content_url: string;
          content_type: string;
          scale: number;
          project_id: string | null;
          user_id: string | null;
          library: ARLibrary;
          created_at: string;
          updated_at: string;
          mind_url_extracted: string | null;
          target_index: number;
        };
      };
      arjs_markers_v2: {
        Row: {
          id: string;
          name: string;
          marker_url: string | null;
          marker_data: Json;
          content_url: string;
          content_type: string;
          scale: number;
          project_id: string | null;
          user_id: string | null;
          library: ARLibrary;
          created_at: string;
          updated_at: string;
          marker_type: string | null;
          pattern_url: string | null;
          barcode_value: number;
          preset: string | null;
        };
      };
      analytics_summary: {
        Row: {
          project_id: string | null;
          user_id: string | null;
          date: string;
          views: number;
          scans: number;
          unique_sessions: number;
          avg_duration: number | null;
          unique_markers_scanned: number;
        };
      };
      active_subscriptions: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          subscription_tier: SubscriptionTier;
          upload_quota: number;
          uploads_used: number;
          status: string;
          trial_ends_at: string | null;
          is_trial_active: boolean | null;
          days_left_in_trial: number | null;
        };
      };
    };
    Functions: {
      get_marker_for_viewer: {
        Args: { marker_id: string };
        Returns: Json;
      };
      get_project_with_markers: {
        Args: { project_uuid: string };
        Returns: {
          project_id: string;
          project_name: string;
          library: ARLibrary;
          marker_count: number;
          markers: Json;
        }[];
      };
      is_trial_valid: {
        Args: { user_id: string };
        Returns: boolean;
      };
      fix_existing_marker_data: {
        Args: {};
        Returns: {
          fixed_count: number;
          invalid_count: number;
          details: Json;
        }[];
      };
    };
  };
}

// ========================================
// Type Guards
// ========================================

export const isMindARMarkerData = (data: any): data is MindARMarkerData => {
  return data?.library === "mindar" && typeof data?.mindUrl === "string";
};

export const isARJSMarkerData = (data: any): data is ARJSMarkerData => {
  return (
    data?.library === "arjs" &&
    ["pattern", "barcode", "hiro", "kanji"].includes(data?.markerType)
  );
};

export const isPatternMarker = (data: any): data is ARJSPatternMarkerData => {
  return (
    isARJSMarkerData(data) &&
    data.markerType === "pattern" &&
    typeof data.patternUrl === "string"
  );
};

export const isBarcodeMarker = (data: any): data is ARJSBarcodeMarkerData => {
  return (
    isARJSMarkerData(data) &&
    data.markerType === "barcode" &&
    typeof data.barcodeValue === "number"
  );
};

export const isPresetMarker = (data: any): data is ARJSPresetMarkerData => {
  return (
    isARJSMarkerData(data) &&
    ["hiro", "kanji"].includes(data.markerType) &&
    typeof data.preset === "string"
  );
};
