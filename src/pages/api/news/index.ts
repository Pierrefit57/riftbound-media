
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, url }) => {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '9');
    const offset = (page - 1) * limit;

    // Query articles with pagination
    const { data: articles, error, count } = await supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('published', true)
        .order('sort_order', { ascending: false })
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        data: articles,
        meta: {
            page,
            limit,
            total: count,
            totalPages: count ? Math.ceil(count / limit) : 0
        }
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
