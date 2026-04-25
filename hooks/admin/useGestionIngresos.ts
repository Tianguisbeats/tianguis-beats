import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateEarnings } from '@/lib/finance-utils';
import { generarComprobanteAdminPDF } from '@/lib/pdf-recibos';
import { supabase } from '@/lib/supabase';

interface OpcionesGestionIngresos {
    onInfo?: (mensaje: string) => void;
    onError?: (mensaje: string) => void;
    onExito?: (mensaje: string) => void;
}

export function useGestionIngresos(opts: OpcionesGestionIngresos = {}) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const optsRef = useRef(opts);

    useEffect(() => {
        optsRef.current = opts;
    }, [opts]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const { data: txData, error: txError } = await supabase
                .from('transacciones')
                .select(`
                    *,
                    comprador:comprador_id(nombre_usuario, nombre_artistico, correo, nivel_suscripcion),
                    vendedor:vendedor_id(nombre_usuario, nombre_artistico, correo, nivel_suscripcion)
                `)
                .order('fecha_creacion', { ascending: false });

            if (txError) throw txError;

            const groupedOrders: Record<string, any> = {};

            (txData || []).forEach(tx => {
                const orderKey = tx.orden_pedido || tx.pago_id || tx.id;

                if (!groupedOrders[orderKey]) {
                    groupedOrders[orderKey] = {
                        id: orderKey,
                        pago_id: tx.pago_id,
                        orden_pedido: tx.orden_pedido,
                        created_at: tx.fecha_creacion,
                        total_amount: 0,
                        currency: tx.moneda || 'MXN',
                        status: tx.estado_pago || 'completado',
                        payment_method: tx.metodo_pago || 'Stripe',
                        comprador: tx.comprador,
                        vendedor: tx.vendedor,
                        items: [],
                    };
                }

                groupedOrders[orderKey].total_amount += Number(tx.precio_total || tx.precio || 0);
                groupedOrders[orderKey].items.push({
                    id: tx.id,
                    product_type: tx.tipo_producto,
                    name: tx.nombre_producto,
                    price: tx.precio_total || tx.precio || 0,
                    license_type: tx.tipo_licencia,
                    metadata: tx.metadatos,
                });
            });

            setOrders(Object.values(groupedOrders).map(order => {
                const sellerPlan = order.vendedor?.nivel_suscripcion || 'free';
                const earnings = calculateEarnings(order.total_amount, sellerPlan);
                return { ...order, earnings };
            }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al cargar pedidos e ingresos');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const totalHistorical = useMemo(
        () => orders.reduce((acc, order) => acc + order.total_amount, 0),
        [orders]
    );

    const totalMonthly = useMemo(() => {
        const now = new Date();
        return orders.filter(order => {
            const date = new Date(order.created_at);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).reduce((acc, order) => acc + order.total_amount, 0);
    }, [orders]);

    const filteredOrders = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return orders.filter(o => {
            const matchesSearch =
                o.id.toLowerCase().includes(q) ||
                (o.orden_pedido && o.orden_pedido.toLowerCase().includes(q)) ||
                o.items.some((i: any) =>
                    i.name.toLowerCase().includes(q) ||
                    (i.license_type && i.license_type.toLowerCase().includes(q))
                );

            const matchesCategory = categoryFilter === 'all' || o.items.some((i: any) => i.product_type === categoryFilter);
            return matchesSearch && matchesCategory;
        });
    }, [categoryFilter, orders, searchTerm]);

    const handleDownloadReceipt = useCallback(async (order: any) => {
        try {
            optsRef.current.onInfo?.('Generando comprobante (Admin)...');
            await generarComprobanteAdminPDF(order);
            optsRef.current.onExito?.('Descarga completada');
        } catch (e) {
            console.error(e);
            optsRef.current.onError?.('Error al generar PDF');
        }
    }, []);

    return {
        orders,
        filteredOrders,
        loading,
        selectedOrder,
        setSelectedOrder,
        searchTerm,
        setSearchTerm,
        categoryFilter,
        setCategoryFilter,
        totalHistorical,
        totalMonthly,
        handleDownloadReceipt,
        refetch: fetchOrders,
    };
}
