"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    CreditCard, Crown, Shield, Zap, RefreshCcw, AlertTriangle,
    CheckCircle2, Calendar, ArrowRight, Loader2, ExternalLink, Star, X, Download, QrCode, Lock, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';
import ValidationQR from '@/components/ValidationQR';
import { Fingerprint, ShoppingBag, FileText as FileTextIcon, ShieldCheck, ChevronRight } from 'lucide-react';

export default function StudioBillingPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const { showToast } = useToast();

    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState<any>(null);
    const [couponText, setCouponText] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [profileRes, txRes] = await Promise.all([
                supabase
                    .from('perfiles')
                    .select('id, nivel_suscripcion, fecha_inicio_suscripcion, fecha_termino_suscripcion, stripe_cliente_id, nombre_artistico, nombre_usuario, foto_perfil, es_prueba, cancela_al_final, pago_pendiente')
                    .eq('id', user.id)
                    .single(),
                supabase
                    .from('transacciones')
                    .select('*')
                    .eq('comprador_id', user.id)
                    .eq('tipo_producto', 'plan')
                    .order('fecha_creacion', { ascending: false })
            ]);

            if (profileRes.data) {
                setProfile({ ...profileRes.data, userId: user.id, email: user.email });
            }
            if (txRes.data && txRes.data.length > 0) {
                const lastTx = txRes.data[0];
                setTransactions(txRes.data);
                
                // Si la última transacción tiene cupón, traer el texto descriptivo
                if (lastTx.cupon_id) {
                    const { data: couponData } = await supabase
                        .from('cupones')
                        .select('texto_descuento')
                        .eq('id', lastTx.cupon_id)
                        .single();
                    if (couponData?.texto_descuento) {
                        setCouponText(couponData.texto_descuento);
                    }
                }
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleCancelResume = async (action: 'cancel' | 'resume') => {
        if (!profile?.userId) return;
        setRedirecting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Sesión no encontrada', 'error');
                return;
            }
            const res = await fetch('/api/stripe/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(action === 'cancel' ? 'Suscripción cancelada' : 'Suscripción mantenida', 'success');
                setProfile({ ...profile, cancela_al_final: data.cancel_at_period_end });
            } else {
                throw new Error(data.error || 'No se pudo procesar la solicitud');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setRedirecting(false);
        }
    };

    const handleManageBilling = async () => {
        setRedirecting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Sesión no encontrada', 'error');
                return;
            }

            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    returnUrl: window.location.href
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'No se pudo abrir el portal');
            }
        } catch (err: any) {
            showToast(err.message || 'Error al abrir portal de facturación', 'error');
            setRedirecting(false);
        }
    };

    const currentTx = transactions[0];

    // DETERMINACIÓN DE NIVEL (TIER) CON FALLBACK:
    let rawTier = profile?.nivel_suscripcion?.toString().toLowerCase().trim() || 'free';
    
    // Si el perfil dice 'free' pero hay una transacción de plan reciente, confiamos en la transacción
    if (rawTier === 'free' && currentTx) {
        const txName = (currentTx.nombre_producto || currentTx.tipo_licencia || '').toLowerCase();
        if (txName.includes('premium')) rawTier = 'premium';
        else if (txName.includes('pro') || txName.includes('plus')) rawTier = 'pro';
    }

    const isPremium = rawTier === 'premium' || rawTier.includes('premium');
    const isPro = !isPremium && (rawTier.includes('pro') || rawTier.includes('plus'));
    const isFree = !isPremium && !isPro;

    const planLabel = isPremium ? 'Premium' : isPro ? 'Pro' : 'Gratis';
    
    const isYearly = currentTx?.nombre_producto?.toLowerCase().includes('anual') || 
                     (currentTx?.precio_total && currentTx.precio_total > 500) || 
                     (profile?.fecha_termino_suscripcion && Math.ceil((new Date(profile.fecha_termino_suscripcion).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 35);

    let planPrice = 'Sin costo';
    if (isPremium) {
        planPrice = isYearly ? '$3,591 MXN / año' : '$399 MXN / mes';
    } else if (isPro) {
        planPrice = isYearly ? '$1,530 MXN / año' : '$170 MXN / mes';
    }

    const planGradient = isPremium
        ? 'from-blue-500/20 via-blue-600/10 to-transparent border-blue-500/40'
        : isPro
            ? 'from-amber-500/20 via-amber-600/10 to-transparent border-amber-500/40'
            : 'from-slate-400/10 via-slate-500/5 to-transparent border-slate-400/20';

    const planGlowColor = isPremium ? '#3b82f6' : isPro ? '#f59e0b' : '#94a3b8';

    const planIcon = isPremium
        ? <Crown size={26} className="text-blue-500" fill="currentColor" />
        : isPro
            ? <Star size={26} className="text-amber-500" fill="currentColor" />
            : <Shield size={26} className="text-muted" />;

    const planBadgeColor = isPremium
        ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
        : isPro
            ? 'bg-amber-500/15 text-amber-500 border-amber-500/40'
            : 'bg-slate-500/10 text-slate-500 border-slate-500/30';

    const showGratisLabel = (profile?.es_prueba || couponText) && !isFree;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatDateShort = (dateStr: any) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('es-MX', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) { return 'N/A'; }
    };

    const getRenewalStatus = () => {
        // 1. Fuente principal: fecha_termino_suscripcion del perfil o metadatos de la transacción
        let expiryDate = profile?.fecha_termino_suscripcion || currentTx?.metadatos?.expiry_date;

        // 2. Fallback: calcular desde fecha_inicio_suscripcion (1 mes o 1 año según plan)
        if (!expiryDate && profile?.fecha_inicio_suscripcion) {
            const start = new Date(profile.fecha_inicio_suscripcion);
            const estimated = new Date(start);
            if (isYearly) {
                estimated.setFullYear(estimated.getFullYear() + 1);
            } else {
                estimated.setMonth(estimated.getMonth() + 1);
            }
            expiryDate = estimated.toISOString();
        }

        // 3. Fallback desde fecha de la última transacción
        if (!expiryDate && currentTx?.fecha_creacion) {
            const txDate = new Date(currentTx.fecha_creacion);
            const estimated = new Date(txDate);
            if (isYearly) {
                estimated.setFullYear(estimated.getFullYear() + 1);
            } else {
                estimated.setMonth(estimated.getMonth() + 1);
            }
            expiryDate = estimated.toISOString();
        }

        if (!expiryDate) return { days: null, label: 'N/A' };

        const end = new Date(expiryDate);
        const today = new Date();
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        const days = diff > 0 ? diff : 0;
        let label = formatDateShort(expiryDate);
        
        return { days, label };
    };

    const { days: renewalDays, label: renewalLabel } = getRenewalStatus();
    const effectiveStartDate = profile?.fecha_inicio_suscripcion || currentTx?.fecha_creacion;

    if (loading) {
        return <LoadingTianguis />;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Aviso de Pago Pendiente */}
            {profile?.pago_pendiente && (
                <div className="mb-6 p-5 border border-rose-500/30 bg-rose-500/10 rounded-2xl md:rounded-[2rem] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                    <div className="flex items-start md:items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-1">Problema con tu Pago</h3>
                            <p className="text-[11px] font-bold text-rose-500/80 leading-relaxed uppercase tracking-widest max-w-sm">
                                Tu último pago ha fallado. Actualiza tu método de pago con Stripe para evitar que tu cuenta pase al plan básico.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleManageBilling}
                        disabled={redirecting}
                        className="w-full md:w-auto px-6 py-4 outline-none border-none bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                        {redirecting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={14} />}
                        Actualizar Tarjeta
                    </button>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                    <span className="opacity-40">Mi</span> <br />
                    <span className="text-blue-500 relative inline-block">
                        Suscripción
                        <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                    </span>
                </h1>
                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-2">
                    Gestiona tu plan y método de pago
                </p>
            </div>

            {/* Plan Card */}
            <div className={`relative rounded-2xl md:rounded-[2rem] p-5 md:p-8 bg-gradient-to-br ${planGradient} border overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
                        style={{ background: planGlowColor }} />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[60px] opacity-10 pointer-events-none"
                        style={{ background: planGlowColor }} />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-7">
                        <div className={`w-14 h-14 md:w-16 md:h-16 p-3 md:p-3.5 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${planBadgeColor} border shadow-inner`}>
                            {planIcon}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar items-center gap-2 mb-2 pb-1">
                                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${planBadgeColor}`}>
                                    {couponText ? 'Periodo de prueba' : 'Plan Activo'}
                                </span>
                                {profile?.pago_pendiente ? (
                                    <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 flex items-center gap-1.5">
                                        <AlertTriangle size={10} /> Pago Fallido
                                    </span>
                                ) : isFree ? (
                                    <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full border border-slate-500/30 bg-slate-500/10 text-slate-500 flex items-center gap-1.5">
                                        <Shield size={10} /> Gratis
                                    </span>
                                ) : profile?.cancela_al_final ? (
                                    <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 flex items-center gap-1.5">
                                        <AlertTriangle size={10} /> Cancela al finalizar
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex items-center gap-1.5">
                                        <CheckCircle2 size={10} /> Activo
                                    </span>
                                )}
                            </div>
                             <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                                Tianguis <span style={{ color: planGlowColor }}>{planLabel}</span>
                            </h2>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-1">
                                {couponText ? (
                                    <span className="text-emerald-400 flex items-center gap-1.5 animate-pulse">
                                        <Sparkles size={12} fill="currentColor" /> {couponText}
                                    </span>
                                ) : isFree ? (
                                    'Plan Gratuito'
                                ) : planPrice}
                            </p>
                        </div>

                        {isPremium && !profile?.cancela_al_final ? (
                            <button
                                onClick={handleManageBilling}
                                disabled={redirecting}
                                className="shrink-0 flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full md:w-auto shadow-lg shadow-blue-500/20"
                            >
                                {redirecting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} 
                                Gestionar Suscripción
                            </button>
                        ) : profile?.cancela_al_final ? (
                            <button
                                onClick={() => handleCancelResume('resume')}
                                disabled={redirecting}
                                className="shrink-0 flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {redirecting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                                Mantener Suscripción
                            </button>
                        ) : isFree ? (
                            <Link href="/pricing" className="block w-full text-center py-4 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-foreground/10">
                                Ver Planes de Pago
                            </Link>
                        ) : (
                            <button
                                onClick={handleManageBilling}
                                disabled={redirecting}
                                className="shrink-0 flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 w-full md:w-auto shadow-lg shadow-amber-500/20"
                            >
                                {redirecting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} 
                                Gestionar Suscripción
                            </button>
                        )}
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted/70 flex items-center gap-1.5">
                                <Calendar size={10} className={isPremium ? 'text-blue-400' : 'text-amber-500'} /> Inicio del plan
                            </span>
                            <p className="text-sm font-black text-foreground">
                                {formatDateShort(effectiveStartDate)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted/70 flex items-center gap-1.5">
                                <RefreshCcw size={10} className={isPremium ? 'text-blue-400' : 'text-amber-500'} /> Próxima renovación
                            </span>
                            <p className="text-sm font-black text-foreground">
                                {renewalLabel}
                            </p>
                            {renewalDays !== null && !isFree && (
                                <p className={`text-[9px] font-black uppercase tracking-widest ${renewalDays <= 7 ? 'text-amber-500' : 'text-muted/50'}`}>
                                    {renewalDays === 0 ? 'Vence hoy' : profile?.cancela_al_final ? `Termina en ${renewalDays} día${renewalDays === 1 ? '' : 's'}` : `En ${renewalDays} día${renewalDays === 1 ? '' : 's'}`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

            {/* Billing Management Footer Button */}

            {/* Payment History */}
            {transactions.length > 0 ? (
                <div className="overflow-hidden mt-12">
                    <div className="py-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center">
                                <Zap size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-foreground">Historial de Pagos</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{transactions.length} transacciones de suscripción</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {transactions.map((tx) => {
                            const txTier = (tx.tipo_licencia || tx.nombre_producto || '').toLowerCase();
                            const isTxPremium = txTier.includes('premium');
                            const txIconClass = isTxPremium ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30';
                            const txIcon = isTxPremium ? <Crown size={16} className="text-blue-400" /> : <Star size={16} className="text-amber-500" fill="currentColor" />;
                            return (
                            <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 bg-card/30 hover:bg-card border border-border/50 hover:border-border rounded-2xl transition-all group gap-4">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${txIconClass} border`}>
                                        {txIcon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-[11px] text-foreground uppercase tracking-tight truncate">
                                            Tianguis {tx.nombre_producto || `Plan ${tx.tipo_licencia || ''}`}
                                        </p>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                            {formatDateShort(tx.fecha_creacion)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <p className="font-black text-sm text-foreground">${tx.precio_total?.toLocaleString() || tx.precio?.toLocaleString()} <span className="text-[9px] text-muted font-bold">{tx.moneda || 'MXN'}</span></p>
                                        <span className="inline-flex items-center gap-1 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                                            <CheckCircle2 size={9} /> {tx.estado_pago || 'Completado'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTx(tx)}
                                        className="px-4 py-2 bg-foreground/5 hover:bg-accent hover:text-white text-foreground text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-border hover:border-accent group-hover:border-accent/30"
                                    >
                                        Ver detalles
                                    </button>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                </div>
            ) : (
                <div className="p-10 border-2 border-dashed border-border rounded-[2.5rem] text-center">
                    <Zap size={32} className="text-muted/20 mx-auto mb-3" />
                    <p className="text-[11px] font-black uppercase text-muted tracking-widest">Sin historial de pagos aún</p>
                </div>
            )}

            {/* Ver todos los planes Button */}
            <div className="flex justify-center py-4">
                <Link
                    href="/pricing"
                    className="flex items-center gap-3 px-10 py-5 bg-card border border-border text-foreground hover:bg-accent hover:text-white hover:border-accent rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 group"
                >
                    Ver todos los planes <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* ── 1. MODAL DE CONFIRMACIÓN (REPLICADO DE PRICING) ── */}
            {showConfirmModal && confirmModalData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-400/20 rounded-[2.5rem] p-8 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                        
                        <button onClick={() => setShowConfirmModal(false)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all">
                            <X size={18} />
                        </button>

                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {confirmModalData.icon} Plan {confirmModalData.name}
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
                                Cambio de Plan
                            </h2>
                            {profile?.fecha_termino_suscripcion && (
                                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Tu periodo actual vence</p>
                                    <p className="text-sm font-bold text-white">{formatDate(profile.fecha_termino_suscripcion)}</p>
                                </div>
                            )}
                        </div>

                        <ul className="space-y-3 mb-8">
                            {confirmModalData.messages?.map((msg: string, i: number) => msg && (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                                    <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-amber-500/15 text-amber-400">
                                        <CheckCircle2 size={12} strokeWidth={3} />
                                    </div>
                                    {msg}
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => {
                                setShowConfirmModal(false);
                                handleManageBilling();
                            }} 
                            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-amber-500 text-white hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Ir a Gestionar en Stripe →
                        </button>
                        <button onClick={() => setShowConfirmModal(false)} className="w-full mt-3 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction Detail Modal — REPLICATED FROM MY PURCHASES */}
            {selectedTx && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedTx(null)} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/20 rounded-2xl md:rounded-[3rem] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        {/* Modal Glow Wrapper */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 dark:from-blue-600/10 via-transparent to-purple-600/5 dark:to-purple-600/10 pointer-events-none" />
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/10 dark:bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

                        {/* Modal Header */}
                        <div className="relative z-10 p-6 sm:p-8 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Detalles del Pedido</h3>
                                <p className="text-[10px] font-bold text-muted dark:text-white/50 uppercase tracking-widest">
                                    Orden {selectedTx.orden_pedido || `#${selectedTx.id?.slice(0, 8).toUpperCase()}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="w-12 h-12 rounded-full bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center text-foreground dark:text-white hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all z-20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 scrollbar-hide text-slate-900 dark:text-white relative z-10">
                            {/* General Info Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                                <div className="p-5 bg-blue-50 dark:bg-blue-600/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center">
                                    <p className="text-[9px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                        <CreditCard size={10} /> Pago
                                    </p>
                                    <p className="text-[11px] font-black text-blue-900 dark:text-white uppercase tracking-tight">{selectedTx.metodo_pago || 'Stripe'}</p>
                                </div>
                                <div className="p-5 bg-amber-50 dark:bg-amber-600/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center">
                                    <p className="text-[9px] font-black text-amber-600 dark:text-amber-300 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                        <Calendar size={10} /> Fecha
                                    </p>
                                    <p className="text-[11px] font-black text-amber-900 dark:text-white uppercase tracking-tight">{formatDateShort(selectedTx.fecha_creacion)}</p>
                                </div>
                                <div className="p-5 bg-slate-50 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center">
                                    <p className="text-[9px] font-black text-muted dark:text-muted uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                        <Star size={10} /> Estatus
                                    </p>
                                    <div className="px-2 py-0.5 bg-emerald-500/10 rounded-full flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{selectedTx.estado_pago || 'Completado'}</span>
                                    </div>
                                </div>
                                <div className="p-5 bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/30 rounded-2xl backdrop-blur-md flex flex-col items-center justify-center">
                                    <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-[0.2em] mb-2">Total de la compra</p>
                                    <p className="text-xl font-black text-indigo-900 dark:text-white tracking-tighter">${(selectedTx.precio_total || selectedTx.precio || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Itemized Breakdown */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-muted dark:text-white/50 uppercase tracking-[0.3em] text-center flex items-center justify-center gap-3">
                                    <div className="h-[1px] flex-1 bg-border" />
                                    Detalles del Contenido
                                    <div className="h-[1px] flex-1 bg-border" />
                                </h4>
                                <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                            <Crown size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                                {selectedTx.nombre_producto || `Plan ${selectedTx.tipo_licencia || 'Premium'}`}
                                            </h5>
                                            <p className="text-[9px] font-bold text-muted dark:text-white/60 uppercase tracking-widest">
                                                Suscripción Tianguis Beats
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">${(selectedTx.precio_total || selectedTx.precio || 0).toFixed(2)} <span className="text-[9px] text-muted dark:text-white/60">{selectedTx.moneda || 'MXN'}</span></p>
                                </div>
                            </div>

                            {/* Certification of Ownership */}
                            <div className="relative p-8 rounded-[2.5rem] bg-[#0c0c0e] dark:bg-black border border-white/5 overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Shield size={120} className="text-accent" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1 w-full text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/40 rounded-full mb-4">
                                            <Fingerprint size={12} className="text-accent" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Certificación de Propiedad Digital</span>
                                        </div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Sello Notarial Tianguis</h4>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-6 leading-relaxed">
                                            Transacción autenticada bajo estándares internacionales de propiedad intelectual digital.
                                        </p>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-muted uppercase tracking-widest">HASH DE LA ORDEN</p>
                                                <p className="text-[9px] font-mono text-accent break-all bg-accent/5 p-2 rounded-lg border border-accent/20">
                                                    {(selectedTx.id || 'order-hash').repeat(4).slice(0, 64)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 bg-white p-2 rounded-xl overflow-hidden">
                                        <ValidationQR orderId={selectedTx.id} size={100} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 flex items-center justify-center relative z-10">
                            <button
                                onClick={() => {
                                    if (selectedTx?.recibo_url) {
                                        showToast("Abriendo factura...", "info");
                                        window.open(selectedTx.recibo_url, '_blank');
                                    } else {
                                        showToast("Factura no disponible aún.", "warning");
                                    }
                                }}
                                className="w-full sm:w-auto px-12 py-5 bg-accent text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <FileTextIcon size={20} /> Descargar Factura
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Certification of Security — Green Banner */}
            <div className="relative p-5 md:p-12 rounded-2xl md:rounded-[3rem] bg-[#0c0c0e] border border-emerald-500/20 overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none">
                    <Shield size={160} className="text-emerald-500 rotate-12" />
                </div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 w-full text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                            <Lock size={12} className="text-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-500">Portal de Pago Encriptado</span>
                        </div>
                        <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Transacciones <span className="text-emerald-500">100% Seguras</span></h4>
                        <p className="text-[11px] text-muted font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-lg">
                            Tu seguridad es nuestra prioridad. Todas las operaciones de facturación están cifradas mediante la tecnología líder de Stripe y protegidas por nuestra infraestructura de seguridad Tianguis Beats.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                                <Fingerprint size={18} className="text-emerald-500" />
                                <div className="text-left">
                                    <p className="text-[7px] font-black text-muted uppercase tracking-widest">Digital Auth</p>
                                    <p className="text-[10px] font-black text-white uppercase tracking-tight">Cifrado de Punto</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                                <QrCode size={18} className="text-emerald-500" />
                                <div className="text-left">
                                    <p className="text-[7px] font-black text-muted uppercase tracking-widest">Validación</p>
                                    <p className="text-[10px] font-black text-white uppercase tracking-tight">QR Instantáneo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-3 transform group-hover:scale-105 transition-transform duration-500">
                        <div className="bg-white p-4 rounded-3xl overflow-hidden">
                            <ValidationQR orderId={profile?.userId || 'tianguis-beats-secure'} size={120} />
                        </div>
                        <span className="text-[9px] font-bold text-foreground/60 dark:text-muted uppercase tracking-widest opacity-60">* Referencia / Ejemplo</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
