import type { APIRoute } from 'astro';
import { createAuthClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
    // Exact extraction via new URL as requested
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
        console.error('[auth] Callback sans code');
        return redirect('/login?error=no_code');
    }

    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        // Log complet demandé
        console.error('Session établie: NON');
        if (error) {
            console.error('[auth] Supabase Error:', {
                message: error.message,
                status: error.status,
                name: error.name
            });
        }
        return redirect('/login?error=callback_failed');
    }

    // Session OK
    console.log('Session établie: OUI');

    const isProd = import.meta.env.PROD;
    const domain = isProd ? '.riftbound-media.fr' : undefined;

    const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
        domain: domain,
        maxAge: 60 * 60 * 24 * 7,
    };

    cookies.set('sb-access-token', data.session.access_token, cookieOptions);
    cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);

    return redirect('/');
};
