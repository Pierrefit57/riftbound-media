-- Add Foreign Key relationship between articles and profiles
-- This allows Supabase to understand how to join these tables

ALTER TABLE articles
ADD CONSTRAINT articles_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES profiles(id)
ON DELETE SET NULL;
