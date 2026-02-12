import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otbccpoavhfvjpqpzemz.supabase.co';
const supabaseAnonKey = 'sb_publishable_G6uZujSOgne2fWBIPZoVTQ_CQkcMGu1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectArticle() {
    console.log('Inspecting article: les-erratas-spiritforged');
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', 'les-erratas-spiritforged')
        .single();

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    console.log('--- ARTICLE DETAILS ---');
    console.log(JSON.stringify(data, null, 2));
}

inspectArticle();
