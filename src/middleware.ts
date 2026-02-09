import { defineMiddleware } from 'astro:middleware';
import { createAuthClient, getUserProfile } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
    // Récupérer les tokens depuis les cookies
    const accessToken = context.cookies.get('sb-access-token')?.value;
    const refreshToken = context.cookies.get('sb-refresh-token')?.value;

    // Pas de tokens → pas de session
    if (!accessToken || !refreshToken) {
        context.locals.user = null;
        context.locals.profile = null;

        // Protéger les routes admin
        if (context.url.pathname.startsWith('/admin')) {
            console.log('[auth] Pas de tokens, redirect /login');
            return context.redirect('/login');
        }

        return next();
    }

    // Vérifier/restaurer la session avec un client frais
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error || !data.session) {
        // Session invalide → nettoyer les cookies
        console.log('[auth] Session invalide:', error?.message);
        context.cookies.delete('sb-access-token', { path: '/' });
        context.cookies.delete('sb-refresh-token', { path: '/' });
        context.locals.user = null;
        context.locals.profile = null;

        if (context.url.pathname.startsWith('/admin')) {
            return context.redirect('/login');
        }

        return next();
    }

    // Session valide → attacher user + profil
    context.locals.user = data.session.user;

    // Rafraîchir les cookies si les tokens ont changé
    if (data.session.access_token !== accessToken) {
        context.cookies.set('sb-access-token', data.session.access_token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 jours
        });
        context.cookies.set('sb-refresh-token', data.session.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });
    }

    // Charger le profil (rôle) via le service client
    const profile = await getUserProfile(data.session.user.id);
    context.locals.profile = profile;
    console.log('[auth] User:', data.session.user.email, '| Rôle:', profile?.role);

    // Protéger les routes admin — seuls admin et editor
    if (context.url.pathname.startsWith('/admin')) {
        if (!profile || !['admin', 'editor'].includes(profile.role)) {
            console.log('[auth] Accès admin refusé, rôle:', profile?.role);
            return context.redirect('/');
        }
    }

    return next();
});

