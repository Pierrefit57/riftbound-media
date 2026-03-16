
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function finalProof() {
    const slug = '/news/revelations-unleashed';
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Total count for THIS specific path in 30d
    const { count, error } = await supabase
        .from('analytics_logs')
        .select('*', { count: 'exact', head: true })
        .eq('path', slug)
        .gte('created_at', thirtyDaysAgo);

    console.log(`--- THE TRUTH IN THE DATABASE ---`);
    console.log(`Article: ${slug}`);
    console.log(`True 30-day count in DB: ${count}`);
    console.log(`\n(Si le dashboard affiche moins, c'est à cause de la limite technique de 1000 lignes par requête de Supabase API)`);
}

finalProof();
