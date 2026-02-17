import { createServiceClient } from './supabase';

export async function trackEvent(eventType: string, data: {
    path?: string;
    user_id?: string;
    session_id?: string;
    ip?: string;
    agent?: string;
    referrer?: string;
    country?: string;
}) {
    try {
        const supabase = createServiceClient();
        const { error } = await supabase.from('analytics_logs').insert({
            event_type: eventType,
            path: data.path,
            user_id: data.user_id,
            session_id: data.session_id,
            ip_address: data.ip,
            user_agent: data.agent,
            referrer: data.referrer,
            country: data.country,
        });
        if (error) {
            console.error('[analytics] Supabase insert error:', error.message, error.details, error.hint);
        }
    } catch (e: any) {
        // Fail silently to not block the app
        console.error('[analytics] Unexpected error:', e?.message);
    }
}

