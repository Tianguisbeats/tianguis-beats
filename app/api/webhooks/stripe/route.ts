import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { renderContractToBuffer, ContractData } from '@/lib/PDFgenerarContratos';
import { generateFriendlyOrderId } from '@/lib/order-utils';
import { obtenerSupabaseAdmin } from '@/lib/supabase-admin';
import {
    obtenerStripe,
    MAPA_PRECIO_A_TIER,
    PRECIOS_ANUALES,
    detectarTierDesdeStripe,
} from '@/lib/stripe-config';

const logWebhook = (msg: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[WEBHOOK_STRIPE] [${timestamp}] ${msg}`);
};

/** Solo devuelve el string si es un UUID válido (36 chars con guiones), de lo contrario null */
const toUuidOrNull = (val: string | null | undefined): string | null => {
    if (!val) return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val.trim()) ? val.trim() : null;
};

/** Convierte a number seguro para columnas numeric */
const toNumericOrZero = (val: any): number => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
};

// --- AYUDANTE: SINCRONIZACIÓN DE PERFIL Y SUSCRIPCIÓN ---
async function syncUserProfileSubscription(
    supabaseAdmin: any,
    stripe: Stripe,
    usuarioId: string,
    subscriptionId: string,
    fallbackTier?: string,
    providedInvoice?: any
) {
    logWebhook(`[SYNC] Iniciando sincronización para usuario ${usuarioId} | Sub: ${subscriptionId}`);
    try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: [
                'latest_invoice.payment_intent', 
                'latest_invoice.lines', 
                'latest_invoice.discounts.data.coupon',
                'latest_invoice.discount.coupon',
                'items.data.price.product',
                'discounts.data.coupon',
                'discount.coupon'
            ]
        }) as any;
        
        // NIVEL 1: Obtener la factura de forma robusta
        let lastInvoice = providedInvoice || sub.latest_invoice;
        
        // RE-RETRIEVE: Si es un ID string O un objeto pero no tiene descuentos expandidos (común en webhooks directos)
        const needsExpansion = typeof lastInvoice === 'string' || 
                              (lastInvoice && typeof lastInvoice === 'object' && 
                               Array.isArray(lastInvoice.discounts) && typeof lastInvoice.discounts[0] === 'string');

        if (needsExpansion && lastInvoice) {
            const invoiceId = typeof lastInvoice === 'string' ? lastInvoice : lastInvoice.id;
            logWebhook(`[SYNC INFO] Re-recuperando factura ${invoiceId} para garantizar expansiones...`);
            lastInvoice = await stripe.invoices.retrieve(invoiceId, {
                expand: ['discounts.data.coupon', 'discount.coupon', 'lines']
            });
        }
        
        let furthestExpiry = sub.current_period_end;
        
        // NIVEL 2: Escaneo de líneas de factura (Más preciso en upgrades)
        if (lastInvoice?.lines?.data) {
            for (const line of lastInvoice.lines.data) {
                // Si la línea tiene un fin de periodo más lejano, lo tomamos
                const lineEnd = line.period?.end;
                if (lineEnd && lineEnd > furthestExpiry) {
                    furthestExpiry = lineEnd;
                }
            }
        }

        // NIVEL 3: Blindaje de Ciclo (Si es anual y la fecha sigue siendo corta, forzar el año)
        const activePlan = sub.items?.data[0]?.plan;
        const activePriceId = activePlan?.id || sub.items?.data[0]?.price?.id;
        
        const isAnnualPlan = activePlan?.interval === 'year' ||
                           activePlan?.interval === 'yearly' ||
                           PRECIOS_ANUALES.has(activePriceId);

        // Validar que el usuario existe antes de proceder
        const { data: currentProfile, error: profileCheckError } = await supabaseAdmin
            .from('perfiles')
            .select('id, nivel_suscripcion, stripe_cliente_id')
            .eq('id', usuarioId)
            .maybeSingle();

        if (profileCheckError) throw new Error(`Error verificando existencia del perfil: ${profileCheckError.message}`);
        if (!currentProfile) {
            logWebhook(`[SYNC CRÍTICO] Perfil de usuario NO ENCONTRADO para id: ${usuarioId}`);
            return false;
        }

        // Blindaje: si el perfil ya está en Premium y no hay fallbackTier explícito,
        // se preserva Premium para evitar downgrade accidental por glitch de detección.
        let detectedTier = 'pro';
        if (currentProfile.nivel_suscripcion === 'premium' && !fallbackTier) {
            logWebhook(`[SYNC INFO] Preservando tier Premium (sin fallback explícito).`);
            detectedTier = 'premium';
        }

        let expiryDate = new Date(furthestExpiry * 1000);
        const daysToExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (isAnnualPlan && daysToExpiry < 200) {
            logWebhook(`[SYNC ALERTA] Plan anual detectado con vigencia corta (${daysToExpiry} días). Forzando expiración a +1 año.`);
            expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        const expiryDateStr = expiryDate.toISOString();

        logWebhook(`[SYNC DEBUG] Usuario ${usuarioId} nivel actual: ${currentProfile.nivel_suscripcion}`);

        const productId = sub.items?.data[0]?.price?.product?.id || sub.items?.data[0]?.price?.product || sub.plan?.product;
        const priceId = sub.items?.data[0]?.price?.id || sub.plan?.id;
        const productMetadata = (sub.items?.data[0]?.price?.product as any)?.metadata || {};
        
        // Detección de tier usando los mapas centralizados (lib/stripe-config).
        // Iteramos todos los ítems de la suscripción y nos quedamos con el más alto.
        const allItems = sub.items?.data || [];

        for (const item of allItems) {
            const prId = item.price?.id || '';
            const pName = (item.price?.product as any)?.name || '';

            const tierItem = detectarTierDesdeStripe({ priceId: prId, productName: pName });
            if (tierItem === 'premium') {
                logWebhook(`[SYNC DETECT] Plan PREMIUM encontrado en la suscripción.`);
                detectedTier = 'premium';
                break;
            }
            if (tierItem === 'pro') {
                logWebhook(`[SYNC DETECT] Plan PRO encontrado en la suscripción.`);
                detectedTier = 'pro';
            }
        }

        const effectiveTier = fallbackTier || detectedTier || productMetadata.tier?.toLowerCase() || 'pro';

        let effectiveExpiry = new Date(expiryDate);
        let effectiveStart = new Date(sub.current_period_start * 1000);
        
        // CORRECCIÓN TRIAL: Si está en periodo de prueba o la factura es de $0
        const invoiceTotal = typeof lastInvoice?.total === 'number' ? lastInvoice.total : 999;
        const invoiceDue = typeof lastInvoice?.amount_due === 'number' ? lastInvoice.amount_due : 999;
        
        // Búsqueda profunda de cupón (Factura -> Suscripción)
        // Búsqueda profunda de cupón (Suscripción -> Factura -> Metadatos)
        const couponData = (sub.discount && typeof sub.discount === 'object' ? (sub.discount as any).coupon : null) || 
                          (sub.discounts?.data?.[0]?.coupon) ||
                          (lastInvoice?.discount?.coupon) || 
                          (lastInvoice?.discounts?.data?.[0]?.coupon);

        // MEJORA: Detección de prueba (si tiene trial, si la factura es $0, o si tiene un CUPÓN activo)
        // Pero ATENCIÓN: Si el pago fue realizado (> $0), ya no es prueba.
        const amountPaid = typeof lastInvoice?.amount_paid === 'number' ? lastInvoice.amount_paid : 0;
        const isTrial = (sub.status === 'trialing' || invoiceDue === 0 || invoiceTotal === 0 || !!couponData) && amountPaid === 0;
        const isGift = ((couponData && (couponData as any).percent_off === 100) || (invoiceTotal === 0 && invoiceDue === 0)) && amountPaid === 0;

        logWebhook(`[SYNC DEBUG SCAN] 
            - sub.status: ${sub.status}
            - lastInvoiceID: ${lastInvoice?.id || 'N/A'}
            - invoiceDue: ${invoiceDue}
            - invoiceTotal: ${invoiceTotal}
            - hasCouponData: ${!!couponData}
            - couponID: ${couponData?.id || 'N/A'}
            - isTrial Result: ${isTrial}
            - isGift Result: ${isGift}
        `);

        if (couponData) logWebhook(`[SYNC INFO] Cupón detectado con éxito: ${couponData.id} (${(couponData as any).duration_in_months || 'sin'} meses)`);

        if (isTrial || isGift) {
            logWebhook(`[SYNC] Periodo promocional detectado.`);
            const couponDurationMonths = (couponData as any)?.duration_in_months;
            
            if (couponDurationMonths) {
                logWebhook(`[SYNC] Aplicando duración de cupón: ${couponDurationMonths} meses.`);
                // Usamos la fecha de creación de la suscripción como base para el cupón de bienvenida
                const startDate = new Date(sub.created * 1000);
                const couponExpiry = new Date(startDate);
                couponExpiry.setMonth(couponExpiry.getMonth() + couponDurationMonths);
                
                if (couponExpiry.getTime() > effectiveExpiry.getTime()) {
                    logWebhook(`[SYNC] Extensión por cupón hasta: ${couponExpiry.toISOString()}`);
                    
                    // AÑADIR DÍAS EXTRA DE CORTESÍA (3 DÍAS ADICIONALES)
                    couponExpiry.setDate(couponExpiry.getDate() + 3);
                    logWebhook(`[SYNC] +3 días de cortesía aplicados: ${couponExpiry.toISOString()}`);
                    
                    effectiveExpiry = couponExpiry;
                }
                // Si es un cupón, el periodo efectivo empieza cuando empezó el cupón (usualmente al inicio de la sub)
                effectiveStart = startDate;
            } else if (sub.trial_end) {
                // Si tiene trial_end nativo de Stripe, lo usamos
                const trialExpiry = new Date(sub.trial_end * 1000);
                if (trialExpiry.getTime() > effectiveExpiry.getTime()) {
                    effectiveExpiry = trialExpiry;
                }
            }
        }

        // Si se activó el blindaje (expiryDate fue forzada a +1 año), forzar también el inicio a HOY
        if (isAnnualPlan && daysToExpiry < 300) {
            effectiveStart = new Date();
        }

        logWebhook(`[SYNC] Final Config -> Tier: ${effectiveTier}, Start: ${effectiveStart.toISOString()}, Expiry: ${effectiveExpiry.toISOString()} (isTrial: ${isTrial})`);

        // MANEJO DE ESTADOS DE PAGO: past_due, unpaid, canceled
        const subStatus = sub.status; // 'active' | 'past_due' | 'unpaid' | 'canceled' | 'trialing' | 'incomplete'
        const isPastDue = subStatus === 'past_due' || subStatus === 'unpaid';
        const isCanceled = subStatus === 'canceled' || subStatus === 'incomplete_expired';

        if (isCanceled) {
            logWebhook(`[SYNC] Suscripción con estado '${subStatus}' → Downgrade a Free.`);
            const cancelUpdate = {
                nivel_suscripcion: 'free',
                fecha_termino_suscripcion: new Date().toISOString(),
                cancela_al_final: false,
                pago_pendiente: false,
                fecha_actualizacion: new Date().toISOString()
            };
            await supabaseAdmin.from('perfiles').update(cancelUpdate).eq('id', usuarioId);
            await supabaseAdmin.rpc('manejar_downgrade_produccion', { p_usuario_id: usuarioId });
            logWebhook(`[SYNC] Downgrade completado para ${usuarioId} (estado: ${subStatus})`);
            return true;
        }

        // ACTUALIZACIÓN UNIFICADA (Core + Secundarios + Flags de Prueba)
        const fullUpdate: any = {
            nivel_suscripcion: effectiveTier,
            fecha_inicio_suscripcion: effectiveStart.toISOString(),
            fecha_termino_suscripcion: effectiveExpiry.toISOString(),
            stripe_suscripcion_id: subscriptionId,
            stripe_cliente_id: sub.customer as string,
            es_prueba: isTrial || isGift,
            es_regalo: isGift,
            fecha_fin_prueba: isTrial || isGift ? effectiveExpiry.toISOString() : null,
            cancela_al_final: sub.cancel_at_period_end || false,
            pago_pendiente: isPastDue,
            fecha_pago_fallido: isPastDue ? new Date().toISOString() : null,
            fecha_actualizacion: new Date().toISOString()
        };

        if (isPastDue) {
            logWebhook(`[SYNC ALERTA] Suscripción en estado '${subStatus}' para usuario ${usuarioId}. Marcando pago_pendiente.`);
        }

        if (sub.trial_end) fullUpdate.fecha_fin_prueba = new Date(sub.trial_end * 1000).toISOString();

        const { data: updatedData, error: updateError, status: updateStatus } = await supabaseAdmin
            .from('perfiles')
            .update(fullUpdate)
            .eq('id', usuarioId)
            .select('id, nivel_suscripcion, es_prueba');

        if (updateError) {
            logWebhook(`[DB ERROR] Sync update failed: ${updateError.message} (Status: ${updateStatus})`);
        } else {
            logWebhook(`[SYNC OK] DB Updated: Status ${updateStatus}, User: ${usuarioId}, Trial: ${updatedData?.[0]?.es_prueba}`);
        }

        if (updateError) {
            logWebhook(`[SYNC CRÍTICO] Falló la actualización del perfil: ${updateError.message} (Código: ${updateError.code})`);
            throw new Error(`Error en sincronización de perfil: ${updateError.message}`);
        }

        if (!updatedData || updatedData.length === 0) {
            const errorMsg = `La actualización afectó 0 filas (Estado: ${updateStatus}). ¿ID de usuario incorrecto? ID intentado: "${usuarioId}"`;
            logWebhook(`[SYNC ERROR] ${errorMsg}`);
            throw new Error(errorMsg);
        }

        logWebhook(`[SYNC SUCCESS] Profile ${usuarioId} updated to ${effectiveTier} (es_prueba: ${isTrial || isGift})`);

        // Ejecutar trigger/lógica de producción
        const { error: rpcError } = await supabaseAdmin.rpc('manejar_upgrade_produccion', { p_usuario_id: usuarioId });
        if (rpcError) logWebhook(`[SYNC WARNING] RPC failed: ${rpcError.message}`);
        
        // ACTUALIZAR METADATOS DE TRANSACCIÓN CON FECHA EFECTIVA (Fallback para el frontend)
        if (providedInvoice?.id) {
            logWebhook(`[SYNC] Actualizando metadatos de transacción ${providedInvoice.id} con expiry_date.`);
            const { data: tx } = await supabaseAdmin.from('transacciones').select('metadatos').eq('pago_id', providedInvoice.id).single();
            if (tx) {
                await supabaseAdmin.from('transacciones').update({
                    metadatos: { ...tx.metadatos, expiry_date: effectiveExpiry.toISOString() }
                }).eq('pago_id', providedInvoice.id);
            }
        }
        
        return true;
    } catch (err: any) {
        logWebhook(`[SYNC CRITICAL ERROR] ${err.message}`);
        return false;
    }
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const accountHeader = req.headers.get('stripe-account');

    logWebhook('--- WEBHOOK ENTRANTE ---');
    logWebhook(`Header de Cuenta: ${accountHeader || 'Plataforma'}`);

    if (!signature) {
        logWebhook('ERROR: Falta el header stripe-signature');
        return NextResponse.json({ error: 'Sin firma' }, { status: 400 });
    }

    let event: Stripe.Event | null = null;
    const stripe = obtenerStripe();

    const secrets = [
        { name: 'STANDARD', val: process.env.STRIPE_WEBHOOK_SECRET },
        { name: 'CONNECT', val: process.env.STRIPE_CONNECT_WEBHOOK_SECRET }
    ].filter(s => !!s.val);

    let verified = false;
    let usedSecretName = '';
    for (const secretObj of secrets) {
        try {
            event = stripe.webhooks.constructEvent(body, signature, secretObj.val!);
            verified = true;
            usedSecretName = secretObj.name;
            logWebhook(`VERIFIED with secret: ${secretObj.name}`);
            break; 
        } catch (err: any) {
            logWebhook(`FAILED ${secretObj.name}: ${err.message}`);
        }
    }

    if (!verified || !event) {
        logWebhook('CRITICAL: All signature verifications failed.');
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    logWebhook(`Event Verified: ${event.type} | Source: ${usedSecretName} | Account: ${event.account || 'None'}`);

    // --- FILTRADO DE SEGURIDAD (Arquitectura Dual) ---
    // Si el evento viene del webhook de Connect, usualmente lo ignoraríamos si es de suscripción.
    // Pero si el usuario solo tiene un secreto configurado o ambos son iguales, debemos procesarlo.
    const isStandardOnlyEvent = [
        'customer.subscription.created', 
        'customer.subscription.updated', 
        'customer.subscription.deleted', 
        'invoice.paid',
        'invoice.payment_failed'
    ].includes(event.type);

    if (usedSecretName === 'CONNECT' && isStandardOnlyEvent) {
        // Solo ignoramos si el secreto de STANDARD también está presente y es distinto.
        // Si son iguales o falta uno, procesamos para no perder la activación.
        const standardSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const connectSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
        
        if (standardSecret && standardSecret !== connectSecret) {
            logWebhook(`[FILTER] Ignoring Standard event ${event.type} received via CONNECT secret.`);
            return NextResponse.json({ ignored: true, source: 'connect' });
        }
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            
            // Si es un checkout de suscripción pero llega por Connect
            if (usedSecretName === 'CONNECT' && session.mode === 'subscription') {
                const standardSecret = process.env.STRIPE_WEBHOOK_SECRET;
                const connectSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
                if (standardSecret && standardSecret !== connectSecret) {
                    logWebhook(`[FILTER] Ignoring subscription checkout received via CONNECT secret.`);
                    return NextResponse.json({ ignored: true, source: 'connect' });
                }
            }

            logWebhook(`Processing Session: ${session.id}`);
            
            const supabaseAdmin = obtenerSupabaseAdmin();
            const accountId = (event as any).account;
            // CRÍTICO: No pasar {} como opciones vacías al SDK de Stripe — causa "Unknown arguments"
            // Solo pasar stripeAccount cuando realmente es un evento de una cuenta conectada
            const lineItems = accountId
                ? await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] }, { stripeAccount: accountId })
                : await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });

            const moneda = session.currency?.toUpperCase() || 'MXN';
            let stripeId = session.id;
            const subscriptionId = session.subscription as string;
            const cuponId = session.metadata?.couponId || session.metadata?.couponIds || (session as any).metadata?.appliedCouponId;
            const customerEmail = session.customer_details?.email;
            const paymentStatus = session.payment_status;
            
            const estadoInicial = (paymentStatus === 'paid' || paymentStatus === 'no_payment_required') ? 'completado' : 'pendiente';

            let ordenPedido = "TB-ERROR";
            try {
                ordenPedido = generateFriendlyOrderId(lineItems.data, session.payment_intent as string || session.id, session.metadata);
            } catch (err) {
                ordenPedido = `TB-${Date.now().toString().slice(-6)}`;
            }

            let usuarioId = session.client_reference_id || session.metadata?.userId || (session.metadata as any)?.customerId;
            if (!usuarioId && session.customer) {
                logWebhook(`Intentando búsqueda por stripe_cliente_id: ${session.customer}`);
                const { data: userData } = await supabaseAdmin.from('perfiles').select('id').eq('stripe_cliente_id', session.customer as string).single();
                if (userData) {
                    usuarioId = userData.id;
                    logWebhook(`Usuario encontrado vía customer ID: ${usuarioId}`);
                }
            }
            if (!usuarioId && customerEmail) {
                logWebhook(`Intentando fallback por email para ${customerEmail}...`);
                const { data: userData } = await supabaseAdmin.from('perfiles').select('id').eq('correo', customerEmail).single();
                if (userData) {
                    usuarioId = userData.id;
                    logWebhook(`Usuario encontrado vía email: ${usuarioId}`);
                }
            }

            // Fallback total: Buscar en los metadatos de los items de Stripe
            if (!usuarioId && lineItems.data.length > 0) {
                logWebhook('Intentando fallback por metadata de items para userId...');
                for (const item of lineItems.data) {
                    const itemMetadata = (item.price?.product as Stripe.Product)?.metadata || {};
                    if (itemMetadata.userId && itemMetadata.userId.length === 36) {
                        usuarioId = itemMetadata.userId;
                        logWebhook(`Usuario encontrado vía metadata de item: ${usuarioId}`);
                        break;
                    }
                }
            }

            if (!usuarioId) {
                logWebhook('ERROR: Falló la identificación del usuario tras agotar todos los métodos');
                throw new Error('Identificación de usuario fallida');
            }

            // 0. Fetch buyer's plan to determine commission
            let buyerTier = 'free';
            if (usuarioId) {
                const { data: bData } = await supabaseAdmin.from('perfiles').select('nivel_suscripcion').eq('id', usuarioId).maybeSingle();
                if (bData) buyerTier = (bData.nivel_suscripcion || 'free').toLowerCase().trim();
            }

            if (!lineItems.data || lineItems.data.length === 0) {
                logWebhook('ERROR: No se encontraron items en la sesión');
                throw new Error('Sesión sin items');
            }

            const totalDiscount = (session.total_details?.amount_discount || 0) / 100;
            let couponCode = session.metadata?.couponCode || null;
            let couponIdDB: string | null = null;

            if (cuponId) {
                // cuponId puede ser un UUID de la DB o un ID de Stripe (co_xxx, promo_xxx)
                // cupon_id en la tabla es UUID, entonces solo buscamos si parece un UUID
                const cuponIdAsUuid = toUuidOrNull(cuponId);
                if (cuponIdAsUuid) {
                    logWebhook(`Fetching coupon by DB UUID: ${cuponIdAsUuid}`);
                    const { data: cData } = await supabaseAdmin.from('cupones').select('id, codigo').eq('id', cuponIdAsUuid).maybeSingle();
                    if (cData) {
                        couponCode = couponCode || cData.codigo;
                        couponIdDB = cData.id; // UUID válido desde la DB
                    }
                } else {
                    // Es un ID de Stripe, buscar por id_cupon_stripe
                    logWebhook(`cuponId is a Stripe ID (${cuponId}), searching by id_cupon_stripe...`);
                    const { data: cData } = await supabaseAdmin.from('cupones').select('id, codigo').eq('id_cupon_stripe', cuponId).maybeSingle();
                    if (cData) {
                        couponCode = couponCode || cData.codigo;
                        couponIdDB = cData.id; // UUID de la DB
                    }
                }
            }

            // --- DETECCIÓN DE DURACIÓN DE CUPÓN Y CICLO ---
            let mesesDuracion = 1;
            
            // Si el nombre del producto o el ciclo en metadatos dicen 'anual'
            const isYearlyCheckout = lineItems.data.some(item => {
                const cRaw = String((item.price?.product as Stripe.Product)?.metadata?.cycle || session.metadata?.cycle || '').toLowerCase();
                const iName = String(item.description || '').toLowerCase();
                return cRaw === 'yearly' || cRaw === 'anual' || iName.includes('anual');
            });
            
            if (isYearlyCheckout) {
                mesesDuracion = 12;
            }

            if (subscriptionId) {
                try {
                    const subFull = await stripe.subscriptions.retrieve(subscriptionId, {
                        expand: ['discount.coupon']
                    }) as any; // Cast a any para evitar lints de 'discount'
                    if (subFull.discount?.coupon?.duration_in_months) {
                        mesesDuracion = subFull.discount.coupon.duration_in_months;
                        logWebhook(`Coupon duration detected: ${mesesDuracion} months`);
                    }
                } catch (e) {
                    logWebhook(`Warning: Could not retrieve subscription coupon duration: ${e}`);
                }
            }

            // --- SINCRONIZACIÓN DE CLIENTE STRIPE ---
            if (session.customer && usuarioId) {
                logWebhook(`Sincronizando stripe_cliente_id (${session.customer}) para usuario ${usuarioId}`);
                await supabaseAdmin.from('perfiles').update({ stripe_cliente_id: session.customer as string }).eq('id', usuarioId);
            }
            if (!couponCode && (session as any).discount?.coupon?.name) {
                couponCode = (session as any).discount.coupon.name;
                // El ID del cupón de Stripe (co_xxx) NO es un UUID, buscar en DB
                const stripeDiscountId = (session as any).discount.coupon.id;
                if (!couponIdDB && stripeDiscountId) {
                    const { data: cData } = await supabaseAdmin.from('cupones').select('id').eq('id_cupon_stripe', stripeDiscountId).maybeSingle();
                    if (cData) couponIdDB = cData.id; // UUID de la DB
                }
            }

            logWebhook(`[BETA] Total items en sesión: ${lineItems.data.length}. Expandiendo sesión para recibo...`);
            
            let receiptUrl = "";
            let isTrialSession = false;
            try {
                const sessionToRetrieve = session.id;
                const expandOptions = ['payment_intent.latest_charge', 'invoice'];
                
                const expandedSession = accountId
                    ? await stripe.checkout.sessions.retrieve(sessionToRetrieve, { expand: expandOptions }, { stripeAccount: accountId })
                    : await stripe.checkout.sessions.retrieve(sessionToRetrieve, { expand: expandOptions });
                
                const pi = expandedSession.payment_intent as Stripe.PaymentIntent | null;
                const charge = pi?.latest_charge as Stripe.Charge | null;
                const invoice = expandedSession.invoice as Stripe.Invoice | null;
                
                // Si es un plan, intentamos usar hosted_invoice_url, de lo contrario receipt_url
                receiptUrl = invoice?.hosted_invoice_url || charge?.receipt_url || "";
                
                // MEJORA: Unificar el pago_id para planes usando el ID de factura si existe
                // Esto permite que el handler de invoice.paid (que usa in_...) haga upsert
                if (invoice?.id && (session.mode === 'subscription' || session.metadata?.type === 'plan')) {
                    stripeId = invoice.id;
                    logWebhook(`Unifying pago_id to invoice ID: ${stripeId}`);
                }
                
                const totalDiscount = (session.total_details?.amount_discount || 0) / 100;
                const amountTotal = (session.amount_total || 0) / 100;
                isTrialSession = amountTotal === 0 || totalDiscount > 0 || !!cuponId;

                logWebhook(`URL de Factura/Recibo encontrada: ${receiptUrl ? 'SÍ' : 'NO'} | isTrial: ${isTrialSession}`);
            } catch (err: any) {
                logWebhook(`Error expandiendo sesión: ${err.message}`);
            }

            for (const item of lineItems.data) {
                try {
                    let product = item.price?.product;
                
                // Si el producto no está expandido (es un string), lo obtenemos directamente de Stripe
                if (typeof product === 'string') {
                    logWebhook(`Fetching product details for ${product}...`);
                    try {
                        product = accountId
                            ? await stripe.products.retrieve(product, {}, { stripeAccount: accountId })
                            : await stripe.products.retrieve(product);
                    } catch (e: any) {
                        logWebhook(`Error fetching product: ${e.message}`);
                    }
                }

                const isObject = typeof product === 'object' && product !== null;
                const pObj = isObject ? (product as Stripe.Product) : null;
                const metadata = pObj?.metadata || {};
                
                const iTypeRaw = String(metadata.type || session.metadata?.type || '').toLowerCase().trim();
                let iType = iTypeRaw;
                if (iType === 'beats' || iType === 'beat') iType = 'beat';
                if (['soundkit', 'kit', 'sound-kit', 'sound_kit', 'sound kit'].includes(iType)) iType = 'sound_kit';
                if (['servicio', 'service'].includes(iType)) iType = 'service';
                if (['plan', 'subscription', 'suscripcion'].includes(iType)) iType = 'plan';
                
                // --- ROBUSTEZ: Detección por recurrencia si falla la metadata ---
                if (iType !== 'plan' && item.price?.type === 'recurring') {
                    logWebhook(`Detected RECURRING item via price type. Forcing iType=plan for ${item.description}`);
                    iType = 'plan';
                }

                const vendeurId = metadata.productor_id || 
                                  metadata.producer_id || 
                                  metadata.seller_id || 
                                  metadata.producerId || 
                                  session.metadata?.productor_id || 
                                  session.metadata?.producer_id ||
                                  null;
                
                // --- IDENTIFICACIÓN DE PRODUCTO MEJORADA (MÁXIMA PRIORIDAD AL UUID) ---
                const rawIdFromMeta = metadata.productId || 
                                     metadata.product_id || 
                                     session.metadata?.productId || 
                                     session.metadata?.product_id;
                
                // Limpiamos posibles sufijos de licencia (ej: "UUID-Pro" -> "UUID") usando Regex
                const uuidMatch = (typeof rawIdFromMeta === 'string') 
                    ? rawIdFromMeta.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
                    : null;
                const cleanUuid = uuidMatch ? uuidMatch[1] : null;
                
                // Solo si es un UUID válido (36 caracteres), lo usamos como ID principal
                let itemId = (cleanUuid && cleanUuid.length === 36)
                    ? cleanUuid
                    : (pObj?.id || (typeof product === 'string' ? product : null) || "unknown_product");
                
                // MEJORA: Forzar consistencia para planes (debe ser plan-pro o plan-premium)
                if (iType === 'plan') {
                    const planTier = (metadata.tier || session.metadata?.tier || 'pro').toLowerCase();
                    itemId = `plan-${planTier}`;
                }
                
                // Guardamos el UUID explícitamente para las APIs de descarga
                const itemUuid = (cleanUuid && cleanUuid.length === 36) ? cleanUuid : null;

                                  null;

                
                
                const rawLicense = (metadata.type === 'plan' || session.metadata?.type === 'plan')
                    ? (metadata.tier || session.metadata?.tier)
                    : (metadata.licenseType || metadata.license_info || metadata.license || session.metadata?.licenseType || 'basica');
                let normalizedLicense = String(rawLicense || 'basica').toLowerCase().trim();

                // Override específico para Sound Kits: Siempre deben decir 'soundkit' 
                // para evitar que en la base de datos salga "basica"
                if (iType === 'sound_kit') {
                    normalizedLicense = 'soundkit';
                }

                let nombreProd = pObj?.name || metadata.product_name || session.metadata?.product_name || item.description || "Producto Tianguis";
                
                // MEJORA: Asegurar que si es un plan, el nombre indique el intervalo (Mensual/Anual)
                if (iType === 'plan' && !nombreProd.includes('(')) {
                    const cycle = metadata.cycle || session.metadata?.cycle || (item.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly');
                    const cycleLabel = (cycle === 'yearly' || cycle === 'year') ? ' (Anual)' : ' (Mensual)';
                    nombreProd += cycleLabel;
                }
                const portadaUrl = metadata.portada_url || pObj?.images?.[0] || session.metadata?.portada_url || '';
                
                // Fallback de descuento: Si Stripe no lo ve (porque se aplicó en el catálogo antes de llegar a Stripe)
                // Usamos el discountPercent de la metadata (enviado desde el carrito)
                let itemDiscount = ((item.amount_subtotal || 0) - (item.amount_total || 0)) / 100;
                const metaDiscountPercent = parseFloat(metadata.discountPercent || "0");
                
                if (itemDiscount <= 0 && metaDiscountPercent > 0) {
                    const finalPrice = (item.amount_total || 0) / 100;
                    // Cálculo: Original = Final / (1 - %) | Descuento = Original - Final
                    const originalPrice = finalPrice / (1 - (metaDiscountPercent / 100));
                    itemDiscount = originalPrice - finalPrice;
                    logWebhook(`Manual discount calculation for ${nombreProd}: ${itemDiscount} (based on ${metaDiscountPercent}%)`);
                }

                logWebhook(`[DEBUG] Final Identifiers -> UUID: ${itemUuid}, ItemId: ${itemId}, Type: ${iType}, License: ${normalizedLicense}`);
                logWebhook(`Inserting item: ${nombreProd} | Portada: ${portadaUrl ? 'YES' : 'NO'}`);

                let contractUrl = "";

                // --- 1. REGISTRO EN BASE DE DATOS ---
                const compositeId = (iType === 'plan') ? itemId : ((normalizedLicense && normalizedLicense !== 'basica') ? `${itemId}-${normalizedLicense}` : itemId);
                
                logWebhook(`DB Sync for Item: ${compositeId}`);
                
                const { data: existingTxData } = await supabaseAdmin
                    .from('transacciones')
                    .select('*')
                    .eq('pago_id', stripeId)
                    .or(`producto_id.eq.${compositeId},producto_id.eq.${itemId}-basica,producto_id.eq.${itemId}-sound_kit,producto_id.eq.${itemId}-soundkit`); 
                
                const existingTx = existingTxData?.[0] || null;

                let insertedTx, txError;

                // --- Sanitizar valores para columnas UUID y Numeric antes de insertar ---
                const safeVendeurId = toUuidOrNull(vendeurId);
                const safeItemUuid = toUuidOrNull(itemUuid);
                const safeCouponId = toUuidOrNull(couponIdDB); // Garantizar que cupon_id sea UUID o null
                const safePrecioTotal = toNumericOrZero((item.amount_total || 0) / 100);
                const safeMonto = toNumericOrZero(itemDiscount);

                logWebhook(`[SAFE VALUES] vendeurId=${safeVendeurId}, itemUuid=${safeItemUuid}, couponId=${safeCouponId}, precio=${safePrecioTotal}`);

                if (existingTx) {
                    logWebhook(`La transacción con pago_id ${stripeId} ya existe. Actualizando detalles...`);
                    const { data: updateData, error: updateErr } = await supabaseAdmin
                        .from('transacciones')
                        .update({
                            comprador_id: usuarioId,
                            vendedor_id: safeVendeurId,
                            producto_id: compositeId, 
                            producto_uuid: safeItemUuid,
                            tipo_licencia: normalizedLicense,
                            nombre_producto: nombreProd,
                            orden_pedido: ordenPedido,
                            cupon_id: safeCouponId,
                            codigo_cupon: couponCode,
                            monto_descuento: safeMonto,
                            recibo_url: receiptUrl || (existingTx.recibo_url || ""),
                            metadatos: { 
                                ...metadata,
                                portada_url: portadaUrl,
                                product_name: nombreProd,
                                license_type: normalizedLicense,
                                productor_id: vendeurId,
                                tipo_producto: iType,
                                comprador_id: usuarioId,
                                contract_url: existingTx.contract_url || "",
                                codigo_cupon: couponCode,
                                monto_descuento: safeMonto,
                                meses_duracion: mesesDuracion, // Inyectamos la duración detectada
                                ip_compra: metadata.ip_compra || session.metadata?.ip_compra || 'unknown',
                                license_id_composite: compositeId,
                                checkout_session_id: session.id
                            }
                        })
                        .eq('pago_id', stripeId)
                        .eq('producto_id', compositeId)
                        .select()
                        .single();
                    
                    if (updateErr) {
                        logWebhook(`[DB ERROR] Update failed for ${compositeId}: ${updateErr.message} (Code: ${updateErr.code})`);
                    }
                    insertedTx = updateData;
                    txError = updateErr;
                } else {
                    const { data: insertData, error: insertErr } = await supabaseAdmin
                        .from('transacciones')
                        .insert({
                            pago_id: stripeId,
                            comprador_id: usuarioId,
                            vendedor_id: safeVendeurId,
                            producto_id: compositeId,
                            tipo_producto: iType,
                            nombre_producto: nombreProd,
                            precio_total: safePrecioTotal,
                            moneda: moneda,
                            estado_pago: estadoInicial,
                            metodo_pago: 'stripe',
                            tipo_licencia: normalizedLicense,
                            orden_pedido: ordenPedido,
                            cupon_id: safeCouponId,
                            codigo_cupon: couponCode,
                            monto_descuento: safeMonto,
                            producto_uuid: safeItemUuid,
                            recibo_url: receiptUrl || "",
                            contract_url: contractUrl,
                            conteo_descargas: 0,
                            ip_descarga: null,
                            metadatos: {
                                ...metadata,
                                portada_url: portadaUrl,
                                meses_duracion: mesesDuracion, 
                                es_prueba: isTrialSession, // Inyectamos para el trigger SQL
                                is_trial: isTrialSession,   // Alias común
                                ip_compra: metadata.ip_compra || session.metadata?.ip_compra || 'unknown',
                                license_id_composite: compositeId,
                                checkout_session_id: session.id
                            }
                        })
                        .select()
                        .single();

                    if (insertErr) {
                        logWebhook(`[DB ERROR] Insert failed for ${nombreProd}: ${insertErr.message} (Code: ${insertErr.code})`);
                        logWebhook(`[DB DEBUG] item data: pago_id=${stripeId}, comprador=${usuarioId}, producto=${compositeId}, tipo=${iType}, precio=${safePrecioTotal}, cupon=${safeCouponId}`);
                    }
                    insertedTx = insertData;
                    txError = insertErr;
                }

                if (txError) {
                    logWebhook(`ERROR EN INSERCIÓN: ${txError.message}`);
                    throw new Error(`Error DB Inserción: ${txError.message}`);
                }
                
                logWebhook(`ÉXITO EN INSERCIÓN: ${insertedTx.id}`);

                // --- 2. GENERACIÓN DE CONTRATO PDF (Solo para Beats y Kits) ---
                if (['beat', 'sound_kit'].includes(iType)) {
                    logWebhook(`Generando PDF para ${iType}... (Item: ${insertedTx.id})`);
                    try {
                        const { fetchLicenseDetails } = await import('@/lib/license-utils');
                        const licenseDetails = await fetchLicenseDetails(supabaseAdmin, insertedTx);
                        
                        if (!licenseDetails) {
                            logWebhook(`[ADVERTENCIA] fetchLicenseDetails devolvió null para item ${insertedTx.id}`);
                        }

                        if (licenseDetails) {
                            const pdfBuffer = await renderContractToBuffer(licenseDetails as ContractData);
                            const fileName = licenseDetails.pdfName || `Licencia_${insertedTx.id}.pdf`;
                            const filePath = `${usuarioId}/${insertedTx.id}/${fileName}`;

                            const { error: uploadError } = await supabaseAdmin.storage
                                .from('licencias')
                                .upload(filePath, pdfBuffer, {
                                    contentType: 'application/pdf',
                                    upsert: true
                                });

                            if (!uploadError) {
                                const { data: { publicUrl } } = supabaseAdmin.storage
                                    .from('licencias')
                                    .getPublicUrl(filePath);

                                await supabaseAdmin
                                    .from('transacciones')
                                    .update({ 
                                        contract_url: publicUrl,
                                        recibo_url: publicUrl, // EL RECIBO ES EL PDF DE SUPABASE SEGÚN EL USUARIO
                                        metadatos: {
                                            ...insertedTx.metadatos,
                                            contract_url: publicUrl,
                                            contract_pdf_url: publicUrl,
                                            recibo_url: publicUrl,
                                            stripe_receipt_url: receiptUrl // Guardamos el de Stripe solo en metadatos por si acaso
                                        }
                                    })
                                    .eq('id', insertedTx.id);
                                
                                logWebhook(`PDF generado y subido: ${publicUrl}`);
                            } else {
                                logWebhook(`Error de Subida de PDF: ${uploadError.message}`);
                            }
                        }
                    } catch (pdfErr: any) {
                        logWebhook(`Error CRÍTICO en generación de PDF: ${pdfErr.message}`);
                        // No bloqueamos el webhook si falla el PDF, pero lo logueamos
                    }
                }

                // Solo pagar e incrementar ventas si el pago ya se realizó (Tarjeta) y no es pendiente (OXXO)
                if (estadoInicial === 'completado' && iType !== 'plan' && vendeurId) {
                    const isConnectPayment = session.metadata?.isConnect === 'true';
                    if (!isConnectPayment) {
                        const montoItem = item.amount_total / 100;
                        const comisionStripe = (montoItem * 0.036 + 3) * 1.16;
                        
                        // DINÁMICO: 0% si es Pro/Premium, 15% si es Free
                        const isBuyerPaid = ['pro', 'premium', 'tianguis pro', 'tianguis premium'].includes(buyerTier);
                        const comisionPct = isBuyerPaid ? 0 : 0.15;
                        const comisionTianguis = montoItem * comisionPct;
                        
                        const gananciaNeta = montoItem - comisionStripe - comisionTianguis;
                        await supabaseAdmin.rpc('incrementar_balance_productor', { id_productor: vendeurId, monto_ganancia: gananciaNeta > 0 ? gananciaNeta : 0 });
                    }
                    
                    const tableMap: Record<string, string> = { 'beat': 'beats', 'sound_kit': 'kits_sonido', 'service': 'servicios' };
                    const targetTable = tableMap[iType];
                    if (targetTable && itemId) {
                        await supabaseAdmin.rpc('incrementar_conteo_ventas', { tabla_target: targetTable, id_item: itemId });
                    }

                    // Marcar beat como vendido si la licencia es exclusiva (estándar o premium)
                    if (iType === 'beat' && /exclusiv/i.test(normalizedLicense) && itemUuid) {
                        await supabaseAdmin.from('beats').update({ esta_vendido: true }).eq('id', itemUuid);
                        logWebhook(`Beat ${itemUuid} marcado como esta_vendido=true (Licencia: ${normalizedLicense})`);
                    }
                }

                if (iType === 'plan' && subscriptionId) {
                    logWebhook(`Plan detectado en checkout. Iniciando sincronización para usuario ${usuarioId}`);
                    // Ignoramos si esto falla, la tabla de transacciones es más crítica aquí
                    await syncUserProfileSubscription(supabaseAdmin, stripe, usuarioId, subscriptionId, metadata.tier || session.metadata?.tier);
                }
            } catch (itemErr: any) {
                logWebhook(`ERROR EN ITEM (${item.description || 'Desconocido'}): ${itemErr.message}`);
                // LANZAR HACIA AFUERA PARA FORZAR EL 500 Y MOSTRARLO EN EL PANEL DE STRIPE
                throw new Error(`Fallo en item ${item.description || 'Desconocido'}: ${itemErr.message}`);
            }
        }
    }

    // --- EVENTOS ASÍNCRONOS (EJ. OXXO) ---
    if (event.type === 'checkout.session.async_payment_succeeded') {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseAdmin = obtenerSupabaseAdmin();
        logWebhook(`[OXXO/ASYNC] Pago exitoso para sesión: ${session.id}`);
        
        // 1. Marcar transacciones como completadas
        const { data: txs, error: txError } = await supabaseAdmin.from('transacciones')
            .update({ estado_pago: 'completado' })
            .eq('pago_id', session.id)
            .select('*');
            
        if (txError) {
            logWebhook(`[OXXO/ASYNC] Error de DB actualizando transacciones: ${txError.message}`);
        }
            
        // 2. Repartición de fondos a productores (Ahora que sí se pagó)
        if (txs && txs.length > 0) {
            for (const tx of txs) {
                const iType = tx.tipo_producto;
                const vendeurId = tx.vendedor_id;
                const montoItem = tx.precio_total || 0;
                
                if (iType !== 'plan' && vendeurId) {
                    const isConnectPayment = session.metadata?.isConnect === 'true';
                    if (!isConnectPayment) {
                        const comisionStripe = (montoItem * 0.036 + 3) * 1.16;
                        
                        const { data: bData } = await supabaseAdmin.from('perfiles').select('nivel_suscripcion').eq('id', tx.comprador_id).maybeSingle();
                        const buyerTier = (bData?.nivel_suscripcion || 'free').toLowerCase().trim();
                        const isBuyerPaid = ['pro', 'premium', 'tianguis pro', 'tianguis premium'].includes(buyerTier);
                        const comisionPct = isBuyerPaid ? 0 : 0.15;
                        const comisionTianguis = montoItem * comisionPct;
                        
                        const gananciaNeta = montoItem - comisionStripe - comisionTianguis;
                        await supabaseAdmin.rpc('incrementar_balance_productor', { id_productor: vendeurId, monto_ganancia: gananciaNeta > 0 ? gananciaNeta : 0 });
                    }
                    
                    const tableMap: Record<string, string> = { 'beat': 'beats', 'sound_kit': 'kits_sonido', 'service': 'servicios', 'soundkit': 'kits_sonido' };
                    const targetTable = tableMap[iType];
                    const itemId = tx.producto_uuid || (tx.producto_id ? String(tx.producto_id).split('-')[0] : null);

                    if (targetTable && itemId) {
                        await supabaseAdmin.rpc('incrementar_conteo_ventas', { tabla_target: targetTable, id_item: itemId });
                    }

                    // Marcar beat como vendido si la licencia es exclusiva (estándar o premium)
                    if (iType === 'beat' && /exclusiv/i.test(tx.tipo_licencia || '') && tx.producto_uuid) {
                        await supabaseAdmin.from('beats').update({ esta_vendido: true }).eq('id', tx.producto_uuid);
                        logWebhook(`[OXXO] Beat ${tx.producto_uuid} marcado como esta_vendido=true (Licencia: ${tx.tipo_licencia})`);
                    }
                }
            }
        }
    }

    if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseAdmin = obtenerSupabaseAdmin();
        const nuevoEstado = event.type === 'checkout.session.expired' ? 'expirado' : 'fallido';
        logWebhook(`[OXXO/ASYNC] Voucher ${nuevoEstado} para sesión: ${session.id}`);
        
        await supabaseAdmin.from('transacciones')
            .update({ estado_pago: nuevoEstado })
            .eq('pago_id', session.id);
    }

        if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
            const subscription = event.data.object as Stripe.Subscription;
            const subscriptionId = subscription.id;
            const customerId = subscription.customer as string;
            const supabaseAdmin = obtenerSupabaseAdmin();
            const stripe = obtenerStripe();

            logWebhook(`Evento ${event.type} recibido para cliente ${customerId}`);

            // 1. Intentar buscar usuario por metadata de la suscripción (más proactivo)
            let usuarioId = subscription.metadata?.userId || (subscription as any).parent?.subscription_details?.metadata?.userId;

            // 2. Si no hay metadata, buscar por stripe_cliente_id en perfiles
            if (!usuarioId) {
                logWebhook(`Searching user by stripe_cliente_id: ${customerId}`);
                const { data: profile } = await supabaseAdmin
                    .from('perfiles')
                    .select('id')
                    .eq('stripe_cliente_id', customerId)
                    .maybeSingle();
                if (profile) {
                    usuarioId = profile.id;
                    logWebhook(`Usuario encontrado: ${usuarioId}`);
                }
            }

            if (usuarioId) {
                await syncUserProfileSubscription(supabaseAdmin, stripe, usuarioId, subscriptionId);
            } else {
                logWebhook(`[ADVERTENCIA] No se encontró usuario con customerId ${customerId} o metadata.userId para evento ${event.type}`);
            }
        }

        if (event.type === 'invoice.paid') {
            const invoice = event.data.object as any;
            
            // Soporte para versión Clover: subscription puede estar en parent.subscription_details
            const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
            
            logWebhook(`[INVOICE.PAID] Recibido para invoice: ${invoice.id}, sub: ${subscriptionId || 'N/A'}`);
            
            if (subscriptionId) {
                const stripe = obtenerStripe();
                const supabaseAdmin = obtenerSupabaseAdmin();

                logWebhook(`Invoice Paid: ${invoice.id} for customer ${invoice.customer}. Sub: ${subscriptionId}`);

                // --- BUSCADOR MAESTRO DE USUARIO ---
                let profile: any = null;

                // 1. Intentar por metadata (El método más seguro)
                const metadataUserId = invoice.metadata?.userId || 
                                       invoice.subscription_details?.metadata?.userId || 
                                       invoice.parent?.subscription_details?.metadata?.userId;

                if (metadataUserId) {
                    logWebhook(`Found userId in metadata: ${metadataUserId}. Fetching profile...`);
                    const { data: mProfile } = await supabaseAdmin
                        .from('perfiles')
                        .select('id, correo, nivel_suscripcion')
                        .eq('id', metadataUserId)
                        .maybeSingle();
                    profile = mProfile;
                }

                // 2. Si falla, intentar por ID de suscripción o cliente
                if (!profile) {
                    logWebhook(`User not found by metadata. Trying subscription/customer ID...`);
                    const { data: idProfile } = await supabaseAdmin
                        .from('perfiles')
                        .select('id, correo, nivel_suscripcion')
                        .or(`stripe_suscripcion_id.eq.${subscriptionId},stripe_cliente_id.eq.${invoice.customer}`)
                        .maybeSingle();
                    profile = idProfile;
                }

                // 3. Si falla, intentar por email
                if (!profile && invoice.customer_email) {
                    logWebhook(`User not found by IDs. Trying email lookup: ${invoice.customer_email}`);
                    const { data: emailProfile } = await supabaseAdmin
                        .from('perfiles')
                        .select('id, correo, nivel_suscripcion')
                        .eq('correo', invoice.customer_email)
                        .maybeSingle();
                    profile = emailProfile;
                }

                if (profile) {
                    // Limpiar estado de pago fallido cuando se paga con éxito
                    await supabaseAdmin.from('perfiles').update({ pago_pendiente: false, fecha_pago_fallido: null }).eq('id', profile.id);
                    logWebhook(`[INVOICE.PAID] Perfil identificado con éxito: ${profile.id} (Tier: ${profile.nivel_suscripcion}). Flag pago_pendiente limpiado.`);
                    
                    // --- REGISTRAR EN TRANSACCIONES PARA HISTORIAL ---
                    const lines = invoice.lines?.data || [];
                    
                    // Buscamos si ALGUNA línea es Premium (Soporte Clover y Estándar)
                    // ESTRATEGIA LÍNEA HÉROE: Buscamos la línea que tiene el monto más alto y NO es negativa
                    const heroLine = lines
                        .filter((l: any) => (l.amount || 0) > 0)
                        .sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0))[0];

                    let tier = 'pro';
                    let interval = 'month';

                    if (heroLine) {
                        const prid = heroLine.price?.id || (heroLine as any).pricing?.price_details?.price || heroLine.plan?.id;
                        const pName = (heroLine.price?.product as any)?.name || (heroLine.plan?.product as any)?.nickname || (heroLine.plan?.product as any)?.name || "";
                        const priceId = typeof prid === 'string' ? prid : null;
                        const detectedTier = detectarTierDesdeStripe({ priceId, productName: pName });

                        const isAnnualId = priceId ? PRECIOS_ANUALES.has(priceId) : false;
                        if (detectedTier) tier = detectedTier;

                        const rawInterval = heroLine.plan?.interval || heroLine.price?.recurring?.interval || '';
                        interval = (isAnnualId || rawInterval === 'year' || rawInterval === 'yearly') ? 'year' : 'month';
                    }
                    
                    const intervalLabel = (interval === 'year' || interval === 'yearly') ? ' (Anual)' : ' (Mensual)';
                    const compositeProductId = `plan-${tier}`;
                    logWebhook(`Hero Line detected: ${tier}, Interval: ${intervalLabel}, Amount: ${(heroLine?.amount || 0)/100}`);

                    const isFirstInvoice = invoice.billing_reason === 'subscription_create';
                    const montoFinal = (invoice.amount_paid || 0) / 100;
                    const isTrialInvoice = montoFinal === 0 || (invoice.amount_due === 0);

                    if (isFirstInvoice && !isTrialInvoice) {
                        logWebhook(`Skipping transaction insert for ${invoice.id} (subscription_create handled by checkout)`);
                    } else {
                        if (isFirstInvoice) logWebhook(`Processing subscription_create invoice because it is a TRIAL/FREE invoice ($0)`);
                        
                        // Aseguramos que el nombre del producto tenga el intervalo y la orden respete el formato estricto: SU-DDMMAA-XXXX
                        const now = new Date();
                        const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`;
                        const uniquePart = invoice.id.slice(-4).toUpperCase();
                        const ordenPedidoStr = `SU-${dateStr}-${uniquePart}`;

                        const transactionData = {
                            pago_id: invoice.id,
                            comprador_id: profile.id,
                            producto_id: compositeProductId, 
                            tipo_producto: 'plan',
                            nombre_producto: `Plan ${tier.toUpperCase()}${intervalLabel}`,
                            precio_total: montoFinal,
                            moneda: (invoice.currency || 'mxn').toUpperCase(),
                            estado_pago: 'completado',
                            metodo_pago: 'stripe',
                            tipo_licencia: tier,
                            orden_pedido: ordenPedidoStr,
                            recibo_url: invoice.hosted_invoice_url || "",
                            metadatos: {
                                invoice_id: invoice.id,
                                subscription_id: subscriptionId,
                                stripe_customer_id: invoice.customer,
                                tier: tier,
                                auto_generated: true,
                                processed_at: new Date().toISOString(),
                                meses_duracion: (interval === 'year' || interval === 'yearly') ? 12 : 1,
                                es_prueba: isTrialInvoice, // Inyectamos para el trigger SQL
                                is_trial: isTrialInvoice,   // Alias común
                                audit_log: `Identificado por ${metadataUserId ? 'metadata' : 'búsqueda'}. Nivel seleccionado: ${tier} de ${lines.length} líneas.`
                            }
                        };

                        // Usamos upsert con onConflict explícito ahora que aseguraremos el índice UNIQUE
                        const { error: txError } = await supabaseAdmin
                            .from('transacciones')
                            .upsert(transactionData, { onConflict: 'pago_id,producto_id' });

                        if (txError) {
                            logWebhook(`[ERROR CRÍTICO] Falló el registro de transacción con upsert: ${txError.message}`);
                            // Si falla aquí, lanzamos para que Stripe reintente
                            throw new Error(`Fallo al registrar transacción: ${txError.message}`);
                        }
                    }

                    await syncUserProfileSubscription(supabaseAdmin, stripe, profile.id, subscriptionId, tier, invoice);
                    return NextResponse.json({ received: true, user: profile.id, status: 'synced', tier: tier });
                } else {
                    logWebhook(`[CRÍTICO] Factura pagada pero NO SE ENCONTRÓ PERFIL para cliente ${invoice.customer} o sub ${subscriptionId}`);
                    return NextResponse.json({ received: true, error: 'Usuario no encontrado', status: 'miss' });
                }
            }
        }

        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object as Stripe.Subscription;
            const metadataUserId = subscription.metadata?.userId || 
                                   (subscription as any).subscription_details?.metadata?.userId;
            
            logWebhook(`Processing customer.subscription.updated for sub: ${subscription.id}`);
            const supabaseAdmin = obtenerSupabaseAdmin();
            let profileId = metadataUserId;

            if (!profileId) {
                const { data: profile } = await supabaseAdmin.from('perfiles')
                    .select('id')
                    .or(`stripe_suscripcion_id.eq.${subscription.id},stripe_cliente_id.eq.${subscription.customer}`)
                    .maybeSingle();
                if (profile) profileId = profile.id;
            }

            if (profileId) {
                // Sincroniza directamente la fecha de expiración y el nivel (sin forzar tier para que lea el producto de la suscripción)
                await syncUserProfileSubscription(supabaseAdmin, stripe, profileId, subscription.id);
                logWebhook(`Successfully synced customer.subscription.updated for user ${profileId}`);
            } else {
                logWebhook(`Could not find profile for updated subscription ${subscription.id}`);
            }
            return NextResponse.json({ received: true });
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription;
            const supabaseAdmin = obtenerSupabaseAdmin();
            const { data: profile } = await supabaseAdmin.from('perfiles').select('id').eq('stripe_cliente_id', subscription.customer as string).single();

            if (profile) {
                await supabaseAdmin.from('perfiles').update({ nivel_suscripcion: 'free', fecha_termino_suscripcion: new Date().toISOString() }).eq('id', profile.id);
                await supabaseAdmin.rpc('manejar_downgrade_produccion', { p_usuario_id: profile.id });
            }
        }

        // --- FALLO DE PAGO (Reintento de Stripe) ---
        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object as any;
            const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
            logWebhook(`[INVOICE.PAYMENT_FAILED] Fallo de pago para invoice: ${invoice.id}, sub: ${subscriptionId || 'N/A'}, intento: ${invoice.attempt_count}`);

            if (subscriptionId) {
                const supabaseAdmin = obtenerSupabaseAdmin();

                // Buscar perfil del usuario
                let profile: any = null;
                const metadataUserId = invoice.metadata?.userId || invoice.subscription_details?.metadata?.userId || invoice.parent?.subscription_details?.metadata?.userId;
                if (metadataUserId) {
                    const { data } = await supabaseAdmin.from('perfiles').select('id, correo, nivel_suscripcion').eq('id', metadataUserId).maybeSingle();
                    profile = data;
                }
                if (!profile) {
                    const { data } = await supabaseAdmin.from('perfiles').select('id, correo, nivel_suscripcion').or(`stripe_suscripcion_id.eq.${subscriptionId},stripe_cliente_id.eq.${invoice.customer}`).maybeSingle();
                    profile = data;
                }
                if (!profile && invoice.customer_email) {
                    const { data } = await supabaseAdmin.from('perfiles').select('id, correo, nivel_suscripcion').eq('correo', invoice.customer_email).maybeSingle();
                    profile = data;
                }

                if (profile) {
                    // Marcar como pago pendiente — NO bajamos a Free aún
                    // Stripe reintentará automáticamente (3-4 intentos en ~7 días)
                    // Si todos fallan, Stripe mandará customer.subscription.deleted → downgrade automático
                    await supabaseAdmin.from('perfiles').update({
                        pago_pendiente: true,
                        fecha_pago_fallido: new Date().toISOString()
                    }).eq('id', profile.id);
                    logWebhook(`[INVOICE.PAYMENT_FAILED] Usuario ${profile.id} marcado con pago_pendiente=true (Intento: ${invoice.attempt_count})`);
                } else {
                    logWebhook(`[INVOICE.PAYMENT_FAILED] No se encontró perfil para cliente ${invoice.customer}`);
                }
            }
            return NextResponse.json({ received: true });
        }

        if (event.type === 'account.updated') {
            const account = event.data.object as Stripe.Account;
            const onboarded = account.charges_enabled && account.payouts_enabled;
            if (onboarded) {
                const supabaseAdmin = obtenerSupabaseAdmin();
                await supabaseAdmin.from('perfiles').update({ stripe_connect_onboarded: true }).eq('stripe_connect_id', account.id);
            }
        }

        return NextResponse.json({ received: true });

    } catch (globalErr: any) {
        logWebhook(`ERROR GLOBAL: ${globalErr.message}`);
        return NextResponse.json({ error: 'Error Interno', details: globalErr.message }, { status: 500 });
    }
}
