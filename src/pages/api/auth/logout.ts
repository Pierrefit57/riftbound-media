import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
    const isProd = import.meta.env.PROD;
    const prefix = 'sb-otbccpoavhfvjpqpzemz-auth-token';
    const domain = isProd ? '.riftbound-media.fr' : undefined;

    cookies.delete(prefix, { path: '/', domain });
    cookies.delete(`${prefix}.0`, { path: '/', domain });
    cookies.delete(`${prefix}.1`, { path: '/', domain });

    return redirect('/login');
};
