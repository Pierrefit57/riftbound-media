import type { APIRoute } from 'astro';

export const prerender = false;

const SUPABASE_STORAGE_BASE = 'https://otbccpoavhfvjpqpzemz.supabase.co/storage/v1/object/public/';

/**
 * Proxy d'images Supabase Storage via Vercel CDN.
 * 
 * Requête: GET /api/img/article-images/articles/image.webp
 * → Fetch: https://otbcc...supabase.co/storage/v1/object/public/article-images/articles/image.webp
 * → Retourne l'image avec des headers de cache agressifs pour le CDN Vercel.
 * 
 * Vu par le CDN Vercel comme un asset statique → le cache edge sert les requêtes suivantes
 * sans toucher Supabase = 0 egress supplémentaire.
 */
export const GET: APIRoute = async ({ params }) => {
    const path = params.path;

    if (!path) {
        return new Response('Missing path', { status: 400 });
    }

    const supabaseUrl = `${SUPABASE_STORAGE_BASE}${path}`;

    try {
        const response = await fetch(supabaseUrl);

        if (!response.ok) {
            return new Response(`Upstream error: ${response.status}`, {
                status: response.status
            });
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const body = await response.arrayBuffer();

        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                // Cache CDN Vercel : 30 jours, navigateur : 7 jours
                'Cache-Control': 'public, s-maxage=2592000, max-age=604800, stale-while-revalidate=86400',
                // Permettre au CDN de servir depuis le cache
                'CDN-Cache-Control': 'public, max-age=2592000',
                'Vercel-CDN-Cache-Control': 'public, max-age=2592000',
            },
        });
    } catch (error: any) {
        console.error('[img-proxy] Error fetching:', supabaseUrl, error.message);
        return new Response('Proxy error', { status: 502 });
    }
};
