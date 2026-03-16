
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function updateArticle() {
  const content = fs.readFileSync('c:/Users/Windows/.gemini/antigravity/scratch/riftbound-media/converted-article.md', 'utf8');
  
  const { data, error } = await supabase
    .from('articles')
    .update({ content: content })
    .eq('slug', 'revelations-unleashed')
    .select();

  if (error) {
    console.error('Error updating article:', error);
  } else {
    console.log('Article updated successfully:', data[0].title);
  }
}

updateArticle();
