import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
    const domain = '.riftbound-media.fr';

    // Delete segmented Supabase cookies (HttpOnly)
    cookies.delete('sb-otbccpoavhfvjpqpzemz-auth-token.0', { path: '/', domain });
    cookies.delete('sb-otbccpoavhfvjpqpzemz-auth-token.1', { path: '/', domain });

    // Also delete the base prefix just in case
    cookies.delete('sb-otbccpoavhfvjpqpzemz-auth-token', { path: '/', domain });

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
};
