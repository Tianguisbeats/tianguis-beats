"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
    DollarSign, Clock, User, ArrowUpRight, Music,
    Download, Search, Filter, CreditCard,
    ArrowDownLeft, ExternalLink, Calendar,
    TrendingUp, Users, Wallet, Package, Crown
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
                    precio_total,
                    fecha_creacion,
                    tipo_licencia,
                    metodo_pago,
                    nombre_producto,
                    tipo_producto,
                    comprador:perfiles!comprador_id (nombre_usuario, nombre_artistico, foto_perfil)
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
                amount: sale.precio_total,
                created_at: sale.fecha_creacion,
                license_type: sale.tipo_licencia,
                payment_method: sale.metodo_pago,
                tipo_producto: sale.tipo_producto,
                producto: {
                    titulo: sale.nombre_producto || 'Producto Vendido',
                    type: sale.tipo_producto,
                    portada_url: null
                },
                comprador: sale.comprador
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
                sale.producto?.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.comprador?.nombre_usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.comprador?.nombre_artistico?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterLicense === "all" || sale.tipo_producto === filterLicense;

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

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'beat': return <Music size={18} />;
            case 'sound_kit': return <Package size={18} />;
            case 'service': return <DollarSign size={18} />;
            case 'plan': return <Crown size={18} className="text-accent" />;
            default: return <Package size={18} />;
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted animate-pulse">Sincronizando Tesorería...</p>
        </div>
    );

    return (
        <div className="space-y-12">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/20 to-accent opacity-20" />
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-4">
                        Historial de <span className="text-accent underline decoration-border underline-offset-8">Ventas</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-muted">
                        <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-success/20">
                            <Wallet size={12} /> Portal Seguro
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                            <Calendar size={12} /> Sincronizado hoy
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-card border border-border px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all flex items-center gap-2 active:scale-95">
                        <Download size={14} /> Reporte PDF
                    </button>
                    <button className="bg-foreground text-background dark:bg-foreground dark:text-background px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white hover:scale-105 transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center gap-2">
                        Retirar Fondos <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>

            {/* Financial KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative bg-card border border-border shadow-xl dark:shadow-2xl rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-accent/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] -mr-16 -mt-16" />
                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-3">Balance Histórico</p>
                    <h3 className="text-4xl font-black tracking-tighter text-foreground mb-2">
                        {formatCurrency(totalRevenue)}
                    </h3>
                    <div className="flex items-center gap-2 text-success text-[10px] font-bold uppercase tracking-widest">
                        <TrendingUp size={12} /> Listo para retiro
                    </div>
                </div>

                <div className="group relative bg-card border border-border shadow-xl dark:shadow-none rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-success/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 blur-[50px] -mr-16 -mt-16" />
                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-3">Ventas Recientes (30d)</p>
                    <h3 className="text-4xl font-black tracking-tighter text-foreground mb-2">
                        {stats.recentSales} <span className="text-sm font-bold text-muted uppercase tracking-widest">Unidades</span>
                    </h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-60">Volumen de mercado</p>
                </div>

                <div className="group relative bg-card border border-border shadow-xl dark:shadow-none rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-info/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-info/5 blur-[50px] -mr-16 -mt-16" />
                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-3">Ticket Promedio</p>
                    <h3 className="text-4xl font-black tracking-tighter text-foreground mb-2">
                        {formatCurrency(stats.avgSale)}
                    </h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-60">Valor por licencia</p>
                </div>
            </div>

            {/* Transaction Ledger Section */}
            <div className="bg-card border border-border shadow-xl dark:shadow-none rounded-[3rem] p-10 relative overflow-hidden transition-all">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/20 to-accent opacity-20" />

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter shrink-0">
                        Libro de <span className="text-accent">Transacciones</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:max-w-2xl">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-80" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por beat o comprador..."
                                className="w-full bg-accent/5 border border-border rounded-2xl py-3 pl-12 pr-4 text-[11px] font-bold text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all placeholder:text-muted"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-accent/5 border border-border rounded-2xl py-3 px-6 text-[10px] font-bold text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all appearance-none cursor-pointer"
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

                {/* Ledger Table */}
                <div className="space-y-6">
                    {filteredSales.map((sale) => (
                        <div key={sale.id} className="group relative bg-accent/5 border border-border hover:bg-accent/10 hover:border-accent/40 rounded-3xl p-5 transition-all duration-500 hover:shadow-xl dark:hover:shadow-accent/5 overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                                {/* Product Info Section */}
                                <div className="flex items-center gap-5 flex-1 w-full">
                                    <div className="w-14 h-14 bg-card border border-border shadow-lg rounded-2xl flex items-center justify-center text-muted group-hover:text-accent group-hover:scale-105 transition-all duration-500 shrink-0 relative overflow-hidden">
                                        {sale.producto?.portada_url ? (
                                            <Image
                                                src={sale.producto.portada_url}
                                                fill
                                                className="object-cover"
                                                alt={sale.producto.titulo}
                                            />
                                        ) : (
                                            getItemIcon(sale.tipo_producto)
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[8px] font-black text-accent uppercase tracking-[0.2em]">
                                                {sale.tipo_producto === 'beat' ? 'Beat / Licencia' :
                                                    sale.tipo_producto === 'sound_kit' ? 'Sound Kit' :
                                                        sale.tipo_producto === 'service' ? 'Servicio' : 'Producto'}
                                            </span>
                                            {sale.license_type && (
                                                <span className="bg-foreground/5 dark:bg-white/5 border border-border px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest text-muted">
                                                    {sale.license_type}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-base font-black text-foreground uppercase tracking-tight truncate group-hover:text-accent transition-colors mb-2">
                                            {sale.producto?.titulo || 'Producto Vendido'}
                                        </h4>

                                        {/* Buyer Preview */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-background/50 dark:bg-white/5 border border-border px-2 py-1 rounded-xl">
                                                {sale.comprador?.foto_perfil ? (
                                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-border">
                                                        <Image src={sale.comprador.foto_perfil} width={20} height={20} className="object-cover" alt={sale.comprador.nombre_usuario} />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                                                        <User size={10} className="text-accent" />
                                                    </div>
                                                )}
                                                <span className="text-[9px] font-bold text-foreground uppercase tracking-widest">
                                                    {sale.comprador?.nombre_artistico || sale.comprador?.nombre_usuario || 'Cliente Tianguis'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted/60 text-[9px] font-bold uppercase tracking-widest">
                                                <Clock size={10} /> {new Date(sale.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Impact Section */}
                                <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">Estado</span>
                                        <div className="flex items-center gap-1.5 text-success">
                                            <ArrowDownLeft size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Acreditado</span>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px bg-border hidden lg:block" />

                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-0.5">Ingreso Neto</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-black text-foreground tracking-tighter">
                                                {formatCurrency(sale.amount)}
                                            </span>
                                            <span className="text-[8px] font-black text-accent uppercase tracking-widest bg-accent/5 px-1.5 py-0.5 rounded-md border border-accent/10">{sale.payment_method || 'Stripe'}</span>
                                        </div>
                                    </div>

                                    <button className="w-10 h-10 bg-foreground text-background dark:bg-foreground dark:text-background rounded-xl flex items-center justify-center hover:bg-accent hover:text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/5">
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
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

                {/* Pagination Placeholder */}
                {filteredSales.length > 10 && (
                    <div className="mt-12 flex justify-center">
                        <button className="bg-accent/5 border border-border px-8 py-3 rounded-2xl text-[10px] font-black text-foreground uppercase tracking-widest hover:bg-accent/10 transition-all">
                            Cargar más transacciones
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
