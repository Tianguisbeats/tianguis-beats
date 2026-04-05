"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
    DollarSign, Clock, User, ArrowUpRight, Music,
    Download, Search, Filter, CreditCard,
    ArrowDownLeft, ExternalLink, Calendar,
    TrendingUp, Users, Wallet, Package, Crown, ShieldCheck, Check, Info, AlertTriangle, X, CheckCircle2, QrCode, Tag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import LoadingTianguis from '@/components/LoadingTianguis';
import { calculateEarnings } from '@/lib/finance-utils';

export default function StudioSalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterLicense, setFilterLicense] = useState("all");
    const [recentSales, setRecentSales] = useState(0);
    const [avgSaleValue, setAvgSaleValue] = useState(0);
    const [calcPrice, setCalcPrice] = useState(199);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchSales = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profileData } = await supabase.from('perfiles').select('nivel_suscripcion').eq('id', user.id).single();
            setProfile(profileData);

            // Fetch sales data using the unified table
            const { data, error } = await supabase
                .from('transacciones')
                .select(`
                    id,
                    precio_total,
                    fecha_creacion,
                    tipo_licencia,
                    metodo_pago,
                    nombre_producto,
                    tipo_producto,
                    codigo_cupon,
                    monto_descuento,
                    orden_pedido,
                    metadatos,
                    comprador:perfiles!comprador_id (nombre_usuario, nombre_artistico, foto_perfil, nivel_suscripcion),
                    vendedor:perfiles!vendedor_id (nivel_suscripcion)
                `)
                .eq('vendedor_id', user.id)
                .order('fecha_creacion', { ascending: false });

            if (error) {
                console.error("Error fetching sales:", error);
                setLoading(false);
                return;
            }

            // Group transactions by Order ID to avoid duplicates
            const groupedMap: Record<string, any> = {};

            data.forEach(sale => {
                const orderId = sale.orden_pedido || sale.id; // Fallback if no order ID
                const sellerInfo: any = Array.isArray(sale.vendedor) ? sale.vendedor[0] : sale.vendedor;
                const buyerInfo: any = Array.isArray(sale.comprador) ? sale.comprador[0] : sale.comprador;
                const sellerPlan = sellerInfo?.nivel_suscripcion || 'free';

                if (!groupedMap[orderId]) {
                    groupedMap[orderId] = {
                        id: sale.id, 
                        orden_pedido: orderId,
                        created_at: sale.fecha_creacion,
                        payment_method: sale.metodo_pago,
                        comprador: buyerInfo,
                        vendedor_plan: sellerPlan,
                        items: [],
                        amount: 0,
                        monto_descuento: 0,
                        codigo_cupon: sale.codigo_cupon,
                        producto: { titulo: '', type: '', portada_url: null }
                    };
                }

                const itemEarnings = calculateEarnings(sale.precio_total, sellerPlan);
                let currentPortada = sale.metadatos?.portada_url || sale.metadatos?.url_portada;
                
                if (currentPortada && !currentPortada.startsWith('http')) {
                    const bucket = (sale.tipo_producto === 'beat') ? 'portadas_beats' : 'portadas_kits_sonido';
                    const { data: pData } = supabase.storage.from(bucket).getPublicUrl(currentPortada);
                    if (pData?.publicUrl) currentPortada = pData.publicUrl;
                }

                const item = {
                    id: sale.id,
                    name: sale.nombre_producto || 'Producto Vendido',
                    type: sale.tipo_producto,
                    license: sale.tipo_licencia,
                    amount: sale.precio_total,
                    discount: sale.monto_descuento || 0,
                    coupon: sale.codigo_cupon,
                    earnings: itemEarnings,
                    portada_url: currentPortada
                };

                groupedMap[orderId].items.push(item);
                groupedMap[orderId].amount += Number(sale.precio_total || 0);
                groupedMap[orderId].monto_descuento += Number(sale.monto_descuento || 0);
            });

            const formattedSales = Object.values(groupedMap).map((order: any) => {
                const earnings = calculateEarnings(order.amount, order.vendedor_plan);
                const mainItem = order.items[0];
                const tituloDisplay = order.items.length > 1 
                    ? `${mainItem.name} y ${order.items.length - 1} más` 
                    : mainItem.name;

                return {
                    ...order,
                    tipo_producto: order.items.length > 1 ? 'multi' : mainItem.type,
                    license_type: mainItem.license,
                    producto: {
                        titulo: tituloDisplay,
                        type: mainItem.type,
                        portada_url: mainItem.portada_url
                    },
                    earnings
                };
            });

            setSales(formattedSales);
            const total = formattedSales.reduce((acc, sale) => acc + (sale.amount || 0), 0);
            setTotalRevenue(total);
            setAvgSaleValue(total > 0 && formattedSales.length > 0 ? total / formattedSales.length : 0);
            setLoading(false);
        };

        fetchSales();
    }, []);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchesSearch =
                sale.producto?.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.comprador?.nombre_usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.comprador?.nombre_artistico?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterLicense === "all" || sale.tipo_producto === filterLicense;

            return matchesSearch && matchesFilter;
        });
    }, [sales, searchTerm, filterLicense]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    };

    const handleDownloadCSV = () => {
        const rows = [
            ['Fecha', 'Producto', 'Tipo', 'Comprador', 'Licencia', 'Metodo Pago', 'Monto Bruto (MXN)', 'Comision Stripe', 'IVA Comision', 'Total (MXN)'],
            ...filteredSales.map(s => {
                const earnings = calculateEarnings(s.amount);
                return [
                    new Date(s.created_at).toLocaleDateString('es-MX'),
                    s.producto?.titulo || 'Producto',
                    s.tipo_producto || '',
                    s.comprador?.nombre_artistico || s.comprador?.nombre_usuario || 'Cliente',
                    s.license_type || '',
                    s.payment_method || 'Stripe',
                    Number(s.amount || 0).toFixed(2),
                    earnings.stripeCommission.toFixed(2),
                    earnings.ivaOnCommission.toFixed(2),
                    earnings.netAmount.toFixed(2)
                ];
            })
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ventas_TianguisBeats_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const handleDownloadReceipt = async (saleId: string, orderPedido: string) => {
        try {
            const res = await fetch('/api/ventas/nota', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saleId })
            });
            if (!res.ok) throw new Error("Error al generar la nota");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Tianguis Beats - ${orderPedido || saleId.slice(0, 8)} - Recibo.pdf`;
            a.click();
        } catch (err) {
            alert("No se pudo generar el recibo.");
        }
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'beat': return <Music size={18} />;
            case 'sound_kit': return <Package size={18} />;
            case 'service': return <DollarSign size={18} />;
            case 'plan': return <Crown size={18} className="text-accent" />;
            case 'multi': return <Package size={18} className="text-accent" />;
            default: return <Package size={18} />;
        }
    };

    if (loading) return <LoadingTianguis />;

    return (
        <div className="space-y-12 w-full max-w-[1600px] mx-auto pb-20 px-6 sm:px-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-16 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-4 md:mb-6 opacity-60">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Transacciones Seguras</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                        <span className="opacity-40">Historial</span> <br />
                        <span className="text-blue-500 relative inline-block">
                            Ventas.
                            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                        </span>
                    </h1>
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40 ml-1">Libro Mayor Sincronizado</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadCSV} className="bg-accent/5 border border-border px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all flex items-center gap-2 active:scale-95 w-full md:w-auto justify-center">
                        <Download size={14} /> Reporte CSV
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-2xl">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-80" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por beat o comprador..."
                            className="w-full bg-accent/5 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-[11px] font-bold text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all placeholder:text-muted shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-accent/5 border border-border rounded-2xl py-3.5 px-6 text-[10px] font-bold text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all appearance-none cursor-pointer shrink-0 shadow-sm min-w-[200px]"
                        value={filterLicense}
                        onChange={(e) => setFilterLicense(e.target.value)}
                    >
                        <option value="all">Ver Todo (Categoría)</option>
                        <option value="beat">Beats</option>
                        <option value="sound_kit">Sound Kits</option>
                        <option value="service">Servicios</option>
                        <option value="license">Licencias</option>
                    </select>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-12">
                {filteredSales.map((sale) => (
                    <div key={sale.id} className="group relative overflow-hidden transition-all duration-300 pb-12 border-b border-border/20 last:border-0">
                        
                        <div className="pb-8 border-b border-border/40 flex flex-wrap items-center justify-between gap-8">
                            
                            {/* Left: Identification (Order, Date, Coupon) */}
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-accent/5 text-accent rounded-[1.5rem] flex items-center justify-center shrink-0 border border-accent/10 shadow-inner group-hover:bg-accent/10 transition-colors">
                                    <Package size={24} />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[12px] font-black text-muted uppercase tracking-[0.2em]">Orden <span className="text-foreground">#{sale.orden_pedido || sale.id?.slice(0, 8).toUpperCase()}</span></p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-[10px] font-bold text-foreground opacity-30 flex items-center gap-1.5 whitespace-nowrap uppercase tracking-widest">
                                            <Calendar size={11} className="text-muted" />
                                            {new Date(sale.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        
                                        {sale.codigo_cupon && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-emerald-500/30" />
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-md text-emerald-500/60">
                                                    <Tag size={10} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{sale.codigo_cupon}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions Row (Comprador, Total, Recibo) - Centered */}
                            <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-center flex-1 min-w-[300px]">
                                
                                {/* Comprador Box (Normalized Size) */}
                                <div className="flex flex-col items-center bg-accent/5 px-5 py-2.5 rounded-2xl border border-accent/10 shadow-inner min-w-[140px] h-[58px] justify-center group-hover:border-accent/20 transition-all">
                                    <span className="text-[8px] font-black text-accent/50 uppercase tracking-[0.2em] mb-1.5">Comprador</span>
                                    <Link 
                                        href={`/${sale.comprador?.nombre_usuario || ''}`}
                                        className="flex items-center gap-2 group/buyer"
                                    >
                                        {sale.comprador?.foto_perfil ? (
                                            <div className="w-5 h-5 rounded-full overflow-hidden border border-border/30 shrink-0">
                                                <Image src={sale.comprador.foto_perfil} width={20} height={20} className="object-cover" alt="" />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                <User size={10} className="text-accent" />
                                            </div>
                                        )}
                                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest group-hover/buyer:text-accent transition-colors">
                                            @{sale.comprador?.nombre_artistico || sale.comprador?.nombre_usuario || 'Cliente'}
                                        </span>
                                    </Link>
                                </div>

                                {/* Total Box (Normalized Gross Sale) */}
                                <div className="flex flex-col items-center bg-accent/5 px-5 py-2.5 rounded-2xl border border-accent/10 shadow-inner min-w-[120px] h-[58px] justify-center">
                                    <span className="text-[8px] font-black text-accent/50 uppercase tracking-[0.2em] mb-0.5">Venta Bruta</span>
                                    <span className="text-lg md:text-xl font-black text-foreground tracking-tighter leading-none">
                                        {formatCurrency(sale.amount)}
                                    </span>
                                </div>

                                {/* Receipt Button */}
                                <button
                                    onClick={() => handleDownloadReceipt(sale.id, sale.orden_pedido)}
                                    className="shrink-0 px-5 py-3.5 bg-gradient-to-br from-blue-600 to-blue-500 text-white hover:brightness-110 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md shadow-blue-500/10 border border-white/5 h-[58px]"
                                >
                                    <Download size={14} /> Recibo
                                </button>
                            </div>
                        </div>

                        {/* Items Sub-List (Now cleaner without inner border) */}
                        <div className="space-y-4 pt-8">
                            {sale.items?.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 md:p-6 flex items-center gap-6 group/item hover:bg-accent/[0.02] transition-colors">
                                    <div className="w-14 h-14 bg-card rounded-2xl border border-border flex items-center justify-center shrink-0 relative overflow-hidden transition-all group-hover/item:scale-110 shadow-sm group-hover/item:border-accent/50">
                                        {item.portada_url ? (
                                            <Image src={item.portada_url} fill className="object-cover" alt={item.name} />
                                        ) : (
                                            <div className="text-muted/30">
                                                {getItemIcon(item.type)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className={`px-2.5 py-1 ${
                                                (item.type === 'sound_kit' || item.type === 'soundkit') ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 
                                                'bg-accent/10 text-accent border-accent/20'
                                            } border rounded-lg text-[8px] font-black uppercase tracking-widest leading-none`}>
                                                {item.type === 'beat' ? 'BEAT' : (item.type === 'sound_kit' || item.type === 'soundkit') ? 'SOUND KIT' : 'PRODUCTO'}
                                            </span>
                                            {item.type === 'beat' && (
                                                <span className={`px-2.5 py-1 border rounded-lg text-[8px] font-black uppercase tracking-widest leading-none ${
                                                    (item.license?.toLowerCase() === 'pro' || item.license?.toLowerCase() === 'wav') ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                                                    (item.license?.toLowerCase() === 'premium' || item.license?.toLowerCase() === 'stems') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    (item.license?.toLowerCase() === 'exclusiva' || item.license?.toLowerCase() === 'exclusive') ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>
                                                    {item.license || 'Licencia'}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-sm md:text-lg font-black uppercase tracking-tight text-foreground truncate group-hover/item:text-accent transition-colors leading-tight">
                                            {item.name.split('[')[0].split('(')[0].trim()}
                                        </h4>
                                    </div>
                                    <div className="text-[12px] font-black text-foreground/40 px-4 py-2 rounded-xl">
                                        {formatCurrency(item.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredSales.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-border rounded-[2.5rem]">
                        <CreditCard className="w-16 h-16 text-muted/10 mx-auto mb-6" />
                        <h4 className="text-lg font-black uppercase text-muted tracking-tighter mb-2">No se encontraron transacciones</h4>
                        <p className="text-[10px] font-bold text-muted/30 uppercase tracking-[0.3em]">Ajusta los filtros para ver más resultados</p>
                    </div>
                )}
            </div>
        </div>
    );
}
