import type { APIRoute } from 'astro';
import { createAuthClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
    const authClient = createAuthClient();

    // On définit l'URL de redirection de manière robuste
    // En développement, on utilise localhost. En prod, on utilise le domaine officiel.
    const redirectTo = import.meta.env.DEV
        ? 'http://localhost:4321/api/auth/callback'
        : 'https://riftbound-media.com/api/auth/callback';

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
        console.log('[auth] Redirection vers Discord:', data.url);
        return redirect(data.url);
    }

    return redirect('/login?error=no_url_returned');
};
