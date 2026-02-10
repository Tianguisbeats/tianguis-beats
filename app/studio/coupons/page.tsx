"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit3, Trash2, Ticket, Percent, Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Tipos
type Coupon = {
    id: string;
    codigo: string;
    porcentaje_descuento: number;
    usos_maximos: number | null;
    usos_actuales: number;
    fecha_expiracion: string | null;
    is_active: boolean;
};

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTier, setUserTier] = useState<string | null>(null);

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

        // Get Coupons
        const { data: couponsData } = await supabase
            .from('coupons')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (couponsData) setCoupons(couponsData);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !currentCoupon) return;

        try {
            const payload = {
                user_id: user.id,
                codigo: currentCoupon.codigo?.toUpperCase(),
                porcentaje_descuento: currentCoupon.porcentaje_descuento,
                usos_maximos: currentCoupon.usos_maximos || null,
                fecha_expiracion: currentCoupon.fecha_expiracion || null,
                is_active: true
            };

            let error;
            if (currentCoupon.id) {
                // Update
                const { error: err } = await supabase.from('coupons').update(payload).eq('id', currentCoupon.id);
                error = err;
            } else {
                // Create
                const { error: err } = await supabase.from('coupons').insert(payload);
                error = err;
            }

            if (error) throw error;
            setIsEditing(false);
            setCurrentCoupon(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error al guardar cupón: " + (err as any).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este cupón?")) return;

        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) {
            alert("Error al eliminar");
        } else {
            fetchData();
        }
    };

    const toggleStatus = async (coupon: Coupon) => {
        const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
        if (!error) fetchData();
    };

    if (loading) return <div className="flex justify-center p-12 text-muted"><Loader2 className="animate-spin" /></div>;

    if (userTier === 'free') { // Allow Pro/Premium
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-accent-soft p-6 rounded-full mb-6 text-accent">
                    <Ticket size={48} />
                </div>
                <h1 className="text-3xl font-black text-foreground mb-4">Marketing Avanzado</h1>
                <p className="text-muted max-w-md mb-8">
                    Crea cupones de descuento y promociones para aumentar tus ventas. Exclusivo para miembros
                    <span className="text-foreground font-bold"> Pro</span> y <span className="text-accent font-bold">Premium</span>.
                </p>
                <Link href="/pricing" className="bg-foreground text-background px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                    Mejorar Plan
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-3">Cupones <span className="text-accent">& Promos</span></h1>
                    <div className="flex items-center gap-4">
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Ticket size={12} className="text-accent" />
                            Estrategia de Ventas
                        </p>
                        <div className="h-3 w-px bg-border" />
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Fidelización Pro</p>
                    </div>
                </div>
                <button
                    onClick={() => { setCurrentCoupon({}); setIsEditing(true); }}
                    className="bg-foreground text-background px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-3 w-fit"
                >
                    <Plus size={16} /> Nuevo Cupón
                </button>
            </div>

            {/* Coupons List / Empty State */}
            {coupons.length === 0 && !isEditing ? (
                <div className="p-20 text-center bg-background/50 rounded-[3rem] border-2 border-dashed border-border/60">
                    <div className="w-20 h-20 bg-card rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-muted/20 shadow-inner">
                        <Ticket size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">No hay promociones</h3>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest max-w-xs mx-auto mb-10 opacity-60 leading-relaxed">
                        Crea códigos de descuento exclusivos para atraer más clientes y cerrar ventas rápidamente.
                    </p>
                    <button
                        onClick={() => { setCurrentCoupon({}); setIsEditing(true); }}
                        className="text-accent font-black text-[10px] uppercase tracking-[0.3em] hover:underline"
                    >
                        Generar mi primer código
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {coupons.map(coupon => (
                        <div key={coupon.id} className={`group bg-white dark:bg-[#08080a] border border-slate-200 dark:border-white/5 hover:border-accent/40 rounded-[2.5rem] p-8 transition-all duration-500 flex flex-col h-full shadow-sm hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${!coupon.is_active && 'opacity-60 grayscale'}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full pointer-events-none" />
                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${coupon.is_active ? 'bg-accent/10 text-accent' : 'bg-slate-100 dark:bg-white/5 text-muted'}`}>
                                    <Ticket size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleStatus(coupon)} title={coupon.is_active ? "Desactivar" : "Activar"} className={`w-10 h-10 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center transition-all ${coupon.is_active ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-slate-100 dark:bg-white/5 text-muted hover:text-foreground'}`}>
                                        {coupon.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                    </button>
                                    <button onClick={() => { setCurrentCoupon(coupon); setIsEditing(true); }} className="w-10 h-10 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all">
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(coupon.id)} className="w-10 h-10 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-rose-500/60 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-8 relative z-10">
                                <div className="flex flex-wrap items-center gap-4 mb-3">
                                    <h3 className="font-black text-3xl text-slate-900 dark:text-white tracking-widest uppercase">{coupon.codigo}</h3>
                                    <div className="px-4 py-1.5 bg-accent text-white rounded-xl text-[11px] font-black tracking-widest shadow-lg shadow-accent/20">
                                        -{coupon.porcentaje_descuento}% OFF
                                    </div>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Descuento directo en checkout</p>
                            </div>

                            <div className="mt-auto space-y-3 pt-6 border-t border-slate-100 dark:border-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-muted uppercase tracking-[0.2em]">Redenciones</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{coupon.usos_actuales} <span className="text-[10px] opacity-40">/ {coupon.usos_maximos || '∞'}</span></span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-muted uppercase tracking-[0.2em]">Válido hasta</span>
                                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-white/80 tracking-tight">
                                        <Calendar size={12} className="text-accent/60" />
                                        {coupon.fecha_expiracion ? new Date(coupon.fecha_expiracion).toLocaleDateString() : 'Eterno'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden border border-border">
                        <h2 className="text-xl font-black uppercase tracking-tighter mb-6 text-foreground">
                            {currentCoupon?.id ? 'Editar Cupón' : 'Nuevo Cupón'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Código</label>
                                <input
                                    required
                                    value={currentCoupon?.codigo || ''}
                                    onChange={e => setCurrentCoupon({ ...currentCoupon, codigo: e.target.value.toUpperCase() })}
                                    placeholder="Ej. VERANO24"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-black text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-accent uppercase tracking-wider"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Descuento (%)</label>
                                <div className="relative">
                                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        value={currentCoupon?.porcentaje_descuento || ''}
                                        onChange={e => setCurrentCoupon({ ...currentCoupon, porcentaje_descuento: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-3 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Límite de Usos</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Ilimitado"
                                        value={currentCoupon?.usos_maximos || ''}
                                        onChange={e => setCurrentCoupon({ ...currentCoupon, usos_maximos: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Expiración</label>
                                    <input
                                        type="date"
                                        value={currentCoupon?.fecha_expiracion?.split('T')[0] || ''}
                                        onChange={e => setCurrentCoupon({ ...currentCoupon, fecha_expiracion: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setCurrentCoupon(null); }}
                                    className="flex-1 py-3 rounded-xl font-bold text-muted uppercase tracking-widest text-xs hover:bg-background transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-foreground text-background py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent hover:text-white transition-colors shadow-lg"
                                >
                                    {saving ? "Guardando..." : (currentCoupon?.id ? "Guardar Cambios" : "Crear Cupón")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
