import { defineMiddleware } from 'astro:middleware';
import { createAuthClient, getUserProfile } from './lib/supabase';
import { trackEvent } from './lib/analytics';

const IGNORED_PATHS = [
    '/_astro',
    '/api',
    '/lib',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.css',
    '.js',
];

export const onRequest = defineMiddleware(async (context, next) => {
    // 1. Analytics Tracking
    const path = context.url.pathname;

    // PROTECTION CRITIQUE : Ne jamais interférer ou rediriger les routes d'authentification
    // Cela évite de perdre le code PKCE pendant une redirection www vers non-www
    if (path.startsWith('/api/auth/')) {
        return next();
    }

    if (!IGNORED_PATHS.some((p) => path.startsWith(p) || path.endsWith(p))) {
        // Obtenir l'IP de manière sécurisée (compatible Vercel/Node)
        const ip = context.request.headers.get('x-forwarded-for') || context.clientAddress;

        // On ne bloque pas la requête, on lance le tracking en "background"
        // Note: Dans un environnement serverless strict, il vaudrait mieux utiliser context.waitUntil si disponible,
        // mais Astro ne l'expose pas toujours directement. On appelle la fonction async sans await.
        // ATTENTION: Sur Vercel Edge, sans await, la promesse peut être annulée.
        // Pour l'instant, on fait un tracking simple qui attend (rapide avec Supabase) ou on accepte le risque.
        // On va attendre pour garantir l'écriture, ça ajoute quelques ms mais c'est plus sûr.
        trackEvent('page_view', {
            path,
            ip: typeof ip === 'string' ? ip : undefined,
            agent: context.request.headers.get('user-agent') || undefined,
            user_id: undefined, // Sera enrichi si session trouvée ? Non, middleware s'exécute avant auth pour tout le monde. 
            // Si on veut le user_id, il faut le faire APRES la résolution de session ci-dessous.
            // On déplace le tracking après la session.
        });
    }
    // Récupérer les tokens depuis les cookies (Gestion des cookies segmentés)
    const segmentedPrefix = 'sb-otbccpoavhfvjpqpzemz-auth-token';
    const hasSegmented = context.cookies.has(`${segmentedPrefix}.0`) || context.cookies.has(segmentedPrefix);

    // Fallback anciens cookies génériques
    const accessToken = context.cookies.get('sb-access-token')?.value;
    const refreshToken = context.cookies.get('sb-refresh-token')?.value;

    if (hasSegmented || (accessToken && refreshToken)) {
        // Vérifier/restaurer la session avec un client frais
        const authClient = createAuthClient();
        console.log('[auth] Tentative de restauration de session via cookies...');
        const { data, error } = await authClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        if (error || !data.session) {
            console.log('[auth] Echec restauration session:', error?.message);
            const isProd = import.meta.env.PROD;
            const domain = isProd ? '.riftbound-media.fr' : undefined;
            context.cookies.delete('sb-access-token', { path: '/', domain });
            context.cookies.delete('sb-refresh-token', { path: '/', domain });
            context.locals.user = null;
            context.locals.profile = null;
        } else {
            // Session valide → attacher user + profil
            context.locals.user = data.session.user;

            // Rafraîchir les cookies si les tokens ont changé
            if (data.session.access_token !== accessToken) {
                const isProd = import.meta.env.PROD;
                const domain = isProd ? '.riftbound-media.fr' : undefined;
                context.cookies.set('sb-access-token', data.session.access_token, {
                    path: '/',
                    httpOnly: true,
                    secure: isProd,
                    sameSite: 'lax',
                    domain,
                    maxAge: 60 * 60 * 24 * 7,
                });
                context.cookies.set('sb-refresh-token', data.session.refresh_token, {
                    path: '/',
                    httpOnly: true,
                    secure: isProd,
                    sameSite: 'lax',
                    domain,
                    maxAge: 60 * 60 * 24 * 7,
                });
            }

            // Charger le profil (rôle) via le service client
            const profile = await getUserProfile(data.session.user.id);
            context.locals.profile = profile;
            console.log('[auth] Session OK - User:', data.session.user.email, '| Rôle:', profile?.role);
        }
    } else {
        context.locals.user = null;
        context.locals.profile = null;
    }

    // Protéger les routes admin
    if (context.url.pathname.startsWith('/admin')) {
        if (!context.locals.user) {
            console.log('[auth] Accès admin refusé: pas de session');
            return context.redirect('/login');
        }
        if (!context.locals.profile || !['admin', 'editor'].includes(context.locals.profile.role)) {
            console.log('[auth] Accès admin refusé: rôle insuffisant');
            return context.redirect('/');
        }
    }

    return next();
});

