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

        const usuarioId = session.client_reference_id!;
        const montoTotal = session.amount_total! / 100;
        const moneda = session.currency?.toUpperCase() || 'MXN';
        const stripeId = session.id;
        const subscriptionId = session.subscription as string;
        const cuponId = session.metadata?.couponId;

        try {
            // 2. Crear la Orden (Cabecera)
            const { data: orden, error: orderError } = await supabaseAdmin
                .from('ordenes')
                .insert({
                    usuario_id: usuarioId,
                    monto_total: montoTotal,
                    moneda: moneda,
                    estado: 'completado',
                    stripe_id: stripeId,
                    cupon_id: cuponId || null
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 3. Registrar Items y Ventas individuales
            for (const item of lineItems.data) {
                const product = item.price?.product as Stripe.Product;
                const metadata = product.metadata;

                // Insertar en items_orden
                const { data: itemOrden, error: itemError } = await supabaseAdmin
                    .from('items_orden')
                    .insert({
                        orden_id: orden.id,
                        producto_id: metadata.productId,
                        tipo_producto: metadata.type || 'beat',
                        nombre: product.name,
                        precio: item.amount_total / 100,
                        tipo_licencia: metadata.licenseType || 'basic',
                        metadatos: metadata
                    })
                    .select()
                    .single();

                if (itemError) throw itemError;

                // --- LÓGICA DE SUSCRIPCIONES (PLANES) ---
                if (metadata.type === 'plan') {
                    const tier = metadata.tier;
                    const cycle = metadata.cycle; // 'monthly' o 'yearly'

                    // Calcular fecha de expiración
                    const now = new Date();
                    let expiryDate = new Date();
                    if (cycle === 'yearly') {
                        expiryDate.setFullYear(now.getFullYear() + 1);
                    } else {
                        expiryDate.setMonth(now.getMonth() + 1);
                    }

                    // Actualizar el perfil del usuario
                    // Si el usuario compra un plan Pro o Premium por primera vez, le damos el badge de Founder
                    const { error: profileError } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            subscription_tier: tier,
                            termina_suscripcion: expiryDate.toISOString(),
                            stripe_subscription_id: subscriptionId,
                            is_founder: true, // Se convierte en Founder al suscribirse (Early Adopter)
                            comenzar_suscripcion: null
                        })
                        .eq('id', usuarioId);

                    if (profileError) {
                        console.error('Error actualizando suscripción en perfil:', profileError);
                    }
                }

                // Si es un beat, insertamos en la tabla 'ventas' para el dashboard del productor
                if (metadata.type === 'beat') {
                    const montoItem = item.amount_total / 100;
                    const vendedorId = metadata.producer_id || metadata.producerId;

                    // --- CÁLCULO DE COMISIONES (PROXIMADO) ---
                    // Stripe México aprox: (3.6% + $3) + 16% IVA sobre la comisión
                    const comisionStripe = (montoItem * 0.036 + 3) * 1.16;
                    // Tianguis Beats: 10% del total
                    const comisionTianguis = montoItem * 0.10;
                    const gananciaNeta = montoItem - comisionStripe - comisionTianguis;

                    await supabaseAdmin.from('ventas').insert({
                        comprador_id: usuarioId,
                        vendedor_id: vendedorId,
                        beat_id: metadata.productId,
                        monto: montoItem,
                        moneda: moneda,
                        tipo_licencia: metadata.licenseType || 'basic',
                        pago_id: stripeId,
                        metodo_pago: 'stripe',
                        comision_pasarela: comisionStripe,
                        comision_plataforma: comisionTianguis,
                        ganancia_neta: gananciaNeta > 0 ? gananciaNeta : 0
                    });

                    // Actualizar el balance_pendiente del productor
                    if (vendedorId) {
                        await supabaseAdmin.rpc('incrementar_balance_productor', {
                            id_productor: vendedorId,
                            monto_ganancia: gananciaNeta > 0 ? gananciaNeta : 0
                        });
                    }
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
