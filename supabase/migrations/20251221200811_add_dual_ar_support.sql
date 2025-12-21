-- Migration: Add support for dual AR libraries (MindAR + AR.js)
-- File: supabase/migrations/YYYYMMDD_add_dual_ar_support.sql

-- 1. Create enum for AR library types
CREATE TYPE public.ar_library_type AS ENUM ('mindar', 'arjs');

-- 2. Add new columns to ar_content table
ALTER TABLE public.ar_content 
ADD COLUMN IF NOT EXISTS library ar_library_type NOT NULL DEFAULT 'mindar',
ADD COLUMN IF NOT EXISTS marker_data JSONB;

-- 3. Create comment to explain marker_data structure
COMMENT ON COLUMN public.ar_content.marker_data IS 
'JSON data structure:
For MindAR: { "library": "mindar", "mindUrl": "...", "targetIndex": 0 }
For AR.js: { 
  "library": "arjs", 
  "markerType": "pattern|barcode|hiro|kanji",
  "patternUrl": "..." (if pattern),
  "barcodeValue": 0-63 (if barcode),
  "preset": "hiro|kanji" (if preset)
}';

-- 4. Add index for library type queries
CREATE INDEX IF NOT EXISTS idx_ar_content_library ON public.ar_content(library);

-- 5. Create view for AR.js markers specifically
CREATE OR REPLACE VIEW public.arjs_markers AS
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
  created_at
FROM public.ar_content
WHERE library = 'arjs';

-- 6. Create view for MindAR markers specifically
CREATE OR REPLACE VIEW public.mindar_markers AS
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
  created_at
FROM public.ar_content
WHERE library = 'mindar';

-- 7. Add library type to ar_projects for easier filtering
ALTER TABLE public.ar_projects
ADD COLUMN IF NOT EXISTS library ar_library_type NOT NULL DEFAULT 'mindar';

CREATE INDEX IF NOT EXISTS idx_ar_projects_library ON public.ar_projects(library);

-- 8. Function to get project info with marker details
CREATE OR REPLACE FUNCTION public.get_project_with_markers(project_uuid UUID)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  library ar_library_type,
  marker_count BIGINT,
  markers JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.name as project_name,
    p.library,
    COUNT(ac.id) as marker_count,
    jsonb_agg(
      jsonb_build_object(
        'id', ac.id,
        'name', ac.name,
        'library', ac.library,
        'marker_url', ac.marker_url,
        'marker_data', ac.marker_data,
        'content_url', ac.content_url,
        'content_type', ac.content_type,
        'scale', ac.scale
      )
    ) as markers
  FROM public.ar_projects p
  LEFT JOIN public.ar_content ac ON ac.project_id = p.id
  WHERE p.id = project_uuid
  GROUP BY p.id, p.name, p.library;
END;
$$;

-- 9. Function to validate marker_data JSON structure
CREATE OR REPLACE FUNCTION public.validate_marker_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate MindAR marker data
  IF NEW.library = 'mindar' THEN
    IF NEW.marker_data IS NULL OR 
       NOT (NEW.marker_data ? 'library') OR 
       (NEW.marker_data->>'library') != 'mindar' THEN
      RAISE EXCEPTION 'Invalid MindAR marker_data: must contain library=mindar';
    END IF;
  END IF;

  -- Validate AR.js marker data
  IF NEW.library = 'arjs' THEN
    IF NEW.marker_data IS NULL OR 
       NOT (NEW.marker_data ? 'library') OR 
       (NEW.marker_data->>'library') != 'arjs' OR
       NOT (NEW.marker_data ? 'markerType') THEN
      RAISE EXCEPTION 'Invalid AR.js marker_data: must contain library=arjs and markerType';
    END IF;

    -- Validate markerType-specific fields
    CASE NEW.marker_data->>'markerType'
      WHEN 'pattern' THEN
        IF NOT (NEW.marker_data ? 'patternUrl') THEN
          RAISE EXCEPTION 'Pattern marker must have patternUrl';
        END IF;
      WHEN 'barcode' THEN
        IF NOT (NEW.marker_data ? 'barcodeValue') THEN
          RAISE EXCEPTION 'Barcode marker must have barcodeValue';
        END IF;
      WHEN 'hiro', 'kanji' THEN
        IF NOT (NEW.marker_data ? 'preset') THEN
          RAISE EXCEPTION 'Preset marker must have preset field';
        END IF;
      ELSE
        RAISE EXCEPTION 'Invalid markerType: must be pattern, barcode, hiro, or kanji';
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

-- 10. Create trigger for marker_data validation
DROP TRIGGER IF EXISTS validate_marker_data_trigger ON public.ar_content;
CREATE TRIGGER validate_marker_data_trigger
BEFORE INSERT OR UPDATE ON public.ar_content
FOR EACH ROW
EXECUTE FUNCTION public.validate_marker_data();

-- 11. Add helper function to convert old data to new format (migration helper)
CREATE OR REPLACE FUNCTION public.migrate_existing_markers_to_dual_support()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update existing records to have proper marker_data structure
  UPDATE public.ar_content
  SET 
    library = 'mindar',
    marker_data = jsonb_build_object(
      'library', 'mindar',
      'mindUrl', mind_file_url,
      'targetIndex', 0
    )
  WHERE library IS NULL OR marker_data IS NULL;

  -- Update projects to set library type
  UPDATE public.ar_projects p
  SET library = (
    SELECT COALESCE(ac.library, 'mindar')
    FROM public.ar_content ac
    WHERE ac.project_id = p.id
    LIMIT 1
  )
  WHERE p.library IS NULL;

END;
$$;

-- 12. Run migration for existing data
SELECT public.migrate_existing_markers_to_dual_support();

-- 13. Add statistics view for both libraries
CREATE OR REPLACE VIEW public.ar_library_stats AS
SELECT 
  library,
  COUNT(DISTINCT project_id) as total_projects,
  COUNT(*) as total_markers,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(scale) as avg_scale,
  COUNT(*) FILTER (WHERE content_type = 'video') as video_count,
  COUNT(*) FILTER (WHERE content_type = 'image') as image_count
FROM public.ar_content
GROUP BY library;

-- 14. Grant necessary permissions
GRANT SELECT ON public.arjs_markers TO authenticated, anon;
GRANT SELECT ON public.mindar_markers TO authenticated, anon;
GRANT SELECT ON public.ar_library_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_with_markers(UUID) TO authenticated, anon;

-- 15. Add helpful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ar_content_library_project 
ON public.ar_content(library, project_id);

CREATE INDEX IF NOT EXISTS idx_ar_content_marker_data_gin 
ON public.ar_content USING GIN(marker_data);

-- 16. Create function to get AR.js marker preview URL (for QR codes, etc)
CREATE OR REPLACE FUNCTION public.get_marker_preview_url(marker_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  marker_rec RECORD;
  preview_url TEXT;
BEGIN
  SELECT * INTO marker_rec FROM public.ar_content WHERE id = marker_uuid;
  
  IF marker_rec.library = 'arjs' THEN
    CASE marker_rec.marker_data->>'markerType'
      WHEN 'hiro' THEN
        preview_url := 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png';
      WHEN 'kanji' THEN
        preview_url := 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/kanji.png';
      WHEN 'barcode' THEN
        preview_url := 'https://create.ar.js.org/barcode/' || (marker_rec.marker_data->>'barcodeValue');
      ELSE
        preview_url := marker_rec.marker_url;
    END CASE;
  ELSE
    preview_url := marker_rec.marker_url;
  END IF;
  
  RETURN preview_url;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marker_preview_url(UUID) TO authenticated, anon;