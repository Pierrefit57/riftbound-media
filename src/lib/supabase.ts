import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Client public — utilisé côté client et pour les requêtes publiques
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function createAstroServerClient(context: { cookies: any }) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return context.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                context.cookies.set(name, value, options);
            },
            remove(name: string, options: CookieOptions) {
                context.cookies.delete(name, options);
            },
        },
    });
}

// Client serveur avec service role — utilisé uniquement côté serveur (admin, middleware)
export function createServiceClient() {
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// Client d'authentification SSR (Pattern recommandé)
export function createAuthClient() {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// Helper : récupérer la session depuis les cookies d'une requête
export async function getSession(request: Request) {
    const cookies = parseCookies(request.headers.get('cookie') || '');

    // Tentative 1: Cookies génériques
    let accessToken = cookies['sb-access-token'];
    let refreshToken = cookies['sb-refresh-token'];

    // Tentative 2: Cookies segmentés (Supabase default)
    if (!accessToken) {
        accessToken = cookies['sb-otbccpoavhfvjpqpzemz-auth-token.0'] || cookies['sb-otbccpoavhfvjpqpzemz-auth-token'];
    }

    if (!accessToken) return null;

    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '', // Le refresh token peut être optionnel pour certaines validations si l'access est valide
    });

    if (error) {
        console.error('[supabase-lib] Erreur setSession dans getSession:', error.message);
        return null;
    }
    return data.session;
}

// Helper : récupérer le profil utilisateur (avec rôle)
// Utilise le service client pour bypasser les RLS et garantir la lecture du rôle
export async function getUserProfile(userId: string) {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) {
        console.error('Erreur getUserProfile:', error.message);
        return null;
    }
    return data;
}

function parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    cookieString.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) cookies[name] = decodeURIComponent(rest.join('='));
    });
    return cookies;
}
