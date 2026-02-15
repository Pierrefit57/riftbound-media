import type { APIRoute } from 'astro';
import { createAstroServerClient } from '../../../lib/supabase';

export const GET: APIRoute = async (context) => {
    const supabaseServer = createAstroServerClient(context);
    const { data: { session } } = await supabaseServer.auth.getSession();

    if (!session) {
        return new Response(JSON.stringify({ followedIds: [] }), { status: 200 });
    }

    const { data, error } = await supabaseServer
        .from('event_follows')
        .select('event_id')
        .eq('user_id', session.user.id);

    if (error) {
        console.error('[api-follow-get] Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ followedIds: data.map(f => f.event_id) }), { status: 200 });
};

export const POST: APIRoute = async (context) => {
    const supabaseServer = createAstroServerClient(context);
    const { data: { session } } = await supabaseServer.auth.getSession();

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { eventId, action } = await context.request.json();

    if (!eventId || !action) {
        return new Response('Missing parameters', { status: 400 });
    }

    if (action === 'follow') {
        const { error } = await supabaseServer
            .from('event_follows')
            .upsert({ user_id: session.user.id, event_id: eventId }, { onConflict: 'user_id, event_id' });

        if (error) {
            console.error('[api-follow-post] Upsert Error:', error.message);
            return new Response(error.message, { status: 500 });
        }
    } else if (action === 'unfollow') {
        const { error } = await supabaseServer
            .from('event_follows')
            .delete()
            .eq('user_id', session.user.id)
            .eq('event_id', eventId);

        if (error) {
            console.error('[api-follow-post] Delete Error:', error.message);
            return new Response(error.message, { status: 500 });
        }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
