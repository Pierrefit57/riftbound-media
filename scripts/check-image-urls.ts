/**
 * Script de diagnostic : vérifie quelles image_url sont cassées
 * en testant chaque URL avec un HEAD request.
 * 
 * Usage: npx tsx scripts/check-image-urls.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function checkUrls() {
    const { data: events, error } = await supabase
        .from('calendar_events')
        .select('id, title, image_url')
        .not('image_url', 'is', null)
        .order('start_date', { ascending: true });

    if (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }

    console.log(`\n🔍 Checking ${events?.length || 0} event image URLs...\n`);

    for (const event of events || []) {
        if (!event.image_url) continue;

        try {
            const resp = await fetch(event.image_url, { method: 'HEAD' });
            const status = resp.status;
            const ok = status === 200;

            // If the .webp is broken, check if the .png version exists
            let fixUrl = null;
            if (!ok && event.image_url.includes('.webp')) {
                const pngUrl = event.image_url.replace(/\.webp/g, '.png');
                const pngResp = await fetch(pngUrl, { method: 'HEAD' });
                if (pngResp.status === 200) {
                    fixUrl = pngUrl;
                }
            }

            const icon = ok ? '✅' : '❌';
            console.log(`${icon} [${status}] "${event.title}"`);
            console.log(`   URL: ${event.image_url}`);
            if (fixUrl) {
                console.log(`   🔧 .png version exists! Reverting...`);

                const { error: updateError } = await supabase
                    .from('calendar_events')
                    .update({ image_url: fixUrl })
                    .eq('id', event.id);

                if (updateError) {
                    console.log(`   ❌ Revert failed: ${updateError.message}`);
                } else {
                    console.log(`   ✅ Reverted to: ${fixUrl}`);
                }
            } else if (!ok) {
                console.log(`   ⚠️  No .png fallback found either`);
            }
            console.log();
        } catch (err: any) {
            console.log(`❌ "${event.title}" — Network error: ${err.message}`);
            console.log(`   URL: ${event.image_url}\n`);
        }
    }

    console.log('🎉 Done!');
}

checkUrls();
