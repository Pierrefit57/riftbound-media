
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkLimit() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // 1. Total count in last 30 days
    const { count, error } = await supabase
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

    if (error) {
        console.error(error);
        return;
    }
    console.log(`Total logs in last 30 days: ${count}`);
    
    // 2. See if latest logs are page_views
    const { data: latest } = await supabase
        .from('analytics_logs')
        .select('created_at, event_type, ip_address')
        .order('created_at', { ascending: false })
        .limit(5);
    
    console.log('\nLatest 5 logs:');
    latest.forEach(l => console.log(`- ${l.created_at} | ${l.event_type} | ${l.ip_address}`));
}

checkLimit();
