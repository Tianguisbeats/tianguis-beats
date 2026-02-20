import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-11' as any, // Siguiendo la versión instalada o la más reciente compatible
});

export async function POST(req: Request) {
    try {
        const { items, customerEmail, customerId, couponId } = await req.json();

        // 1. Preparar line_items para Stripe
        const line_items = items.map((item: any) => ({
            price_data: {
                currency: 'mxn',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                    metadata: {
                        productId: item.id,
                        type: item.type,
                        ...item.metadata
                    }
                },
                unit_amount: Math.round(item.price * 100), // En centavos
            },
            quantity: 1,
        }));

        // 2. Crear sesión de Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
            customer_email: customerEmail,
            client_reference_id: customerId,
            metadata: {
                couponId: couponId || '',
            }
        });

        return NextResponse.json({ id: session.id, url: session.url });
    } catch (err: any) {
        console.error('Stripe Checkout Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
