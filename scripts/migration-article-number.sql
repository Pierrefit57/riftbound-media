-- ============================================================
-- Migration: Ajout de article_number (SERIAL) à la table articles
-- VERSION CORRIGÉE v3
-- ============================================================

-- 1. Ajouter la colonne article_number avec auto-incrément
ALTER TABLE articles ADD COLUMN IF NOT EXISTS article_number SERIAL;

-- 2. Supprimer l'index unique auto-créé ou existant (pour éviter les conflits)
DROP INDEX IF EXISTS idx_articles_article_number;

-- 3. Réassigner les numéros dans l'ordre chronologique
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM articles
)
UPDATE articles SET article_number = ordered.rn
FROM ordered WHERE articles.id = ordered.id;

-- 4. Recréer l'index unique
CREATE UNIQUE INDEX idx_articles_article_number ON articles (article_number);

-- 5. Mettre à jour la séquence pour les prochains articles
SELECT setval(
  pg_get_serial_sequence('articles', 'article_number'),
  COALESCE((SELECT MAX(article_number) FROM articles), 0)
);
