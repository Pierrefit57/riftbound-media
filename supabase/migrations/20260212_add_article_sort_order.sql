-- Migration: Add sort_order to articles
ALTER TABLE public.articles ADD COLUMN sort_order INT DEFAULT 0;

-- Initialize sort_order based on created_at (most recent first)
WITH ranked_articles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rank
  FROM public.articles
)
UPDATE public.articles
SET sort_order = ranked_articles.rank
FROM ranked_articles
WHERE public.articles.id = ranked_articles.id;
