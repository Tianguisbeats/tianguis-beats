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

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function checkData() {
    console.log("Checking tables...");

    const { count: cOrders, error: eOrders } = await supabase.from('ordenes').select('*', { count: 'exact', head: true });
    console.log('ordenes:', cOrders, eOrders ? eOrders.message : 'OK');

    const { count: cItems, error: eItems } = await supabase.from('items_orden').select('*', { count: 'exact', head: true });
    console.log('items_orden:', cItems, eItems ? eItems.message : 'OK');

    const { count: cVentas, error: eVentas } = await supabase.from('ventas').select('*', { count: 'exact', head: true });
    console.log('ventas:', cVentas, eVentas ? eVentas.message : 'OK');

    const { count: cOldOrders, error: eOldOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    console.log('old orders:', cOldOrders, eOldOrders ? eOldOrders.message : 'OK');

    const { count: cOldSales, error: eOldSales } = await supabase.from('sales').select('*', { count: 'exact', head: true });
    console.log('old sales:', cOldSales, eOldSales ? eOldSales.message : 'OK');
}

checkData();
