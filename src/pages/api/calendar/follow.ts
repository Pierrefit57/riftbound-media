import type { APIRoute } from 'astro';
import { supabase, getSession } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
    const session = await getSession(request);
    if (!session) {
        return new Response(JSON.stringify({ followedIds: [] }), { status: 200 });
    }

    const { data, error } = await supabase
        .from('event_follows')
        .select('event_id')
        .eq('user_id', session.user.id);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ followedIds: data.map(f => f.event_id) }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
    const session = await getSession(request);
    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { eventId, action } = await request.json();

    if (!eventId || !action) {
        return new Response('Missing parameters', { status: 400 });
    }

    if (action === 'follow') {
        const { error } = await supabase
            .from('event_follows')
            .upsert({ user_id: session.user.id, event_id: eventId }, { onConflict: 'user_id, event_id' });

        if (error) return new Response(error.message, { status: 500 });
    } else if (action === 'unfollow') {
        const { error } = await supabase
            .from('event_follows')
            .delete()
            .eq('user_id', session.user.id)
            .eq('event_id', eventId);

        if (error) return new Response(error.message, { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
