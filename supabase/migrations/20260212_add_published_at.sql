-- Migration: Add published_at to articles
ALTER TABLE public.articles ADD COLUMN published_at TIMESTAMPTZ DEFAULT now();

-- Initialize published_at with created_at for existing articles
UPDATE public.articles SET published_at = created_at WHERE published_at IS NULL OR published_at = created_at;
