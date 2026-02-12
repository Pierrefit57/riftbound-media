import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otbccpoavhfvjpqpzemz.supabase.co';
const supabaseAnonKey = 'sb_publishable_G6uZujSOgne2fWBIPZoVTQ_CQkcMGu1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllArticles() {
    const { data, error } = await supabase
        .from('articles')
        .select('title, slug, published_at, image_url');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- START ARTICLES ---');
    data.forEach(a => {
        console.log(`TITLE: ${a.title}`);
        console.log(`SLUG: ${a.slug}`);
        console.log(`IMG: ${a.image_url}`);
        console.log(`DATE: ${a.published_at}`);
        console.log('-------------------');
    });
    console.log('--- END ARTICLES ---');
}

listAllArticles();
