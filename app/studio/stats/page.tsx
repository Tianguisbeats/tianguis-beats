"use client";

import React, { useEffect, useState } from 'react';
import {
    BarChart, Activity, Heart, Play, DollarSign,
    Users, TrendingUp, Award, Zap, ArrowUpRight,
    Download, Star, Music2, ShieldCheck, Crown,
    Sparkles, X, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import LoadingTianguis from '@/components/LoadingTianguis';

type StatData = {
    totalPlays: number;
    totalLikes: number;
    totalSales: number;
    totalRevenue: number;
    followerCount: number;
    topBeat: any;
    beatsList: any[];
    userTier: string;
    expiryDate: Date | null;
    startDate: Date | null;
};

export default function StudioStatsPage() {
    const [stats, setStats] = useState<StatData>({
        totalPlays: 0, totalLikes: 0, totalSales: 0, totalRevenue: 0,
        followerCount: 0, topBeat: null, beatsList: [], userTier: 'free',
        expiryDate: null, startDate: null
    });
    const [loading, setLoading] = useState(true);
    const [showOptimizeModal, setShowOptimizeModal] = useState(false);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('perfiles')
                .select('nivel_suscripcion, fecha_termino_suscripcion, fecha_inicio_suscripcion')
                .eq('id', user.id).single();

            const { data: beats } = await supabase.from('beats')
                .select('*').eq('productor_id', user.id)
                .order('conteo_reproducciones', { ascending: false });

            const { data: sales } = await supabase.from('transacciones')
                .select('precio_total').eq('vendedor_id', user.id);

            const { count: followers } = await supabase.from('follows')
                .select('*', { count: 'exact', head: true }).eq('following_id', user.id);

            if (beats) {
                const totalPlays = beats.reduce((sum, b) => sum + (b.conteo_reproducciones || 0), 0);
                const totalLikes = beats.reduce((sum, b) => sum + (b.conteo_likes || 0), 0);
                const totalRevenue = sales?.reduce((sum, s) => sum + (Number(s.precio_total) || 0), 0) || 0;
                const totalSales = sales?.length || 0;
                setStats({
                    totalPlays, totalLikes, totalSales, totalRevenue,
                    followerCount: followers || 0,
                    topBeat: beats[0] || null,
                    beatsList: beats.slice(0, 5),
                    userTier: profile?.nivel_suscripcion || 'free',
                    expiryDate: profile?.fecha_termino_suscripcion ? new Date(profile.fecha_termino_suscripcion) : null,
                    startDate: profile?.fecha_inicio_suscripcion ? new Date(profile.fecha_inicio_suscripcion) : null
                });
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    const formatNumber = (val: number) =>
        new Intl.NumberFormat('es-MX').format(val);

    const getSubscriptionProgress = () => {
        if (!stats.expiryDate || stats.userTier === 'free') return { percent: 0, daysLeft: 0 };
        const now = new Date();
        const remainingMs = stats.expiryDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
        const total = stats.userTier === 'premium' && daysLeft > 60 ? 365 : 30;
        return { percent: Math.max(0, Math.min(100, (daysLeft / total) * 100)), daysLeft: Math.max(0, daysLeft) };
    };

    const handleDownloadCSV = () => {
        const rows = [
            ['Métrica', 'Valor'],
            ['Reproducciones totales', stats.totalPlays],
            ['Ventas totales', stats.totalSales],
            ['Ingresos totales (MXN)', stats.totalRevenue.toFixed(2)],
            ['Likes totales', stats.totalLikes],
            ['Seguidores', stats.followerCount],
            ['Plan activo', stats.userTier],
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estadisticas_tianguis_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const progress = getSubscriptionProgress();
    const isPremium = stats.userTier === 'premium';
    const isPro = stats.userTier === 'pro';
    const planColor = isPremium ? '#00f2ff' : '#f59e0b';
    const planTailwind = isPremium ? 'text-[#00f2ff]' : 'text-amber-400';
    const planBg = isPremium ? 'bg-[#00f2ff]/10' : 'bg-amber-500/10';
    const planBorder = isPremium ? 'border-[#00f2ff]/20' : 'border-amber-500/20';

    if (loading) return <LoadingTianguis />;

    // ── KPI Card component helper
    const KpiCard = ({ color, icon, value, label, sub }: any) => (
        <div className={`group relative bg-card border border-border rounded-[2.5rem] p-8 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-opacity-50 flex flex-col items-center text-center`}
            style={{ '--hc': color } as any}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent"
                style={{ backgroundImage: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />
            <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `${color}15` }} />
            <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: `${color}15`, color }}>
                    {icon}
                </div>
                <h3 className="text-3xl font-black tracking-tighter mb-1" style={{ color }}>{value}</h3>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">{label}</p>
                {sub && <div className="mt-auto text-[9px] font-bold text-muted uppercase tracking-widest opacity-70">{sub}</div>}
            </div>
        </div>
    );

    return (
        <div className="space-y-12">
            {/* Optimize Modal */}
            {showOptimizeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
                    <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                        <button onClick={() => setShowOptimizeModal(false)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all">
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                                <Zap size={20} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Optimizar Ventas</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { color: '#f59e0b', icon: <Star size={16} fill="currentColor" />, title: 'Track Destacado', tip: `"${stats.topBeat?.titulo || 'Tu mejor beat'}" atrae la mayor parte de tus plays. Crea más tracks con BPM y mood similar para capitalizar.` },
                                { color: '#10b981', icon: <TrendingUp size={16} />, title: 'Lanzamiento Estratégico', tip: 'Los jueves y viernes son los días con mayor actividad en el catálogo. Programa tus lanzamientos a las 5 PM hora local.' },
                                { color: '#00f2ff', icon: <BarChart size={16} />, title: 'Tasa de Conversión', tip: `Tu tasa es ${stats.totalPlays > 0 ? ((stats.totalSales / stats.totalPlays) * 100).toFixed(2) : '0'}%. La media de la industria es 0.5%. Mejora tus portadas y descripciones para aumentarla.` },
                            ].map((item, i) => (
                                <div key={i} className="p-5 rounded-2xl border flex gap-4" style={{ background: `${item.color}10`, borderColor: `${item.color}20` }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}20`, color: item.color }}>{item.icon}</div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: item.color }}>{item.title}</p>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.tip}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Datos en Vivo</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-2 leading-[1]">
                        Analítica<br /><span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Elite.</span>
                    </h1>
                    <p className="text-muted text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">
                        Última actualización: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadCSV} className="group relative overflow-hidden bg-card border border-border px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 text-foreground hover:border-accent/30">
                        <Download size={14} /> Reporte CSV
                    </button>
                    <button onClick={() => setShowOptimizeModal(true)} className="group relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center gap-2">
                        <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <Sparkles size={14} className="relative z-10 group-hover:text-white transition-colors" />
                        <span className="relative z-10 group-hover:text-white transition-colors">Optimizar Ventas</span>
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard color="#10b981" icon={<DollarSign size={22} />} value={formatCurrency(stats.totalRevenue)} label="Ingresos Totales" sub={<span className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400"><TrendingUp size={10} /> Listo para retiro</span>} />
                <KpiCard color="#10b981" icon={<ShieldCheck size={22} />} value={formatCurrency(stats.totalRevenue * 0.15)} label="Ahorro en Comisiones" sub={`Gracias a tu plan ${stats.userTier !== 'free' ? stats.userTier.toUpperCase() : 'Pro/Premium'}`} />

                {/* Subscription progress card */}
                <div className={`group relative bg-card border rounded-[2.5rem] p-8 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center text-center ${planBorder}`}>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent"
                        style={{ backgroundImage: `linear-gradient(to right, transparent, ${planColor}60, transparent)` }} />
                    <div className="relative z-10 flex flex-col items-center w-full">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${planBg} ${planTailwind}`}>
                            {isPremium ? <Crown size={22} /> : <Star size={22} />}
                        </div>
                        {stats.userTier !== 'free' ? (
                            <>
                                <h3 className={`text-3xl font-black tracking-tighter mb-1 flex items-end gap-1 ${planTailwind}`}>
                                    {progress.daysLeft} <span className="text-sm font-bold uppercase tracking-widest opacity-60 mb-1">días</span>
                                </h3>
                                <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
                                    Restantes del {isPremium ? 'Premium' : 'Pro'}
                                </p>
                                <div className="w-full bg-foreground/10 rounded-full h-1 mb-2 mt-auto">
                                    <div className="h-1 rounded-full transition-all" style={{ width: `${progress.percent}%`, background: planColor }} />
                                </div>
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                    Vence el {stats.expiryDate?.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center mt-2 gap-4">
                                <p className="text-[11px] font-black text-slate-500 dark:text-muted uppercase tracking-widest">Plan Free Activo</p>
                                <Link href="/pricing" className="px-6 py-2 bg-gradient-to-r from-accent to-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                                    <Sparkles size={12} /> Hazte PRO
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <KpiCard color="#3b82f6" icon={<Play size={22} fill="currentColor" />} value={formatNumber(stats.totalPlays)} label="Reproducciones" sub="Alcance Global" />
                <KpiCard color="#a855f7" icon={<Zap size={22} />} value={`${stats.totalPlays > 0 ? ((stats.totalSales / stats.totalPlays) * 100).toFixed(2) : '0'}%`} label="Tasa de Conversión" sub="Eficiencia de Venta" />
                <KpiCard color="#a855f7" icon={<Users size={22} />} value={formatNumber(stats.followerCount)} label="Seguidores" sub="Comunidad Leal" />
            </div>

            {/* Bottom section: Top Beats + Insights */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Top Beats */}
                <div className="lg:col-span-2 bg-card border border-border rounded-[3rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tighter uppercase mb-1">
                                Mayor <span className="text-accent">Rendimiento</span>
                            </h2>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">Top 5 de tus producciones</p>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black text-muted uppercase tracking-widest">
                            <Activity size={12} className="text-accent" /> En vivo
                        </div>
                    </div>
                    {stats.beatsList.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-40 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                            <Music2 size={28} className="text-muted/20 mb-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40">Aún no hay beats</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.beatsList.map((beat: any, idx) => {
                                const maxPlays = stats.beatsList[0]?.conteo_reproducciones || 1;
                                const pct = Math.round(((beat.conteo_reproducciones || 0) / maxPlays) * 100);
                                return (
                                    <div key={beat.id} className="group relative flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/[0.08] hover:border-accent/20 transition-all overflow-hidden">
                                        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent to-purple-600 transition-all duration-700" style={{ width: `${pct}%` }} />
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 relative">
                                            <Image src={beat.portada_url || '/placeholder.jpg'} fill className="object-cover" alt={beat.titulo} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-foreground truncate group-hover:text-accent transition-colors">{beat.titulo}</h4>
                                            <div className="flex items-center gap-4 text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                                                <span className="flex items-center gap-1"><Play size={9} /> {formatNumber(beat.conteo_reproducciones || 0)}</span>
                                                <span className="flex items-center gap-1"><Heart size={9} fill="currentColor" /> {formatNumber(beat.conteo_likes || 0)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[9px] font-black text-accent uppercase tracking-widest">#{idx + 1}</span>
                                            <p className="text-[8px] font-bold text-muted opacity-50 uppercase">{pct}%</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Business Tips */}
                <div className="bg-card border border-border rounded-[3rem] p-8 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                    <div className="mb-6">
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-1 text-foreground">
                            Consejos de <span className="text-accent">Negocio</span>
                        </h3>
                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50">Basados en tus datos</p>
                    </div>
                    <div className="space-y-4 flex-1">
                        {[
                            { c: 'accent', icon: <Star size={12} fill="currentColor" />, title: 'Track Estrella', body: `Maximiza "${stats.topBeat?.titulo?.slice(0, 20) || 'tu mejor beat'}..." con un pack especial o remix.` },
                            { c: 'emerald-500', icon: <TrendingUp size={12} />, title: 'Ritmo Correcto', body: 'Lanza los jueves-viernes a las 5 PM para el pico de atención de tu audiencia.' },
                            { c: 'amber-400', icon: <Zap size={12} />, title: 'Conversión+', body: `Estás a ${Math.max(0, (0.5 - ((stats.totalSales / (stats.totalPlays || 1)) * 100))).toFixed(2)}% de la media del sector. Mejora tu portada.` },
                        ].map((tip, i) => (
                            <div key={i} className={`p-4 rounded-2xl bg-${tip.c}/5 border border-${tip.c}/10 hover:bg-${tip.c}/10 transition-colors`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 bg-${tip.c}/15 rounded-lg text-${tip.c}`}>{tip.icon}</div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest text-${tip.c}`}>{tip.title}</span>
                                </div>
                                <p className="text-[11px] text-muted font-medium leading-relaxed">{tip.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
