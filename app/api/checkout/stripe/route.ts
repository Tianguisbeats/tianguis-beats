import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { calculateEarnings } from '@/lib/finance-utils';

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !roleKey) throw new Error('Supabase Admin env vars missing');
    return createClient(url, roleKey);
};

// Inicialización de Stripe
// Ayudante de depuración para diagnóstico
const logDebug = (msg: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[DEPURACION_CHECKOUT] [${timestamp}] ${msg}`);
};

const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not defined');
    return new Stripe(key);
};

export async function POST(req: Request) {
    try {
        const { items, customerEmail, customerId, couponIds, promotionCode, currency = 'mxn' } = await req.json();

        if (!customerId) {
            console.error('ERROR: No customerId (userId) provided to Checkout');
            return NextResponse.json({ error: "Debes iniciar sesión para realizar una compra" }, { status: 400 });
        }

        // --- RESOLVER URL BASE PARA STRIPE (CRÍTICO) ---
        let baseUrl = process.env.NEXT_PUBLIC_URL;
        if (!baseUrl || baseUrl === '' || baseUrl === 'undefined') {
            // Intentar usar Vercel URL
            baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://tianguisbeats.com';
        }
        // Limpiar slash final si existe
        baseUrl = baseUrl.replace(/\/$/, '');

        // 1. Preparar y Validar line_items para Stripe
        const validItems = (items || []).filter((item: any) => {
            const iType = String(item.type || '').toLowerCase().trim();
            const producerId = item.metadata?.productor_id || item.metadata?.producer_id || item.metadata?.seller_id || item.metadata?.producerId;

            if (iType === 'plan') return true;

            if (!producerId) {
                console.warn(`[CHECKOUT] Advertencia: Item '${item.name}' sin productor_id.`);
                if (['beat', 'beats', 'sound_kit', 'soundkit', 'kit', 'service', 'servicio'].includes(iType)) {
                    console.error(`[CHECKOUT] Error Crítico: Item '${item.name}' requiere productor_id.`);
                    return false;
                }
            }
            return true;
        });

        if (validItems.length === 0) {
            return NextResponse.json({
                error: "Tu carrito no contiene productos válidos. Por favor, vacía el carrito y agrega los productos de nuevo."
            }, { status: 400 });
        }

        // --- VALIDACIÓN DE PRECIOS CONTRA BASE DE DATOS ---
        // Nunca confiar en los precios enviados por el cliente. Los precios reales se leen de Supabase.
        const supabaseAdminForPrices = getSupabaseAdmin();

        const BEAT_LICENSE_PRICE_COL: Record<string, string> = {
            'gratis': 'precio_gratis_mxn', 'free': 'precio_gratis_mxn', 'demo': 'precio_gratis_mxn',
            'basica': 'precio_basica_mxn', 'básica': 'precio_basica_mxn', 'basic': 'precio_basica_mxn', 'mp3': 'precio_basica_mxn',
            'pro': 'precio_pro_mxn',
            'premium': 'precio_premium_mxn',
            'exclusiva': 'precio_exclusiva_estandar_mxn',
            'exclusiva estandar': 'precio_exclusiva_estandar_mxn',
            'exclusiva estándar': 'precio_exclusiva_estandar_mxn',
            'exclusiva premium': 'precio_exclusiva_premium_mxn',
        };

        // Recopilar IDs únicos de beats y kits para hacer un solo query en batch
        const beatIds = [...new Set(validItems
            .filter((i: any) => ['beat', 'beats'].includes(String(i.type || '').toLowerCase()))
            .map((i: any) => i.metadata?.beatId || i.metadata?.productId || String(i.id).split('-')[0])
            .filter(Boolean)
        )];

        const kitIds = [...new Set(validItems
            .filter((i: any) => ['sound_kit', 'soundkit', 'kit', 'sound-kit'].includes(String(i.type || '').toLowerCase()))
            .map((i: any) => i.metadata?.kitId || i.metadata?.productId || String(i.id).split('-')[0])
            .filter(Boolean)
        )];

        const serviceIds = [...new Set(validItems
            .filter((i: any) => ['service', 'servicio'].includes(String(i.type || '').toLowerCase()))
            .map((i: any) => i.metadata?.serviceId || i.metadata?.productId || String(i.id).split('-')[0])
            .filter(Boolean)
        )];

        const couponsArray = (couponIds || '').split(',').filter(Boolean);
        const exclusiveOfferIds = validItems
            .filter((i: any) => i.metadata?.isExclusiveOffer)
            .map((i: any) => String(i.id).split('_')[0])
            .filter(Boolean);

        const [beatsDbResult, kitsDbResult, servicesDbResult, couponsDbResult, offersDbResult] = await Promise.all([
            beatIds.length > 0
                ? supabaseAdminForPrices.from('beats').select('id, precio_gratis_mxn, precio_basica_mxn, precio_pro_mxn, precio_premium_mxn, precio_exclusiva_estandar_mxn, precio_exclusiva_premium_mxn').in('id', beatIds)
                : { data: [] },
            kitIds.length > 0
                ? supabaseAdminForPrices.from('kits_sonido').select('id, precio_mxn').in('id', kitIds)
                : { data: [] },
            serviceIds.length > 0
                ? supabaseAdminForPrices.from('servicios').select('id, precio_mxn').in('id', serviceIds)
                : { data: [] },
            couponsArray.length > 0
                ? supabaseAdminForPrices.from('cupones').select('*').in('id', couponsArray)
                : { data: [] },
            exclusiveOfferIds.length > 0
                ? supabaseAdminForPrices.from('ofertas_exclusivas').select('*').in('beat_id', exclusiveOfferIds).eq('comprador_id', customerId).eq('estado', 'aceptada')
                : { data: [] },
        ]);

        const beatPriceMap = new Map((beatsDbResult.data || []).map((b: any) => [b.id, b]));
        const kitPriceMap = new Map((kitsDbResult.data || []).map((k: any) => [k.id, k]));
        const servicePriceMap = new Map((servicesDbResult.data || []).map((s: any) => [s.id, s]));
        const couponMap = new Map((couponsDbResult.data || []).map((c: any) => [c.id, c]));
        const offerMap = new Map((offersDbResult.data || []).map((o: any) => [o.beat_id, o]));

        const getVerifiedPrice = (item: any): number => {
            const iType = String(item.type || '').toLowerCase().trim();
            let basePrice = 0;

            if (iType === 'plan') return item.price;

            // --- 0. CASOS ESPECIALES (GRATIS O NEGOCIADOS) ---
            if (item.metadata?.isBulkFree) return 0;

            if (item.metadata?.isExclusiveOffer) {
                const beatId = String(item.id).split('_')[0];
                const offer = offerMap.get(beatId);
                if (offer) return Number(offer.monto_ofertado);
            }

            // --- 1. DETERMINAR PRECIO BASE DE DB ---
            if (['beat', 'beats'].includes(iType)) {
                const beatId = item.metadata?.beatId || item.metadata?.productId || String(item.id).split('-')[0];
                const beat = beatPriceMap.get(beatId);
                if (!beat) {
                    basePrice = item.price;
                } else {
                    const licenseKey = (item.metadata?.licenseType || item.metadata?.license || '').toLowerCase().trim()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    const priceCol = BEAT_LICENSE_PRICE_COL[licenseKey];
                    basePrice = priceCol ? (beat[priceCol] ?? beat.precio_basica_mxn) : beat.precio_basica_mxn;
                }
            } else if (['sound_kit', 'soundkit', 'kit', 'sound-kit'].includes(iType)) {
                const kitId = item.metadata?.kitId || item.metadata?.productId || String(item.id).split('-')[0];
                const kit = kitPriceMap.get(kitId);
                basePrice = kit?.precio_mxn ?? item.price;
            } else if (['service', 'servicio'].includes(iType)) {
                const serviceId = item.metadata?.serviceId || item.metadata?.productId || String(item.id).split('-')[0];
                const service = servicePriceMap.get(serviceId);
                basePrice = service?.precio_mxn ?? item.price;
            } else {
                basePrice = item.price;
            }

            // --- 2. APLICAR CUPÓN SI EXISTE Y ES VÁLIDO ---
            const couponId = item.appliedCouponId || item.metadata?.appliedCouponId;
            if (couponId) {
                const coupon = couponMap.get(couponId);
                if (coupon && coupon.es_activo) {
                    const discount = coupon.porcentaje_descuento / 100;
                    return basePrice * (1 - discount);
                }
            }

            return basePrice;
        };

        const line_items = validItems.map((item: any) => {
            const cleanName = item.name.split('[')[0].trim();
            const licenseInfo = item.metadata?.license || item.metadata?.licenseType || item.metadata?.tipo_licencia || '';
            const producerId = item.metadata?.productor_id || item.metadata?.producer_id || item.metadata?.seller_id || item.metadata?.producerId || '';
            const discountPercent = item.discountPercent || 0;

            const iTypeRaw = String(item.type || '').toLowerCase().trim();
            let iType = iTypeRaw;
            if (iType === 'beats') iType = 'beat';
            if (iType === 'soundkit' || iType === 'kit' || iType === 'sound-kit') iType = 'sound_kit';
            if (iType === 'servicio') iType = 'service';

            const isSoundKit = iType === 'sound_kit';
            const isService = iType === 'service';
            const isBeat = iType === 'beat';

            let typeLabel = 'Producto';
            if (isBeat) typeLabel = 'Licencia de Beat';
            else if (isSoundKit) typeLabel = 'Sound Kit';
            else if (isService) typeLabel = 'Servicio';
            else if (iType === 'plan') typeLabel = 'Suscripción';

            let itemImage = item.image ? [item.image] : [];

            if (iType === 'plan') {
                const cycle = item.metadata?.cycle === 'yearly' ? 'Anual' : 'Mensual';
                typeLabel = `Suscripción ${cycle}`;

                if (item.metadata?.tier === 'pro') {
                    itemImage = [`${baseUrl}/images/stripe/pro-icon.png`];
                } else if (item.metadata?.tier === 'premium') {
                    itemImage = [`${baseUrl}/images/stripe/premium-icon.png`];
                }
            }

            const discountText = discountPercent > 0 ? ` • Descuento Aplicado: -${discountPercent}%` : '';
            const cycleRaw = String(item.metadata?.cycle || '').toLowerCase().trim() || 'mensual';
            const suffix = iType === 'plan' ? (cycleRaw === 'yearly' ? ' (Anual)' : ' (Mensual)') : '';
            const productName = (item.name || `Producto ${item.id}`) + suffix;

            const description = licenseInfo
                ? `${typeLabel}: ${licenseInfo.toUpperCase()}${discountText}`
                : `${typeLabel}${discountText}`;

            const STRIPE_PRODUCTS: Record<string, string> = {
                'pro': 'prod_U9hq8ifcXWz0O3',
                'premium': 'prod_U9g82c9yHCvLQO',
            };

            const STRIPE_PRICE_IDS: Record<string, string> = {
                'pro_mensual': 'price_1TAzIAH5NxxqqE4kYHQgnDil',
                'pro_anual': 'price_1TB0DFH5NxxqqE4kY51i7dkp',
                'premium_mensual': 'price_1TAzIDH5NxxqqE4k339iqiO5',
                'premium_anual': 'price_1TB057H5NxxqqE4kNxZoU8uY',
            };

            const tierRaw = String(item.metadata?.tier || '').toLowerCase().trim();
            const planKey = `${tierRaw}_${cycleRaw === 'yearly' ? 'anual' : 'mensual'}`;
            const fixedPriceId = iType === 'plan' ? STRIPE_PRICE_IDS[planKey] : null;
            const officialProductId = iType === 'plan' ? STRIPE_PRODUCTS[tierRaw] : null;

            logDebug(`[CHECKOUT] Item: ${productName} | Tipo: ${iType} | ClavePlan: ${planKey} | Product: ${officialProductId}`);

            const priceData: any = {
                currency: currency,
                product_data: officialProductId ? undefined : {
                    name: productName,
                    description: description,
                    images: itemImage,
                    metadata: {
                        productId: item.id || '',
                        type: iType,
                        tier: tierRaw,
                        cycle: cycleRaw,
                        licenseType: licenseInfo,
                        productor_id: producerId,
                        userId: customerId || '',
                        portada_url: item.metadata?.portada_url || (itemImage ? itemImage[0] : ''),
                        discountPercent: item.discountPercent || 0,
                        product_name: productName,
                    }
                },
                product: officialProductId || undefined,
                unit_amount: Math.round(getVerifiedPrice(item) * 100),
            };

            if (iType === 'plan') {
                priceData.recurring = {
                    interval: item.metadata?.cycle === 'yearly' ? 'year' : 'month',
                    interval_count: 1
                };
            }

            if (fixedPriceId) {
                return { price: fixedPriceId, quantity: 1 };
            }

            return { price_data: priceData, quantity: 1 };
        });

        const typesInOrder = new Set(validItems.map((item: any) => {
            const t = String(item.type || '').toLowerCase().trim();
            if (t === 'beats') return 'beat';
            if (['soundkit', 'kit', 'sound-kit'].includes(t)) return 'sound_kit';
            return t;
        }));
        const hasPlan = typesInOrder.has('plan');
        const globalOrderType = typesInOrder.size === 1 ? Array.from(typesInOrder)[0] : 'mixed';

        const stripe = getStripe();

        let stripeCustomerId: string | undefined = undefined;
        let invalidCustomerIds: string[] = [];

        // 1. Intentar obtener el ID desde la base de datos primero (Más confiable)
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('perfiles')
            .select('stripe_cliente_id, correo')
            .eq('id', customerId)
            .single();

        if (profile?.stripe_cliente_id) {
            try {
                const customer = await stripe.customers.retrieve(profile.stripe_cliente_id);
                if (customer && !(customer as any).deleted) {
                    stripeCustomerId = customer.id;
                    logDebug(`[CHECKOUT] Cliente Stripe recuperado de DB: ${stripeCustomerId}`);
                } else {
                    invalidCustomerIds.push(profile.stripe_cliente_id);
                }
            } catch (err) {
                logDebug(`[CHECKOUT] ID de DB inválido: ${profile.stripe_cliente_id}`);
                invalidCustomerIds.push(profile.stripe_cliente_id);
            }
        }

        // 2. Si no hay ID o era inválido, buscar por email
        if (!stripeCustomerId && customerEmail) {
            try {
                const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
                if (existingCustomers.data && existingCustomers.data.length > 0) {
                    const foundId = existingCustomers.data[0].id;
                    // IMPORTANTE: Si el ID encontrado por email fue el que ya falló (o es el que reportó el usuario), lo ignoramos
                    if (!invalidCustomerIds.includes(foundId)) {
                        stripeCustomerId = foundId;
                        logDebug(`[CHECKOUT] Cliente Stripe encontrado por email: ${stripeCustomerId}`);
                    } else {
                        logDebug(`[CHECKOUT] Ignorando ID encontrado por email por ser inválido o reportado: ${foundId}`);
                    }
                }

                if (!stripeCustomerId) {
                    // 3. Crear nuevo si no hay uno válido
                    const newCustomer = await stripe.customers.create({
                        email: customerEmail,
                        metadata: { userId: customerId }
                    });
                    stripeCustomerId = newCustomer.id;
                    logDebug(`[CHECKOUT] Nuevo Cliente Stripe creado: ${stripeCustomerId}`);
                }

                // Sincronizar en la DB
                await supabaseAdmin
                    .from('perfiles')
                    .update({ stripe_cliente_id: stripeCustomerId })
                    .eq('id', customerId);
            } catch (err) {
                console.error("Error crítico resolviendo Cliente de Stripe:", err);
            }
        }

        const sessionConfig: any = {
            payment_method_types: hasPlan ? ['card'] : ['card', 'oxxo'],
            line_items,
            mode: hasPlan ? 'subscription' : 'payment',
            ...(promotionCode
                ? {
                    discounts: [
                        promotionCode.startsWith('promo_')
                            ? { promotion_code: promotionCode }
                            : { coupon: promotionCode }
                    ]
                }
                : { allow_promotion_codes: true }
            ),
            locale: 'auto',
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/cart`,
            client_reference_id: customerId,
            customer: stripeCustomerId,
            ...(hasPlan ? { payment_method_collection: 'if_required' } : {}),
            ...(hasPlan ? {
                subscription_data: {
                    metadata: { userId: customerId }
                }
            } : {}),
            metadata: {
                type: globalOrderType,
                tier: validItems.find((i: any) => String(i.type).toLowerCase().includes('plan'))?.metadata?.tier || '',
                cycle: validItems.find((i: any) => String(i.type).toLowerCase().includes('plan'))?.metadata?.cycle || '',
                couponIds: couponIds || '',
                isConnect: 'false',
                userId: customerId,
                ip_compra: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
            },
            billing_address_collection: 'auto'
        };

        // Si tenemos customer ID, NO debemos pasar customer_email
        if (!stripeCustomerId) {
            sessionConfig.customer_email = customerEmail;
        }

        if (!hasPlan && validItems.length > 0) {
            const firstProducerId = validItems[0].metadata?.productor_id || validItems[0].metadata?.producer_id || validItems[0].metadata?.seller_id || validItems[0].metadata?.producerId;
            const allSameProducer = validItems.every((item: any) => {
                const pId = item.metadata?.productor_id || item.metadata?.producer_id || item.metadata?.seller_id || item.metadata?.producerId;
                return pId === firstProducerId;
            });

            if (allSameProducer && firstProducerId) {
                const [sellerRes, buyerRes] = await Promise.all([
                    supabaseAdmin.from('perfiles').select('stripe_connect_id, stripe_connect_onboarded, nivel_suscripcion').eq('id', firstProducerId).single(),
                    supabaseAdmin.from('perfiles').select('nivel_suscripcion').eq('id', customerId).single()
                ]);

                const sellerProfile = sellerRes.data;
                const buyerPlan = (buyerRes.data?.nivel_suscripcion || 'free').toLowerCase().trim();

                if (sellerProfile?.stripe_connect_id && sellerProfile?.stripe_connect_onboarded) {
                    const totalAmount = validItems.reduce((acc: number, item: any) => acc + (item.price || 0), 0);
                    const sellerPlan = (sellerProfile.nivel_suscripcion || 'free').trim().toLowerCase();

                    let applicationFeeAmount = 0;
                    const isSellerPaid = ['pro', 'premium', 'tianguis pro', 'tianguis premium'].includes(sellerPlan);
                    if (!isSellerPaid) applicationFeeAmount = Math.round(totalAmount * 0.15 * 100);

                    sessionConfig.payment_intent_data = {
                        application_fee_amount: applicationFeeAmount,
                        on_behalf_of: sellerProfile.stripe_connect_id,
                        transfer_data: {
                            destination: sellerProfile.stripe_connect_id,
                        },
                    };

                    sessionConfig.metadata.isConnect = 'true';
                    sessionConfig.metadata.sellerPlan = sellerPlan;
                    sessionConfig.metadata.applicationFee = applicationFeeAmount.toString();
                    sessionConfig.metadata.sellerStripeAccount = sellerProfile.stripe_connect_id;

                    if (validItems.length === 1) {
                        sessionConfig.metadata.productId = validItems[0].id || '';
                        sessionConfig.metadata.productor_id = firstProducerId;
                    }
                }
            }
        }

        if (!hasPlan) sessionConfig.submit_type = 'pay';

        let session;
        session = await stripe.checkout.sessions.create(sessionConfig);

        return NextResponse.json({ id: session.id, url: session.url });
    } catch (err: any) {
        console.error('--- ERROR_STRIPE_CHECKOUT ---', err.message);
        return NextResponse.json(
            { error: "Hubo un error al procesar tu pago. Por favor, intenta de nuevo.", rawError: err.message },
            { status: 500 }
        );
    }
}
