import type { APIRoute } from 'astro';
import { createServiceClient } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
    const { user, profile } = locals as any;

    if (!user || !profile || !['admin', 'editor'].includes(profile.role)) {
        return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 403 });
    }

    try {
        const { orders } = await request.json(); // { orders: [{ id: string, sort_order: number }] }

        if (!Array.isArray(orders)) {
            return new Response(JSON.stringify({ error: 'Format invalide' }), { status: 400 });
        }

        const supabase = createServiceClient();

        // On utilise une boucle simple ici car Supabase n'a pas d'upsert批量 unique pour des IDs différents avec des valeurs différentes facilement
        // Mais pour garder ça performant, on peut faire des updates en série
        const promises = orders.map(item =>
            supabase
                .from('articles')
                .update({ sort_order: item.sort_order })
                .eq('id', item.id)
        );

        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error);

        if (errors.length > 0) {
            console.error('Erreurs lors de la réorganisation:', errors);
            const isMissingColumn = errors.some(e => e.error?.message?.includes('sort_order') || e.error?.code === '42703');
            const message = isMissingColumn
                ? 'La colonne "sort_order" est manquante. Veuillez exécuter la migration SQL.'
                : 'Certaines mises à jour ont échoué';
            return new Response(JSON.stringify({ error: message, details: errors }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error('Erreur API reorder:', err);
        return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
    }
};
