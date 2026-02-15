import type { APIRoute } from 'astro';
import { createAstroServerClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async (context) => {
    const { request, cookies, redirect } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
        console.error('[auth] Callback sans code');
        return redirect('/login?error=no_code');
    }

    // On utilise le client SSR qui gère automatiquement les cookies (et le PKCE verifier)
    const supabase = createAstroServerClient(context);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        console.error('Session établie: NON');
        if (error) {
            const authError = error as any;
            console.error('[auth] Supabase Error Detail:', {
                message: authError.message,
                status: authError.status,
                hint: authError.hint,
                details: authError.details
            });
        }
        return redirect('/login?error=callback_failed');
    }

    // Session OK
    console.log('Session établie: OUI');

    // On pose manuellement les cookies persistants sur le domaine global pour le partage entre www et apex
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
