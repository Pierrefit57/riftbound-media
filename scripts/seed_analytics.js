
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
    console.log('Seeding analytics data...');

    const events = [];
    const today = new Date();

    // Generate 30 days of data
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Random view count between 10 and 50 per day
        const dayViews = Math.floor(Math.random() * 40) + 10;

        for (let j = 0; j < dayViews; j++) {
            // Randomize time within the day
            const time = new Date(date);
            time.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            events.push({
                event_type: 'page_view',
                page: Math.random() > 0.3 ? '/news/example-article' : '/',
                path: Math.random() > 0.3 ? '/news/example-article' : '/',
                ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
                user_agent: 'SeedScript/1.0',
                created_at: time.toISOString()
            });
        }
    }

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await supabase.from('analytics_logs').insert(batch);
    }

    console.log(`Inserted ${events.length} mock logs.`);
}

seed();
