-- Migration: Update handle_new_user function untuk support Google OAuth
-- File: supabase/migrations/20251228094327_handle_new_user.sql

-- Step 1: Drop trigger first (karena trigger depends on function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Now we can safely drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create updated function with Google OAuth support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Extract name from metadata (works for both email signup and OAuth)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract avatar from metadata (for OAuth providers)
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_avatar
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

-- Step 4: Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates or updates user profile when a new user signs up. 
Supports both email/password and OAuth (Google, etc.) authentication.';