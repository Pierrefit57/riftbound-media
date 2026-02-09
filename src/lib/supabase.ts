import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Client public — utilisé côté client et pour les requêtes publiques
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client serveur avec service role — utilisé uniquement côté serveur (admin, middleware)
export function createServiceClient() {
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// Helper : récupérer la session depuis les cookies d'une requête
export async function getSession(request: Request) {
    const cookies = parseCookies(request.headers.get('cookie') || '');
    const accessToken = cookies['sb-access-token'];
    const refreshToken = cookies['sb-refresh-token'];

    if (!accessToken || !refreshToken) return null;

    const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error) return null;
    return data.session;
}

// Helper : récupérer le profil utilisateur (avec rôle)
export async function getUserProfile(userId: string) {
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
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
