import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    try {
        const { accessToken, refreshToken } = await request.json();

        if (!accessToken || !refreshToken) {
            return new Response('Missing tokens', { status: 400 });
        }

        // Set the session on the supabase client
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        if (error) {
            return new Response(error.message, { status: 500 });
        }

        // Set cookies for server-side persistence
        if (data.session) {
            cookies.set('sb-access-token', data.session.access_token, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
            cookies.set('sb-refresh-token', data.session.refresh_token, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response('Internal Server Error', { status: 500 });
    }
};
