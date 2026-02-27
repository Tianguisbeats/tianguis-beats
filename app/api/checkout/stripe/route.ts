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

        if (!customerId) {
            console.error('ERROR: No customerId (userId) provided to Checkout');
            return NextResponse.json({ error: "Debes iniciar sesión para realizar una compra" }, { status: 400 });
        }

        // 1. Preparar y Validar line_items para Stripe
        const line_items = items.map((item: any) => {
            // Limpiar el nombre para que sea Premium (Ej: "Girl" en vez de "girl [MP3]")
            const cleanName = item.name.split('[')[0].trim();
            const licenseInfo = item.metadata?.license || item.metadata?.licenseType || '';
            const producerId = item.metadata?.productor_id || item.metadata?.producer_id || item.metadata?.seller_id || item.metadata?.producerId;

            if ((item.type === 'beat' || item.type === 'service' || item.type === 'sound_kit') && !producerId) {
                console.error(`ERROR METADATA VACÍA: El item ${item.name} no tiene ID de productor asignado.`);
                throw new Error("Se detectaron metadatos corruptos en tu carrito de una versión anterior de la página. Por favor, VE A TU CARRITO, PRESIONA EL BOTÓN DE ELIMINAR O VACIAR CARRITO, e intenta realizar la compra de nuevo.");
            }

            // Determinar etiqueta de tipo y icono para planes
            let typeLabel = item.type === 'plan' ? 'Suscripción' : (item.type === 'beat' ? 'Licencia de Beat' : 'Producto');
            let itemImage = item.image ? [item.image] : [];

            if (item.type === 'plan') {
                const cycle = item.metadata?.cycle === 'yearly' ? 'Anual' : 'Mensual';
                typeLabel = `Suscripción ${cycle}`;

                // Iconos específicos (solo para Stripe)
                if (item.metadata?.tier === 'pro') {
                    itemImage = [`${process.env.NEXT_PUBLIC_URL}/images/stripe/pro-icon.png`];
                } else if (item.metadata?.tier === 'premium') {
                    itemImage = [`${process.env.NEXT_PUBLIC_URL}/images/stripe/premium-icon.png`];
                }
            }

            return {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: cleanName,
                        description: licenseInfo ? `${typeLabel}: ${licenseInfo.toUpperCase()}` : typeLabel,
                        images: itemImage,
                        metadata: {
                            productId: item.id || '',
                            type: item.type || '',
                            tier: item.metadata?.tier || '',
                            cycle: item.metadata?.cycle || '',
                            licenseType: item.metadata?.licenseType || '',
                            productor_id: item.metadata?.productor_id || item.metadata?.producer_id || item.metadata?.seller_id || item.metadata?.producerId || '',
                            archivo_muestra_url: item.metadata?.archivo_muestra_url || item.metadata?.mp3_url || '',
                            archivo_wav_url: item.metadata?.archivo_wav_url || item.metadata?.wav_url || '',
                            archivo_stems_url: item.metadata?.archivo_stems_url || item.metadata?.stems_url || '',
                            file_url: item.metadata?.file_url || ''
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
            mode: 'payment',
            allow_promotion_codes: false,
            locale: 'es',
            success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
            client_reference_id: customerId,
            metadata: {
                couponId: couponId || '',
            },
            billing_address_collection: 'auto',
            submit_type: 'pay',
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
