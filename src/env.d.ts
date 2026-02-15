/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface UserProfile {
    id: string;
    username: string;
    avatar_url: string;
    role: 'user' | 'editor' | 'admin';
    created_at: string;
}

declare namespace App {
    interface Locals {
        user: import('@supabase/supabase-js').User | null;
        profile: UserProfile | null;
    }
}

interface ImportMetaEnv {
    readonly PUBLIC_SUPABASE_URL: string;
    readonly PUBLIC_SUPABASE_ANON_KEY: string;
    readonly SUPABASE_SERVICE_ROLE_KEY: string;
}