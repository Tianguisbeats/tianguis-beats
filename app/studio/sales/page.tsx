"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
    DollarSign, Clock, User, ArrowUpRight, Music,
    Download, Search, Filter, CreditCard,
    ArrowDownLeft, ExternalLink, Calendar,
    TrendingUp, Users, Wallet
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function StudioSalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterLicense, setFilterLicense] = useState("all");
    const [recentSales, setRecentSales] = useState(0); // New state variable
    const [avgSaleValue, setAvgSaleValue] = useState(0); // New state variable

    useEffect(() => {
        const fetchSales = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch sales data using the unified table
            const { data, error } = await supabase
                .from('transacciones')
                .select(`
                    id,
                    precio,
                    fecha_creacion,
                    tipo_licencia,
                    metodo_pago,
                    nombre_producto,
                    tipo_producto,
                    buyer:comprador_id (username, artistic_name, foto_perfil)
                `)
                .eq('vendedor_id', user.id)
                .order('fecha_creacion', { ascending: false });

            if (error) {
                console.error("Error fetching sales:", error);
                setLoading(false);
                return;
            }

            // Map to the internal expected format to avoid breaking UI components
            const formattedSales = data.map(sale => ({
                id: sale.id,
                amount: sale.precio,
                created_at: sale.fecha_creacion,
                license_type: sale.tipo_licencia,
                payment_method: sale.metodo_pago,
                beats: { title: sale.nombre_producto || 'Producto Vendido', portadabeat_url: null }, // Fallback since audio cover uses custom fetching
                buyer: sale.buyer
            }));

            setSales(formattedSales);

            // Calculate metrics
            const total = formattedSales.reduce((acc, sale) => acc + (sale.amount || 0), 0);
            setTotalRevenue(total);

            const recent = formattedSales.filter(s => {
                const saleDate = new Date(s.created_at);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return saleDate > thirtyDaysAgo;
            }).length;
            setRecentSales(recent);

            setAvgSaleValue(total > 0 && formattedSales.length > 0 ? total / formattedSales.length : 0);
            setLoading(false);
        };

        fetchSales();
    }, []);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchesSearch =
                sale.beats?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.buyer?.username?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterLicense === "all" || sale.license_type === filterLicense;

            return matchesSearch && matchesFilter;
        });
    }, [sales, searchTerm, filterLicense]);

    const stats = useMemo(() => {
        const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;
        const recentSales = sales.filter(s => {
            const date = new Date(s.created_at);
            const now = new Date();
            return date > new Date(now.setDate(now.getDate() - 30));
        }).length;

        return {
            avgSale,
            recentSales,
            totalTransactions: sales.length
        };
    }, [sales, totalRevenue]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted animate-pulse">Sincronizando Tesorería...</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-4">
                        Tesorería <span className="text-accent underline decoration-white/10 underline-offset-8">Elite</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-muted">
                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">
                            <Wallet size={12} /> Portal Seguro
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                            <Calendar size={12} /> Sincronizado hoy
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95">
                        <Download size={14} /> Reporte PDF
                    </button>
                    <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-2">
                        Retirar Fondos <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>

            {/* Financial KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative bg-[#020205] dark:bg-[#020205] bg-white border border-white/5 dark:border-white/5 border-slate-200 shadow-xl dark:shadow-2xl rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-accent/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] -mr-16 -mt-16" />
                    <p className="text-[9px] font-black text-muted dark:text-muted text-slate-500 uppercase tracking-[0.3em] mb-3">Balance Histórico</p>
                    <h3 className="text-4xl font-black tracking-tighter text-foreground dark:text-foreground text-slate-900 mb-2">
                        {formatCurrency(totalRevenue)}
                    </h3>
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                        <TrendingUp size={12} /> Listo para retiro
                    </div>
                </div>

                <div className="group relative bg-[#020205] dark:bg-[#020205] bg-white border border-white/5 dark:border-white/5 border-slate-200 shadow-xl dark:shadow-none rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-emerald-500/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16" />
                    <p className="text-[9px] font-black text-muted dark:text-muted text-slate-500 uppercase tracking-[0.3em] mb-3">Ventas Recientes (30d)</p>
                    <h3 className="text-4xl font-black tracking-tighter text-foreground dark:text-foreground text-slate-900 mb-2">
                        {stats.recentSales} <span className="text-sm font-bold text-muted dark:text-muted text-slate-400 uppercase tracking-widest">Unidades</span>
                    </h3>
                    <p className="text-[10px] font-bold text-muted dark:text-muted text-slate-400 uppercase tracking-widest opacity-60">Volumen de mercado</p>
                </div>

                <div className="group relative bg-[#020205] dark:bg-[#020205] bg-white border border-white/5 dark:border-white/5 border-slate-200 shadow-xl dark:shadow-none rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-blue-500/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16" />
                    <p className="text-[9px] font-black text-muted dark:text-muted text-slate-500 uppercase tracking-[0.3em] mb-3">Ticket Promedio</p>
                    <h3 className="text-4xl font-black tracking-tighter text-foreground dark:text-foreground text-slate-900 mb-2">
                        {formatCurrency(stats.avgSale)}
                    </h3>
                    <p className="text-[10px] font-bold text-muted dark:text-muted text-slate-400 uppercase tracking-widest opacity-60">Valor por licencia</p>
                </div>
            </div>

            {/* Transaction Ledger Section */}
            <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none rounded-[3rem] p-10 relative overflow-hidden transition-all">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-600 opacity-20" />

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter shrink-0">
                        Libro de <span className="text-accent">Transacciones</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:max-w-2xl">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted opacity-80 dark:opacity-40" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por beat o comprador..."
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-[11px] font-bold text-slate-700 dark:text-white uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all placeholder:text-slate-400 dark:placeholder:text-muted"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-6 text-[10px] font-bold text-slate-700 dark:text-white uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all appearance-none cursor-pointer"
                            value={filterLicense}
                            onChange={(e) => setFilterLicense(e.target.value)}
                        >
                            <option value="all">Suscripción/Licencia</option>
                            <option value="EXCLUSIVE">Exclusive</option>
                            <option value="NON-EXCLUSIVE">Non-Exclusive</option>
                            <option value="BASIC">Basic</option>
                        </select>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="space-y-4">
                    {filteredSales.map((sale) => (
                        <div key={sale.id} className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-accent/20 transition-all duration-500">
                            <div className="flex items-center gap-6 flex-1">
                                {/* Beat Cover */}
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-300 dark:border-white/10 shadow-xl shrink-0 group-hover:scale-105 transition-transform duration-500">
                                    {sale.beats?.portadabeat_url ? (
                                        <Image
                                            src={sale.beats.portadabeat_url}
                                            fill
                                            className="object-cover"
                                            alt={sale.beats.title}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-white/5 flex items-center justify-center">
                                            <Music className="text-slate-400 dark:text-muted/20" />
                                        </div>
                                    )}
                                </div>

                                {/* Main Info */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">
                                            {sale.beats?.title || 'Beat eliminado'}
                                        </h4>
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${sale.license_type === 'EXCLUSIVE'
                                            ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500'
                                            : 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500'
                                            }`}>
                                            {sale.license_type || 'Licencia'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 group/buyer">
                                            {sale.buyer?.foto_perfil ? (
                                                <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-300 dark:border-white/20">
                                                    <Image src={sale.buyer.foto_perfil} width={20} height={20} className="object-cover" alt={sale.buyer.username} />
                                                </div>
                                            ) : (
                                                <User size={12} className="text-slate-400 dark:text-white/40" />
                                            )}
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-muted uppercase tracking-widest group-hover/buyer:text-accent transition-colors">
                                                {sale.buyer?.artistic_name || sale.buyer?.username || 'Comprador'}
                                            </span>
                                        </div>
                                        <div className="h-3 w-px bg-white/10" />
                                        <span className="text-[10px] font-bold text-muted/60 uppercase tracking-widest flex items-center gap-1.5">
                                            <Clock size={10} /> {new Date(sale.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Details */}
                            <div className="flex items-center justify-between md:justify-end gap-12 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-white/5">
                                <div className="text-left md:text-right">
                                    <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] mb-1">Estado</p>
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <ArrowDownLeft size={12} /> Comisionado
                                    </span>
                                </div>
                                <div className="text-right min-w-[100px]">
                                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.3em] mb-1">Impacto</p>
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-muted uppercase tracking-widest mb-1">{new Date(sale.created_at).toLocaleDateString()}</span>
                                            <span className="font-black text-lg text-slate-900 dark:text-foreground tracking-tighter">
                                                {formatCurrency(sale.monto)} <span className="text-[10px] uppercase text-slate-400 dark:opacity-40">{sale.moneda || 'MXN'}</span>
                                            </span>
                                        </div>
                                        <button className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/60 hover:bg-accent hover:text-white hover:border-accent transition-all group-hover:scale-105 active:scale-95">
                                            <Download size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredSales.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2.5rem]">
                            <CreditCard className="w-16 h-16 text-slate-300 dark:text-muted/10 mx-auto mb-6" />
                            <h4 className="text-lg font-black uppercase text-slate-400 dark:text-muted/40 tracking-tighter mb-2">No se encontraron transacciones</h4>
                            <p className="text-[10px] font-bold text-slate-300 dark:text-muted/30 uppercase tracking-[0.3em]">Ajusta los filtros para ver más resultados</p>
                        </div>
                    )}
                </div>

                {/* Pagination Placeholder */}
                {filteredSales.length > 10 && (
                    <div className="mt-12 flex justify-center">
                        <button className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-8 py-3 rounded-2xl text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                            Cargar más transacciones
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
