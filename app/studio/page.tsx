"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase, getUserSafe } from '@/lib/supabase';
import LoadingTianguis from '@/components/LoadingTianguis';
import {
    TrendingUp, Play, Users, Music, Upload, BarChart2, DollarSign,
    ArrowRight, ArrowUpRight, Crown, Sparkles, Bell, ShoppingBag,
    UserPlus, MessageCircle, Package, Activity, HeartPulse
} from 'lucide-react';
import { calcularInsights, StudioInsight } from '@/lib/studioInsights';
import { resumenSaludCatalogo } from '@/lib/beatHealth';

type DashboardData = {
    nombre: string;
    foto: string | null;
    nivel: string;
    ventasSemana: number;
    ventasMes: number;
    ventasTotal: number;
    playsTotal: number;
    seguidores: number;
    beatsActivos: number;
    beatsTotal: number;
    bestSeller: { name: string; revenue: number } | null;
    insights: StudioInsight[];
    salud: { ok: number; aviso: number; critico: number; total: number };
    notificaciones: { id: string; tipo: string; contenido: string; url_destino: string | null; fecha_creacion: string }[];
};

function saludo() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

function tiempoRelativo(fecha: string) {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

const iconoNotif: Record<string, React.ReactNode> = {
    nueva_venta: <ShoppingBag size={14} />,
    nuevo_seguidor: <UserPlus size={14} />,
    nuevo_comentario: <MessageCircle size={14} />,
};

const formatMXN = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v);
const formatNum = (v: number) => new Intl.NumberFormat('es-MX').format(v);

export default function StudioDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const user = await getUserSafe();
                if (!user) return;

                const [profileRes, beatsRes, salesRes, followersRes, notifRes] = await Promise.all([
                    supabase.from('perfiles').select('nombre_artistico, nombre_usuario, foto_perfil, nivel_suscripcion').eq('id', user.id).single(),
                    supabase.from('beats').select('id, titulo, genero, portada_url, archivo_wav_url, archivo_stems_url, es_publico, esta_archivado, esta_desactivado_por_plan, es_premium_activa, es_exclusiva_premium_activa, conteo_reproducciones, conteo_ventas, conteo_likes').eq('productor_id', user.id),
                    supabase.from('transacciones').select('precio_total, fecha_creacion, nombre_producto').eq('vendedor_id', user.id),
                    supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguido_id', user.id),
                    supabase.from('notificaciones').select('id, tipo, contenido, url_destino, fecha_creacion').eq('usuario_id', user.id).order('fecha_creacion', { ascending: false }).limit(5),
                ]);

                const profile = profileRes.data;
                const beats = beatsRes.data || [];
                const sales = salesRes.data || [];

                const now = new Date();
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const ventasSemana = sales.filter(s => new Date(s.fecha_creacion) >= startOfWeek).reduce((a, s) => a + (Number(s.precio_total) || 0), 0);
                const ventasMes = sales.filter(s => new Date(s.fecha_creacion) >= startOfMonth).reduce((a, s) => a + (Number(s.precio_total) || 0), 0);
                const ventasTotal = sales.reduce((a, s) => a + (Number(s.precio_total) || 0), 0);
                const playsTotal = beats.reduce((a, b) => a + (b.conteo_reproducciones || 0), 0);
                const beatsActivos = beats.filter(b => b.es_publico && !b.esta_archivado && !b.esta_desactivado_por_plan).length;

                // Best seller por ingreso
                const porProducto = new Map<string, number>();
                for (const s of sales) {
                    const n = s.nombre_producto || 'Producto';
                    porProducto.set(n, (porProducto.get(n) || 0) + (Number(s.precio_total) || 0));
                }
                const bestEntry = [...porProducto.entries()].sort((a, b) => b[1] - a[1])[0];
                const bestSeller = bestEntry ? { name: bestEntry[0], revenue: bestEntry[1] } : null;

                setData({
                    nombre: profile?.nombre_artistico || profile?.nombre_usuario || 'Productor',
                    foto: profile?.foto_perfil || null,
                    nivel: profile?.nivel_suscripcion || 'free',
                    ventasSemana, ventasMes, ventasTotal, playsTotal,
                    seguidores: followersRes.count || 0,
                    beatsActivos,
                    beatsTotal: beats.length,
                    bestSeller,
                    insights: calcularInsights(beats, sales).slice(0, 3),
                    salud: resumenSaludCatalogo(beats),
                    notificaciones: notifRes.data || [],
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <LoadingTianguis />;
    if (!data) return null;

    const nivelBadge = data.nivel === 'premium'
        ? { label: 'Premium', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: <Crown size={12} /> }
        : data.nivel === 'pro'
        ? { label: 'Pro', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: <Crown size={12} /> }
        : { label: 'Free', color: 'text-muted bg-foreground/5 border-border', icon: <Sparkles size={12} /> };

    const kpis = [
        { label: 'Ventas esta semana', value: formatMXN(data.ventasSemana), icon: <TrendingUp size={20} />, accent: 'text-emerald-500 bg-emerald-500/10', href: '/studio/sales' },
        { label: 'Reproducciones', value: formatNum(data.playsTotal), icon: <Play size={20} />, accent: 'text-blue-500 bg-blue-500/10', href: '/studio/stats' },
        { label: 'Seguidores', value: formatNum(data.seguidores), icon: <Users size={20} />, accent: 'text-violet-500 bg-violet-500/10', href: '/studio/stats' },
        { label: 'Beats activos', value: `${data.beatsActivos}/${data.beatsTotal}`, icon: <Music size={20} />, accent: 'text-orange-500 bg-orange-500/10', href: '/studio/beats' },
    ];

    const accesos = [
        { label: 'Subir Beat', desc: 'Publica un nuevo beat', icon: <Upload size={18} />, href: '/upload', color: 'hover:border-blue-500/40 hover:bg-blue-500/5' },
        { label: 'Ver Estadísticas', desc: 'Métricas e insights', icon: <BarChart2 size={18} />, href: '/studio/stats', color: 'hover:border-violet-500/40 hover:bg-violet-500/5' },
        { label: 'Mis Ventas', desc: 'Historial y comprobantes', icon: <DollarSign size={18} />, href: '/studio/sales', color: 'hover:border-emerald-500/40 hover:bg-emerald-500/5' },
        { label: 'Cobros', desc: 'Configura Stripe', icon: <Package size={18} />, href: '/studio/payments', color: 'hover:border-amber-500/40 hover:bg-amber-500/5' },
    ];

    const toneStyle: Record<string, string> = {
        positivo: 'border-emerald-500/20 bg-emerald-500/[0.04]',
        oportunidad: 'border-amber-500/20 bg-amber-500/[0.04]',
        neutro: 'border-blue-500/20 bg-blue-500/[0.04]',
    };
    const toneText: Record<string, string> = {
        positivo: 'text-emerald-500',
        oportunidad: 'text-amber-500',
        neutro: 'text-blue-500',
    };

    return (
        <div className="space-y-10 pb-24 md:pb-0">
            {/* ── Encabezado con saludo ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative w-16 h-16 rounded-3xl overflow-hidden border-2 border-border bg-foreground/5 shrink-0">
                        {data.foto ? (
                            <Image src={data.foto} alt={data.nombre} fill sizes="64px" className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-black text-muted">{data.nombre.charAt(0).toUpperCase()}</div>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-1">{saludo()}</p>
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">{data.nombre}</h1>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mt-2 ${nivelBadge.color}`}>
                            {nivelBadge.icon} Plan {nivelBadge.label}
                        </div>
                    </div>
                </div>
                <Link href="/upload" className="bg-blue-500 text-white px-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95 flex items-center gap-3 w-fit h-fit shadow-xl shadow-blue-500/20">
                    <Upload size={18} className="stroke-[3]" /> Subir Beat
                </Link>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k) => (
                    <Link key={k.label} href={k.href} className="group bg-card border border-border rounded-[2rem] p-6 hover:border-accent/30 transition-all hover:-translate-y-1">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${k.accent}`}>{k.icon}</div>
                        <p className="text-2xl md:text-3xl font-black tracking-tighter text-foreground tabular-nums">{k.value}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted opacity-60 mt-1">{k.label}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Insights accionables (2/3) ── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Sparkles size={16} /></div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Insights para ti</h2>
                    </div>

                    {data.insights.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {data.insights.map((ins) => (
                                <div key={ins.id} className={`rounded-[1.75rem] border p-6 ${toneStyle[ins.tone]}`}>
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 ${toneText[ins.tone]}`}>{ins.titulo}</p>
                                    <p className="text-lg font-black text-foreground tracking-tight mb-2 leading-tight">{ins.valor}</p>
                                    <p className="text-[11px] text-muted font-medium leading-relaxed">{ins.detalle}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[1.75rem] border border-dashed border-border p-8 text-center">
                            <Activity size={28} className="mx-auto mb-3 text-muted/40" />
                            <p className="text-[11px] font-bold text-muted uppercase tracking-widest">Sube beats y genera ventas para desbloquear insights personalizados.</p>
                        </div>
                    )}

                    {/* Best seller */}
                    {data.bestSeller && (
                        <div className="rounded-[1.75rem] border border-border bg-card p-6 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0"><Crown size={22} /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Tu más vendido</p>
                                <p className="text-base font-black text-foreground truncate">{data.bestSeller.name}</p>
                            </div>
                            <p className="text-lg font-black text-emerald-500 tabular-nums shrink-0">{formatMXN(data.bestSeller.revenue)}</p>
                        </div>
                    )}

                    {/* ── Salud del catálogo ── */}
                    <div className="rounded-[1.75rem] border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"><HeartPulse size={16} /></div>
                                <h3 className="text-sm font-black uppercase tracking-tight text-foreground">Salud del catálogo</h3>
                            </div>
                            <Link href="/studio/beats" className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1">
                                Revisar <ArrowRight size={12} />
                            </Link>
                        </div>
                        {data.salud.total === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border py-6 text-center">
                                <HeartPulse size={24} className="mx-auto mb-3 text-muted/40" />
                                <p className="text-[11px] font-bold text-muted uppercase tracking-widest">Sube tu primer beat para ver la salud de tu catálogo aquí.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex h-3 rounded-full overflow-hidden bg-foreground/5">
                                    {data.salud.ok > 0 && <div className="bg-emerald-500" style={{ width: `${(data.salud.ok / data.salud.total) * 100}%` }} />}
                                    {data.salud.aviso > 0 && <div className="bg-amber-500" style={{ width: `${(data.salud.aviso / data.salud.total) * 100}%` }} />}
                                    {data.salud.critico > 0 && <div className="bg-rose-500" style={{ width: `${(data.salud.critico / data.salud.total) * 100}%` }} />}
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-emerald-500">{data.salud.ok} óptimos</span>
                                    <span className="text-amber-500">{data.salud.aviso} con avisos</span>
                                    <span className="text-rose-500">{data.salud.critico} críticos</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Columna derecha: actividad + accesos (1/3) ── */}
                <div className="space-y-6">
                    {/* Actividad reciente */}
                    <div className="rounded-[1.75rem] border border-border bg-card p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Bell size={16} /></div>
                            <h3 className="text-sm font-black uppercase tracking-tight text-foreground">Actividad reciente</h3>
                        </div>
                        {data.notificaciones.length === 0 ? (
                            <div className="py-4 text-center">
                                <Bell size={24} className="mx-auto mb-3 text-muted/40" />
                                <p className="text-[11px] font-bold text-muted uppercase tracking-widest">Aún no hay novedades. Aquí verás tus ventas, seguidores y comentarios nuevos.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {data.notificaciones.map((n) => {
                                    const inner = (
                                        <div className="flex gap-3 items-start py-2.5 px-2 -mx-2 rounded-xl hover:bg-foreground/[0.03] transition-colors">
                                            <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                                                {iconoNotif[n.tipo] || <Bell size={14} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] text-foreground font-medium leading-snug">{n.contenido}</p>
                                                <p className="text-[9px] text-muted opacity-50 mt-0.5">{tiempoRelativo(n.fecha_creacion)}</p>
                                            </div>
                                        </div>
                                    );
                                    return n.url_destino
                                        ? <Link key={n.id} href={n.url_destino}>{inner}</Link>
                                        : <div key={n.id}>{inner}</div>;
                                })}
                            </div>
                        )}
                    </div>

                    {/* Accesos rápidos */}
                    <div className="rounded-[1.75rem] border border-border bg-card p-6">
                        <h3 className="text-sm font-black uppercase tracking-tight text-foreground mb-5">Accesos rápidos</h3>
                        <div className="space-y-2">
                            {accesos.map((a) => (
                                <Link key={a.label} href={a.href} className={`group flex items-center gap-4 p-3 rounded-2xl border border-border transition-all ${a.color}`}>
                                    <div className="w-10 h-10 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center shrink-0">{a.icon}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-black uppercase tracking-tight text-foreground">{a.label}</p>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50">{a.desc}</p>
                                    </div>
                                    <ArrowUpRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
