-- supabase/migrations/20251229000000_fix_subscription_system.sql

-- ========================================
-- STEP 1: Tambahkan kolom trial jika belum ada
-- ========================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN;

-- ========================================
-- STEP 2: Pastikan enum values lengkap
-- ========================================
DO $$ 
BEGIN
  -- Add 'demo' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'subscription_tier' AND e.enumlabel = 'demo'
  ) THEN
    ALTER TYPE subscription_tier ADD VALUE 'demo';
  END IF;

  -- Add 'pro_plus' if not exists  
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'subscription_tier' AND e.enumlabel = 'pro_plus'
  ) THEN
    ALTER TYPE subscription_tier ADD VALUE 'pro_plus';
  END IF;
END $$;

-- ========================================
-- STEP 3: Migrate existing data
-- ========================================

-- Migrate 'free' → 'demo'
UPDATE profiles 
SET 
  subscription_tier = 'demo'::subscription_tier,
  upload_quota = 999999,
  is_trial_active = TRUE,
  trial_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '14 days')
WHERE subscription_tier::text = 'free';

-- Migrate 'enterprise' → 'pro_plus'
UPDATE profiles 
SET 
  subscription_tier = 'pro_plus'::subscription_tier,
  upload_quota = 30
WHERE subscription_tier::text = 'enterprise';

-- Fix existing 'pro' users
UPDATE profiles 
SET upload_quota = 20
WHERE subscription_tier = 'pro' AND upload_quota != 20;

-- ========================================
-- STEP 4: Set default values di column
-- ========================================
ALTER TABLE profiles 
ALTER COLUMN subscription_tier SET DEFAULT 'demo'::subscription_tier,
ALTER COLUMN upload_quota SET DEFAULT 999999,
ALTER COLUMN uploads_used SET DEFAULT 0,
ALTER COLUMN is_trial_active SET DEFAULT TRUE;

-- ⚠️ JANGAN set DEFAULT untuk trial_ends_at
-- Karena NOW() akan evaluated sekali saat column creation
-- Lebih baik handle di trigger

-- ========================================
-- STEP 5: Update handle_new_user function
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Extract name from metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract avatar from metadata
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- ✅ Insert with explicit trial values
  INSERT INTO public.profiles (
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
    'demo'::subscription_tier,  -- ✅ Match TypeScript interface
    999999,                       -- ✅ Demo quota
    0,
    TRUE,                         -- ✅ Trial active by default
    NOW() + INTERVAL '14 days'    -- ✅ 14 days trial
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

-- ========================================
-- STEP 6: Add check constraints
-- ========================================

-- Ensure uploads_used never exceeds quota
ALTER TABLE profiles 
ADD CONSTRAINT check_uploads_within_quota 
CHECK (uploads_used <= upload_quota);

-- Ensure valid tier-quota combinations
ALTER TABLE profiles 
ADD CONSTRAINT check_valid_tier_quota 
CHECK (
  (subscription_tier = 'demo' AND upload_quota = 999999) OR
  (subscription_tier = 'pro' AND upload_quota = 20) OR
  (subscription_tier = 'pro_plus' AND upload_quota = 30)
);

-- ========================================
-- STEP 7: Create indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier 
ON profiles(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_trial_status 
ON profiles(is_trial_active, trial_ends_at);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- ========================================
-- STEP 8: Create helper function
-- ========================================

-- Function to check if trial is still valid
CREATE OR REPLACE FUNCTION public.is_trial_valid(user_id UUID)
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

  -- Trial valid if:
  -- 1. is_trial_active = true
  -- 2. trial_ends_at is in the future
  -- 3. subscription_tier is 'demo'
  RETURN (
    profile_record.is_trial_active = TRUE AND
    profile_record.trial_ends_at > NOW() AND
    profile_record.subscription_tier = 'demo'
  );
END;
$$;

-- ========================================
-- STEP 9: Create view for active subscriptions
-- ========================================
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT 
  id,
  email,
  full_name,
  subscription_tier,
  upload_quota,
  uploads_used,
  CASE 
    WHEN subscription_tier = 'demo' AND is_trial_active = TRUE AND trial_ends_at > NOW() 
    THEN 'trial'
    WHEN subscription_tier IN ('pro', 'pro_plus') 
    THEN 'paid'
    ELSE 'expired'
  END as status,
  trial_ends_at,
  is_trial_active,
  EXTRACT(DAY FROM (trial_ends_at - NOW())) as days_left_in_trial
FROM profiles;

GRANT SELECT ON public.active_subscriptions TO authenticated;

-- ========================================
-- Comments for documentation
-- ========================================
COMMENT ON COLUMN profiles.trial_ends_at IS 
'Trial expiration date. NULL means no trial or trial already converted to paid.';

COMMENT ON COLUMN profiles.is_trial_active IS 
'Whether user is currently on trial. Set to FALSE when trial expires or user upgrades.';

COMMENT ON FUNCTION public.is_trial_valid(UUID) IS 
'Check if user trial is still valid. Returns TRUE if trial is active and not expired.';