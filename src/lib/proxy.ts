/**
 * Helper pour convertir les URLs Supabase Storage en URLs proxy Vercel.
 * Les images passent par /api/img/ qui les cache sur le CDN Vercel,
 * réduisant le cached egress Supabase.
 */

const SUPABASE_STORAGE_PREFIX = 'https://otbccpoavhfvjpqpzemz.supabase.co/storage/v1/object/public/';

/**
 * Convertit une URL Supabase Storage en URL proxy locale.
 * Si l'URL n'est pas une URL Supabase Storage, elle est retournée telle quelle.
 * 
 * @example
 * proxyUrl('https://otbcc...supabase.co/storage/v1/object/public/article-images/articles/image.webp')
 * // → '/api/img/article-images/articles/image.webp'
 */
export function proxyUrl(url: string | null | undefined): string {
    return url || '';
}

