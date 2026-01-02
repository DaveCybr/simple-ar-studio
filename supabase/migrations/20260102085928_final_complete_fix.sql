-- supabase/migrations/20260102120000_final_complete_fix.sql
-- ✅ FINAL COMPREHENSIVE FIX - Type-safe dan production-ready

BEGIN;

-- ========================================
-- STEP 1: Add missing enum values if not exists
-- ========================================
DO $$ 
BEGIN
  -- Add 'demo' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'subscription_tier' AND e.enumlabel = 'demo'
  ) THEN
    ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'demo';
    RAISE NOTICE '✅ Added "demo" to subscription_tier enum';
  END IF;

  -- Add 'pro_plus' if not exists  
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'subscription_tier' AND e.enumlabel = 'pro_plus'
  ) THEN
    ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'pro_plus';
    RAISE NOTICE '✅ Added "pro_plus" to subscription_tier enum';
  END IF;
END $$;

-- ========================================
-- STEP 2: Ensure all columns exist with correct types
-- ========================================

-- Add trial columns if missing
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT TRUE;

-- Ensure marker_data is JSONB (not TEXT)
DO $$ 
BEGIN
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'ar_content' AND column_name = 'marker_data') = 'text' 
  THEN
    ALTER TABLE ar_content 
    ALTER COLUMN marker_data TYPE JSONB USING marker_data::jsonb;
    RAISE NOTICE '✅ Converted marker_data from TEXT to JSONB';
  END IF;
END $$;

-- Make nullable columns truly nullable
ALTER TABLE ar_content 
ALTER COLUMN marker_url DROP NOT NULL,
ALTER COLUMN mind_file_url DROP NOT NULL;

-- ========================================
-- STEP 3: Migrate existing data safely
-- ========================================

-- Migrate old 'free' → 'demo'
UPDATE profiles 
SET 
  subscription_tier = 'demo'::subscription_tier,
  upload_quota = 999999,
  is_trial_active = COALESCE(is_trial_active, TRUE),
  trial_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '14 days')
WHERE subscription_tier::text = 'free';

-- Migrate old 'enterprise' → 'pro_plus'
UPDATE profiles 
SET 
  subscription_tier = 'pro_plus'::subscription_tier,
  upload_quota = 30
WHERE subscription_tier::text = 'enterprise';

-- Fix any pro users with wrong quota
UPDATE profiles 
SET upload_quota = 20
WHERE subscription_tier = 'pro' AND upload_quota != 20;

-- ========================================
-- STEP 4: Set proper defaults
-- ========================================

ALTER TABLE profiles 
ALTER COLUMN subscription_tier SET DEFAULT 'demo'::subscription_tier,
ALTER COLUMN upload_quota SET DEFAULT 999999,
ALTER COLUMN uploads_used SET DEFAULT 0,
ALTER COLUMN is_trial_active SET DEFAULT TRUE;

-- ========================================
-- STEP 5: Fix marker_data for existing records
-- ========================================

-- Fix MindAR markers with NULL or invalid marker_data
UPDATE ar_content
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
  );

RAISE NOTICE '✅ Fixed MindAR marker_data';

-- ========================================
-- STEP 6: Create/Update Functions
-- ========================================

-- Drop old triggers/functions
DROP TRIGGER IF EXISTS validate_marker_data_trigger ON ar_content;
DROP FUNCTION IF EXISTS validate_marker_data() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ✅ Updated handle_new_user with proper trial setup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    avatar_url,
    subscription_tier,
    upload_quota,
    uploads_used,
    is_trial_active,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_avatar,
    'demo'::subscription_tier,
    999999,
    0,
    TRUE,
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

RAISE NOTICE '✅ Created handle_new_user function and trigger';

-- ✅ Flexible marker_data validation
CREATE OR REPLACE FUNCTION validate_marker_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.marker_data IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT (NEW.marker_data ? 'library') THEN
    RAISE EXCEPTION 'marker_data must contain "library" field';
  END IF;

  IF NEW.library = 'mindar' THEN
    IF (NEW.marker_data->>'library') != 'mindar' THEN
      RAISE EXCEPTION 'MindAR marker must have library="mindar"';
    END IF;
  END IF;

  IF NEW.library = 'arjs' THEN
    IF (NEW.marker_data->>'library') != 'arjs' THEN
      RAISE EXCEPTION 'AR.js marker must have library="arjs"';
    END IF;
    
    IF NOT (NEW.marker_data ? 'markerType') THEN
      RAISE EXCEPTION 'AR.js marker must have "markerType"';
    END IF;

    IF NEW.marker_data->>'markerType' NOT IN ('pattern', 'barcode', 'hiro', 'kanji') THEN
      RAISE EXCEPTION 'Invalid markerType';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_marker_data_trigger
BEFORE INSERT OR UPDATE ON ar_content
FOR EACH ROW
EXECUTE FUNCTION validate_marker_data();

RAISE NOTICE '✅ Created marker_data validation';

-- ✅ Trial validation function
CREATE OR REPLACE FUNCTION is_trial_valid(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT 
    is_trial_active,
    trial_ends_at,
    subscription_tier
  INTO profile_record
  FROM profiles
  WHERE id = user_id;

  RETURN (
    profile_record.is_trial_active = TRUE AND
    profile_record.trial_ends_at > NOW() AND
    profile_record.subscription_tier = 'demo'
  );
END;
$$;

RAISE NOTICE '✅ Created is_trial_valid function';

-- ========================================
-- STEP 7: Add constraints
-- ========================================

-- Drop old constraints if they exist
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS check_uploads_within_quota,
DROP CONSTRAINT IF EXISTS check_valid_tier_quota,
DROP CONSTRAINT IF EXISTS check_library_consistency;

ALTER TABLE ar_content
DROP CONSTRAINT IF EXISTS check_library_consistency;

-- Add constraints
ALTER TABLE profiles 
ADD CONSTRAINT check_uploads_within_quota 
CHECK (uploads_used <= upload_quota);

ALTER TABLE profiles 
ADD CONSTRAINT check_valid_tier_quota 
CHECK (
  (subscription_tier = 'demo' AND upload_quota = 999999) OR
  (subscription_tier = 'pro' AND upload_quota = 20) OR
  (subscription_tier = 'pro_plus' AND upload_quota = 30)
);

ALTER TABLE ar_content 
ADD CONSTRAINT check_library_consistency 
CHECK (
  marker_data IS NULL OR 
  (marker_data->>'library')::text = library::text
);

RAISE NOTICE '✅ Added check constraints';

-- ========================================
-- STEP 8: Create indexes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier 
ON profiles(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_trial_status 
ON profiles(is_trial_active, trial_ends_at) 
WHERE subscription_tier = 'demo';

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ar_content_library 
ON ar_content(library);

CREATE INDEX IF NOT EXISTS idx_ar_content_project_library 
ON ar_content(project_id, library);

CREATE INDEX IF NOT EXISTS idx_ar_content_marker_data_gin 
ON ar_content USING GIN(marker_data);

RAISE NOTICE '✅ Created indexes';

-- ========================================
-- STEP 9: Create/Update Views
-- ========================================

DROP VIEW IF EXISTS mindar_markers_v2 CASCADE;
DROP VIEW IF EXISTS arjs_markers_v2 CASCADE;
DROP VIEW IF EXISTS active_subscriptions CASCADE;

CREATE VIEW mindar_markers_v2 AS
SELECT 
  id, name, marker_url, mind_file_url, marker_data,
  content_url, content_type, scale, project_id, user_id,
  library, created_at, updated_at,
  marker_data->>'mindUrl' as mind_url_extracted,
  COALESCE((marker_data->>'targetIndex')::integer, 0) as target_index
FROM ar_content
WHERE library = 'mindar';

CREATE VIEW arjs_markers_v2 AS
SELECT 
  id, name, marker_url, marker_data,
  content_url, content_type, scale, project_id, user_id,
  library, created_at, updated_at,
  marker_data->>'markerType' as marker_type,
  marker_data->>'patternUrl' as pattern_url,
  COALESCE((marker_data->>'barcodeValue')::integer, 0) as barcode_value,
  marker_data->>'preset' as preset
FROM ar_content
WHERE library = 'arjs';

CREATE VIEW active_subscriptions AS
SELECT 
  id, email, full_name, subscription_tier,
  upload_quota, uploads_used,
  CASE 
    WHEN subscription_tier = 'demo' AND is_trial_active = TRUE AND trial_ends_at > NOW() 
    THEN 'trial'
    WHEN subscription_tier IN ('pro', 'pro_plus') 
    THEN 'paid'
    ELSE 'expired'
  END as status,
  trial_ends_at, is_trial_active,
  EXTRACT(DAY FROM (trial_ends_at - NOW())) as days_left_in_trial
FROM profiles;

GRANT SELECT ON mindar_markers_v2 TO authenticated, anon;
GRANT SELECT ON arjs_markers_v2 TO authenticated, anon;
GRANT SELECT ON active_subscriptions TO authenticated;

RAISE NOTICE '✅ Created views';

-- ========================================
-- STEP 10: Add helpful comments
-- ========================================

COMMENT ON TYPE subscription_tier IS 
'Valid values: demo (free trial), pro ($29/mo), pro_plus ($39/mo)';

COMMENT ON COLUMN profiles.subscription_tier IS 
'Current subscription tier. Default is demo with 14-day trial';

COMMENT ON COLUMN profiles.trial_ends_at IS 
'Trial expiration date. Only relevant for demo tier';

COMMENT ON COLUMN profiles.is_trial_active IS 
'Whether trial is active. Set to FALSE when trial expires or user upgrades';

COMMENT ON COLUMN ar_content.marker_data IS 
'JSONB structure for marker configuration:
MindAR: { library: "mindar", mindUrl: "url", targetIndex?: 0 }
AR.js: { library: "arjs", markerType: "pattern|barcode|hiro|kanji", ... }';

-- ========================================
-- Success Summary
-- ========================================

DO $$
DECLARE
  total_profiles INTEGER;
  demo_count INTEGER;
  pro_count INTEGER;
  pro_plus_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO demo_count FROM profiles WHERE subscription_tier = 'demo';
  SELECT COUNT(*) INTO pro_count FROM profiles WHERE subscription_tier = 'pro';
  SELECT COUNT(*) INTO pro_plus_count FROM profiles WHERE subscription_tier = 'pro_plus';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_profiles;
  RAISE NOTICE 'Demo tier: %', demo_count;
  RAISE NOTICE 'Pro tier: %', pro_count;
  RAISE NOTICE 'Pro+ tier: %', pro_plus_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Changes applied:';
  RAISE NOTICE '  ✓ Enum values: demo, pro, pro_plus';
  RAISE NOTICE '  ✓ Trial columns added and configured';
  RAISE NOTICE '  ✓ marker_data ensured as JSONB';
  RAISE NOTICE '  ✓ Nullable columns fixed';
  RAISE NOTICE '  ✓ Data migrated safely';
  RAISE NOTICE '  ✓ Functions and triggers updated';
  RAISE NOTICE '  ✓ Constraints and indexes created';
  RAISE NOTICE '  ✓ Views created and granted';
  RAISE NOTICE '========================================';
END $$;

COMMIT;