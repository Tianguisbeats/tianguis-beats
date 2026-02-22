"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Package,
    Download,
    ExternalLink,
    Clock,
    Plus,
    MoveVertical,
    Save,
    ChevronUp,
    ChevronDown,
    List,
    Briefcase,
    DollarSign,
    MessageSquare,
    Mail,
    ShoppingBag,
    X,
    ChevronRight,
    Search,
    Filter,
    Music,
    Cpu,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { downloadLicensePDF } from '@/lib/pdfGenerator';
import { LicenseType } from '@/lib/licenses';
import { getBeatFulfillmentLinks, getSoundKitFulfillmentLink } from '@/lib/fulfillment';

type OrderItem = {
    id: string;
    product_type: string;
    name: string;
    price: number;
    license_type?: string;
    metadata?: any;
    project_id?: string; // If it's a service
};

type Order = {
    id: string;
    created_at: string;
    total_amount: number;
    currency: string;
    status: string;
    items: OrderItem[];
    payment_method?: string;
    stripe_id?: string;
};

export default function MyPurchasesPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // Fetch orders and their items using the new Spanish schema
            const { data: ordersData, error: ordersError } = await supabase
                .from('ordenes')
                .select(`
                    id,
                    fecha_creacion,
                    monto_total,
                    moneda,
                    estado,
                    metodo_pago,
                    stripe_id,
                    items_orden (
                        id,
                        tipo_producto,
                        nombre,
                        precio,
                        tipo_licencia,
                        metadatos
                    )
                `)
                .eq('usuario_id', user.id)
                .order('fecha_creacion', { ascending: false });

            if (ordersError) throw ordersError;

            // Fetch linked projects
            const { data: projectsData } = await supabase
                .from('service_projects')
                .select('id, order_item_id')
                .in('order_item_id', ordersData.flatMap(o => o.items_orden.map((i: any) => i.id)));

            // Map items to include project_id
            const formattedOrders = (ordersData || []).map(order => ({
                id: order.id,
                created_at: order.fecha_creacion,
                total_amount: order.monto_total,
                currency: order.moneda || 'MXN',
                status: order.estado,
                payment_method: order.metodo_pago,
                stripe_id: order.stripe_id,
                items: (order.items_orden || []).map((item: any) => ({
                    id: item.id,
                    product_type: item.tipo_producto,
                    name: item.nombre,
                    price: item.precio,
                    license_type: item.tipo_licencia,
                    metadata: item.metadatos,
                    project_id: projectsData?.find(p => p.order_item_id === item.id)?.id
                }))
            }));

            setOrders(formattedOrders);
        } catch (err) {
            console.error("Error fetching orders:", err);
            // Fallback for demo/dev if tables don't exist yet but UI is being tested
            // showToast("Usando datos de prueba (Tablas no encontradas)", "info");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'in process': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'beat': return <Music size={18} />;
            case 'sound_kit': return <Cpu size={18} />;
            case 'service': return <Briefcase size={18} />;
            default: return <Package size={18} />;
        }
    };

    const handleDownloadFiles = async (item: OrderItem) => {
        try {
            showToast("Generando enlaces de descarga seguros...", "info");
            let links: { label: string, url: string }[] = [];
            const metadata = item.metadata || {};

            if (item.product_type === 'beat') {
                links = await getBeatFulfillmentLinks(metadata, item.license_type || 'basic');
            } else if (item.product_type === 'sound_kit') {
                const link = await getSoundKitFulfillmentLink(metadata);
                if (link) links.push(link);
            }

            if (links.length === 0) {
                showToast("No se encontraron archivos para descargar.", "error");
                return;
            }

            // Abrir el primero inmediatamente
            window.open(links[0].url, '_blank');
            showToast(`Iniciando descarga: ${links[0].label}`, "success");

            // Si hay más archivos, abrirlos con un pequeño retraso
            if (links.length > 1) {
                links.slice(1).forEach((link, idx) => {
                    setTimeout(() => window.open(link.url, '_blank'), (idx + 1) * 800);
                });
            }
        } catch (error) {
            console.error("Error in download flow:", error);
            showToast("Error al procesar la descarga", "error");
        }
    };

    const handleDownloadLicense = (order: Order, item: OrderItem) => {
        try {
            // Mapping product type and license
            let licenseType: LicenseType = 'basic';
            if (item.product_type === 'sound_kit') licenseType = 'soundkit';
            else if (item.product_type === 'service') licenseType = 'service';
            else licenseType = (item.license_type?.toLowerCase() as LicenseType) || 'basic';

            downloadLicensePDF({
                type: licenseType,
                producerName: 'Tianguis Beats Producer', // This should ideally be extracted from metadata or item seller name
                buyerName: 'Cliente Tianguis', // Should ideally be fetched from profile
                productName: item.name,
                purchaseDate: new Date(order.created_at).toLocaleDateString(),
                amount: item.price,
                orderId: order.id
            });

            showToast("Licencia generada con éxito", "success");
        } catch (error) {
            console.error("Error generating PDF:", error);
            showToast("Error al generar la licencia", "error");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-3xl mb-4" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-white/5 rounded-full" />
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-3">Historial y <span className="text-accent">detalles de las compras</span></h1>
                <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Package size={12} className="text-accent" />
                    Detalles de tus compras y enlaces de descarga
                </p>
            </div>

            {orders.length === 0 ? (
                <div className="py-24 text-center bg-white/50 dark:bg-white/5 rounded-[3.5rem] border-2 border-dashed border-border/50">
                    <div className="w-20 h-20 bg-card rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-muted shadow-inner opacity-40">
                        <Search size={32} />
                    </div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">No has realizado compras aún</h3>
                    <p className="text-muted text-[11px] font-bold uppercase tracking-widest max-w-xs mx-auto mb-10 opacity-70">
                        Explora el catálogo y encuentra los mejores beats y servicios para tu música.
                    </p>
                    <Link href="/beats" className="bg-foreground text-background dark:bg-white dark:text-slate-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                        Ir al Catálogo
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-3xl border border-border/50 rounded-[3rem] overflow-hidden group hover:border-accent/30 transition-all duration-500 shadow-xl shadow-black/5">
                            {/* Order Header */}
                            <div className="px-8 py-6 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-1">
                                            <span className="text-muted">Compra:</span>
                                            <span className="text-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-muted font-bold uppercase tracking-widest">
                                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                            <div className="w-1 h-1 bg-border rounded-full" />
                                            <span>{order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Total Pagado</span>
                                        <span className="font-black text-xl text-foreground tracking-tighter">${order.total_amount} <span className="text-[10px] opacity-40 uppercase">{order.currency}</span></span>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)} animate-in fade-in zoom-in duration-500`}>
                                            {order.status === 'completado' ? 'Completado' : order.status}
                                        </div>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1"
                                        >
                                            Ver más detalles <ChevronRight size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-4 space-y-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="bg-card/40 dark:bg-white/5 border border-transparent hover:border-border/50 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all group/item">
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-14 h-14 bg-background rounded-[1.25rem] border border-border/30 flex items-center justify-center text-accent/50 group-hover/item:text-accent transition-colors">
                                                {getItemIcon(item.product_type)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-foreground tracking-tight group-hover/item:text-accent transition-colors">{item.name}</h4>
                                                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                                                    {item.product_type === 'beat' ? `Licencia ${item.license_type || 'MP3'}` :
                                                        item.product_type === 'sound_kit' ? 'Sound Kit HQ' :
                                                            item.product_type === 'service' ? 'Servicio Profesional' : 'Suscripción'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                                            {item.product_type === 'service' ? (
                                                <>
                                                    <Link
                                                        href={`/studio/purchases/service/${item.project_id}`}
                                                        className="flex-1 md:flex-none px-6 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 group/btn"
                                                    >
                                                        Detalles
                                                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDownloadLicense(order, item)}
                                                        className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/10 text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Download size={14} />
                                                        Contrato
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleDownloadFiles(item)}
                                                        className="flex-1 md:flex-none px-6 py-3 bg-foreground text-background dark:bg-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2"
                                                    >
                                                        <Download size={14} />
                                                        Archivos
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadLicense(order, item)}
                                                        className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/10 text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Download size={14} />
                                                        Licencia
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setSelectedOrder(null)}
                    />
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] animate-in zoom-in fade-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-accent/5 to-transparent">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Detalles de Compra</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Orden #{selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 scrollbar-hide">
                            {/* General Info Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">Método de Pago</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">{selectedOrder.payment_method || 'Tarjeta de Crédito / Stripe'}</p>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">Fecha de Pago</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">Total Pagado</p>
                                    <p className="text-xl font-black text-accent tracking-tighter">${selectedOrder.total_amount} <span className="text-[10px] uppercase">{selectedOrder.currency}</span></p>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">Estado del Pedido</p>
                                    <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">{selectedOrder.status === 'completado' ? 'PAGO VERIFICADO' : selectedOrder.status.toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Itemized Breakdown */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                    <Package size={14} className="text-accent" />
                                    Desglose de Productos
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-between group hover:border-accent/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                                    {getItemIcon(item.product_type)}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm text-white uppercase tracking-tight">{item.name}</h5>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                        {item.product_type === 'beat' ? `Licencia ${item.license_type}` : item.product_type === 'plan' ? `Suscripción ${item.metadata?.tier?.toUpperCase() || 'PRO'}` : 'Recurso Digital'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-white tracking-tighter">${item.price} <span className="text-[9px] text-muted">{selectedOrder.currency}</span></p>
                                                {item.product_type !== 'plan' && (
                                                    <button
                                                        onClick={() => handleDownloadFiles(item)}
                                                        className="text-[9px] font-black text-accent uppercase tracking-widest mt-1 hover:underline"
                                                    >
                                                        Re-descargar Archivos
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Official References */}
                            <div className="p-6 bg-slate-950/50 rounded-[2.5rem] border border-white/5">
                                <div className="flex items-center gap-4 text-muted/40">
                                    <div className="w-px h-10 bg-white/10" />
                                    <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wide">
                                        ID de Transacción: {selectedOrder.stripe_id || 'ID NO DISPONIBLE'}<br />
                                        Esta es una transacción digital segura procesada por Tianguis Beats.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-black/20 flex justify-center">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
