import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inicialización perezosa para evitar errores en Build si faltan variables de entorno
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not defined');
    return new Stripe(key);
};

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !roleKey) throw new Error('Supabase Admin env vars missing');
    return createClient(url, roleKey);
};

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    const stripe = getStripe();
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Manejar el evento
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const stripe = getStripe();
        const supabaseAdmin = getSupabaseAdmin();

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
        });

        let usuarioId = session.client_reference_id;
        const montoTotal = session.amount_total! / 100;
        const moneda = session.currency?.toUpperCase() || 'MXN';
        const stripeId = session.id;
        const subscriptionId = session.subscription as string;
        const cuponId = session.metadata?.couponId;
        const customerEmail = session.customer_details?.email;

        console.log('--- WEBHOOK DEBUG: SESSION ---', {
            usuarioId,
            customerEmail,
            stripeId,
            subscriptionId,
            mode: session.mode,
            payment_status: session.payment_status
        });

        try {
            // 1. Validar Usuario (y Buscar por Email si falta ID)
            if (!usuarioId && customerEmail) {
                console.log('WARN: No client_reference_id. Searching by email:', customerEmail);
                const { data: userData, error: userError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', customerEmail)
                    .single();

                if (userData && !userError) {
                    usuarioId = userData.id;
                    console.log('SUCCESS: Identified user by email:', usuarioId);
                }
            }

            if (!usuarioId) {
                console.error('ERROR: No identification for user in session');
                return NextResponse.json({ error: 'Missing user identification' }, { status: 400 });
            }

            // 2. Registrar Transacciones individualmente
            console.log('--- INSERTING TRANSACTIONS ---');

            for (const item of lineItems.data) {
                const product = item.price?.product as Stripe.Product;
                const metadata = product.metadata || {};

                console.log('--- ITEM DEBUG ---', {
                    name: product.name,
                    type: metadata.type,
                    tier: metadata.tier,
                    cycle: metadata.cycle
                });

                const vendedorId = metadata.producer_id || metadata.producerId || null;
                const itemId = metadata.type === 'plan' ? 'price_plan_fake' : (metadata.productId || product.id);

                // Insertar en la tabla unificada 'transacciones'
                const { error: txError } = await supabaseAdmin
                    .from('transacciones')
                    .insert({
                        pago_id: stripeId,
                        comprador_id: usuarioId,
                        vendedor_id: vendedorId,
                        producto_id: itemId,
                        tipo_producto: metadata.type || 'beat',
                        nombre_producto: product.name,
                        precio: item.amount_total / 100,
                        moneda: moneda,
                        estado_pago: 'completado',
                        metodo_pago: 'stripe',
                        tipo_licencia: metadata.licenseType || 'basic',
                        metadatos: metadata,
                        cupon_id: cuponId || null
                    });

                if (txError) {
                    console.error('ERROR: Creating transaccion:', txError);
                }

                // --- LÓGICA DE SUSCRIPCIONES (PLANES) ---
                if (metadata.type === 'plan') {
                    const tier = metadata.tier;
                    const cycle = metadata.cycle; // 'monthly' o 'yearly'

                    console.log('--- ACTIVATING PLAN ---', { tier, cycle, usuarioId });

                    // Calcular fecha de expiración
                    const now = new Date();
                    let expiryDate = new Date();
                    if (cycle === 'yearly') {
                        expiryDate.setFullYear(now.getFullYear() + 1);
                    } else {
                        expiryDate.setMonth(now.getMonth() + 1);
                    }

                    // Actualizar el perfil del usuario
                    const { error: profileError } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription_tier: tier,
                            termina_suscripcion: expiryDate.toISOString(),
                            stripe_subscription_id: subscriptionId || `one_time_${stripeId}`,
                            is_founder: true,
                            comenzar_suscripcion: now.toISOString()
                        })
                        .eq('id', usuarioId);

                    if (profileError) {
                        console.error('ERROR: Updating profile subscription:', profileError);
                    } else {
                        console.log('--- PROFILE ACTIVATED SUCCESSFULLY ---');
                    }
                }

                // Actualizar el balance_pendiente del productor si es un beat/servicio
                if (metadata.type !== 'plan' && vendedorId) {
                    const montoItem = item.amount_total / 100;
                    // --- CÁLCULO DE COMISIONES ---
                    const comisionStripe = (montoItem * 0.036 + 3) * 1.16;
                    const comisionTianguis = montoItem * 0.10;
                    const gananciaNeta = montoItem - comisionStripe - comisionTianguis;

                    await supabaseAdmin.rpc('incrementar_balance_productor', {
                        id_productor: vendedorId,
                        monto_ganancia: gananciaNeta > 0 ? gananciaNeta : 0
                    });
                }
            }

            // 4. Incrementar uso de cupón si aplica
            if (cuponId) {
                await supabaseAdmin.rpc('incrementar_uso_cupon', { cupon_uuid: cuponId });
            }

        } catch (dbErr) {
            console.error('Error actualizando DB post-pago:', dbErr);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
