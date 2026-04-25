import { NextRequest, NextResponse } from 'next/server';
import { obtenerSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * API Route: Verificación Pública de Transacciones
 * Permite que cualquier usuario con el Order ID confirme la validez de una licencia.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const orderIdRaw = searchParams.get('order') || searchParams.get('id');

        if (!orderIdRaw) {
            return NextResponse.json({ error: 'Falta el ID de verificación' }, { status: 400 });
        }

        // Sanitización: el ID solo puede contener caracteres alfanuméricos, guiones y guion bajo.
        // Esto previene que un atacante inyecte comas u operadores en el filtro .or() de PostgREST.
        const orderId = orderIdRaw.trim();
        if (!/^[A-Za-z0-9_-]{4,64}$/.test(orderId)) {
            return NextResponse.json({ error: 'Formato de ID inválido' }, { status: 400 });
        }

        const supabaseAdmin = obtenerSupabaseAdmin();

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

        // Búsqueda en paralelo por cada campo (evita interpolar el ID en .or() de PostgREST,
        // que es vulnerable si el valor contiene comas o paréntesis).
        const SELECT = `
            id, orden_pedido, pago_id, fecha_creacion, nombre_producto, tipo_producto,
            tipo_licencia, estado_pago, codigo_cupon, monto_descuento, precio_total, monto_total,
            comprador:perfiles!comprador_id (nombre_artistico, nombre_usuario),
            vendedor:perfiles!vendedor_id (nombre_artistico, nombre_usuario)
        `;
        const ESTADOS_VALIDOS = ['completado', 'completed', 'valido', 'valid', 'active', 'succeeded', 'paid', 'success', 'pagada', 'completada'];

        const consultas = [
            supabaseAdmin.from('transacciones').select(SELECT).eq('orden_pedido', orderId).in('estado_pago', ESTADOS_VALIDOS),
            supabaseAdmin.from('transacciones').select(SELECT).eq('pago_id', orderId).in('estado_pago', ESTADOS_VALIDOS),
        ];
        if (isUUID) {
            consultas.push(supabaseAdmin.from('transacciones').select(SELECT).eq('id', orderId).in('estado_pago', ESTADOS_VALIDOS));
        }

        const resultados = await Promise.all(consultas);
        const allTxs = resultados
            .flatMap(r => r.data || [])
            .sort((a: any, b: any) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime());
        const error = resultados.find(r => r.error)?.error;

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
