import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderSalesNoteToBuffer } from '@/lib/PDFgenerarVentas';
import { fetchLicenseDetails } from '@/lib/license-utils';

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase admin env vars not configured');
    return createClient(url, key);
};

/**
 * API Route: Generar Recibo de Venta (Ventas Internas)
 * Agrupa todos los artículos de una misma orden en un solo PDF,
 * incluyendo lógica de cupones y descuentos acumulados.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { saleId } = body;

        if (!saleId) {
            return NextResponse.json({ error: 'Falta el ID de la venta' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Obtener la transacción base para identificar la orden
        const { data: baseTx, error: baseTxError } = await supabaseAdmin
            .from('transacciones')
            .select('*')
            .eq('id', saleId)
            .maybeSingle();

        if (baseTxError || !baseTx) {
            return NextResponse.json({ error: 'Transacción base no encontrada' }, { status: 404 });
        }

        // 2. Buscar todas las transacciones vinculadas (orden_pedido o pago_id idénticos)
        const orderKey = baseTx.orden_pedido;
        const paymentKey = baseTx.pago_id;

        let query = supabaseAdmin
            .from('transacciones')
            .select(`
                *,
                comprador:perfiles!comprador_id (*),
                vendedor:perfiles!vendedor_id (*)
            `);

        if (orderKey) {
            query = query.eq('orden_pedido', orderKey);
        } else if (paymentKey) {
            query = query.eq('pago_id', paymentKey);
        } else {
            query = query.eq('id', baseTx.id);
        }

        const { data: allTxs, error: allTxsError } = await query;

        if (allTxsError || !allTxs || allTxs.length === 0) {
            return NextResponse.json({ error: 'No se pudieron recuperar los artículos de la orden' }, { status: 404 });
        }

        const formatMXN = (val: number) => {
            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
        };

        // 3. Procesar lista de artículos
        const items = await Promise.all(allTxs.map(async (t) => {
            const details = await fetchLicenseDetails(supabaseAdmin, t);
            const montoDesc = Number(t.monto_descuento || 0);
            return {
                name: t.nombre_producto || details?.productName || 'Producto',
                type: t.tipo_producto || 'Producto',
                license: t.tipo_licencia || details?.licenseType || 'Licencia',
                priceUnit: formatMXN((Number(t.precio_total || 0) + montoDesc)),
                price: formatMXN(t.precio_total || 0),
                discount: montoDesc > 0 ? formatMXN(montoDesc) : undefined
            };
        }));

        const totalAcumulado = allTxs.reduce((sum, t) => sum + Number(t.precio_total || 0), 0);
        const descuentoAcumulado = allTxs.reduce((sum, t) => sum + Number(t.monto_descuento || 0), 0);
        const subtotalAcumulado = totalAcumulado + descuentoAcumulado;

        // Info de cabecera (usando la baseTx o la primera de la lista)
        const firstTx = allTxs[0];
        // Buscamos si hay algún código de cupón en cualquiera de las transacciones de esta orden
        const couponCode = allTxs.find(t => t.codigo_cupon)?.codigo_cupon;
        
        const salesNoteData = {
            orderId: orderKey || paymentKey || baseTx.id,
            stripeId: paymentKey?.startsWith('cs_') || paymentKey?.startsWith('pi_') ? paymentKey : (paymentKey || undefined),
            transactionDate: new Date(baseTx.fecha_creacion).toLocaleDateString('es-MX'),
            items,
            subtotal: formatMXN(subtotalAcumulado),
            descuento: descuentoAcumulado > 0 ? formatMXN(descuentoAcumulado) : undefined,
            couponCode: couponCode || undefined,
            total: formatMXN(totalAcumulado),
            metodoPago: baseTx.metodo_pago === 'card' ? 'Tarjeta de Crédito/Débito' : (baseTx.metodo_pago || 'Online'),
            sellerRealName: firstTx.vendedor?.nombre_completo || firstTx.vendedor?.nombre_usuario || 'Productor Tianguis',
            sellerArtisticName: firstTx.vendedor?.nombre_artistico || firstTx.vendedor?.nombre_usuario || 'Artista',
            sellerEmail: firstTx.vendedor?.correo || '',
            buyerRealName: firstTx.comprador?.nombre_completo || firstTx.comprador?.nombre_usuario || 'Cliente',
            buyerArtisticName: firstTx.comprador?.nombre_artistico || undefined,
            buyerEmail: firstTx.comprador?.correo || '',
        };

        // 4. Generar el PDF
        const pdfBuffer = await renderSalesNoteToBuffer(salesNoteData as any);

        const filename = `Tianguis Beats - ${salesNoteData.orderId} - Recibo.pdf`;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error: any) {
        console.error('Error en generar-recibo:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
