/**
 * Génère l'URL publique courte d'un article.
 *
 * Format : /news/{article_number}-{slug_tronqué}
 * Exemple : /news/42-katchouze-interview
 *
 * Le slug est tronqué aux 4 premiers segments pour garder l'URL compacte
 * tout en conservant assez de mots-clés pour le SEO.
 */
export function articleUrl(article: { article_number?: number | null; slug: string }): string {
  if (!article.article_number) {
    // Fallback pour les articles sans numéro (ne devrait pas arriver après migration)
    return `/news/${article.slug}`;
  }

  const shortSlug = article.slug.split('-').slice(0, 4).join('-');
  return `/news/${article.article_number}-${shortSlug}`;
}
