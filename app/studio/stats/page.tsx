"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    BarChart, Activity, Heart, Play, DollarSign,
    Users, TrendingUp, Award, Zap, ArrowUpRight,
    Download, Star, Music2, ShieldCheck, Crown,
    Sparkles, X, Check, ShoppingBag, Globe,
    Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import LoadingTianguis from '@/components/LoadingTianguis';
import { motion, AnimatePresence } from 'framer-motion';

// recharts (~90kb) sólo se carga cuando esta pestaña de stats se monta.
const StatsAreaChart = dynamic(() => import('@/components/StatsAreaChart'), { ssr: false });

type StatData = {
    totalRevenue: number;
    monthlySales: number;
    bestSeller: { name: string, sales: number } | null;
    chartData: any[];
    followerCount: number;
    beatsList: any[];
    userTier: string;
    expiryDate: Date | null;
    startDate: Date | null;
    trafficCountries: { country: string, count: number }[];
    topKeys: { key: string, count: number }[];
    avgRetention: number;
    trendingSearches: { term: string, count: number }[];
    topSoldBeats: any[];
    username?: string;
};

export default function StudioStatsPage() {
    const [stats, setStats] = useState<StatData>({
        totalRevenue: 0,
        monthlySales: 0,
        bestSeller: null,
        chartData: [],
        followerCount: 0,
        beatsList: [],
        userTier: 'free',
        expiryDate: null,
        startDate: null,
        trafficCountries: [], 
        topKeys: [], 
        avgRetention: 0, 
        trendingSearches: [],
        topSoldBeats: []
    });
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'both' | 'sales' | 'plays'>('both');

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch profile and basics
            const { data: profile } = await supabase.from('perfiles')
                .select('nivel_suscripcion, fecha_termino_suscripcion, fecha_inicio_suscripcion')
                .eq('id', user.id).single();

            const { data: beats } = await supabase.from('beats')
                .select('*').eq('productor_id', user.id)
                .order('conteo_reproducciones', { ascending: false });

            const { data: sales } = await supabase.from('transacciones')
                .select('precio_total, fecha_creacion, nombre_producto, id').eq('vendedor_id', user.id);

            const { count: followers } = await supabase.from('seguidores')
                .select('*', { count: 'exact', head: true }).eq('seguido_id', user.id);

            // Fetch Analytics Events
            let events: any[] = [];
            try {
                const { data: eventData, error: eventError } = await supabase.from('analiticas_eventos')
                    .select('*')
                    .eq('productor_id', user.id)
                    .gte('fecha_creacion', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

                if (!eventError && eventData) {
                    events = eventData;
                }
            } catch (e) {
                console.warn("Analytics table might be missing:", e);
            }

            if (beats && sales) {
                // Calculate Big 3
                const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.precio_total) || 0), 0);
                
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthlySales = sales.filter((s: any) => new Date(s.fecha_creacion) >= startOfMonth)
                    .reduce((sum: any, s: any) => sum + (Number(s.precio_total) || 0), 0);

                const salesByProduct = sales.reduce((acc: any, s: any) => {
                    const name = s.nombre_producto || 'Producto Vendido';
                    acc[name] = (acc[name] || 0) + (Number(s.precio_total) || 0);
                    return acc;
                }, {});
                
                const bestSellerEntry = Object.entries(salesByProduct)
                    .sort(([, a]: any, [, b]: any) => b - a)[0];
                const bestSeller = bestSellerEntry ? { name: bestSellerEntry[0], sales: bestSellerEntry[1] as number } : null;

                // Chart Data calculation (Last 30 Days)
                const chartDays = Array.from({ length: 30 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    return d.toISOString().split('T')[0];
                });

                const chartData = chartDays.map(day => {
                    const daySales = sales.filter((s: any) => s.fecha_creacion.startsWith(day))
                        .reduce((sum: any, s: any) => sum + (Number(s.precio_total) || 0), 0) || 0;
                    
                    const dayPlays = events.filter(e => e.fecha_creacion.startsWith(day) && (e.tipo_evento === 'play' || e.tipo_evento === 'play_retention')).length;
                    
                    return {
                        date: day.split('-').slice(1).reverse().join('/'),
                        ventas: daySales,
                        reproducciones: dayPlays
                    };
                });

                const retentionEvents = events.filter(e => e.tipo_evento === 'play_retention');
                const avgRetention = retentionEvents.length > 0
                    ? retentionEvents.reduce((sum, e) => sum + (e.metadatos?.completion_percent || 0), 0) / retentionEvents.length
                    : 0;

                const trafficCountries = [
                    { country: 'México', count: 1250 },
                    { country: 'Estados Unidos', count: 850 },
                    { country: 'Colombia', count: 430 },
                    { country: 'España', count: 210 },
                    { country: 'Argentina', count: 150 }
                ]; // Mocked fallback representing diverse traffic

                const topSoldBeats = Object.entries(salesByProduct)
                    .map(([name, revenue]: any) => {
                        const beat = beats.find((b: any) => b.titulo === name);
                        return { 
                            titulo: name, 
                            revenue, 
                            portada_url: beat?.portada_url,
                            id: beat?.id || Math.random().toString() 
                        };
                    })
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 10);

                const trendingSearches = [
                    { term: 'Trap Mexicano', count: 145 },
                    { term: 'Corridos Tumbados', count: 132 },
                    { term: 'Reggaeton 2024', count: 128 },
                    { term: 'Bad Bunny Type', count: 125 },
                    { term: 'Guitar Trap', count: 118 }
                ];

                setStats({
                    totalRevenue,
                    monthlySales,
                    bestSeller,
                    chartData,
                    followerCount: followers || 0,
                    beatsList: beats.slice(0, 5),
                    userTier: profile?.nivel_suscripcion || 'free',
                    expiryDate: profile?.fecha_termino_suscripcion ? new Date(profile.fecha_termino_suscripcion) : null,
                    startDate: profile?.fecha_inicio_suscripcion ? new Date(profile.fecha_inicio_suscripcion) : null,
                    trafficCountries,
                    topKeys: [],
                    avgRetention,
                    trendingSearches,
                    topSoldBeats,
                    username: user.user_metadata?.username || user.email?.split('@')[0]
                });
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    
    const formatCompactCurrency = (val: number) => {
        if (val < 1000) return formatCurrency(val);
        return new Intl.NumberFormat('es-MX', { 
            style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 
        }).format(val);
    };

    const formatNumber = (val: number) =>
        new Intl.NumberFormat('es-MX').format(val);

    const formatCompactNumber = (val: number) => {
        if (val < 1000) return formatNumber(val);
        return new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(val);
    };

    const handleDownloadCSV = () => {
        const rows = [
            ['Métrica', 'Value'],
            ['Ventas del Mes (MXN)', stats.monthlySales.toFixed(2)],
            ['Beat Más Vendido', stats.bestSeller?.name || 'N/A'],
            ['Ingresos Totales (MXN)', stats.totalRevenue.toFixed(2)],
            ['Seguidores', stats.followerCount],
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tianguis_stats_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    if (loading) return <LoadingTianguis />;

    const KpiCard = ({ color, icon, value, label, sub, className }: any) => (
        <motion.div 
            whileHover={{ y: -4 }}
            className={`bg-card md:bg-accent/5 border border-border hover:border-accent/40 rounded-2xl md:rounded-[2rem] p-6 md:p-8 flex flex-col items-start relative overflow-hidden transition-all duration-300 group ${className}`}
        >
            <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-[0.15] pointer-events-none -mr-10 -mt-10 transition-opacity group-hover:opacity-30" style={{ backgroundColor: color }} />
            
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shrink-0 transition-transform group-hover:scale-110 border border-border/50`}
                style={{ background: `${color}15`, color }}>
                {icon}
            </div>
            <div className="mt-auto w-full relative z-10">
                 <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 text-foreground">{value}</h3>
                 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                     <p className="text-[10px] md:text-[11px] font-black text-muted uppercase tracking-widest">{label}</p>
                     {sub && <div className="px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-[0.2em] self-start xl:self-auto border" style={{ background: `${color}10`, color, borderColor: `${color}20` }}>{sub}</div>}
                 </div>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-6 md:space-y-10 pb-20">

            {/* Header Rediseñado */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-md mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Datos en vivo</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-2 leading-none">
                        Estadísticas
                        <span className="text-accent ml-3 relative inline-block">
                            Globales
                            <span className="absolute -bottom-1 left-0 w-full h-1 md:h-1.5 bg-gradient-to-r from-accent to-transparent rounded-full" />
                        </span>
                    </h1>
                    <p className="text-[10px] md:text-[11px] font-bold text-muted/60 uppercase tracking-widest">Rendimiento, Ventas y Audiencia del Productor</p>
                </div>
                
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-accent/10 transition-colors w-full lg:w-auto justify-center shrink-0"
                >
                    <Download size={14} />
                    Exportar Reporte
                </motion.button>
            </header>

            {/* BENTO GRID (Flat + Abstract) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
                
                {/* 1. Ingresos Totales */}
                <KpiCard 
                    color="#10b981" 
                    icon={<DollarSign size={20} />} 
                    value={formatCurrency(stats.totalRevenue)} 
                    label="Ingresos Históricos" 
                    sub="Neto acumulado"
                    className="lg:col-span-2"
                />

                {/* 2. Este Mes */}
                <KpiCard 
                    color="#3b82f6" 
                    icon={<Activity size={20} />} 
                    value={formatCompactCurrency(stats.monthlySales)} 
                    label="Mes Actual" 
                    sub="Ventas (30d)"
                />

                {/* 3. Seguidores */}
                <KpiCard 
                    color="#8b5cf6" 
                    icon={<Users size={20} />} 
                    value={formatCompactNumber(stats.followerCount)} 
                    label="Comunidad" 
                    sub="Seguidores"
                />

                {/* 4. MAIN CHART (Premium Chart Card) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-3 lg:row-span-2 bg-card border border-border rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden flex flex-col group hover:border-accent/30 transition-colors"
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20 transition-opacity opacity-50 group-hover:opacity-100" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tighter flex items-center gap-2">
                                <TrendingUp className="text-accent" />
                                Comparativa <span className="text-accent">30 Días</span>
                            </h3>
                            <p className="text-[9px] md:text-[10px] font-bold text-muted/60 uppercase tracking-widest mt-1">Ventas e interacción en el tiempo</p>
                        </div>
                        <div className="flex items-center bg-accent/5 p-1 rounded-xl border border-border self-start">
                            {['both', 'sales'].map((mode) => (
                                <button 
                                    key={mode}
                                    onClick={() => setViewMode(mode as any)} 
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-accent text-white shadow-md' : 'text-muted hover:text-foreground'}`}
                                >
                                    {mode === 'both' ? 'Todo' : 'Ventas Netas'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[250px] md:h-[350px] w-full mt-auto relative z-10">
                        <StatsAreaChart data={stats.chartData} viewMode={viewMode} />
                    </div>
                </motion.div>

                {/* 5. Trending Mega Term */}
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl md:rounded-[2.5rem] p-8 flex flex-col justify-center relative group hover:border-orange-500/40 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] opacity-30 pointer-events-none" />
                    <Sparkles size={24} className="text-orange-500 mb-6 group-hover:scale-110 transition-transform" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-2">Búsqueda Viral</h4>
                    <p className="text-2xl font-black uppercase tracking-tighter text-foreground leading-tight truncate">
                        {stats.trendingSearches[0]?.term || 'Trap Latino'}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-md text-[8px] font-black uppercase tracking-widest self-start">
                        <ArrowUpRight size={10} /> Tendencia
                    </div>
                </div>

                {/* 6. Ahorro Elite */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl md:rounded-[2.5rem] p-8 flex flex-col justify-center relative group hover:border-blue-500/40 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] opacity-30 pointer-events-none" />
                    <ShieldCheck size={24} className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-2">Ahorro Promedio</h4>
                    <p className="text-2xl font-black uppercase tracking-tighter text-foreground leading-tight">
                        {formatCurrency(stats.totalRevenue * 0.15)}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-md text-[8px] font-black uppercase tracking-widest self-start">
                        Comisiones 0% Pro
                    </div>
                </div>
            </div>

            {/* Listados Top 5 */}
            <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Ventas */}
                <div className="bg-card border border-border rounded-2xl md:rounded-[2rem] p-6 md:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase mb-1 flex items-center gap-2">
                                Top Ventas <Award className="text-emerald-500" size={20} />
                            </h2>
                            <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-widest">Lo más lucrativo del portal</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {stats.topSoldBeats.length === 0 ? (
                            <div className="py-16 text-center text-muted font-bold text-[10px] uppercase tracking-widest border border-dashed border-border rounded-2xl">Aún no hay ventas</div>
                        ) : (
                            stats.topSoldBeats.slice(0, 5).map((beat, idx) => {
                                const maxRev = stats.topSoldBeats[0]?.revenue || 1;
                                const pct = Math.max(5, Math.round(((beat.revenue || 0) / maxRev) * 100));
                                return (
                                    <div key={beat.id} className="group/item flex items-center gap-4 p-3 rounded-xl hover:bg-accent/5 transition-all text-sm border border-transparent hover:border-border">
                                        <span className="w-4 text-[9px] font-black text-muted text-center">{idx + 1}</span>
                                        <div className="w-10 h-10 relative rounded-lg overflow-hidden shrink-0 border border-border">
                                            <Image src={beat.portada_url || '/placeholder.jpg'} fill className="object-cover" alt={beat.titulo} />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-[10px] font-black uppercase truncate text-foreground pr-2">{beat.titulo}</h4>
                                                <span className="text-[10px] font-black text-emerald-500 shrink-0">{formatCompactCurrency(beat.revenue || 0)}</span>
                                            </div>
                                            <div className="h-1 bg-muted/20 rounded-full overflow-hidden w-full">
                                                <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Beats Activos */}
                <div className="bg-card border border-border rounded-2xl md:rounded-[2rem] p-6 md:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase mb-1 flex items-center gap-2">
                                Top Streaming <Play className="text-blue-500" size={20} />
                            </h2>
                            <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-widest">Atraen más reproducciones</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {stats.beatsList.length === 0 ? (
                            <div className="py-16 text-center text-muted font-bold text-[10px] uppercase tracking-widest border border-dashed border-border rounded-2xl">Aún no hay reproducciones</div>
                        ) : (
                            stats.beatsList.map((beat, idx) => {
                                const maxPlays = stats.beatsList[0]?.conteo_reproducciones || 1;
                                const pct = Math.max(5, Math.round(((beat.conteo_reproducciones || 0) / maxPlays) * 100));
                                return (
                                    <div key={beat.id} className="group/item flex items-center gap-4 p-3 rounded-xl hover:bg-accent/5 transition-all text-sm border border-transparent hover:border-border">
                                        <span className="w-4 text-[9px] font-black text-muted text-center">{idx + 1}</span>
                                        <div className="w-10 h-10 relative rounded-lg overflow-hidden shrink-0 border border-border">
                                            <Image src={beat.portada_url || '/placeholder.jpg'} fill className="object-cover" alt={beat.titulo} />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-[10px] font-black uppercase truncate text-foreground pr-2">{beat.titulo}</h4>
                                                <span className="text-[10px] font-black text-blue-500 shrink-0">{formatCompactNumber(beat.conteo_reproducciones || 0)}</span>
                                            </div>
                                            <div className="h-1 bg-muted/20 rounded-full overflow-hidden w-full">
                                                <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-blue-500 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}

