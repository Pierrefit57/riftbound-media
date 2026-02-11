import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
    const code = url.searchParams.get('code');

    if (!code) {
        return redirect('/login');
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        return redirect('/login');
    }

    // Stocker les tokens dans des cookies httpOnly
    cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    });

    cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    });

    // Track Login
    const { trackEvent } = await import('../../../lib/analytics');
    await trackEvent('login', {
        user_id: data.session.user.id,
        path: '/api/auth/callback'
    });

    return redirect('/');
};
