import { createServiceClient } from './supabase';

export async function trackEvent(eventType: string, data: { path?: string; user_id?: string; session_id?: string; ip?: string; agent?: string }) {
    try {
        const supabase = createServiceClient();
        await supabase.from('analytics_logs').insert({
            event_type: eventType,
            path: data.path,
            user_id: data.user_id,
            session_id: data.session_id,
            ip_address: data.ip,
            user_agent: data.agent,
        });
    } catch (e) {
        // Fail silently to not block the app
        console.error('Analytics Error:', e);
    }
}
