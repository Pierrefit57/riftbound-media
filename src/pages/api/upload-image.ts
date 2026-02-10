import type { APIRoute } from 'astro';
import { createServiceClient } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    // Vérifier que l'utilisateur est connecté et a le bon rôle
    const user = locals.user;
    const profile = locals.profile;

    if (!user || !profile || !['admin', 'editor'].includes(profile.role)) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file || !file.size) {
            return new Response(JSON.stringify({ error: 'Aucun fichier fourni' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Vérifier le type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: 'Image trop lourde (max 5 Mo)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Générer un nom de fichier unique
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = `articles/${fileName}`;

        // Upload vers Supabase Storage
        const supabase = createServiceClient();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Erreur upload:', uploadError);
            return new Response(JSON.stringify({ error: 'Erreur lors de l\'upload' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('article-images')
            .getPublicUrl(filePath);

        return new Response(JSON.stringify({ url: publicUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Erreur serveur upload:', err);
        return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
