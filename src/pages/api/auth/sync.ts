import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { access_token, refresh_token } = await request.json();

        if (!access_token || !refresh_token) {
            return new Response(JSON.stringify({ error: 'Missing tokens' }), { status: 400 });
        }

        const isProd = import.meta.env.PROD;

        // Définir les cookies pour le serveur (Middleware)
        cookies.set('sb-access-token', access_token, {
            path: '/',
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        cookies.set('sb-refresh-token', refresh_token, {
            path: '/',
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('[auth] Sync error:', error);
        return new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500 });
    }
};
