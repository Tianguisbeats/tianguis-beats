import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Inicialización perezosa de Stripe para evitar errores en tiempo de compilación si falta la API Key
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    return new Stripe(key);
};

export async function POST(req: Request) {
    try {
        const { items, customerEmail, customerId, couponId, currency = 'mxn' } = await req.json();

        // 1. Preparar line_items para Stripe
        const line_items = items.map((item: any) => {
            // Limpiar el nombre para que sea Premium (Ej: "Girl" en vez de "girl [MP3]")
            const cleanName = item.name.split('[')[0].trim();
            const licenseInfo = item.metadata?.license || item.metadata?.licenseType || '';
            const typeLabel = item.type === 'plan' ? 'Suscripción' : (item.type === 'beat' ? 'Licencia de Beat' : 'Producto');

            return {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: cleanName,
                        description: licenseInfo ? `${typeLabel}: ${licenseInfo.toUpperCase()}` : typeLabel,
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
            };
        });

        // 2. Determinar el modo de la sesión (si hay un plan, usamos 'subscription')
        const hasPlan = items.some((item: any) => item.type === 'plan');

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: hasPlan ? 'subscription' : 'payment',
            allow_promotion_codes: false,
            locale: 'es',
            success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
            client_reference_id: customerId,
            metadata: {
                couponId: couponId || '',
            },
            billing_address_collection: 'auto',
            submit_type: hasPlan ? undefined : 'pay', // 'pay' no es compatible con el modo 'subscription'
        });

        return NextResponse.json({ id: session.id, url: session.url });
    } catch (err: any) {
        console.error('--- STRIPE_CHECKOUT_ERROR_START ---');
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        console.error('Config:', {
            hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
            publicUrl: process.env.NEXT_PUBLIC_URL,
            nodeEnv: process.env.NODE_ENV
        });
        console.error('--- STRIPE_CHECKOUT_ERROR_END ---');

        return NextResponse.json(
            { error: err.message || "Error interno en el servidor de pagos" },
            { status: 500 }
        );
    }
}
