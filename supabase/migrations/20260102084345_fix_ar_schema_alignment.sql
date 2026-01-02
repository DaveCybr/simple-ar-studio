-- supabase/migrations/20251229000001_fix_ar_schema_alignment.sql
-- ✅ FIX: Align database schema with TypeScript ar.types

-- ========================================
-- STEP 1: Fix ar_content columns
-- ========================================

-- Make mind_file_url nullable (not all markers need it)
ALTER TABLE public.ar_content 
ALTER COLUMN mind_file_url DROP NOT NULL;

-- Make marker_url nullable (some AR.js types don't need external marker image)
ALTER TABLE public.ar_content 
ALTER COLUMN marker_url DROP NOT NULL;

-- Ensure marker_data is JSONB (not TEXT)
-- If it was created as TEXT, we need to convert it
DO $$ 
BEGIN
  -- Check if marker_data is TEXT type
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'ar_content' 
      AND column_name = 'marker_data') = 'text' THEN
    
    -- Convert TEXT to JSONB
    ALTER TABLE public.ar_content 
    ALTER COLUMN marker_data TYPE JSONB USING marker_data::jsonb;
  END IF;
END $$;

-- ========================================
-- STEP 2: Update marker_data validation
-- ========================================

-- Drop old strict validation
DROP TRIGGER IF EXISTS validate_marker_data_trigger ON public.ar_content;
DROP FUNCTION IF EXISTS public.validate_marker_data();

-- Create more flexible validation
CREATE OR REPLACE FUNCTION public.validate_marker_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip validation if marker_data is NULL (will be populated later)
  IF NEW.marker_data IS NULL THEN
    RETURN NEW;
  END IF;

  -- Validate library field exists
  IF NOT (NEW.marker_data ? 'library') THEN
    RAISE EXCEPTION 'marker_data must contain "library" field';
  END IF;

  -- Validate MindAR markers
  IF NEW.library = 'mindar' THEN
    IF (NEW.marker_data->>'library') != 'mindar' THEN
      RAISE EXCEPTION 'MindAR marker must have library="mindar" in marker_data';
    END IF;
    -- MindAR should have mindUrl
    IF NEW.marker_data->>'mindUrl' IS NULL THEN
      RAISE WARNING 'MindAR marker should have mindUrl in marker_data';
    END IF;
  END IF;

  -- Validate AR.js markers
  IF NEW.library = 'arjs' THEN
    IF (NEW.marker_data->>'library') != 'arjs' THEN
      RAISE EXCEPTION 'AR.js marker must have library="arjs" in marker_data';
    END IF;
    
    -- Validate markerType exists
    IF NOT (NEW.marker_data ? 'markerType') THEN
      RAISE EXCEPTION 'AR.js marker must have "markerType" field';
    END IF;

    -- Validate markerType value
    IF NEW.marker_data->>'markerType' NOT IN ('pattern', 'barcode', 'hiro', 'kanji') THEN
      RAISE EXCEPTION 'Invalid markerType: must be pattern, barcode, hiro, or kanji';
    END IF;

    -- Type-specific validations (warnings only)
    CASE NEW.marker_data->>'markerType'
      WHEN 'pattern' THEN
        IF NOT (NEW.marker_data ? 'patternUrl') THEN
          RAISE WARNING 'Pattern marker should have patternUrl';
        END IF;
      WHEN 'barcode' THEN
        IF NOT (NEW.marker_data ? 'barcodeValue') THEN
          RAISE WARNING 'Barcode marker should have barcodeValue';
        END IF;
      WHEN 'hiro', 'kanji' THEN
        IF NOT (NEW.marker_data ? 'preset') THEN
          RAISE WARNING 'Preset marker should have preset field';
        END IF;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER validate_marker_data_trigger
BEFORE INSERT OR UPDATE ON public.ar_content
FOR EACH ROW
EXECUTE FUNCTION public.validate_marker_data();

-- ========================================
-- STEP 3: Add helpful indexes
-- ========================================

-- Index for library queries
CREATE INDEX IF NOT EXISTS idx_ar_content_library 
ON public.ar_content(library);

-- Index for project + library combo
CREATE INDEX IF NOT EXISTS idx_ar_content_project_library 
ON public.ar_content(project_id, library);

-- GIN index for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_ar_content_marker_data_gin 
ON public.ar_content USING GIN(marker_data);

-- ========================================
-- STEP 4: Create type-safe views
-- ========================================

-- View for MindAR markers only
CREATE OR REPLACE VIEW public.mindar_markers_v2 AS
SELECT 
  id,
  name,
  marker_url,
  mind_file_url,
  marker_data,
  content_url,
  content_type,
  scale,
  project_id,
  user_id,
  library,
  created_at,
  updated_at,
  -- Extract commonly used fields
  marker_data->>'mindUrl' as mind_url_extracted,
  COALESCE((marker_data->>'targetIndex')::integer, 0) as target_index
FROM public.ar_content
WHERE library = 'mindar';

-- View for AR.js markers only
CREATE OR REPLACE VIEW public.arjs_markers_v2 AS
SELECT 
  id,
  name,
  marker_url,
  marker_data,
  content_url,
  content_type,
  scale,
  project_id,
  user_id,
  library,
  created_at,
  updated_at,
  -- Extract commonly used fields
  marker_data->>'markerType' as marker_type,
  marker_data->>'patternUrl' as pattern_url,
  COALESCE((marker_data->>'barcodeValue')::integer, 0) as barcode_value,
  marker_data->>'preset' as preset
FROM public.ar_content
WHERE library = 'arjs';

-- Grant access
GRANT SELECT ON public.mindar_markers_v2 TO authenticated, anon;
GRANT SELECT ON public.arjs_markers_v2 TO authenticated, anon;

-- ========================================
-- STEP 5: Update migration helper function
-- ========================================

-- Function to ensure existing data is valid
CREATE OR REPLACE FUNCTION public.fix_existing_marker_data()
RETURNS TABLE (
  fixed_count integer,
  invalid_count integer,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fixed integer := 0;
  invalid integer := 0;
  detail_array jsonb := '[]'::jsonb;
BEGIN
  -- Fix MindAR markers with empty marker_data
  WITH updated AS (
    UPDATE public.ar_content
    SET marker_data = jsonb_build_object(
      'library', 'mindar',
      'mindUrl', mind_file_url,
      'targetIndex', 0
    )
    WHERE library = 'mindar' 
      AND (
        marker_data IS NULL 
        OR NOT (marker_data ? 'library')
        OR (marker_data->>'library') != 'mindar'
      )
    RETURNING id, name
  )
  SELECT COUNT(*) INTO fixed FROM updated;

  detail_array := detail_array || jsonb_build_object(
    'step', 'fix_mindar_markers',
    'count', fixed
  );

  -- Log invalid records (don't fix automatically)
  WITH invalid_records AS (
    SELECT id, name, library, marker_data
    FROM public.ar_content
    WHERE library = 'arjs'
      AND (
        marker_data IS NULL
        OR NOT (marker_data ? 'library')
        OR NOT (marker_data ? 'markerType')
      )
  )
  SELECT COUNT(*) INTO invalid FROM invalid_records;

  detail_array := detail_array || jsonb_build_object(
    'step', 'found_invalid_arjs_markers',
    'count', invalid,
    'action', 'manual_review_required'
  );

  RETURN QUERY SELECT fixed, invalid, detail_array;
END;
$$;

-- Run the fix
DO $$
DECLARE
  result RECORD;
BEGIN
  SELECT * INTO result FROM public.fix_existing_marker_data();
  
  RAISE NOTICE 'Fixed % markers, Found % invalid markers', 
    result.fixed_count, result.invalid_count;
  RAISE NOTICE 'Details: %', result.details;
END $$;

-- ========================================
-- STEP 6: Add constraints
-- ========================================

-- Ensure library matches marker_data.library
ALTER TABLE public.ar_content 
DROP CONSTRAINT IF EXISTS check_library_consistency;

ALTER TABLE public.ar_content 
ADD CONSTRAINT check_library_consistency 
CHECK (
  marker_data IS NULL OR 
  (marker_data->>'library')::text = library::text
);

-- ========================================
-- STEP 7: Update comments
-- ========================================

COMMENT ON COLUMN public.ar_content.library IS 
'AR library type: mindar or arjs. Must match marker_data.library';

COMMENT ON COLUMN public.ar_content.marker_data IS 
'JSON structure for marker configuration:
MindAR: { library: "mindar", mindUrl: "url", targetIndex?: 0 }
AR.js: { 
  library: "arjs", 
  markerType: "pattern|barcode|hiro|kanji",
  patternUrl?: "url",      // for pattern type
  barcodeValue?: 0-63,     // for barcode type  
  preset?: "hiro|kanji"    // for preset types
}';

COMMENT ON COLUMN public.ar_content.marker_url IS 
'Optional preview image URL. Nullable for AR.js preset markers (hiro, kanji) that use built-in markers';

COMMENT ON COLUMN public.ar_content.mind_file_url IS 
'MindAR compiled .mind file URL. Only used for library="mindar". Nullable for AR.js markers';

-- ========================================
-- STEP 8: Create helper function for TypeScript
-- ========================================

-- Function to get properly structured marker for frontend
CREATE OR REPLACE FUNCTION public.get_marker_for_viewer(marker_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'library', library,
    'markerData', marker_data,
    'markerUrl', marker_url,
    'contentUrl', content_url,
    'contentType', content_type,
    'scale', scale,
    'projectId', project_id
  ) INTO result
  FROM public.ar_content
  WHERE id = marker_id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marker_for_viewer(UUID) TO authenticated, anon;

-- ========================================
-- Success message
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📋 Changes made:';
  RAISE NOTICE '  - Made marker_url and mind_file_url nullable';
  RAISE NOTICE '  - Ensured marker_data is JSONB type';
  RAISE NOTICE '  - Updated validation to be more flexible';
  RAISE NOTICE '  - Added type-safe views and helper functions';
  RAISE NOTICE '  - Fixed existing data inconsistencies';
END $$;