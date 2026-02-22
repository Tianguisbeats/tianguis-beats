"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus, Edit3, Trash2, Ticket, Percent, Calendar,
    CheckCircle2, XCircle, Loader2, Users, HardDrive,
    ArrowUpRight, Info, Search, Filter, Hash, CreditCard,
    DollarSign, BarChart3, ChevronRight, X
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import Switch from '@/components/ui/Switch';

// Tipos reflejando el nuevo esquema DB (combinado con legado para compatibilidad)
type Coupon = {
    id: string;
    code: string;
    codigo?: string; // Legacy
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    porcentaje_descuento?: number; // Legacy
    usage_limit: number | null;
    usos_maximos?: number | null; // Legacy
    usage_count: number;
    usos_actuales?: number; // Legacy
    valid_until: string | null;
    fecha_expiracion?: string | null; // Legacy
    target_tier: 'all' | 'free' | 'pro' | 'premium';
    min_purchase: number;
    is_active: boolean;
    user_id: string;
};

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTier, setUserTier] = useState<string | null>(null);
    const { showToast } = useToast();

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon> | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Tier
        const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
        setUserTier(profile?.subscription_tier);

        // Get Coupons (Intentamos primero con nuevos nombres, fallback a viejos)
        const { data: couponsData, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (couponsData) {
            // Normalizar datos para la UI
            const normalized = couponsData.map(c => ({
                ...c,
                code: c.code || c.codigo || '',
                discount_value: c.discount_value !== undefined ? c.discount_value : (c.porcentaje_descuento || 0),
                usage_limit: c.usage_limit !== undefined ? c.usage_limit : (c.usos_maximos || null),
                usage_count: c.usage_count !== undefined ? c.usage_count : (c.usos_actuales || 0),
                valid_until: c.valid_until || c.fecha_expiracion || null,
                discount_type: c.discount_type || 'percent',
                target_tier: c.target_tier || 'all',
                min_purchase: c.min_purchase || 0
            }));
            setCoupons(normalized);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !currentCoupon) return;

        setSaving(true);
        try {
            // Preparamos payload con nombres nuevos (el trigger o DB migrada se encargará)
            const payload: any = {
                user_id: user.id,
                code: currentCoupon.code?.toUpperCase(),
                codigo: currentCoupon.code?.toUpperCase(), // Compatibilidad
                discount_type: currentCoupon.discount_type || 'percent',
                discount_value: Number(currentCoupon.discount_value),
                porcentaje_descuento: Number(currentCoupon.discount_value), // Compatibilidad
                usage_limit: currentCoupon.usage_limit ? Number(currentCoupon.usage_limit) : null,
                usos_maximos: currentCoupon.usage_limit ? Number(currentCoupon.usage_limit) : null, // Compatibilidad
                valid_until: currentCoupon.valid_until || null,
                fecha_expiracion: currentCoupon.valid_until || null, // Compatibilidad
                target_tier: currentCoupon.target_tier || 'all',
                min_purchase: Number(currentCoupon.min_purchase) || 0,
                is_active: currentCoupon.id ? currentCoupon.is_active : true
            };

            let error;
            if (currentCoupon.id) {
                const { error: err } = await supabase.from('coupons').update(payload).eq('id', currentCoupon.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('coupons').insert(payload);
                error = err;
            }

            if (error) throw error;

            showToast(currentCoupon.id ? "Cupón actualizado" : "Cupón creado exitosamente", "success");
            setIsEditing(false);
            setCurrentCoupon(null);
            fetchData();
        } catch (err: any) {
            console.error(err);
            showToast("Error al guardar: " + err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este cupón? Esta acción no se puede deshacer.")) return;

        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) {
            showToast("Error al eliminar", "error");
        } else {
            showToast("Cupón eliminado", "success");
            fetchData();
        }
    };

    const toggleStatus = async (id: string, current: boolean) => {
        const { error } = await supabase.from('coupons').update({ is_active: !current }).eq('id', id);
        if (!error) {
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
            <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-[2rem] mb-6 flex items-center justify-center">
                <Loader2 className="animate-spin text-accent/20" size={32} />
            </div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-white/5 rounded-full" />
        </div>
    );

    if (userTier === 'free') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-50 dark:bg-card/10 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-border/50">
                <div className="bg-accent/10 p-8 rounded-[2.5rem] mb-8 text-accent shadow-2xl shadow-accent/20 animate-bounce-slow">
                    <Ticket size={64} strokeWidth={1} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter mb-4">Marketing <span className="text-accent">Potenciado</span></h1>
                <p className="text-slate-600 dark:text-muted max-w-md mb-12 font-medium leading-relaxed uppercase text-[10px] tracking-widest">
                    Crea cupones de descuento, segmenta a tus seguidores y dispara tus ventas. Exclusivo para miembros
                    <span className="text-slate-900 dark:text-foreground font-black mx-1">PRO</span> y <span className="text-accent font-black mx-1">PREMIUM</span>.
                </p>
                <Link href="/pricing" className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">
                    Mejorar Mi Plan <ArrowUpRight size={16} className="inline ml-2" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-20">
            {/* Header Elite: Architecture Style */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Marketing Engine v2.0</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground leading-[1] flex flex-col">
                            Cupones
                            <span className="text-accent">y Ofertas.</span>
                        </h1>
                        <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-[0.4em] opacity-60 ml-1">
                            Panel de conversión y lealtad
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="hidden xl:flex items-center gap-8 pr-8 border-r border-slate-200 dark:border-border/50">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-muted mb-1">Impacto Total</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-foreground tabular-nums">1.2M <span className="text-accent text-xs">MXN</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-muted mb-1">Cupones Activos</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-foreground tabular-nums">{coupons.filter(c => c.is_active).length}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setCurrentCoupon({ discount_type: 'percent', target_tier: 'all', min_purchase: 0 }); setIsEditing(true); }}
                        className="group relative overflow-hidden bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-xl active:scale-95 flex items-center gap-3"
                    >
                        <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <Plus size={18} strokeWidth={3} className="relative z-10 group-hover:text-white" />
                        <span className="relative z-10 group-hover:text-white pb-[1px]">Nuevo Cupón</span>
                    </button>
                </div>
            </div>

            {/* Coupons Grid */}
            {coupons.length === 0 && !isEditing ? (
                <div className="py-40 text-center bg-slate-50 dark:bg-[#020205] border border-slate-200 dark:border-white/5 rounded-[4rem] relative overflow-hidden shadow-inner dark:shadow-none">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm shadow-black/5 dark:shadow-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-accent">
                            <Ticket size={40} strokeWidth={1.5} className="rotate-12" />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter mb-4">Sistemas Vacíos</h3>
                        <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-[0.4em] max-w-sm mx-auto mb-12 opacity-50 leading-loose">
                            Tu motor de promociones está en modo standby. Activa una estrategia de descuentos para incentivar el checkout.
                        </p>
                        <button
                            onClick={() => { setCurrentCoupon({ discount_type: 'percent', target_tier: 'all', min_purchase: 0 }); setIsEditing(true); }}
                            className="bg-accent text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.5em] hover:bg-slate-900 transition-all shadow-xl shadow-accent/20"
                        >
                            Diseñar Primer Cupón
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-10">
                    {coupons.map(coupon => {
                        const usagePercent = coupon.usage_limit ? (coupon.usage_count / coupon.usage_limit) * 100 : 0;
                        const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();

                        // Configuración de colores por Tier
                        const tierConfig = {
                            all: { color: 'blue', label: 'Universal', bg: 'bg-blue-100 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-600 dark:text-blue-500' },
                            free: { color: 'slate', label: 'Free', bg: 'bg-slate-100 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-500/20', text: 'text-slate-600 dark:text-slate-500' },
                            pro: { color: 'emerald', label: 'Pro', bg: 'bg-emerald-100 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-500' },
                            premium: { color: 'amber', label: 'Premium', bg: 'bg-amber-100 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-500' }
                        }[coupon.target_tier as 'all' | 'free' | 'pro' | 'premium'] || { color: 'accent', label: 'Unknown', bg: 'bg-accent/10', border: 'border-accent/20', text: 'text-accent' };

                        return (
                            <div key={coupon.id} className={`group relative bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 transition-all duration-700 hover:border-accent/30 hover:shadow-2xl dark:hover:shadow-black/60 hover:-translate-y-1 overflow-hidden shadow-xl dark:shadow-none ${(!coupon.is_active || isExpired) && 'opacity-60 grayscale'}`}>

                                {/* Estética de Ticket: Recortes laterales */}
                                <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-slate-50 dark:bg-[#050508] border-r border-slate-200 dark:border-white/5 -translate-y-1/2 z-20" />
                                <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-slate-50 dark:bg-[#050508] border-l border-slate-200 dark:border-white/5 -translate-y-1/2 z-20" />

                                {/* Línea punteada de ticket */}
                                <div className="absolute bottom-[100px] left-8 right-8 h-px border-t border-dashed border-slate-300 dark:border-white/10 z-10" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="font-black text-3xl text-slate-900 dark:text-foreground tracking-[-0.05em] uppercase font-mono leading-none">{coupon.code}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${coupon.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                                    <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] opacity-60 dark:opacity-40">EXP: {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : '∞'}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 ${tierConfig.bg} ${tierConfig.border} border ${tierConfig.text} rounded-xl text-base font-black tracking-widest uppercase shadow-sm dark:shadow-inner`}>
                                                {coupon.discount_type === 'percent' ? `-${coupon.discount_value}%` : `-${coupon.discount_value} MXN`}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group/item">
                                                <div className={`absolute top-0 right-0 w-8 h-8 ${tierConfig.bg} blur-xl opacity-0 group-hover/item:opacity-100 transition-opacity`} />
                                                <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] opacity-80 dark:opacity-50 text-center sm:text-left">Nivel Objetivo</p>
                                                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-900 dark:text-foreground">
                                                    <Users size={12} className={tierConfig.text} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{tierConfig.label === 'Universal' ? 'Todos' : tierConfig.label}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-1">
                                                <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] opacity-80 dark:opacity-50 text-center sm:text-left">Compra Mínima</p>
                                                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-900 dark:text-foreground">
                                                    <DollarSign size={12} className="text-accent" />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{coupon.min_purchase > 0 ? `$${coupon.min_purchase}` : 'Sin mínimo'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Usage Metrics */}
                                        <div className="bg-slate-100/50 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-xl font-black text-slate-900 dark:text-foreground tabular-nums">{coupon.usage_count}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 dark:text-muted uppercase tracking-widest opacity-80 dark:opacity-40">Usos realizados</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-900 dark:text-foreground tabular-nums">
                                                        {coupon.usage_limit ? `${Math.round(usagePercent)}%` : '∞'}
                                                    </p>
                                                </div>
                                            </div>
                                            {coupon.usage_limit && (
                                                <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ease-out ${usagePercent > 90 ? 'bg-rose-500' : `${tierConfig.bg.replace('/10', '').replace('bg-', 'bg-')} shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]`}`}
                                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer (Alineado debajo de la línea punteada) */}
                                    <div className="mt-12 pt-0 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                active={coupon.is_active}
                                                onChange={() => toggleStatus(coupon.id, coupon.is_active)}
                                                activeColor="bg-emerald-500"
                                            />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${coupon.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {coupon.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setCurrentCoupon(coupon); setIsEditing(true); }}
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400 hover:bg-slate-800 transition-all text-[11px] font-black uppercase tracking-widest shadow-xl shadow-black/10 dark:shadow-emerald-500/20 active:scale-95"
                                            >
                                                <Edit3 size={14} /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-400 hover:bg-rose-100 transition-all flex items-center justify-center flex-shrink-0 shadow-sm dark:shadow-xl dark:shadow-rose-500/20 active:scale-95"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Editing Modal Premium: Architecture Style */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-2xl animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-[#0c0c0e] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl dark:shadow-[0_0_100px_rgba(var(--accent-rgb),0.2)] overflow-hidden border border-slate-200 dark:border-white/5 relative">
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                        <button
                            onClick={() => { setIsEditing(false); setCurrentCoupon(null); }}
                            className="absolute top-10 right-10 w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500 text-slate-500 hover:text-rose-500 dark:text-foreground dark:hover:text-white transition-all z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-12 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Configuración Estructural</span>
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground leading-[0.9]">
                                {currentCoupon?.id ? 'Refinar' : 'Arquitectura'} <br />
                                <span className="text-accent underline decoration-slate-200 dark:decoration-accent/20 underline-offset-8">del Cupón.</span>
                            </h2>
                        </div>

                        <form onSubmit={handleSave} className="space-y-10 relative z-10">
                            <div className="grid md:grid-cols-2 gap-10">
                                {/* Left Side: Basic Info */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-1">Código Promocional</label>
                                        <input
                                            required
                                            value={currentCoupon?.code || ''}
                                            onChange={e => setCurrentCoupon({ ...currentCoupon, code: e.target.value.toUpperCase() })}
                                            placeholder="EJ. FUEGO20"
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 font-black text-slate-900 dark:text-foreground text-2xl outline-none focus:border-accent transition-all uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-muted/10 font-mono shadow-sm dark:shadow-inner"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-1">Magnitud</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={currentCoupon?.discount_value || ''}
                                                    onChange={e => setCurrentCoupon({ ...currentCoupon, discount_value: Number(e.target.value) })}
                                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-5 font-black text-slate-900 dark:text-foreground outline-none focus:border-accent transition-all tabular-nums font-mono"
                                                />
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/60">
                                                    {currentCoupon?.discount_type === 'percent' ? <Percent size={18} /> : <DollarSign size={18} />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-1">Modo</label>
                                            <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 h-[66px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentCoupon({ ...currentCoupon, discount_type: 'percent' })}
                                                    className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${currentCoupon?.discount_type === 'percent' ? 'bg-accent text-white shadow-lg' : 'text-slate-500 dark:text-muted/60 hover:text-slate-900 dark:hover:text-foreground'}`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentCoupon({ ...currentCoupon, discount_type: 'fixed' })}
                                                    className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${currentCoupon?.discount_type === 'fixed' ? 'bg-accent text-white shadow-lg' : 'text-slate-500 dark:text-muted/60 hover:text-slate-900 dark:hover:text-foreground'}`}
                                                >
                                                    MXN
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-1">Protocolo de Segmentación</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['all', 'free', 'pro', 'premium'].map((tier) => (
                                                <button
                                                    key={tier}
                                                    type="button"
                                                    onClick={() => setCurrentCoupon({ ...currentCoupon, target_tier: tier as any })}
                                                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${currentCoupon?.target_tier === tier
                                                        ? 'border-accent bg-accent/10 text-accent'
                                                        : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-muted/60 hover:border-accent/30'}`}
                                                >
                                                    {tier === 'all' ? 'Universal' : tier}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Advanced Rules */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-1">Límite Operativo</label>
                                        <div className="relative">
                                            <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted/20" />
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="SIN LÍMITE (∞)"
                                                value={currentCoupon?.usage_limit || ''}
                                                onChange={e => setCurrentCoupon({ ...currentCoupon, usage_limit: e.target.value ? Number(e.target.value) : null })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-5 font-black text-slate-900 dark:text-foreground outline-none focus:border-accent transition-all tabular-nums font-mono placeholder:text-[9px] placeholder:tracking-[0.3em] placeholder:text-slate-400 dark:placeholder:text-muted/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-1">Cronología de Expiración</label>
                                        <div className="relative">
                                            <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted/20" />
                                            <input
                                                type="date"
                                                value={currentCoupon?.valid_until?.split('T')[0] || ''}
                                                onChange={e => setCurrentCoupon({ ...currentCoupon, valid_until: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-5 font-black text-slate-900 dark:text-foreground outline-none focus:border-accent transition-all font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-1">Umbral de Inversión Mínima</label>
                                        <div className="relative">
                                            <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/40" />
                                            <input
                                                type="number"
                                                min="0"
                                                value={currentCoupon?.min_purchase || ''}
                                                onChange={e => setCurrentCoupon({ ...currentCoupon, min_purchase: Number(e.target.value) })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-6 py-5 font-black text-slate-900 dark:text-foreground outline-none focus:border-accent transition-all tabular-nums font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-slate-200 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setCurrentCoupon(null); }}
                                    className="flex-1 py-6 rounded-2xl font-black text-slate-500 dark:text-muted/60 uppercase tracking-[0.4em] text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-transparent"
                                >
                                    Abortar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] bg-accent text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] hover:scale-[1.02] transition-all shadow-xl shadow-accent/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Sincronizando Celda...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            {currentCoupon?.id ? 'Compilar Cambios' : 'Desplegar Oferta'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
