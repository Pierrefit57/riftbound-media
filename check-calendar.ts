
import { createServiceClient } from './src/lib/supabase';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkEvents() {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkEvents();
