import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otbccpoavhfvjpqpzemz.supabase.co';
const supabaseAnonKey = 'sb_publishable_G6uZujSOgne2fWBIPZoVTQ_CQkcMGu1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listSlugsOnly() {
    const { data, error } = await supabase
        .from('articles')
        .select('title, slug')
        .order('published_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- SLUGS LIST ---');
    data.forEach(a => {
        console.log(`[${a.slug}] -> ${a.title}`);
    });
    console.log('--- END SLUGS ---');
}

listSlugsOnly();
