import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-11' as any,
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Se requiere Service Role para saltar RLS en webhooks
);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

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

        // 1. Recuperar line items con metadatos extendidos
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
        });

        const userId = session.client_reference_id!;
        const totalAmount = session.amount_total! / 100;
        const paymentIntentId = session.payment_intent as string;
        const couponId = session.metadata?.couponId;

        try {
            // 2. Crear la Orden
            const { data: order, error: orderError } = await supabaseAdmin
                .from('orders')
                .insert({
                    user_id: userId,
                    total_amount: totalAmount,
                    status: 'completed',
                    payment_intent_id: paymentIntentId,
                    coupon_id: couponId || null
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 3. Registrar Items y Ventas individuales
            for (const item of lineItems.data) {
                const product = item.price?.product as Stripe.Product;
                const metadata = product.metadata;

                // Insertar en order_items
                const { data: orderItem, error: itemError } = await supabaseAdmin
                    .from('order_items')
                    .insert({
                        order_id: order.id,
                        product_id: metadata.productId,
                        product_type: metadata.type || 'beat',
                        name: product.name,
                        price: item.amount_total / 100,
                        license_type: metadata.licenseType || 'basic',
                        metadata: metadata
                    })
                    .select()
                    .single();

                if (itemError) throw itemError;

                // Si es un beat, insertamos en la tabla legacy 'sales' para el dashboard del productor
                if (metadata.type === 'beat') {
                    await supabaseAdmin.from('sales').insert({
                        buyer_id: userId,
                        seller_id: metadata.producer_id || metadata.producerId,
                        beat_id: metadata.productId,
                        amount: item.amount_total / 100,
                        license_type: metadata.licenseType || 'basic',
                        payment_id: paymentIntentId,
                        payment_method: 'stripe'
                    });
                }
            }

            // 4. Incrementar uso de cupón si aplica
            if (couponId) {
                await supabaseAdmin.rpc('increment_coupon_usage', { coupon_uuid: couponId });
            }

        } catch (dbErr) {
            console.error('Error actualizando DB post-pago:', dbErr);
            // Stripe reintentará si devolvemos un error
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
