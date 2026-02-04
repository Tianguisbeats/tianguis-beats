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

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;

    if (userTier === 'free') { // Allow Pro/Premium
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-amber-100 p-6 rounded-full mb-6 text-amber-600">
                    <Ticket size={48} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-4">Marketing Avanzado</h1>
                <p className="text-slate-500 max-w-md mb-8">
                    Crea cupones de descuento y promociones para aumentar tus ventas. Exclusivo para miembros
                    <span className="text-slate-900 font-bold"> Pro</span> y <span className="text-blue-600 font-bold">Premium</span>.
                </p>
                <Link href="/pricing" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Mejorar Plan
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Cupones</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Crea descuentos para tus clientes</p>
                </div>
                <button
                    onClick={() => { setCurrentCoupon({}); setIsEditing(true); }}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                    <Plus size={16} />
                    Nuevo Cupón
                </button>
            </div>

            {/* Empty State */}
            {coupons.length === 0 && !isEditing && (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-12 text-center">
                    <Ticket className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No tienes cupones activos</h3>
                    <p className="text-slate-400 text-sm mb-6">Ofrece descuentos limitados para fidelizar a tu audiencia.</p>
                    <button
                        onClick={() => { setCurrentCoupon({}); setIsEditing(true); }}
                        className="text-blue-600 font-bold uppercase tracking-widest text-xs hover:underline"
                    >
                        Crear mi primer cupón
                    </button>
                </div>
            )}

            {/* List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map(coupon => (
                    <div key={coupon.id} className={`bg-white p-6 rounded-2xl border transition-all group ${coupon.is_active ? 'border-slate-100 shadow-sm hover:shadow-md' : 'border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${coupon.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Ticket size={20} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => toggleStatus(coupon)} className={`p-2 rounded-lg ${coupon.is_active ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                                    {coupon.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                </button>
                                <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight">{coupon.codigo}</h3>
                            <span className="text-sm font-bold text-green-600">-{coupon.porcentaje_descuento}%</span>
                        </div>

                        <div className="space-y-2 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4 mt-4">
                            <div className="flex items-center justify-between">
                                <span>Usos:</span>
                                <span className="text-slate-700">{coupon.usos_actuales} / {coupon.usos_maximos || '∞'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Expira:</span>
                                <span className="text-slate-700">{coupon.fecha_expiracion ? new Date(coupon.fecha_expiracion).toLocaleDateString() : 'Nunca'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden">
                        <h2 className="text-xl font-black uppercase tracking-tighter mb-6">
                            Nuevo Cupón
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Código</label>
                                <input
                                    required
                                    value={currentCoupon?.codigo || ''}
                                    onChange={e => setCurrentCoupon({ ...currentCoupon, codigo: e.target.value.toUpperCase() })}
                                    placeholder="Ej. VERANO24"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase tracking-wider"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descuento (%)</label>
                                <div className="relative">
                                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        value={currentCoupon?.porcentaje_descuento || ''}
                                        onChange={e => setCurrentCoupon({ ...currentCoupon, porcentaje_descuento: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Límite de Usos</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Ilimitado"
                                        value={currentCoupon?.usos_maximos || ''}
                                        onChange={e => setCurrentCoupon({ ...currentCoupon, usos_maximos: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Expiración</label>
                                    <input
                                        type="date"
                                        value={currentCoupon?.fecha_expiracion?.split('T')[0] || ''}
                                        onChange={e => setCurrentCoupon({ ...currentCoupon, fecha_expiracion: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setCurrentCoupon(null); }}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors shadow-lg"
                                >
                                    {saving ? "Guardando..." : "Crear Cupón"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
