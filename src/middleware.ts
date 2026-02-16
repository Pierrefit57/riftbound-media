import { defineMiddleware } from 'astro:middleware';
import { createAuthClient, getUserProfile, createAstroServerClient } from './lib/supabase';
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
        await trackEvent('page_view', {
            path,
            ip: typeof ip === 'string' ? ip : undefined,
            agent: context.request.headers.get('user-agent') || undefined,
            user_id: undefined,
        });
    }
    // 2. Gestion de la Session via Supabase SSR
    const supabaseServer = createAstroServerClient(context);

    // Tentative de récupération de la session (SSR gère les cookies segmentés .0, .1 automatiquement)
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();

    if (sessionError || !session) {
        if (sessionError) console.warn('[auth-middleware] Session error:', sessionError.message);

        context.locals.user = null;
        context.locals.profile = null;

        // Nettoyage si on a des restes de cookies mais pas de session valide
        const segmentedPrefix = 'sb-otbccpoavhfvjpqpzemz-auth-token';
        if (context.cookies.has(`${segmentedPrefix}.0`) || context.cookies.has('sb-access-token')) {
            console.log('[auth-middleware] Cleaning up invalid session cookies...');
            const isProd = import.meta.env.PROD;
            const domains = [isProd ? '.riftbound-media.fr' : undefined, undefined];
            const cookiesToClear = ['sb-access-token', 'sb-refresh-token', `${segmentedPrefix}.0`, `${segmentedPrefix}.1`, segmentedPrefix];

            domains.forEach(domain => {
                cookiesToClear.forEach(name => context.cookies.delete(name, { path: '/', domain }));
            });
        }
    } else {
        // Session valide → attacher user + profil
        context.locals.user = session.user;

        // Charger le profil (rôle) via le service client (on pourrait aussi utiliser le supabaseServer si RLS permettent)
        const profile = await getUserProfile(session.user.id);
        context.locals.profile = profile;

        if (path === '/') {
            console.log(`[auth-middleware] Session OK: ${session.user.email} (${profile?.role || 'user'})`);
        }
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

