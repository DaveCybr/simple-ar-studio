-- Add scale column to ar_content table
ALTER TABLE public.ar_content 
ADD COLUMN scale numeric NOT NULL DEFAULT 1.0;