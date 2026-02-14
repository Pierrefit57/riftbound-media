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

    // LOG DEMANDÉ PAR L'UTILISATEUR
    console.log('Session établie:', data.session ? 'OUI' : 'NON');

    if (error || !data.session) {
        if (error) console.error('[auth] Exchange error:', error.message);
        return redirect('/login?error=callback_failed');
    }

    const isProd = import.meta.env.PROD;

    // Déterminer le domaine pour les cookies (partagé entre www et apex si possible)
    // On utilise un point devant le domaine en prod pour inclure les sous-domaines
    const domain = isProd ? '.riftbound-media.fr' : undefined;

    const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: true, // Forcé à true comme demandé
        sameSite: 'lax' as const,
        domain: domain,
        maxAge: 60 * 60 * 24 * 7,
    };

    cookies.set('sb-access-token', data.session.access_token, cookieOptions);
    cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);

    return redirect('/');
};
