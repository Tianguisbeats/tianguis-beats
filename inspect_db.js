const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function inspectDB() {
    console.log("=== DB INSPECTION START ===");

    // Check row counts
    const { count: cOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: cOrdenes } = await supabase.from('ordenes').select('*', { count: 'exact', head: true });
    console.log(`Row counts => orders (old): ${cOrders}, ordenes (new): ${cOrdenes}`);

    // Fetch up to 3 records from the new table to see what they look like
    if (cOrdenes > 0) {
        const { data: ordenesData, error: ordenesErr } = await supabase.from('ordenes').select('*, items_orden(*)').limit(3);
        if (ordenesErr) {
            console.error("Error fetching ordenes:", ordenesErr);
        } else {
            console.log("\nSample 'ordenes' (new table) data:", JSON.stringify(ordenesData, null, 2));
        }
    } else {
        console.log("\nNo data in 'ordenes'. The migration script was likely not run or failed.");
    }

    // Fetch up to 3 records from the old table just to confirm data exists
    if (cOrders > 0) {
        const { data: ordersData, error: ordersErr } = await supabase.from('orders').select('*, order_items(*)').limit(1);
        if (ordersErr) {
            console.error("Error fetching orders:", ordersErr);
        } else {
            console.log("\nSample 'orders' (old table) data:", JSON.stringify(ordersData, null, 2));
        }
    }

    console.log("=== DB INSPECTION END ===");
}

inspectDB();
