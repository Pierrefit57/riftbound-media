
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Permissions Check ---');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key Present: ${!!anonKey}`);
console.log(`Service Role Key Present: ${!!serviceRoleKey}`);

async function testPermissions() {
    const anonClient = createClient(supabaseUrl, anonKey);
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Try reading with Anon
    const { count: anonCount, error: anonError } = await anonClient
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true });
    
    console.log(`\nAnon Client Count: ${anonCount} (Error: ${anonError?.message || 'None'})`);

    // 2. Try reading with Service Role
    const { count: serviceCount, error: serviceError } = await serviceRoleKey ? await serviceClient
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true }) : { count: 'N/A', error: { message: 'Key missing' } };
    
    console.log(`Service Role Count: ${serviceCount} (Error: ${serviceError?.message || 'None'})`);

    // 3. Try reading articles (sanity check)
    const { count: artCount } = await serviceClient.from('articles').select('*', { count: 'exact', head: true });
    console.log(`Articles Count: ${artCount}`);
}

testPermissions();
