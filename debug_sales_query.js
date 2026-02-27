const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Checking transactions for user:", user?.id);

    const { data, error } = await supabase
        .from('transacciones')
        .select(`
        *,
        comprador:perfiles!fk_transacciones_comprador (nombre_usuario, nombre_artistico, foto_perfil)
    `)
        .eq('vendedor_id', '67ccaa34-31f3-49bf-88b6-b4169144c153') // Using the producer ID from previous steps
        .order('fecha_creacion', { ascending: false });

    if (error) console.error("Error:", error);
    console.log("Transactions data:", JSON.stringify(data, null, 2));
}
check();
