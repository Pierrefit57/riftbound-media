import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
    const domain = '.riftbound-media.fr';
    const path = '/';

    // Les noms exacts demandés par l'utilisateur pour les cookies segmentés (HttpOnly)
    const segmentedCookies = [
        'sb-otbccpoavhfvjpqpzemz-auth-token.0',
        'sb-otbccpoavhfvjpqpzemz-auth-token.1',
        'sb-otbccpoavhfvjpqpzemz-auth-token' // Le préfixe de base au cas où
    ];

    segmentedCookies.forEach(name => {
        cookies.delete(name, { path, domain });
        console.log(`[auth-api] Cookie deleted: ${name}`);
    });

    // Optionnel: Nettoyage des anciens noms génériques s'ils existent
    cookies.delete('sb-access-token', { path, domain });
    cookies.delete('sb-refresh-token', { path, domain });

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
};
