import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client initialized safely to avoid build-time errors when ENV is missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/**
 * API Route: Verificación Pública de Transacciones
 * Permite que cualquier usuario con el Order ID confirme la validez de una licencia.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('order') || searchParams.get('id');

        if (!orderId) {
            return NextResponse.json({ error: 'Falta el ID de verificación' }, { status: 400 });
        }

        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized. Missing environment variables.');
            return NextResponse.json({ error: 'Servicio no configurado' }, { status: 500 });
        }

        // Buscamos la transacción por ID, Orden de Pedido o ID de Pago
        let query;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

        if (isUUID) {
            query = supabaseAdmin
                .from('transacciones')
                .select(`
                    id, orden_pedido, pago_id, fecha_creacion, nombre_producto, tipo_producto, tipo_licencia, estado_pago, codigo_cupon, monto_descuento, precio_total, monto_total,
                    comprador:perfiles!comprador_id (nombre_artistico, nombre_usuario),
                    vendedor:perfiles!vendedor_id (nombre_artistico, nombre_usuario)
                `)
                .or(`id.eq.${orderId},orden_pedido.eq.${orderId},pago_id.eq.${orderId}`);
        } else {
            query = supabaseAdmin
                .from('transacciones')
                .select(`
                    id, orden_pedido, pago_id, fecha_creacion, nombre_producto, tipo_producto, tipo_licencia, estado_pago, codigo_cupon, monto_descuento, precio_total, monto_total,
                    comprador:perfiles!comprador_id (nombre_artistico, nombre_usuario),
                    vendedor:perfiles!vendedor_id (nombre_artistico, nombre_usuario)
                `)
                .or(`orden_pedido.eq.${orderId},pago_id.eq.${orderId}`);
        }

        const { data: allTxs, error } = await query
            .in('estado_pago', ['completado', 'completed', 'valido', 'valid', 'active', 'succeeded', 'paid', 'success', 'pagada', 'completada'])
            .order('fecha_creacion', { ascending: true });

        if (error || !allTxs || allTxs.length === 0) {
            console.warn(`Verificación fallida para ID: ${orderId}`, error);
            return NextResponse.json({ error: 'Pedido no encontrado o no verificado' }, { status: 404 });
        }

        const baseTx = allTxs[0];
        const formatMXN = (val: number) => `$ ${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const totalAcumulado = allTxs.reduce((sum: number, t: any) => sum + Number(t.monto_total || t.precio_total || 0), 0);
        const descuentoAcumulado = allTxs.reduce((sum: number, t: any) => sum + Number(t.monto_descuento || 0), 0);
        const subtotalAcumulado = totalAcumulado + descuentoAcumulado;
        const couponCode = allTxs.find((t: any) => t.codigo_cupon)?.codigo_cupon;

        const items = allTxs.map((t: any) => ({
            name: t.nombre_producto || 'Producto',
            type: t.tipo_producto || 'Producto',
            license: t.tipo_licencia || 'Licencia',
            price: formatMXN(Number(t.monto_total || t.precio_total || 0))
        }));

        const comprador = Array.isArray(baseTx.comprador) ? baseTx.comprador[0] : baseTx.comprador;
        const vendedor = Array.isArray(baseTx.vendedor) ? baseTx.vendedor[0] : baseTx.vendedor;

        return NextResponse.json({
            isValid: true,
            orderId: baseTx.orden_pedido || baseTx.id,
            pagoId: baseTx.pago_id || 'INTERNAL_TX',
            transactionDate: baseTx.fecha_creacion,
            buyerArtisticName: comprador?.nombre_artistico || comprador?.nombre_usuario || 'Adquiriente Verificado',
            sellerArtisticName: vendedor?.nombre_artistico || vendedor?.nombre_usuario || 'Tianguis Beats',
            subtotal: formatMXN(subtotalAcumulado),
            descuento: descuentoAcumulado > 0 ? formatMXN(descuentoAcumulado) : undefined,
            total: formatMXN(totalAcumulado),
            couponCode: couponCode || undefined,
            items
        });

    } catch (error: any) {
        console.error('Error en API Verify:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
