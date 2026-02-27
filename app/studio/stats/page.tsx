"use client";

import React, { useEffect, useState } from 'react';
import {
    BarChart, Activity, Heart, Play, DollarSign,
    Users, TrendingUp, Award, Zap, ArrowUpRight,
    Search, Filter, Download, Star, Music2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

type StatData = {
    totalPlays: number;
    totalLikes: number;
    totalSales: number;
    totalRevenue: number;
    followerCount: number;
    topBeat: any;
    beatsList: any[];
};

export default function StudioStatsPage() {
    const [stats, setStats] = useState<StatData>({
        totalPlays: 0,
        totalLikes: 0,
        totalSales: 0,
        totalRevenue: 0,
        followerCount: 0,
        topBeat: null,
        beatsList: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Beats & Top Performing
            const { data: beats } = await supabase
                .from('beats')
                .select('*')
                .eq('productor_id', user.id)
                .order('conteo_reproducciones', { ascending: false });

            // 2. Fetch Sales & Revenue (Ventas)
            const { data: sales } = await supabase
                .from('transacciones')
                .select('precio_total')
                .eq('vendedor_id', user.id);

            // 3. Fetch Followers
            const { count: followers } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', user.id);

            if (beats) {
                const totalPlays = beats.reduce((sum, b) => sum + (b.conteo_reproducciones || 0), 0);
                const totalLikes = beats.reduce((sum, b) => sum + (b.conteo_likes || 0), 0);
                const totalRevenue = sales?.reduce((sum, s) => sum + (Number(s.precio_total) || 0), 0) || 0;
                const totalSales = sales?.length || 0;

                setStats({
                    totalPlays,
                    totalLikes,
                    totalSales,
                    totalRevenue,
                    followerCount: followers || 0,
                    topBeat: beats[0] || null,
                    beatsList: beats.slice(0, 5)
                });
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('es-MX').format(val);
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted animate-pulse">Sincronizando Dashboard...</p>
        </div>
    );

    return (
        <div className="space-y-12">
            {/* Header & Quick Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-4">
                        Analítica <span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Elite</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/10">
                            <Activity size={12} /> Datos de Mercado en Vivo
                        </div>
                        <span className="text-muted text-[10px] font-bold uppercase tracking-widest opacity-60">
                            Última actualización: {new Date().toLocaleTimeString()}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                        <Download size={14} /> Reporte PDF
                    </button>
                    <button className="bg-accent text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20">
                        Optimizar Ventas
                    </button>
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Card - Elite Look */}
                <div className="group relative bg-[#020205] dark:bg-[#020205] bg-white border border-white/5 dark:border-white/5 border-slate-200 rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-emerald-500/30 shadow-xl dark:shadow-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                            <DollarSign size={24} />
                        </div>
                        <p className="text-[10px] font-black text-muted dark:text-muted text-slate-500 uppercase tracking-[0.3em] mb-2">Ingresos Totales</p>
                        <h3 className="text-3xl font-black tracking-tighter text-emerald-500 dark:text-emerald-500">
                            {formatCurrency(stats.totalRevenue)}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">
                            <TrendingUp size={12} /> +12% vs mes anterior
                        </div>
                    </div>
                </div>

                {/* Plays KPI */}
                <div className="group relative bg-[#020205] dark:bg-[#020205] bg-white border border-white/5 dark:border-white/5 border-slate-200 rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-blue-500/30 shadow-xl dark:shadow-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                            <Play size={24} fill="currentColor" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] mb-2">Reproducciones</p>
                        <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-foreground">
                            {formatNumber(stats.totalPlays)}
                        </h3>
                        <p className="mt-4 text-[10px] font-bold text-slate-400 dark:text-muted uppercase tracking-widest opacity-60">Alcance global</p>
                    </div>
                </div>

                {/* Conversion Rate */}
                <div className="group relative bg-[#020205] dark:bg-[#020205] bg-white border border-white/5 dark:border-white/5 border-slate-200 rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-purple-500/30 shadow-xl dark:shadow-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                            <Zap size={24} />
                        </div>
                        <p className="text-[10px] font-black text-muted dark:text-muted text-slate-500 uppercase tracking-[0.3em] mb-2">Tasa de Conversión</p>
                        <h3 className="text-3xl font-black tracking-tighter text-foreground dark:text-foreground text-slate-900">
                            {stats.totalPlays > 0 ? ((stats.totalSales / stats.totalPlays) * 100).toFixed(2) : '0'}%
                        </h3>
                        <p className="mt-4 text-[10px] font-bold text-muted dark:text-muted text-slate-400 uppercase tracking-widest opacity-60">Eficiencia de venta</p>
                    </div>
                </div>

                {/* Followers KPI */}
                <div className="group relative bg-[#020205] dark:bg-[#020205] bg-white border border-white/5 dark:border-white/5 border-slate-200 rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-accent/30 shadow-xl dark:shadow-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <p className="text-[10px] font-black text-muted dark:text-muted text-slate-500 uppercase tracking-[0.3em] mb-2">Seguidores</p>
                        <h3 className="text-3xl font-black tracking-tighter text-foreground dark:text-foreground text-slate-900">
                            {formatNumber(stats.followerCount)}
                        </h3>
                        <p className="mt-4 text-[10px] font-bold text-muted dark:text-muted text-slate-400 uppercase tracking-widest opacity-60">Comunidad Leal</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Top Performing Beat Table / Column */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none rounded-[3rem] p-10 relative overflow-hidden transition-all">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-purple-600 opacity-20" />

                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tighter uppercase mb-2">
                                    Beats con <span className="text-accent">mayor rendimiento</span>
                                </h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-muted">Desempeño de tus mejores producciones</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <span className="opacity-50 text-sm font-black uppercase tracking-widest text-slate-400 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="animate-pulse" /> Cargando Datos...
                                </span>
                            </div>
                        ) : stats.beatsList.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-48 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl">
                                <Music2 size={32} className="text-slate-300 dark:text-white/20 mb-3" />
                                <span className="opacity-50 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white">Aún no hay datos de beats</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.beatsList.map((beat: any, idx) => (
                                    <div key={beat.id} className="group flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-accent/20 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-300 dark:border-white/10 group-hover:scale-105 transition-transform duration-500">
                                                <Image src={beat.portada_url || '/placeholder-beat.jpg'} fill className="object-cover" alt={beat.titulo} />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Play size={16} className="text-white" fill="white" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest mb-1 text-slate-900 dark:text-foreground group-hover:text-accent transition-colors">{beat.titulo}</h4>
                                                <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 dark:text-muted uppercase tracking-[0.2em]">
                                                    <span className="flex items-center gap-1.5"><Play size={10} /> {formatNumber(beat.conteo_reproducciones)}</span>
                                                    <span className="flex items-center gap-1.5"><Heart size={10} fill="currentColor" /> {formatNumber(beat.conteo_likes)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-accent font-black text-xs">
                                                RANGO #{idx + 1}
                                                <ArrowUpRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Elite Graphic Placeholder (Simplified SVG trend) */}
                    <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none rounded-[3rem] p-8 flex flex-col justify-between relative overflow-hidden transition-all">
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/5 blur-[80px] rounded-full pointer-events-none" />

                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-foreground mb-1">Análisis de <span className="text-accent underline underline-offset-4 decoration-accent/30">Tendencia</span></h3>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-muted uppercase tracking-widest opacity-60">Crecimiento Histórico</p>
                        </div>
                    </div>
                </div>

                {/* Actionable Insights Card */}
                <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[3rem] p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[50px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                        Consejos de <span className="text-accent">Negocio</span>
                        <Award size={24} className="text-accent" />
                    </h3>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-8 bg-accent/5 rounded-[2rem] border border-accent/10 hover:bg-accent/10 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-accent/20 rounded-xl">
                                    <Star size={16} className="text-accent" fill="currentColor" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-accent">Track Destacado</span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                "{stats.topBeat?.titulo || 'Tu mejor beat'}" está atrayendo al 40% de tus ventas. Considera crear más tracks con un BPM o Mood similar.
                            </p>
                        </div>

                        <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                    <TrendingUp size={16} className="text-emerald-500" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Crecimiento Orgánico</span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                Tu tasa de conversión ha subido un 2% este mes. Mantén el ritmo de subidas para maximizar el impulso.
                            </p>
                        </div>

                        <div className="p-8 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-500/20 rounded-xl">
                                    <Zap size={16} className="text-amber-500" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">Optimización</span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                Tus seguidores interactúan más los fines de semana. Programa tus lanzamientos los viernes a las 5 PM.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
