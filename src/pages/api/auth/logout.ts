import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
    const isProd = import.meta.env.PROD;
    const apexDomain = '.riftbound-media.fr';
    const wwwDomain = 'www.riftbound-media.fr';
    const path = '/';

    const cookieNames = [
        'sb-otbccpoavhfvjpqpzemz-auth-token.0',
        'sb-otbccpoavhfvjpqpzemz-auth-token.1',
        'sb-otbccpoavhfvjpqpzemz-auth-token',
        'sb-access-token',
        'sb-refresh-token'
    ];

    const domains = [apexDomain, wwwDomain, undefined]; // Tentative sur Apex, WWW et local (sans domaine)

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    // Pour chaque cookie et chaque domaine possible, on force l'expiration maximale
    cookieNames.forEach(name => {
        domains.forEach(d => {
            const domainAttr = d ? `Domain=${d}; ` : '';
            const cookieStr = `${name}=; Path=${path}; ${domainAttr}Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;
            headers.append('Set-Cookie', cookieStr);
        });
    });

    console.log('[auth-api] Aggressive logout executed - all variants targeted.');

    return new Response(JSON.stringify({ success: true, message: 'Logged out aggressively' }), {
        status: 200,
        headers
    });
};
