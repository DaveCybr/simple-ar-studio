-- supabase/migrations/[timestamp]_migrate_subscription_data.sql

-- Now we can safely use the new enum values

-- Update old 'free' to 'demo'
UPDATE profiles 
SET subscription_tier = 'demo'
WHERE subscription_tier::text = 'free';

-- Update old 'enterprise' to 'pro_plus' 
UPDATE profiles 
SET subscription_tier = 'pro_plus'
WHERE subscription_tier::text = 'enterprise';

-- Update quotas
UPDATE profiles
SET upload_quota = CASE
  WHEN subscription_tier = 'demo' THEN 999999
  WHEN subscription_tier = 'pro' THEN 20
  WHEN subscription_tier = 'pro_plus' THEN 30
  ELSE upload_quota
END;

-- Add trial fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days');

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT TRUE;

-- Set trial for demo users
UPDATE profiles
SET 
  trial_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '14 days'),
  is_trial_active = COALESCE(is_trial_active, TRUE)
WHERE subscription_tier = 'demo';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON profiles(trial_ends_at);