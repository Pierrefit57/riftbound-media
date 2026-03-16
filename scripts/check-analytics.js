
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkOnline() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: logs, error } = await supabase
        .from('analytics_logs')
        .select('ip_address')
        .eq('event_type', 'page_view')
        .gte('created_at', fiveMinutesAgo);

    if (error) {
        console.error(error);
        return;
    }

    const uniqueIps = new Set(logs.map(l => l.ip_address));
    console.log(`--- ONLINE NOW (5 MIN) ---`);
    console.log(`Unique IPs in last 5 min: ${uniqueIps.size}`);
    
    // Sample of what's online
    console.log('\nSample IPs:');
    Array.from(uniqueIps).slice(0, 5).forEach(ip => console.log(`- ${ip}`));
}

checkOnline();
