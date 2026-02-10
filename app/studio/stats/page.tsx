"use client";

import React from 'react';
import { BarChart, Activity, Heart, Play, DollarSign } from 'lucide-react';

export default function StudioStatsPage() {
    const [stats, setStats] = React.useState({
        totalPlays: 0,
        totalLikes: 0,
        conversionRate: 0,
        totalSales: 0
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
            if (!user) {
                setLoading(false);
                return;
            }

            // 1. Fetch Beats Stats
            const { data: beats, error: beatsError } = await import('@/lib/supabase').then(m => m.supabase
                .from('beats')
                .select('play_count, like_count')
                .eq('producer_id', user.id));

            if (beatsError) console.error("Error fetching beats stats:", beatsError);

            // 2. Fetch Sales Count
            const { count: salesCount } = await import('@/lib/supabase').then(m => m.supabase
                .from('sales')
                .select('id', { count: 'exact', head: true })
                .eq('seller_id', user.id));

            if (beats) {
                const totalPlays = beats.reduce((sum, b) => sum + (b.play_count || 0), 0);
                const totalLikes = beats.reduce((sum, b) => sum + (b.like_count || 0), 0);
                const totalSales = salesCount || 0;

                // Calculate Conversion (Sales / Plays) * 100
                const conversionRate = totalPlays > 0
                    ? ((totalSales / totalPlays) * 100).toFixed(2)
                    : 0;

                setStats({
                    totalPlays,
                    totalLikes,
                    conversionRate: Number(conversionRate),
                    totalSales
                });
            }
            setLoading(false);
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div className="bg-card rounded-[2.5rem] p-12 border border-border shadow-sm min-h-[500px] flex items-center justify-center">
            <div className="animate-spin text-muted"><Activity size={32} /></div>
        </div>
    );

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-3">Tu <span className="text-accent">Rendimiento</span></h1>
                    <div className="flex items-center gap-4">
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={12} className="text-accent" />
                            Datos en Tiempo Real
                        </p>
                        <div className="h-3 w-px bg-border" />
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Sincronizado hoy</p>
                    </div>
                </div>
                <div className="bg-background px-6 py-3 rounded-2xl border border-border/50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Total Histórico</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Plays Card */}
                <div className="group relative bg-[#f8fafc] dark:bg-white/5 p-8 rounded-[2.5rem] border border-border/50 hover:border-blue-500/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8 text-blue-500">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Play size={20} fill="currentColor" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Plays</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-6xl font-black text-foreground tracking-tighter">
                                {new Intl.NumberFormat('es-MX').format(stats.totalPlays)}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Reproducciones acumuladas</p>
                    </div>
                </div>

                {/* Likes Card */}
                <div className="group relative bg-[#fff7f7] dark:bg-white/5 p-8 rounded-[2.5rem] border border-border/50 hover:border-red-500/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8 text-red-500">
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                                <Heart size={20} fill="currentColor" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Likes</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-6xl font-black text-foreground tracking-tighter">
                                {new Intl.NumberFormat('es-MX').format(stats.totalLikes)}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Apoyo de la comunidad</p>
                    </div>
                </div>

                {/* Sales Card */}
                <div className="group relative bg-[#f0fdf4] dark:bg-white/5 p-8 rounded-[2.5rem] border border-border/50 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8 text-emerald-600">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total de Ventas</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2 text-emerald-600 dark:text-emerald-500">
                            <span className="text-6xl font-black tracking-tighter">
                                {new Intl.NumberFormat('es-MX').format(stats.totalSales)}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Éxito comercial acumulado</p>
                    </div>
                </div>
            </div>

            {/* Bottom visualizer placeholder refined */}
            <div className="relative p-12 bg-background/50 rounded-[3rem] border-2 border-dashed border-border/60 overflow-hidden text-center">
                <div className="relative z-10">
                    <BarChart className="w-16 h-16 text-muted/20 mx-auto mb-6" strokeWidth={1} />
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-2">Gráficas Detalladas</h3>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">
                        Estamos preparando visualizaciones avanzadas de retención y geolocalización.
                    </p>
                </div>
            </div>
        </div>
    );
}
