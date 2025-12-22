-- Migration: Create ar_analytics table
-- Run this in Supabase SQL Editor

-- Create analytics table
CREATE TABLE IF NOT EXISTS public.ar_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.ar_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'scan', 'marker_lost', 'session_end'
  marker_name TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  user_agent TEXT,
  duration INTEGER, -- in seconds
  ip_address INET,
  country TEXT,
  city TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_analytics_project ON public.ar_analytics(project_id);
CREATE INDEX idx_analytics_user ON public.ar_analytics(user_id);
CREATE INDEX idx_analytics_session ON public.ar_analytics(session_id);
CREATE INDEX idx_analytics_event ON public.ar_analytics(event_type);
CREATE INDEX idx_analytics_date ON public.ar_analytics(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ar_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own analytics
CREATE POLICY "Users can view own analytics"
  ON public.ar_analytics
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can insert analytics"
  ON public.ar_analytics
  FOR INSERT
  WITH CHECK (true);

-- Function to automatically set user_id from project
CREATE OR REPLACE FUNCTION public.set_analytics_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user_id from the project
  SELECT user_id INTO NEW.user_id
  FROM public.ar_projects
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-populate user_id
CREATE TRIGGER set_analytics_user_id_trigger
  BEFORE INSERT ON public.ar_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.set_analytics_user_id();

-- Create view for analytics summary
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
  project_id,
  user_id,
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE event_type = 'view') as views,
  COUNT(*) FILTER (WHERE event_type = 'scan') as scans,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(duration) FILTER (WHERE duration IS NOT NULL) as avg_duration,
  COUNT(DISTINCT marker_name) as unique_markers_scanned
FROM public.ar_analytics
GROUP BY project_id, user_id, DATE(created_at);

-- Grant access to authenticated users
GRANT SELECT ON public.analytics_summary TO authenticated;

COMMENT ON TABLE public.ar_analytics IS 'Stores analytics events for AR projects';
COMMENT ON VIEW public.analytics_summary IS 'Daily aggregated analytics summary';