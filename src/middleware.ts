import { defineMiddleware } from 'astro:middleware';
import { getUserProfile, createAstroServerClient } from './lib/supabase';

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
    const path = context.url.pathname;

    // PROTECTION CRITIQUE : Ne jamais interférer ou rediriger les routes d'authentification
    if (path.startsWith('/api/auth/')) {
        return next();
    }

    // Skip auth pour les assets statiques et API (pas besoin de session)
    if (IGNORED_PATHS.some((p) => path.startsWith(p) || path.endsWith(p))) {
        return next();
    }

    // Gestion de la Session via Supabase SSR
    const supabaseServer = createAstroServerClient(context);
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
        // Session valide → attacher user + profil (en parallèle avec next si possible)
        context.locals.user = session.user;

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


