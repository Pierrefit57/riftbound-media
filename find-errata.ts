import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otbccpoavhfvjpqpzemz.supabase.co';
const supabaseAnonKey = 'sb_publishable_G6uZujSOgne2fWBIPZoVTQ_CQkcMGu1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findErrata() {
    const { data, error } = await supabase
        .from('articles')
        .select('title, slug, published_at, image_url')
        .ilike('title', '%errata%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- FIND ERRATA ---');
    if (data.length === 0) {
        console.log('No articles found with "errata" in title.');
        // List first 20 articles as fallback
        const { data: allData } = await supabase.from('articles').select('title, slug').limit(20);
        console.log('Recent 20 articles:');
        allData.forEach(a => console.log(`- ${a.title} (${a.slug})`));
    } else {
        data.forEach(a => {
            console.log(`TITLE: ${a.title}`);
            console.log(`SLUG: ${a.slug}`);
            console.log(`IMG: ${a.image_url}`);
            console.log(`DATE: ${a.published_at}`);
            console.log('-------------------');
        });
    }
}

findErrata();
