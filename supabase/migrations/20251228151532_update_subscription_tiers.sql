DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'demo' 
    AND enumtypid = 'subscription_tier'::regtype
  ) THEN
    ALTER TYPE subscription_tier ADD VALUE 'demo';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pro_plus' 
    AND enumtypid = 'subscription_tier'::regtype
  ) THEN
    ALTER TYPE subscription_tier ADD VALUE 'pro_plus';
  END IF;
END $$;
