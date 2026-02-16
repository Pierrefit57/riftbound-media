
import { createServiceClient } from './src/lib/supabase.js';

async function debug() {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from('analytics_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Last 10 logs:');
    data.forEach(log => {
        console.log(`ID: ${log.id} | CreatedAt: "${log.created_at}" (Type: ${typeof log.created_at}) | Type: ${log.event_type} | Path: ${log.path}`);
    });
}

debug();
