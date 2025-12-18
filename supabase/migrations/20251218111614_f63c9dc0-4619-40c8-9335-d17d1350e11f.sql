-- Create table for AR content
CREATE TABLE public.ar_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  marker_url TEXT NOT NULL,
  mind_file_url TEXT NOT NULL,
  content_url TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'video', -- 'video', 'image', 'model'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ar_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access (AR content is public)
CREATE POLICY "AR content is publicly readable" 
ON public.ar_content 
FOR SELECT 
USING (true);

-- Allow public insert (for demo purposes - in production you'd want auth)
CREATE POLICY "Anyone can create AR content" 
ON public.ar_content 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ar_content_updated_at
BEFORE UPDATE ON public.ar_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();