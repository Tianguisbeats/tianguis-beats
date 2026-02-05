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
        <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm min-h-[500px] flex items-center justify-center">
            <div className="animate-spin text-slate-300"><Activity size={32} /></div>
        </div>
    );

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">Estadísticas</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tu impacto en números</p>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Histórico</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                    <div className="flex items-center gap-3 mb-4 text-blue-600">
                        <Play size={20} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Plays</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter block mb-2">
                        {new Intl.NumberFormat('es-MX').format(stats.totalPlays)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Reproducciones totales</span>
                </div>

                <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <Heart size={20} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Likes</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter block mb-2">
                        {new Intl.NumberFormat('es-MX').format(stats.totalLikes)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Me gusta recibidos</span>
                </div>

                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                    <div className="flex items-center gap-3 mb-4 text-emerald-600">
                        <Activity size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Conversión</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter block mb-2">{stats.conversionRate}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{stats.totalSales} Ventas totales</span>
                </div>
            </div>

            <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 opacity-50">
                <BarChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-sm">Visualización avanzada próximamente...</p>
            </div>
        </div>
    );
}
