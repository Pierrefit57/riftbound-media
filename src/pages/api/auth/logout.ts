import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
    const isProd = import.meta.env.PROD;
    const domain = isProd ? '.riftbound-media.fr' : undefined;

    cookies.delete('sb-access-token', { path: '/', domain });
    cookies.delete('sb-refresh-token', { path: '/', domain });

    return redirect('/login');
};
