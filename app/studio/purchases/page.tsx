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
    Calendar,
    Tag,
    Loader2,
    Zap,
    Star,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { downloadLicensePDF } from '@/lib/pdfGenerator';
import { LicenseType } from '@/lib/licenses';
import { useCurrency } from '@/context/CurrencyContext';
import LoadingTianguis from '@/components/LoadingTianguis';

const LICENSE_LABELS: Record<string, string> = {
    basica: 'Básica',
    basic: 'Básica',
    mp3: 'MP3 Estándar',
    pro: 'Pro',
    premium: 'Premium',
    ilimitada: 'Ilimitada',
    unlimited: 'Ilimitada',
    exclusiva: 'Exclusiva',
    exclusive: 'Exclusiva',
    soundkit: 'Sound kit',
    sound_kit: 'Sound kit',
    service: 'Servicio',
    gratis: 'Gratis',
    demo: 'Gratis',
};

function getLicenseBadge(tipo_licencia: string | null | undefined, productName?: string, productType?: string) {
    let effectiveLicense = (tipo_licencia || '').toLowerCase();
    const isKit = productType === 'sound_kit' || productType === 'soundkit' || productType === 'kit' || productName?.toLowerCase().includes('sound kit') || productName?.toLowerCase().includes('soundkit');

    if (isKit) {
        return { label: 'Licencia Sound Kit', color: 'text-orange-500', dot: 'bg-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    }

    // [FALLBACK] Smart license detection from product name if DB metadata is missing/wrong
    if ((!effectiveLicense || effectiveLicense === 'basica') && productName?.includes('[')) {
        const match = productName.match(/\[(.*?)\]/);
        if (match && match[1]) {
            const extracted = match[1].toLowerCase().trim();
            const validLicenses = ['pro', 'premium', 'exclusiva', 'exclusive', 'ilimitada', 'unlimited'];
            if (validLicenses.includes(extracted)) {
                effectiveLicense = extracted;
            }
        }
    }

    if (!effectiveLicense) return { label: 'Licencia Digital', color: 'text-blue-500', dot: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };

    const key = effectiveLicense.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Forzado para Sound Kits si el tipo de licencia es incorrecto o vacío (redundancia)
    if (key.includes('soundkit') || key.includes('sound_kit')) {
        return { label: 'Licencia Sound Kit', color: 'text-orange-500', dot: 'bg-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    }

    const label = LICENSE_LABELS[effectiveLicense] || LICENSE_LABELS[key] || effectiveLicense;

    if (key.includes('exclusiv')) return { label: `Licencia ${label}`, color: 'text-rose-500', dot: 'bg-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
    if (key.includes('ilimitad') || key.includes('unlimited')) return { label: `Licencia ${label}`, color: 'text-purple-500', dot: 'bg-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    if (key.includes('premium')) return { label: `Licencia ${label}`, color: 'text-amber-500', dot: 'bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    if (key.includes('pro')) return { label: `Licencia ${label}`, color: 'text-blue-500', dot: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (key.includes('basic') || key.includes('basica') || key.includes('mp3')) return { label: 'Licencia Básica', color: 'text-emerald-500', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (key.includes('gratis') || key.includes('free') || key.includes('demo')) return { label: `Licencia ${label}`, color: 'text-slate-400', dot: 'bg-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
    if (key === 'service') return { label: 'Servicio Profesional', color: 'text-teal-500', dot: 'bg-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' };

    return { label: label, color: 'text-blue-500', dot: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
}

type OrderItem = {
    id: string;
    product_id: string;
    product_type: string;
    name: string;
    price: number;
    license_type?: string;
    status?: string;
    metadata?: any;
    project_id?: string;
    codigo_cupon?: string;
    monto_descuento?: number;
    original_currency?: string;
    orden_pedido?: string;
};

const PAGE_SIZE = 24;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXCHANGE_RATES_REV = {
    MXN: 1,
    USD: 1 / 0.058, // ~17.2 MXN/USD
    EUR: 1 / 0.053, // ~18.8 MXN/EUR
};

type Order = {
    id: string;
    pago_id?: string;
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
    buyer_name?: string;
    buyer_email?: string;
    recibo_url?: string;
};

export default function MyPurchasesPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [allTx, setAllTx] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalInvestmentInMXN, setTotalInvestmentInMXN] = useState(0);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const { currentUserId } = useCart();
    const { playBeat, isPlaying, currentBeat } = usePlayer();
    const { showToast } = useToast();
    const { formatPrice, convertPrice, currency: currentCurrencySelection } = useCurrency();

    const handlePlayPreview = (item: OrderItem) => {
        const pt = (item.product_type || '').toLowerCase();
        const isSoundKit = pt === 'sound_kit' || pt === 'soundkit' || pt === 'kit_sonido';

        let audioUrl = item.metadata?.url_audio ||
            item.metadata?.archivo_muestra_url ||
            item.metadata?.previewUrl ||
            item.metadata?.preview_url;

        if (!audioUrl) {
            showToast("No hay vista previa disponible", "error");
            return;
        }

        if (audioUrl && !audioUrl.startsWith('http')) {
            const bucket = isSoundKit ? 'portadas_kits_sonido' : 'muestras_beats';
            const { data } = supabase.storage.from(bucket).getPublicUrl(audioUrl);
            if (data?.publicUrl) audioUrl = data.publicUrl;
        }

        const beatToPlay = {
            id: item.product_id || item.id,
            titulo: item.name,
            product_type: isSoundKit ? 'sound_kit' : 'beat',
            tipo: isSoundKit ? 'kit' : 'beat',
            productor_nombre_artistico: item.metadata?.producer_name || item.metadata?.nombre_productor || 'Artista Tianguis',
            productor_nombre_usuario: item.metadata?.producer_name || item.metadata?.nombre_productor || 'Artista Tianguis',
            portada_url: item.metadata?.portada_url || '/placeholder.png',
            archivo_muestra_url: audioUrl,
            archivo_mp3_url: audioUrl,
            precio_base: item.price,
            productor_id: item.metadata?.productor_id || (item as any).vendedor_id
        };

        playBeat(beatToPlay as any);
    };

    const isCurrentPlaying = (item: OrderItem) => {
        const productId = item.product_id || item.id;
        return currentBeat?.id === productId && isPlaying;
    };

    useEffect(() => {
        fetchOrders(0);
        fetchTotalInvestment();
    }, []);

    const fetchTotalInvestment = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('transacciones')
            .select('precio_total, moneda')
            .eq('comprador_id', user.id)
            .neq('tipo_producto', 'plan');

        const total = (data || []).reduce((acc, tx) => {
            const rate = (EXCHANGE_RATES_REV as any)[tx.moneda || 'MXN'] || 1;
            return acc + Number(tx.precio_total || 0) * rate;
        }, 0);
        setTotalInvestmentInMXN(total);
    };

    const fetchOrders = async (pageIndex: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        if (pageIndex > 0) setLoadingMore(true);

        try {
            const from = pageIndex * PAGE_SIZE;
            const { data: txData, error: txError } = await supabase
                .from('transacciones')
                .select(`
                    id, pago_id, producto_id, producto_uuid, tipo_producto, nombre_producto,
                    precio_total, moneda, estado_pago, metodo_pago, tipo_licencia, metadatos,
                    codigo_cupon, monto_descuento, recibo_url, fecha_creacion, orden_pedido,
                    vendedor_id, comprador_id,
                    vendedor:perfiles!vendedor_id (
                        nombre_artistico,
                        nombre_usuario,
                        foto_perfil
                    )
                `)
                .eq('comprador_id', user.id)
                .neq('tipo_producto', 'plan')
                .order('fecha_creacion', { ascending: false })
                .range(from, from + PAGE_SIZE - 1);

            if (txError) throw txError;

            const pageTx = txData || [];
            setHasMore(pageTx.length === PAGE_SIZE);

            // Portadas/audio faltantes: una query batch por tabla en vez de una por transacción
            const needsEnrich = (tx: any) => {
                const tipo = (tx.tipo_producto || '').toLowerCase();
                const hasMedia = tx.metadatos?.portada_url && (tx.metadatos?.archivo_muestra_url || tx.metadatos?.preview_url);
                return !hasMedia && ['beat', 'sound_kit', 'soundkit', 'kit_sonido'].includes(tipo);
            };
            const productId = (tx: any) => String(tx.producto_uuid || tx.producto_id || '');
            const beatIds = pageTx
                .filter(tx => needsEnrich(tx) && (tx.tipo_producto || '').toLowerCase() === 'beat')
                .map(productId).filter(id => UUID_RE.test(id));
            const kitIds = pageTx
                .filter(tx => needsEnrich(tx) && (tx.tipo_producto || '').toLowerCase() !== 'beat')
                .map(productId).filter(id => UUID_RE.test(id));

            const [beatsRes, kitsRes] = await Promise.all([
                beatIds.length
                    ? supabase.from('beats').select('id, portada_url, archivo_muestra_url, archivo_mp3_url').in('id', beatIds)
                    : Promise.resolve({ data: [] as any[] }),
                kitIds.length
                    ? supabase.from('kits_sonido').select('id, url_portada, archivo_muestra_url, url_archivo').in('id', kitIds)
                    : Promise.resolve({ data: [] as any[] }),
            ]);
            const beatsById = new Map((beatsRes.data || []).map((b: any) => [b.id, b]));
            const kitsById = new Map((kitsRes.data || []).map((k: any) => [k.id, k]));

            const enrichedData = pageTx.map(tx => {
                let currentPortada = tx.metadatos?.portada_url;
                let currentAudio = tx.metadatos?.archivo_muestra_url || tx.metadatos?.preview_url;
                const tipoTx = (tx.tipo_producto || '').toLowerCase();

                if (tipoTx === 'beat') {
                    const beatData = beatsById.get(productId(tx));
                    if (beatData) {
                        currentPortada = beatData.portada_url || currentPortada;
                        currentAudio = beatData.archivo_muestra_url || beatData.archivo_mp3_url || currentAudio;
                    }
                } else {
                    const kitData = kitsById.get(productId(tx));
                    if (kitData) {
                        currentPortada = kitData.url_portada || currentPortada;
                        currentAudio = kitData.archivo_muestra_url || kitData.url_archivo || currentAudio;
                    }
                }

                if (currentPortada && !currentPortada.startsWith('http')) {
                    const bucket = (tipoTx === 'beat') ? 'portadas_beats' : 'portadas_kits_sonido';
                    const { data: pData } = supabase.storage.from(bucket).getPublicUrl(currentPortada);
                    if (pData?.publicUrl) currentPortada = pData.publicUrl;
                }

                return {
                    ...tx,
                    metadatos: {
                        ...tx.metadatos,
                        portada_url: currentPortada,
                        url_audio: currentAudio
                    }
                };
            });

            const combinedTx = pageIndex === 0 ? enrichedData : [...allTx, ...enrichedData];
            setAllTx(combinedTx);

            const groupedOrders: Record<string, any> = {};

            combinedTx.forEach(tx => {
                const orderKey = tx.orden_pedido || tx.pago_id || tx.id;

                if (!groupedOrders[orderKey]) {
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
                        recibo_url: tx.recibo_url,
                        items: []
                    };
                }

                groupedOrders[orderKey].total_amount += Number(tx.precio_total);
                groupedOrders[orderKey].monto_descuento += Number(tx.monto_descuento || 0);

                if (!groupedOrders[orderKey].codigo_cupon && tx.codigo_cupon) {
                    groupedOrders[orderKey].codigo_cupon = tx.codigo_cupon;
                }

                if (!groupedOrders[orderKey].recibo_url && tx.recibo_url) {
                    groupedOrders[orderKey].recibo_url = tx.recibo_url;
                }

                groupedOrders[orderKey].items.push({
                    id: tx.id,
                    product_id: tx.producto_id,
                    product_type: tx.tipo_producto,
                    name: tx.nombre_producto,
                    price: tx.precio_total,
                    license_type: tx.tipo_licencia,
                    metadata: tx.metadatos,
                    producer_id: tx.vendedor_id,
                    buyer_id: tx.comprador_id,
                    codigo_cupon: tx.codigo_cupon,
                    monto_descuento: tx.monto_descuento,
                    original_currency: tx.moneda || 'MXN',
                    recibo_url: tx.recibo_url,
                    status: tx.estado_pago
                });
            });

            const formattedOrders = Object.values(groupedOrders);
            const itemIds = formattedOrders.flatMap((o: any) => o.items.map((i: any) => i.id));
            if (itemIds.length > 0) {
                const { data: projectsData } = await supabase.from('proyectos').select('id, transaccion_id').in('transaccion_id', itemIds);
                formattedOrders.forEach((order: any) => {
                    order.items.forEach((item: any) => {
                        item.project_id = projectsData?.find(p => p.transaccion_id === item.id)?.id;
                    });
                });
            }

            formattedOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setOrders(formattedOrders as Order[]);
            setPage(pageIndex);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
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

    const LICENSE_MAPPING: Record<string, string> = {
        'basica': 'Básica',
        'basic': 'Básica',
        'pro': 'Pro',
        'premium': 'Premium',
        'exclusiva': 'Exclusiva',
        'exclusive': 'Exclusiva',
        'ilimitada': 'Ilimitada',
        'unlimited': 'Ilimitada',
        'gratis': 'Gratis',
        'demo': 'Gratis'
    };

    function getLicenseLabel(slug: string | null | undefined, productName?: string): string {
        let effective = (slug || '').toLowerCase().trim();

        // Si la licencia es basica o vacia, pero el nombre tiene [Etiqueta], extraemos
        if ((!effective || effective === 'basica') && productName?.includes('[')) {
            const match = productName.match(/\[(.*?)]/);
            if (match && match[1]) {
                const extracted = match[1].toLowerCase().trim();
                if (LICENSE_MAPPING[extracted]) effective = extracted;
            }
        }

        if (effective.includes('soundkit') || effective.includes('sound_kit') || productName?.toLowerCase().includes('sound kit') || productName?.toLowerCase().includes('soundkit')) {
            return 'Licencia Sound kit';
        }

        return LICENSE_MAPPING[effective] || (effective.charAt(0).toUpperCase() + effective.slice(1)) || 'Básica';
    }

    function getStatusConfig(status: string | undefined): { label: string, color: string, border: string } {
        const s = (status || 'completado').toLowerCase();
        if (s === 'completado' || s === 'completed' || s === 'succeeded') {
            return { label: 'Completado', color: 'bg-emerald-500/10 text-emerald-500', border: 'border-emerald-500/20' };
        }
        if (s === 'pendiente' || s === 'pending') {
            return { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20' };
        }
        return { label: s.toUpperCase(), color: 'bg-blue-500/10 text-blue-500', border: 'border-blue-500/20' };
    }

    const handleDownloadFiles = async (item: OrderItem) => {
        try {
            setDownloadingId(item.id);
            showToast("Preparando descarga segura...", "info");

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error("Sesión no encontrada. Por favor, reinicia sesión.");

            const queryParam = item.orden_pedido ? `orderId=${item.orden_pedido}` : `txId=${item.id}`;
            const response = await fetch(`/api/download?${queryParam}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (!response.ok) {
                let errorMsg = 'Error en la descarga';
                try {
                    const errorData = await response.json();
                    if (errorData.error) errorMsg = errorData.error;
                } catch (e) { }
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get('Content-Type');
            const contentDisposition = response.headers.get('Content-Disposition');

            if (contentType?.includes('application/json')) {
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                if (data.url) {
                    const a = document.createElement('a');
                    a.href = data.url;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    showToast("¡Descarga iniciada!", "success");
                    return;
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            let filename = `TianguisBeats_${item.name}.zip`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch?.[1]) filename = filenameMatch[1];
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast("¡Archivo descargado!", "success");
        } catch (error: any) {
            console.error("Download Error:", error);
            showToast(error.message || "Error al procesar la descarga", "error");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadLicense = async (order: Order, item: OrderItem) => {
        const isSoundKit = item.product_type === 'sound_kit' || item.product_type === 'soundkit';
        const isBeat = item.product_type === 'beat';
        const savedPdfUrl = item.metadata?.contract_pdf_url || item.metadata?.contractPdfUrl || item.metadata?.contract_url || item.metadata?.recibo_url;

        // Si tiene una URL guardada y NO es un beat ni un sound kit, podemos usar esa.
        // Pero para beats y sound kits, queremos el nuevo diseño (V4) con texto personalizado y hoja membretada.
        if (savedPdfUrl && !isBeat && !isSoundKit) {
            showToast("Abriendo Licencia Oficial...", "info");
            window.open(savedPdfUrl, '_blank');
            return;
        }

        setDownloadingId(item.id);
        showToast("Generando certificado...", "info");

        // Mapear el tipo de licencia al formato que espera la nueva API (espanol/minúsculas)
        let effectiveLicense: string = (item.license_type || 'basica').toLowerCase();
        if (effectiveLicense === 'basic') effectiveLicense = 'basica';
        if (effectiveLicense === 'free' || effectiveLicense === 'demo') effectiveLicense = 'gratis';
        if (effectiveLicense === 'unlimited') effectiveLicense = 'ilimitada';
        if (effectiveLicense === 'exclusive') effectiveLicense = 'exclusiva';
        if (item.product_type === 'sound_kit' || item.product_type === 'soundkit') effectiveLicense = 'soundkits';

        // Usar el ID de orden amigable (orden_pedido) o el pago_id de Stripe como referencia
        const realOrderId = order.orden_pedido || order.pago_id || order.id;

        try {
            await downloadLicensePDF({
                orderId: realOrderId,
                transactionId: item.id, // ID específico de la transacción
                licenseType: effectiveLicense,
                beatId: item.product_id,
                buyerName: order.buyer_name || 'Cliente Tianguis',
                buyerEmail: order.buyer_email || '',
                productName: item.name
            });
            showToast("Licencia generada exitosamente", "success");
        } catch (error: any) {
            console.error("Error al generar certificado:", error);
            showToast(error.message || "Error al generar la licencia", "error");
        } finally {
            setDownloadingId(null);
        }
    };


    const handleDownloadReceipt = (order: Order) => {
        showToast("Generando comprobante...", "info");
        import('jspdf').then(async ({ default: jsPDF }) => {
            const autoTable = (await import('jspdf-autotable')).default;
            const doc = new jsPDF();
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text("TIANGUIS BEATS", 15, 25);
            (doc as any).autoTable({
                startY: 95,
                head: [['Descripción', 'Tipo', 'Monto']],
                body: order.items.map(item => [item.name, item.product_type.toUpperCase(), `$${Number(item.price).toFixed(2)} ${order.currency}`]),
                headStyles: { fillColor: [59, 130, 246] },
            });
            doc.save(`Recibo_${order.orden_pedido || order.id.slice(0, 8)}.pdf`);
            showToast("Recibo generado", "success");
        });
    };

    // Define oCurrencySymbols for the new UI structure
    const oCurrencySymbols: { [key: string]: string } = {
        MXN: '$',
        USD: 'US$',
        EUR: '€',
    };

    // Placeholder for handleGeneratePDF, assuming it's a new function
    const handleGeneratePDF = async (item: OrderItem, orderId: string, orderDate: string) => {
        showToast("El servicio de generación de licencias está siendo actualizado.", "info");
    };


    if (loading) return <LoadingTianguis />;

    return (
        <main className="relative z-10 pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">

            {/* Header Compacto */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-2">Mi Studio</p>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                        <span className="opacity-40">Tus</span> <br />
                        <span className="text-blue-500 relative inline-block">
                            Compras
                            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    {/* Summary Box Compacto */}
                    <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent/10 border border-accent/20 text-accent rounded-xl flex items-center justify-center shrink-0">
                            <Zap size={18} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">Inversión Total</p>
                            <span className="text-xl font-black text-foreground tracking-tighter">{formatPrice(totalInvestmentInMXN)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SEARCH & FILTERS ── */}
            <div className="grid md:grid-cols-3 gap-4 items-center animate-in fade-in duration-700 delay-200">
                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-accent" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por beat, licencia o ID de orden..."
                        className="w-full bg-card border border-border rounded-[2rem] py-4 px-12 text-[11px] font-black text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-muted/60"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <select
                        className="w-full bg-card border border-border rounded-[2rem] py-4 px-12 text-[11px] font-black text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Filtro: TODOS</option>
                        <option value="beat">Solo Beats</option>
                        <option value="sound_kit">Sound Kits</option>
                        <option value="service">Servicios</option>
                        <option value="plan">Planes</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
            </div>

            {/* ── ORDERS LIST ── */}
            {filteredOrders.length === 0 ? (
                <div className="py-32 text-center bg-card border border-border rounded-[4rem] flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-accent/5 border border-accent/10 rounded-[2.5rem] flex items-center justify-center text-muted">
                        <ShoppingBag size={40} className="opacity-20" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Archivos no encontrados</h3>
                        <p className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] mt-2 max-w-[280px] mx-auto opacity-50">
                            No hay compras que coincidan con tu búsqueda actual.
                        </p>
                    </div>
                    <button onClick={() => { setSearchTerm(""); setFilterType("all"); }} className="mt-4 px-10 py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                        Limpiar Filtros
                    </button>
                </div>
            ) : (
                <div className="space-y-6 mt-10">
                    {filteredOrders.map((order, idx) => {
                        const status = getStatusConfig(order.status);
                        return (
                            <div key={order.id} className="group relative bg-card border border-border rounded-[2rem] overflow-hidden transition-all duration-300 hover:border-accent/30">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Order Header Compacto */}
                                <div className="p-5 border-b border-border bg-foreground/[0.01] flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-0.5">Orden #{order.orden_pedido || order.id.slice(-8).toUpperCase()}</p>
                                            <p className="text-xs font-bold text-foreground">{new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest ${status.color} ${status.border}`}>
                                            {order.status === 'pendiente' && <Clock size={10} />}
                                            {status.label}
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-1 self-start ml-1">Total</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-foreground tracking-tighter leading-none">
                                                    {oCurrencySymbols[order.currency as keyof typeof oCurrencySymbols] || '$'}{Number(order.total_amount).toFixed(2)}
                                                </span>
                                                <span className="text-[10px] font-black text-muted-foreground">{order.currency}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="h-12 px-6 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all active:scale-95"
                                        >
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>

                                {/* Items List Compacta */}
                                <div className="divide-y divide-border/50">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="p-4 sm:p-5 flex items-center gap-4 group/item hover:bg-foreground/[0.02] transition-colors">
                                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0">
                                                {item.metadata?.portada_url ? (
                                                    <img src={item.metadata.portada_url} alt={item.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                                                        <Music size={20} className="text-accent" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                     <span className={`px-2 py-0.5 ${(item.product_type === 'sound_kit' || item.product_type === 'soundkit') ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-accent/10 text-accent border-accent/20'} border rounded-md text-[7px] font-black uppercase tracking-widest leading-none`}>
                                                         {item.product_type === 'beat' ? 'Beat' :
                                                          (item.product_type === 'sound_kit' || item.product_type === 'soundkit') ? 'Sound Kit' : 'Producto'}
                                                     </span>
                                                    {(item.product_type === 'beat' || item.product_type === 'sound_kit' || item.product_type === 'soundkit') && (() => {
                                                        const badge = getLicenseBadge(item.license_type, item.name, item.product_type);
                                                        return (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-0.5 ${badge.bg} ${badge.color} border ${badge.border} rounded-md text-[7px] font-black uppercase tracking-widest leading-none`}>
                                                                    {badge.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <h4 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground truncate max-w-[300px]">
                                                    {item.name.split('[')[0].trim()}
                                                </h4>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDownloadLicense(order, item)}
                                                        disabled={item.status === 'pendiente'}
                                                        className="flex items-center gap-2.5 px-5 py-3 bg-white/5 text-foreground border border-border rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <FileText size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                        <span>{item.status === 'pendiente' ? 'Pendiente' : 'Licencia'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadFiles(item)}
                                                        disabled={item.status === 'pendiente'}
                                                        className="flex items-center gap-2.5 px-5 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/80 hover:scale-[1.02] active:scale-95 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Download size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                        <span>{item.status === 'pendiente' ? 'Esperando Pago' : 'Archivos'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => fetchOrders(page + 1)}
                                disabled={loadingMore}
                                className="flex items-center gap-3 px-10 py-4 bg-card border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                                {loadingMore ? 'Cargando...' : 'Cargar más compras'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── FOOTER INFO ── */}
            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in duration-700 delay-500 mt-10">
                <div className="bg-gradient-to-br from-card to-accent/5 border border-border rounded-2xl md:rounded-[3rem] p-6 md:p-12 relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700"><Fingerprint size={200} /></div>
                    <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6"><Shield size={28} /></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">Integridad de Licencias</h3>
                    <p className="text-muted text-sm leading-relaxed max-w-sm">
                        Cada compra genera un contrato legal único vinculado a tu firma digital, con hash de seguridad incluido en cada PDF.
                    </p>
                </div>
                <div className="bg-card border border-border rounded-2xl md:rounded-[3rem] p-6 md:p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-foreground/5 text-foreground rounded-2xl flex items-center justify-center mb-6"><ShoppingBag size={28} /></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">¿Faltan Archivos?</h3>
                    <p className="text-muted text-sm leading-relaxed max-w-sm mb-8">
                        Si algún producto no aparece o el enlace de descarga falla, reporta el incidente a nuestro equipo técnico de inmediato.
                    </p>
                    <Link href="/quejas-y-sugerencias" className="px-10 py-4 border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">
                        Reportar Incidencia
                    </Link>
                </div>
            </div>

            {/* ── SEPARATOR ── */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* ── ORDER DETAILS MODAL ── */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-3xl bg-card border border-border rounded-[4rem] overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-blue-400 to-purple-500" />

                        <div className="p-10 md:p-14 space-y-12 overflow-y-auto max-h-[85vh] scrollbar-hide">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-2">Detalles de Orden</h2>
                                    <p className="text-[11px] font-black text-muted uppercase tracking-[0.3em] ml-1">ID: {selectedOrder.orden_pedido || selectedOrder.pago_id || selectedOrder.id}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="w-14 h-14 bg-foreground/5 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center border border-border transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="p-6 bg-accent/5 border border-accent/10 rounded-3xl text-center">
                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">Fecha</span>
                                    <span className="text-sm font-black text-foreground uppercase tracking-tight">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="p-6 bg-accent/5 border border-accent/10 rounded-3xl text-center">
                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">Pago</span>
                                    <span className="text-sm font-black text-foreground uppercase tracking-tight">{selectedOrder.payment_method || 'Tarjeta'}</span>
                                </div>
                                <div className="p-6 bg-accent/5 border border-accent/10 rounded-3xl text-center">
                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">Moneda</span>
                                    <span className="text-sm font-black text-foreground uppercase tracking-tight">{selectedOrder.currency}</span>
                                </div>
                                
                                {/* Dynamic Status Block */}
                                {selectedOrder.status === 'pendiente' ? (
                                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-center flex flex-col items-center justify-center">
                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-2">Estatus</span>
                                        <span className="text-xs font-black text-amber-500 uppercase tracking-tight flex items-center gap-1"><Clock size={12} /> Esperando Confirmación</span>
                                    </div>
                                ) : selectedOrder.status === 'fallido' || selectedOrder.status === 'cancelado' ? (
                                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center flex flex-col items-center justify-center">
                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-2">Estatus</span>
                                        <span className="text-xs font-black text-rose-500 uppercase tracking-tight flex items-center gap-1"><AlertCircle size={12} /> Cancelada por falta de pago</span>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center flex flex-col items-center justify-center">
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Estatus</span>
                                        <span className="text-sm font-black text-emerald-500 uppercase tracking-tight">Válido</span>
                                    </div>
                                )}
                            </div>

                            {/* Warning Message for Pending Orders */}
                            {selectedOrder.status === 'pendiente' && (
                                <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                                    <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-black text-amber-500 uppercase tracking-tight mb-1">Pago Pendiente (Oxxo Pay)</h4>
                                        <p className="text-xs text-amber-500/80 font-medium">
                                            Recuerda que tienes <strong>5 días</strong> para realizar el pago en ventanilla utilizando tu código. Si el plazo vence, esta orden será cancelada automáticamente por falta de pago y tendrás que generar una nueva.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black text-muted uppercase tracking-widest flex items-center gap-3">
                                    <div className="h-px flex-1 bg-border" />
                                    Resumen del Pedido
                                    <div className="h-px flex-1 bg-border" />
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between py-4 border-b border-border/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center">{getItemIcon((item.product_type || ''))}</div>
                                                <span className="text-[11px] font-black text-foreground uppercase tracking-tight">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-foreground">${Number(item.price).toFixed(2)} <span className="text-[9px] text-muted-foreground ml-0.5">{item.original_currency}</span></span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between py-6 pt-10">
                                        <span className="text-lg font-black text-foreground uppercase tracking-tighter">Total Invertido</span>
                                        <span className="text-4xl font-black text-accent tracking-tighter">${Number(selectedOrder.total_amount).toFixed(2)} <span className="text-sm text-accent opacity-60 ml-1">{selectedOrder.currency}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button 
                                    onClick={() => handleDownloadReceipt(selectedOrder)} 
                                    disabled={selectedOrder.status === 'pendiente' || selectedOrder.status === 'fallido' || selectedOrder.status === 'cancelado'}
                                    className="flex-1 flex items-center justify-center gap-3 py-5 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FileText size={16} /> Descargar Comprobante
                                </button>
                                {selectedOrder.recibo_url && (
                                    <button 
                                        onClick={() => window.open(selectedOrder.recibo_url!, '_blank')}
                                        className="flex-1 flex items-center justify-center gap-3 py-5 bg-accent text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-accent/80 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        <FileText size={16} /> Factura Oficial (Stripe)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );

    function getItemIcon(type: string) {
        const t = type.toLowerCase();
        if (t === 'beat') return <Music size={18} />;
        if (t === 'sound_kit' || t === 'soundkit') return <Cpu size={18} />;
        if (t === 'service') return <Briefcase size={18} />;
        if (t === 'plan') return <Crown size={18} />;
        return <Package size={18} />;
    }
}
