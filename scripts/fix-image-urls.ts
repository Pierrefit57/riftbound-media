/**
 * Script pour migrer les image_url de .png vers .webp
 * dans la table calendar_events de Supabase.
 * 
 * Usage: npx tsx scripts/fix-image-urls.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function fixImageUrls() {
    console.log('🔍 Fetching calendar events with .png image URLs...\n');

    const { data: events, error } = await supabase
        .from('calendar_events')
        .select('id, title, image_url')
        .like('image_url', '%.png%');

    if (error) {
        console.error('❌ Error fetching events:', error.message);
        process.exit(1);
    }

    if (!events || events.length === 0) {
        console.log('✅ No events with .png image URLs found. Nothing to update.');
        return;
    }

    console.log(`Found ${events.length} event(s) with .png URLs:\n`);

    for (const event of events) {
        const oldUrl = event.image_url;
        const newUrl = oldUrl.replace(/\.png/g, '.webp');

        console.log(`  📌 "${event.title}"`);
        console.log(`     Old: ${oldUrl}`);
        console.log(`     New: ${newUrl}`);

        const { error: updateError } = await supabase
            .from('calendar_events')
            .update({ image_url: newUrl })
            .eq('id', event.id);

        if (updateError) {
            console.error(`     ❌ Update failed: ${updateError.message}`);
        } else {
            console.log(`     ✅ Updated!`);
        }
    }

    console.log('\n🎉 Done! All .png URLs have been migrated to .webp.');
}

fixImageUrls();
