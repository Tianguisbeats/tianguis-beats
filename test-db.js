require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('quejas_y_sugerencias').select('*, perfiles:usuario_id(nombre_usuario)').limit(1);
  console.log("With profile relation:", error ? error.message : "Success");
  const { data: d2, error: e2 } = await supabase.from('quejas_y_sugerencias').select('*').limit(1);
  console.log("Without relation:", e2 ? e2.message : "Success, rows: " + d2?.length);

  const { data: d3, error: e3 } = await supabase.from('quejas_y_sugerencias').select('*, perfiles:user_id(nombre_usuario)').limit(1);
  console.log("With user_id relation:", e3 ? e3.message : "Success");
}
run();
