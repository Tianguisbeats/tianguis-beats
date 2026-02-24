import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('coupons').select('*').limit(1);
    if (error) {
        console.error('Error fetching:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('COLUMNS IN DATA:', Object.keys(data[0]));
    } else {
        // try to get columns using an insert error trick or just select that returns empty
        const { data: emptyData, error: e2 } = await supabase.rpc('hello'); // just fail
        console.log('No rows returned. Run psql instead if possible.');
    }
}
check();
