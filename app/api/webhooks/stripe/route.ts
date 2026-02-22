import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inicialización perezosa para evitar errores en Build si faltan variables de entorno
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not defined');
    return new Stripe(key, { apiVersion: '2025-02-11' as any });
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
        const stripeId = session.id;
        const cuponId = session.metadata?.couponId;

        try {
            // 2. Crear la Orden (Cabecera)
            const { data: orden, error: orderError } = await supabaseAdmin
                .from('ordenes')
                .insert({
                    usuario_id: usuarioId,
                    monto_total: montoTotal,
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

                // Si es un beat, insertamos en la tabla 'ventas' para el dashboard del productor
                if (metadata.type === 'beat') {
                    await supabaseAdmin.from('ventas').insert({
                        comprador_id: usuarioId,
                        vendedor_id: metadata.producer_id || metadata.producerId,
                        beat_id: metadata.productId,
                        monto: item.amount_total / 100,
                        tipo_licencia: metadata.licenseType || 'basic',
                        pago_id: stripeId,
                        metodo_pago: 'stripe'
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
