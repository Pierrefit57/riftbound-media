
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalVerify() {
    const { data: events, error } = await supabase
        .from('calendar_events')
        .select('id, title, start_date, end_date')
        .ilike('title', '%Riot Merch%');

    if (error) {
        console.error(error);
        return;
    }

    console.log('FINAL_VERIFY:', JSON.stringify(events, null, 2));
}

finalVerify();
