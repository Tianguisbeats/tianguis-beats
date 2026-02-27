import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { renderContractToBuffer, ContractData } from '@/lib/pdfCustomRenderer';
import { generateFriendlyOrderId } from '@/lib/order-utils';

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

        // --- GENERACIÓN DE ID DE PEDIDO AMIGABLE ---
        const ordenPedido = generateFriendlyOrderId(lineItems.data, session.payment_intent as string || session.id);
        console.log('--- GENERATED FRIENDLY ORDER ID ---', ordenPedido);

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
                    .from('perfiles')
                    .select('id, nombre_usuario')
                    .eq('correo', customerEmail)
                    .single();

                if (userData && !userError) {
                    usuarioId = userData.id;
                    (session.metadata as any).nombre_usuario = userData.nombre_usuario;
                    console.log('SUCCESS: Identified user by email:', usuarioId);
                }
            } else if (usuarioId) {
                // Si tenemos el ID pero no el username en metadata, lo buscamos
                const { data: userData } = await supabaseAdmin
                    .from('perfiles')
                    .select('nombre_usuario')
                    .eq('id', usuarioId)
                    .single();
                if (userData) {
                    (session.metadata as any).nombre_usuario = userData.nombre_usuario;
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

                const vendedorId = metadata.productor_id || metadata.producer_id || metadata.seller_id || metadata.producerId || null;
                const itemId = metadata.type === 'plan' ? 'price_plan_fake' : (metadata.productId || product.id);

                console.log(`--- PROCESSING ITEM: ${product.name} (Type: ${metadata.type}) ---`);

                let pdfUrl = null;

                // --- GENERACIÓN DE CONTRATO PDF AVANZADO ---
                try {
                    if (metadata.type === 'beat' || metadata.type === 'soundkit') {
                        console.log('--- STARTING PDF GENERATION ---');
                        const sellerId = metadata.producerId || metadata.productor_id || metadata.seller_id;
                        let templateOverrides = {};

                        if (sellerId) {
                            const normalizedType = (metadata.licenseType || 'basica')
                                .toLowerCase()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "");

                            const { data: templateData } = await supabaseAdmin
                                .from('licencias')
                                .select('*, incluir_clausulas_pro')
                                .eq('productor_id', sellerId)
                                .eq('tipo', normalizedType)
                                .single();

                            if (templateData) {
                                templateOverrides = {
                                    isCustomText: templateData.usar_texto_personalizado,
                                    customText: templateData.texto_legal,
                                    incluir_clausulas_pro: templateData.incluir_clausulas_pro,
                                    limits: {
                                        streams: templateData.streams_limite,
                                        copies: templateData.copias_limite,
                                        videos: templateData.videos_limite,
                                        radio: templateData.radio_limite
                                    }
                                };
                            }
                        }

                        const { data: prodProfile } = await supabaseAdmin
                            .from('perfiles')
                            .select('nombre_artistico, correo')
                            .eq('id', sellerId)
                            .single();

                        const contractData: ContractData = {
                            orderId: stripeId,
                            transactionDate: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
                            licenseType: metadata.licenseType || 'basica',
                            productName: product.name,
                            price: (item.amount_total / 100).toString(),
                            producerName: prodProfile?.nombre_artistico || 'Productor Tianguis',
                            producerEmail: prodProfile?.correo || '',
                            buyerName: session.customer_details?.name || 'Cliente Verificado',
                            buyerEmail: customerEmail || '',
                            isCustomText: false,
                            incluir_clausulas_pro: true,
                            ...templateOverrides
                        };

                        const pdfBuffer = await renderContractToBuffer(contractData);
                        const safeFileName = `Licencia_${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_${stripeId.slice(-8)}.pdf`;
                        const folderName = (session.metadata as any).nombre_usuario || usuarioId;
                        const uploadPath = `${folderName}/${safeFileName}`;

                        const { data: uploadData, error: uploadError } = await supabaseAdmin
                            .storage
                            .from('licencias_generadas')
                            .upload(uploadPath, pdfBuffer, {
                                contentType: 'application/pdf',
                                upsert: true
                            });

                        if (!uploadError) {
                            const { data: publicUrlData } = supabaseAdmin.storage.from('licencias_generadas').getPublicUrl(uploadPath);
                            pdfUrl = publicUrlData.publicUrl;
                        } else {
                            console.error('PDF Upload Error (Non-blocking):', uploadError);
                        }
                    }
                } catch (pdfErr) {
                    console.error('CRITICAL PDF ERROR (Non-blocking):', pdfErr);
                }

                // Insertar en la tabla unificada 'transacciones'
                console.log('--- INSERTING TO DB ---', {
                    pago_id: stripeId,
                    comprador_id: usuarioId,
                    vendedor_id: vendedorId,
                    producto_id: itemId
                });

                const { data: insertedTx, error: txError } = await supabaseAdmin
                    .from('transacciones')
                    .insert({
                        pago_id: stripeId,
                        comprador_id: usuarioId,
                        vendedor_id: vendedorId,
                        producto_id: itemId,
                        tipo_producto: metadata.type || 'beat',
                        nombre_producto: product.name,
                        precio_total: item.amount_total / 100,
                        moneda: moneda,
                        estado_pago: 'completado',
                        metodo_pago: 'stripe',
                        tipo_licencia: metadata.type === 'plan' ? metadata.tier : (metadata.licenseType || 'basica'),
                        metadatos: { ...metadata, contract_pdf_url: pdfUrl },
                        cupon_id: cuponId || null
                    })
                    .select()
                    .single();

                if (txError) {
                    console.error('DB INSERTION FAILED:', txError);
                } else {
                    console.log('DB INSERTION SUCCESS:', insertedTx.id);
                }

                // --- LÓGICA DE SUSCRIPCIONES (PLANES) ---
                if (metadata.type === 'plan') {
                    const tier = metadata.tier;
                    const cycle = metadata.cycle; // 'monthly' o 'yearly'
                    const isSequential = metadata.sequential === 'true';

                    console.log('--- ACTIVATING PLAN ---', { tier, cycle, usuarioId, isSequential });

                    // 1. Obtener vencimiento actual
                    const { data: profileData } = await supabaseAdmin
                        .from('perfiles')
                        .select('fecha_termino_suscripcion, nivel_suscripcion, es_fundador')
                        .eq('id', usuarioId)
                        .single();

                    const currentExpiry = profileData?.fecha_termino_suscripcion ? new Date(profileData.fecha_termino_suscripcion) : null;
                    const currentTier = profileData?.nivel_suscripcion || 'free';
                    const isSameTier = currentTier === tier;

                    let baseDate = new Date();
                    let extraDaysFromProration = 0;

                    // Si ya tiene una suscripción activa
                    if (currentExpiry && currentExpiry > new Date()) {
                        if (isSameTier) {
                            baseDate = currentExpiry;
                            console.log('SUMMING TIME: Starting from existing expiry (Same Tier)', baseDate.toISOString());
                        } else if (currentTier === 'pro' && tier === 'premium') {
                            // --- LÓGICA DE PRORRATEO: Pro -> Premium ---
                            // Pro = $149/mes, Premium = $349/mes. Relación de valor: 149 / 349 = ~0.427
                            // Cada día restante de Pro equivale a ~0.427 días de Premium
                            const remainingProMs = currentExpiry.getTime() - new Date().getTime();
                            const remainingProDays = remainingProMs / (1000 * 60 * 60 * 24);
                            extraDaysFromProration = Math.floor(remainingProDays * 0.4269);

                            console.log(`PRORATION APPLIED: Converting ${Math.round(remainingProDays)} Pro days into ${extraDaysFromProration} Premium days.`);
                        } else {
                            console.log('DOWNGRADE or FREE->TIER: Starting from TODAY (Tier change)', baseDate.toISOString());
                        }
                    }

                    let expiryDate = new Date(baseDate);
                    // Sumar el tiempo comprado hoy
                    if (cycle === 'yearly') {
                        expiryDate.setFullYear(baseDate.getFullYear() + 1);
                    } else {
                        expiryDate.setMonth(baseDate.getMonth() + 1);
                    }

                    // Sumar el tiempo prorrateado (si aplica)
                    if (extraDaysFromProration > 0) {
                        expiryDate.setDate(expiryDate.getDate() + extraDaysFromProration);
                    }

                    // Actualizar el perfil del usuario
                    const updates: any = {
                        fecha_termino_suscripcion: expiryDate.toISOString(),
                        stripe_suscripcion_id: subscriptionId || `one_time_${stripeId}`,
                    };

                    // Si es secuencial, NO cambiamos el tier actual todavía, guardamos el objetivo
                    if (isSequential && !isSameTier) {
                        updates.fecha_inicio_suscripcion = tier;
                        console.log('SEQUENTIAL UPGRADE: Target tier saved', tier);
                    } else {
                        updates.nivel_suscripcion = tier;
                        updates.fecha_inicio_suscripcion = null; // Limpiar cambios programados si ya se aplicó un plan directo
                    }

                    const { error: profileError } = await supabaseAdmin
                        .from('perfiles')
                        .update(updates)
                        .eq('id', usuarioId);

                    if (profileError) {
                        console.error('ERROR: Updating profile subscription:', profileError);
                    } else {
                        console.log('--- PROFILE UPDATED SUCCESSFULLY ---', { newExpiry: expiryDate.toISOString(), tierApplied: updates.nivel_suscripcion || 'sequential_pending' });
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

                    // 2. Incrementar contador de ventas del producto específico
                    const tableMap: Record<string, string> = {
                        'beat': 'beats',
                        'soundkit': 'kits_sonido',
                        'sound_kit': 'kits_sonido',
                        'service': 'servicios'
                    };
                    const targetTable = tableMap[metadata.type];
                    if (targetTable && itemId) {
                        console.log(`--- UPDATING SALES COUNT: ${targetTable} / ${itemId} ---`);
                        await supabaseAdmin.rpc('incrementar_conteo_ventas', {
                            tabla_target: targetTable,
                            id_item: itemId
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
