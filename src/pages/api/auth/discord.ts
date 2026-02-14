import type { APIRoute } from 'astro';
import { createAuthClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
    const authClient = createAuthClient();

    // On utilise le domaine configuré dans Supabase pour la redirection
    const redirectTo = import.meta.env.DEV
        ? 'http://localhost:4321/api/auth/callback'
        : 'https://riftbound-media.fr/api/auth/callback';

    console.log('[auth] Initiation Discord vers:', redirectTo);

    const { data, error } = await authClient.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo,
            skipBrowserRedirect: true,
        },
    });

    if (error) {
        console.error('[auth] Erreur initiation Discord:', error.message);
        return redirect('/login?error=auth_init_failed');
    }

    if (data?.url) {
        return redirect(data.url);
    }

    return redirect('/login?error=no_url_returned');
};
