
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigate() {
    const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .ilike('title', '%Riot Merch%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('FOUND_EVENTS:', JSON.stringify(data, null, 2));
}

investigate();
