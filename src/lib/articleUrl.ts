/**
 * Génère l'URL publique d'un article.
 *
 * Format : /news/{article_number}
 * Exemple : /news/42
 */
export function articleUrl(article: { article_number?: number | null; slug: string }): string {
  if (!article.article_number) {
    // Fallback pour les articles sans numéro (ne devrait pas arriver après migration)
    return `/news/${article.slug}`;
  }

  return `/news/${article.article_number}`;
}
