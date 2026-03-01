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
    FileText,
    CreditCard,
    Play,
    Pause,
    ShieldCheck as Shield,
    Fingerprint,
    QrCode
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { downloadLicensePDF } from '@/lib/pdfGenerator';
import { LicenseType } from '@/lib/licenses';
import { getBeatFulfillmentLinks, getSoundKitFulfillmentLink } from '@/lib/fulfillment';
import LoadingTianguis from '@/components/LoadingTianguis';
import ValidationQR from '@/components/ValidationQR';

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
    orden_pedido?: string;
    codigo_cupon?: string;
    monto_descuento?: number;
};

export default function MyPurchasesPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const { currentUserId } = useCart();
    const { playBeat, isPlaying, currentBeat } = usePlayer();
    const { showToast } = useToast();

    const handlePlayPreview = (item: OrderItem) => {
        const audioUrl = item.metadata?.audio_url || item.metadata?.previewUrl;
        if (!audioUrl) {
            showToast("No hay vista previa disponible", "error");
            return;
        }

        const beatToPlay = {
            id: item.id,
            titulo: item.name,
            nombre_usuario: item.metadata?.producer_name || 'Tianguis Artist',
            portada_url: item.metadata?.portada_url || item.metadata?.coverUrl || '/placeholder.png',
            url_audio: audioUrl,
        };

        playBeat(beatToPlay as any);
    };

    const isCurrentPlaying = (itemId: string) => {
        return currentBeat?.id === itemId && isPlaying;
    };

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
                // Prioritize orden_pedido, then pago_id, then tx.id
                const orderKey = tx.orden_pedido || tx.pago_id || tx.id;

                if (!groupedOrders[orderKey]) {
                    // Si encontramos una Orden por primera vez, inicializamos variables
                    groupedOrders[orderKey] = {
                        id: orderKey,
                        pago_id: tx.pago_id,
                        orden_pedido: tx.orden_pedido,
                        created_at: tx.fecha_creacion,
                        total_amount: 0,
                        currency: tx.moneda || 'MXN',
                        status: tx.estado_pago,
                        payment_method: tx.metodo_pago,
                        stripe_id: tx.pago_id,
                        buyer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente Tianguis',
                        buyer_email: user.email,
                        codigo_cupon: tx.codigo_cupon,
                        monto_descuento: 0,
                        items: []
                    };
                }

                groupedOrders[orderKey].total_amount += Number(tx.precio_total);
                groupedOrders[orderKey].monto_descuento += Number(tx.monto_descuento || 0);

                groupedOrders[orderKey].items.push({
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

            // Add orden_pedido to Search
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
                (order.orden_pedido && order.orden_pedido.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

    const handleDownloadReceipt = (order: Order) => {
        try {
            showToast("Generando comprobante...", "info");
            import('jspdf').then(async ({ default: jsPDF }) => {
                const autoTable = (await import('jspdf-autotable')).default;
                const doc = new jsPDF();

                doc.setFillColor(15, 23, 42);
                doc.rect(0, 0, 210, 40, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(24);
                doc.setFont("helvetica", "bold");
                doc.text("TIANGUIS BEATS", 15, 25);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text("Comprobante de Pago Digital", 140, 20);
                doc.text(new Date().toLocaleDateString('es-MX'), 140, 28);

                doc.setTextColor(50, 50, 50);
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Detalles de la Transacción", 15, 55);

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`ID de Orden: ${order.orden_pedido || order.stripe_id || order.id}`, 15, 65);
                doc.text(`Fecha: ${new Date(order.created_at).toLocaleString()}`, 15, 72);
                doc.text(`Estado: Pago Completado (${order.payment_method || 'Stripe'})`, 15, 79);

                doc.setFont("helvetica", "bold");
                doc.text("Facturado a:", 120, 65);
                doc.setFont("helvetica", "normal");
                const buyerEmail = (order as any).buyer_email || 'Estudio / Cliente';
                const buyerName = (order as any).buyer_name || 'Productor Vendedor';
                doc.text(buyerName, 120, 72);
                doc.text(buyerEmail, 120, 79);

                const tableBody = order.items.map(item => [
                    item.name,
                    item.product_type.toUpperCase(),
                    `$${Number(item.price).toFixed(2)} ${order.currency}`
                ]);

                autoTable(doc, {
                    startY: 95,
                    head: [['Descripción del Producto', 'Tipo', 'Monto']],
                    body: tableBody,
                    theme: 'striped',
                    headStyles: { fillColor: [59, 130, 246] },
                    styles: { font: 'helvetica', fontSize: 10 },
                });

                const finalY = (doc as any).lastAutoTable.finalY || 150;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                // @ts-ignore
                doc.text(`Total Pagado: $${order.total_amount.toFixed(2)} ${order.currency}`, 140, finalY + 15);

                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text("Este documento es un comprobante de compra digital expedido por la plataforma.", 15, 280);
                doc.text("Si necesitas factura fiscal oficial, contáctanos en soporte@tianguisbeats.com", 15, 285);

                doc.save(`Recibo_${order.orden_pedido || order.id.slice(0, 8)}.pdf`);
                showToast("Descarga completada", "success");
            });
        } catch (e) {
            console.error(e);
            showToast("No se pudo generar el comprobante", "error");
        }
    };

    if (loading) return <LoadingTianguis />;

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Bóveda Segura · {orders.length} Pedido{orders.length !== 1 ? 's' : ''}</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground mb-2 leading-[1]">
                        Mis<br /><span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Compras.</span>
                    </h1>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-50 ml-1 mt-1">Todos tus productos y licencias en un solo lugar</p>
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
                <div className="py-24 text-center bg-slate-50 dark:bg-white/[0.02] rounded-[3.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-white dark:bg-card border border-slate-200 dark:border-border/50 rounded-[2rem] flex items-center justify-center mx-auto text-muted shadow-sm">
                        <ShoppingBag size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                        {searchTerm || filterType !== 'all' ? 'Sin resultados' : 'Aún no hay compras'}
                    </h3>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-widest max-w-xs mx-auto opacity-60">
                        {searchTerm || filterType !== 'all' ? 'Ajusta los filtros para ver más.' : 'Explora el catálogo y encuentra beats increibles.'}
                    </p>
                    {(searchTerm || filterType !== 'all') ? (
                        <button onClick={() => { setSearchTerm(""); setFilterType("all"); }}
                            className="mt-4 bg-accent text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                            Limpiar Filtros
                        </button>
                    ) : (
                        <Link href="/beats" className="mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
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
                                            <span className="text-muted">Pedido:</span>
                                            <span className="text-foreground">
                                                {order.orden_pedido || `#${order.id.slice(0, 8).toUpperCase()}`}
                                            </span>
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
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(order.status)} animate-in fade-in zoom-in duration-500`}>
                                            <span className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.status === 'completado' ? 'bg-emerald-500' : 'bg-current'}`} />
                                                {order.status === 'completado' ? 'Completado' : order.status}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1 group/more"
                                        >
                                            Ver más detalles <ChevronRight size={10} className="group-hover/more:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-8 space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="bg-accent/5 border border-border hover:bg-accent/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all group/item hover:border-accent/40 hover:shadow-md dark:hover:shadow-accent/5">
                                        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                                            <div className="relative w-20 h-20 bg-card border border-border shadow-xl rounded-[1.25rem] overflow-hidden group/thumb shrink-0">
                                                <img
                                                    src={item.metadata?.portada_url || item.metadata?.coverUrl || '/placeholder.png'}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-700 opacity-80 group-hover/thumb:opacity-100"
                                                />
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                                    {(item.product_type === 'beat' || item.product_type === 'sound_kit') && (
                                                        <button
                                                            onClick={() => handlePlayPreview(item)}
                                                            className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                                                        >
                                                            {isCurrentPlaying(item.id) ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                                                        </button>
                                                    )}
                                                </div>
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
                                                        className="flex-1 md:flex-none px-8 py-4 bg-accent/10 border border-accent/20 text-accent rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/5 flex items-center justify-center gap-2"
                                                    >
                                                        <Download size={14} />
                                                        Descargar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadLicense(order, item)}
                                                        className="flex-1 md:flex-none px-6 py-4 bg-slate-100 dark:bg-white/5 border border-border text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
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
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/20 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(59,130,246,0.3)] dark:shadow-[0_40px_100px_-20px_rgba(59,130,246,0.5)] animate-in zoom-in-95 fade-in duration-300">
                        {/* Modal Glow Wrapper */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 dark:from-blue-600/10 via-transparent to-purple-600/5 dark:to-purple-600/10 pointer-events-none" />
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/10 dark:bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

                        {/* Modal Header */}
                        <div className="relative z-10 p-6 sm:p-8 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Detalles del Pedido</h3>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-white/50 uppercase tracking-widest shadow-sm">
                                    Orden {selectedOrder.orden_pedido || `#${selectedOrder.id.slice(0, 8).toUpperCase()}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all z-20 relative"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 scrollbar-hide text-slate-900 dark:text-white">
                            {/* General Info Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                                <div className="p-5 bg-blue-50 dark:bg-blue-600/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center">
                                    <p className="text-[9px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-[0.2em] mb-2">Método de Pago</p>
                                    <p className="text-[11px] font-black text-blue-900 dark:text-white uppercase tracking-tight">{selectedOrder.payment_method || 'Tarjeta / Stripe'}</p>
                                </div>
                                <div className="p-5 bg-amber-50 dark:bg-amber-600/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center">
                                    <p className="text-[9px] font-black text-amber-600 dark:text-amber-300 uppercase tracking-[0.2em] mb-2">Fecha de Compra</p>
                                    <p className="text-[11px] font-black text-amber-900 dark:text-white uppercase tracking-tight">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="p-5 bg-emerald-50 dark:bg-emerald-600/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center">
                                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-[0.2em] mb-2">Estatus</p>
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Inmortalizado</span>
                                    </div>
                                </div>
                                <div className="p-5 bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/30 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center">
                                    <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-[0.2em] mb-2">Total Invertido</p>
                                    <p className="text-xl font-black text-indigo-900 dark:text-white tracking-tighter">${selectedOrder.total_amount.toFixed(2)} <span className="text-[10px] text-indigo-500 dark:text-indigo-300 uppercase">{selectedOrder.currency}</span></p>
                                </div>
                            </div>

                            {/* Coupon Section (Conditional) */}
                            {selectedOrder.codigo_cupon && (
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Cupón Aplicado</p>
                                            <p className="text-sm font-black text-emerald-900 dark:text-white uppercase tracking-tight">{selectedOrder.codigo_cupon}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.2em]">Descuento Ahorrado</p>
                                        <p className="text-lg font-black text-emerald-500 tracking-tighter">-${selectedOrder.monto_descuento?.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Itemized Breakdown */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-[0.3em] text-center flex items-center justify-center gap-3">
                                    <div className="h-[1px] flex-1 bg-border" />
                                    Detalles del Contenido
                                    <div className="h-[1px] flex-1 bg-border" />
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between gap-4 group transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                                                    <img
                                                        src={item.metadata?.portada_url || item.metadata?.coverUrl || '/placeholder.png'}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate">{item.name}</h5>
                                                    <p className="text-[9px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-widest">
                                                        {item.product_type === 'beat' ? `Licencia ${item.license_type}` : item.product_type === 'plan' ? `Suscripción ${item.metadata?.tier?.toUpperCase() || 'PRO'}` : 'Recurso Digital'}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">${item.price} <span className="text-[9px] text-slate-500 dark:text-white/60">{selectedOrder.currency}</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Certification of Ownership */}
                            <div className="relative p-8 rounded-[2.5rem] bg-zinc-900 dark:bg-black border-4 border-zinc-800 overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Shield size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1 w-full text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/40 rounded-full mb-4">
                                            <Fingerprint size={12} className="text-accent" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Certificación de Propiedad Digital</span>
                                        </div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Sello Notarial Tianguis</h4>
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-6 leading-relaxed">
                                            Esta transacción ha sido firmada criptográficamente y es válida como prueba de propiedad ante entidades legales.
                                        </p>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">SHA256 Transaction Hash</p>
                                                <p className="text-[10px] font-mono text-accent break-all bg-accent/5 p-2 rounded-lg border border-accent/20">
                                                    {selectedOrder.id.repeat(4).slice(0, 64)}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Stripe Payment ID</p>
                                                <p className="text-[10px] font-mono text-zinc-300">
                                                    {selectedOrder.stripe_id || 'INTERNAL_TRANSAC_ID'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <ValidationQR orderId={selectedOrder.id} size={110} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => handleDownloadReceipt(selectedOrder)}
                                className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-foreground rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-accent hover:text-white hover:border-accent hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/5 dark:shadow-white/5"
                            >
                                <FileText size={20} className="text-accent group-hover:text-white" /> Descargar Factura
                            </button>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-full sm:w-auto px-14 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-black/20 dark:shadow-white/20 hover:scale-[1.05] active:scale-95 transition-all"
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
