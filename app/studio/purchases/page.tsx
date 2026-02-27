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
    CheckCircle2,
    Crown,
    FileText
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
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const { showToast } = useToast();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // Fetch transactions natively from the new single schema
            const { data: txData, error: txError } = await supabase
                .from('transacciones')
                .select(`
                    *,
                    vendedor:perfiles!vendedor_id (
                        nombre_artistico,
                        nombre_usuario,
                        foto_perfil
                    )
                `)
                .eq('comprador_id', user.id)
                .order('fecha_creacion', { ascending: false });

            if (txError) throw txError;

            // Group transactions by pago_id to simulate the "Order -> Items" visual structure
            const groupedOrders: Record<string, any> = {};

            (txData || []).forEach(tx => {
                const pagoId = tx.pago_id || tx.id; // Group key, prioritizing pago_id
                if (!groupedOrders[pagoId]) {
                    groupedOrders[pagoId] = {
                        id: pagoId,
                        created_at: tx.fecha_creacion,
                        total_amount: 0,
                        currency: tx.moneda || 'MXN',
                        status: tx.estado_pago,
                        payment_method: tx.metodo_pago,
                        stripe_id: tx.pago_id,
                        items: []
                    };
                }

                groupedOrders[pagoId].total_amount += Number(tx.precio_total);

                groupedOrders[pagoId].items.push({
                    id: tx.id,
                    product_type: tx.tipo_producto,
                    name: tx.nombre_producto,
                    price: tx.precio_total,
                    license_type: tx.tipo_licencia,
                    metadata: tx.metadatos,
                    producer_id: tx.vendedor_id,
                    buyer_id: tx.comprador_id
                });
            });

            const formattedOrders = Object.values(groupedOrders);

            // Fetch linked projects (if any services were bought)
            const itemIds = formattedOrders.flatMap((o: any) => o.items.map((i: any) => i.id));
            if (itemIds.length > 0) {
                const { data: projectsData } = await supabase
                    .from('proyectos_servicio')
                    .select('id, transaccion_id')
                    .in('transaccion_id', itemIds);

                formattedOrders.forEach((order: any) => {
                    order.items.forEach((item: any) => {
                        item.project_id = projectsData?.find(p => p.transaccion_id === item.id)?.id;
                    });
                });
            }

            // Ensure chronological order
            formattedOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setOrders(formattedOrders as Order[]);
        } catch (err) {
            console.error("Error fetching orders:", err);
            // Fallback for demo/dev if tables don't exist yet but UI is being tested
            // showToast("Usando datos de prueba (Tablas no encontradas)", "info");
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = React.useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.items.some(item =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.product_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.license_type && item.license_type.toLowerCase().includes(searchTerm.toLowerCase()))
                );

            const matchesFilter = filterType === "all" ||
                order.items.some(item => item.product_type === filterType);

            return matchesSearch && matchesFilter;
        });
    }, [orders, searchTerm, filterType]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'text-success bg-success/10 border-success/20';
            case 'pending': return 'text-warning bg-warning/10 border-warning/20';
            case 'in process': return 'text-info bg-info/10 border-info/20';
            default: return 'text-muted bg-muted/10 border-muted/20';
        }
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'beat': return <Music size={18} />;
            case 'sound_kit': return <Cpu size={18} />;
            case 'service': return <Briefcase size={18} />;
            case 'plan': return <Crown size={18} className="text-accent" />;
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
            // 1. Intentar descargar el PDF oficial generado y guardado en la Base de Datos
            const savedPdfUrl = item.metadata?.contract_pdf_url || item.metadata?.contractPdfUrl;

            if (savedPdfUrl) {
                showToast("Obteniendo Licencia Oficial...", "info");
                window.open(savedPdfUrl, '_blank');
                return;
            }

            // 2. Fallback: Si no hay URL (compras antiguas antes de esta actualización), se genera en vivo como antes
            showToast("Generando certificado legacy...", "info");
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

            showToast("Licencia legacy generada con éxito", "success");
        } catch (error) {
            console.error("Error generating PDF:", error);
            showToast("Error al procesar la licencia", "error");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 bg-muted/10 rounded-3xl mb-4" />
            <div className="h-4 w-32 bg-muted/10 rounded-full" />
        </div>
    );

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-4">
                        Mis <span className="text-accent underline decoration-border underline-offset-8">Compras</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-muted">
                        <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/10">
                            <Package size={12} /> Bóveda Segura
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                            <Clock size={12} /> Sincronizado
                        </span>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-80" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por beat, licencia o ID..."
                        className="w-full bg-accent/5 border border-border rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all placeholder:text-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest px-2">
                        <Filter size={14} /> Filtrar:
                    </div>
                    <select
                        className="bg-accent/5 border border-border rounded-2xl py-4 px-6 text-[10px] font-bold text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all appearance-none cursor-pointer min-w-[180px]"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Ver Todo</option>
                        <option value="beat">Beats</option>
                        <option value="sound_kit">Sound Kits</option>
                        <option value="service">Servicios</option>
                        <option value="plan">Suscripciones</option>
                    </select>
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="py-24 text-center bg-white/50 dark:bg-white/5 rounded-[3.5rem] border-2 border-dashed border-border/50">
                    <div className="w-20 h-20 bg-card rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-muted shadow-inner opacity-40">
                        <ShoppingBag size={32} />
                    </div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">
                        {searchTerm || filterType !== 'all' ? 'No hay resultados para tu búsqueda' : 'No has realizado compras aún'}
                    </h3>
                    <p className="text-muted text-[11px] font-bold uppercase tracking-widest max-w-xs mx-auto mb-10 opacity-70">
                        {searchTerm || filterType !== 'all' ? 'Intenta con otros términos o limpia los filtros.' : 'Explora el catálogo y encuentra los mejores beats y servicios para tu música.'}
                    </p>
                    {(searchTerm || filterType !== 'all') ? (
                        <button
                            onClick={() => { setSearchTerm(""); setFilterType("all"); }}
                            className="bg-accent text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                        >
                            Limpiar Filtros
                        </button>
                    ) : (
                        <Link href="/beats" className="bg-foreground text-background dark:bg-foreground dark:text-background px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                            Ir al Catálogo
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="bg-card border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-[3rem] relative overflow-hidden transition-all duration-500 hover:border-accent/50 hover:shadow-2xl dark:hover:shadow-accent/10 group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/20 to-accent opacity-20 group-hover:opacity-40 transition-opacity" />

                            {/* Order Header */}
                            <div className="px-8 py-8 border-b border-border flex flex-wrap lg:flex-nowrap items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-accent/5 text-accent rounded-3xl flex items-center justify-center border border-accent/10 group-hover:scale-105 transition-transform duration-500 shadow-xl shadow-accent/5">
                                        <Package size={24} />
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
                            <div className="p-8 space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="bg-accent/5 border border-border hover:bg-accent/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all group/item hover:border-accent/40 hover:shadow-md dark:hover:shadow-accent/5">
                                        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                                            <div className="w-16 h-16 bg-card border border-border shadow-xl rounded-[1.25rem] flex items-center justify-center text-muted group-hover/item:text-accent group-hover/item:scale-105 transition-all duration-500 shrink-0">
                                                {getItemIcon(item.product_type)}
                                            </div>
                                            <div className="text-center md:text-left min-w-0">
                                                <h4 className="font-black text-lg text-foreground uppercase tracking-tight group-hover/item:text-accent transition-colors truncate max-w-[280px]">
                                                    {item.name}
                                                </h4>
                                                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                                    <span className="text-[10px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] inline-block">
                                                        {item.product_type === 'beat' ? `Licencia ${item.license_type || 'MP3'}` :
                                                            item.product_type === 'sound_kit' ? 'Sound Kit HQ' :
                                                                item.product_type === 'service' ? 'Servicio Profesional' : 'Suscripción'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                                            {item.product_type === 'service' ? (
                                                <>
                                                    <Link
                                                        href={`/studio/purchases/service/${item.project_id}`}
                                                        className="flex-1 md:flex-none px-8 py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2 group/btn"
                                                    >
                                                        Estado del Proyecto
                                                        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDownloadLicense(order, item)}
                                                        className="flex-1 md:flex-none px-6 py-4 bg-accent-soft border border-border text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/10 hover:border-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <FileText size={14} />
                                                        Contrato PDF
                                                    </button>
                                                </>
                                            ) : item.product_type === 'plan' ? (
                                                <span className="px-6 py-3.5 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.3em] bg-success/10 text-success border border-success/20 self-start md:self-auto shadow-sm">
                                                    Plan Acreditado <CheckCircle2 size={16} />
                                                </span>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleDownloadFiles(item)}
                                                        className="flex-1 md:flex-none px-8 py-4 bg-foreground text-background dark:bg-foreground dark:text-background rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 dark:shadow-accent/5 flex items-center justify-center gap-2"
                                                    >
                                                        <Download size={14} />
                                                        Descargar HQ
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadLicense(order, item)}
                                                        className="flex-1 md:flex-none px-6 py-4 bg-accent-soft border border-border text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/10 hover:border-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <FileText size={14} />
                                                        Licencia PDF
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
                        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setSelectedOrder(null)}
                    />
                    <div className="relative w-full max-w-2xl bg-background border border-border rounded-[3rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(37,99,235,0.3)] animate-in zoom-in fade-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-border flex items-center justify-between bg-gradient-to-r from-accent/5 to-transparent">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Detalles de Compra</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Orden #{selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-12 h-12 rounded-2xl bg-accent-soft border border-border flex items-center justify-center text-foreground hover:bg-accent/10 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 scrollbar-hide">
                            {/* General Info Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 bg-card border border-border rounded-2xl">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">Método de Pago</p>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{selectedOrder.payment_method || 'Tarjeta de Crédito / Stripe'}</p>
                                </div>
                                <div className="p-5 bg-card border border-border rounded-2xl">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">Fecha de Pago</p>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                                </div>
                                <div className="p-5 bg-card border border-border rounded-2xl">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">Total Pagado</p>
                                    <p className="text-xl font-black text-accent tracking-tighter">${selectedOrder.total_amount} <span className="text-[10px] uppercase">{selectedOrder.currency}</span></p>
                                </div>
                                <div className="p-5 bg-card border border-border rounded-2xl">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">Estado del Pedido</p>
                                    <p className="text-sm font-black text-success uppercase tracking-widest">{selectedOrder.status === 'completado' ? 'PAGO VERIFICADO' : selectedOrder.status.toUpperCase()}</p>
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
                                        <div key={item.id} className="p-6 rounded-[2rem] bg-card border border-border flex items-center justify-between group hover:border-accent/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                                    {getItemIcon(item.product_type)}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm text-foreground uppercase tracking-tight">{item.name}</h5>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                        {item.product_type === 'beat' ? `Licencia ${item.license_type}` : item.product_type === 'plan' ? `Suscripción ${item.metadata?.tier?.toUpperCase() || 'PRO'}` : 'Recurso Digital'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-foreground tracking-tighter">${item.price} <span className="text-[9px] text-muted">{selectedOrder.currency}</span></p>
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
                            <div className="p-6 bg-card/50 rounded-[2.5rem] border border-border/10">
                                <div className="flex items-center gap-4 text-muted/40">
                                    <div className="w-px h-10 bg-border/20" />
                                    <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wide">
                                        ID de Transacción: {selectedOrder.stripe_id || 'ID NO DISPONIBLE'}<br />
                                        Esta es una transacción digital segura procesada por Tianguis Beats.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-background flex justify-center">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-full py-5 bg-foreground text-background dark:bg-foreground dark:text-background rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95"
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
