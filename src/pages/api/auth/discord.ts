import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: `${url.origin}/api/auth/callback`,
            skipBrowserRedirect: true,
        },
    });

    if (error) {
        console.error('Discord auth error:', error.message);
        return redirect('/login?error=auth_init_failed');
    }

    if (data?.url) {
        return redirect(data.url);
    }

    return redirect('/login');
};
