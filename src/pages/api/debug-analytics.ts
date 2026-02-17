import type { APIRoute } from 'astro';
import { createServiceClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
    const supabase = createServiceClient();

    // 1. Count total rows
    const { count: totalCount, error: countError } = await supabase
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true });

    // 2. Get last 10 entries
    const { data: recentLogs, error: recentError } = await supabase
        .from('analytics_logs')
        .select('event_type, path, ip_address, created_at, country')
        .order('created_at', { ascending: false })
        .limit(10);

    // 3. Count today's entries
    const todayStr = new Date().toISOString().split('T')[0];
    const { count: todayCount, error: todayError } = await supabase
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStr);

    // 4. Test insert
    const testResult = await supabase.from('analytics_logs').insert({
        event_type: 'diagnostic_test',
        path: '/api/debug-analytics',
        ip_address: '127.0.0.1',
    });

    return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        serverless_working: true,
        total_rows: totalCount,
        today_rows: todayCount,
        last_10_entries: recentLogs,
        test_insert: testResult.error ? { error: testResult.error.message, details: testResult.error.details, hint: testResult.error.hint } : 'success',
        errors: {
            count: countError?.message,
            recent: recentError?.message,
            today: todayError?.message,
        }
    }, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'CDN-Cache-Control': 'no-store',
            'Vercel-CDN-Cache-Control': 'no-store',
        }
    });
};
