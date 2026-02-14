import type { APIRoute } from 'astro';
import { createAuthClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
    const code = url.searchParams.get('code');

    if (!code) {
        console.error('[auth] Callback: No code found in URL');
        return redirect('/login?error=no_code');
    }

    console.log('[auth] Callback: Exchange code for session...');
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        console.error('[auth] Callback: Exchange failed:', error?.message);
        return redirect('/login?error=callback_failed');
    }

    console.log('[auth] Callback: Session obtained for', data.session.user.email);

    const isProd = import.meta.env.PROD;

    // Stocker les tokens dans des cookies httpOnly
    cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    });

    cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    });

    console.log('[auth] Callback: Cookies set, redirecting to home.');
    return redirect('/');
};
