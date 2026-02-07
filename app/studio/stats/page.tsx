"use client";

import React from 'react';
import { BarChart, Activity, Heart, Play } from 'lucide-react';

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
        <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-2">Estadísticas</h1>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest">Tu impacto en números</p>
                </div>
                <div className="bg-background px-4 py-2 rounded-full border border-border">
                    <span className="text-[10px] font-black uppercase text-muted">Total Histórico</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-blue-500/10 p-6 rounded-[2rem] border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-4 text-blue-500">
                        <Play size={20} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Plays</span>
                    </div>
                    <span className="text-4xl font-black text-foreground tracking-tighter block mb-2">
                        {new Intl.NumberFormat('es-MX').format(stats.totalPlays)}
                    </span>
                    <span className="text-[10px] font-bold text-muted uppercase">Reproducciones totales</span>
                </div>

                <div className="bg-red-500/10 p-6 rounded-[2rem] border border-red-500/20">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <Heart size={20} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Likes</span>
                    </div>
                    <span className="text-4xl font-black text-foreground tracking-tighter block mb-2">
                        {new Intl.NumberFormat('es-MX').format(stats.totalLikes)}
                    </span>
                    <span className="text-[10px] font-bold text-muted uppercase">Me gusta recibidos</span>
                </div>

                <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-100/20">
                    <div className="flex items-center gap-3 mb-4 text-emerald-500">
                        <Activity size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Conversión</span>
                    </div>
                    <span className="text-4xl font-black text-foreground tracking-tighter block mb-2">{stats.conversionRate}%</span>
                    <span className="text-[10px] font-bold text-muted uppercase">{stats.totalSales} Ventas totales</span>
                </div>
            </div>

            <div className="text-center py-12 bg-background rounded-3xl border-2 border-dashed border-border opacity-50">
                <BarChart className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                <p className="text-muted font-bold text-sm">Visualización avanzada próximamente...</p>
            </div>
        </div>
    );
}
