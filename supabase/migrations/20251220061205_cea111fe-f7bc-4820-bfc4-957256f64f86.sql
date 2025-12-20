-- Create ar_projects table for multi-marker support
CREATE TABLE public.ar_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ar_projects
ALTER TABLE public.ar_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for ar_projects
CREATE POLICY "AR projects are publicly readable" 
ON public.ar_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create AR projects" 
ON public.ar_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AR projects" 
ON public.ar_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AR projects" 
ON public.ar_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add project_id to ar_content
ALTER TABLE public.ar_content 
ADD COLUMN project_id UUID REFERENCES public.ar_projects(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_ar_content_project_id ON public.ar_content(project_id);

-- Update trigger for ar_projects
CREATE TRIGGER update_ar_projects_updated_at
BEFORE UPDATE ON public.ar_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();