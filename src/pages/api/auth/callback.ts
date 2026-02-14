import type { APIRoute } from 'astro';
import { createAuthClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
    const code = url.searchParams.get('code');

    if (!code) {
        return redirect('/login?error=no_code');
    }

    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        console.error('Callback error:', error?.message);
        return redirect('/login?error=callback_failed');
    }

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

    // Track Login (Optional, can be silent)
    try {
        const { trackEvent } = await import('../../../lib/analytics');
        await trackEvent('login', {
            user_id: data.session.user.id,
            path: '/api/auth/callback'
        });
    } catch (e) {
        console.error('Tracking error:', e);
    }

    return redirect('/');
};
