const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('coupons').select('*').limit(1);
  if (error) console.error(error);
  else console.log(data[0] ? Object.keys(data[0]) : "No rows, but columns exist. Try selecting * from coupons limit 0");
}
check();
