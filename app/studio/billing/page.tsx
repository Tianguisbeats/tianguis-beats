"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    CreditCard, Crown, Shield, Zap, RefreshCcw, AlertTriangle,
    CheckCircle2, Calendar, ArrowRight, Loader2, ExternalLink, Star
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';

export default function StudioBillingPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('perfiles')
                .select('nivel_suscripcion, fecha_inicio_suscripcion, fecha_termino_suscripcion, stripe_customer_id, nombre_artistico, nombre_usuario, foto_perfil')
                .eq('id', user.id)
                .single();

            setProfile({ ...data, userId: user.id, email: user.email });
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleManageBilling = async () => {
        if (!profile?.userId) return;
        setRedirecting(true);
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile.userId,
                    returnUrl: `${window.location.origin}/studio/billing`
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

    const isPremium = profile?.nivel_suscripcion?.toLowerCase() === 'premium';
    const isPro = profile?.nivel_suscripcion?.toLowerCase() === 'pro';
    const isFree = !isPremium && !isPro;

    const planLabel = isPremium ? 'Premium' : isPro ? 'Pro' : 'Free';
    const planColor = isPremium
        ? 'from-[#00f2ff]/20 via-blue-600/10 to-transparent border-[#00f2ff]/30'
        : isPro
            ? 'from-amber-500/20 via-amber-600/10 to-transparent border-amber-500/30'
            : 'from-slate-400/10 via-slate-500/5 to-transparent border-slate-400/20';

    const planIcon = isPremium
        ? <Crown size={28} className="text-[#00f2ff]" fill="currentColor" />
        : isPro
            ? <Star size={28} className="text-amber-500" fill="currentColor" />
            : <Shield size={28} className="text-slate-400" />;

    const planBadgeColor = isPremium
        ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30'
        : isPro
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
            : 'bg-slate-400/10 text-slate-400 border-slate-400/20';

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getRenewalDays = () => {
        if (!profile?.fecha_termino_suscripcion) return null;
        const end = new Date(profile.fecha_termino_suscripcion);
        const today = new Date();
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    const renewalDays = getRenewalDays();

    if (loading) {
        return <LoadingTianguis />;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                    Facturación <span className="text-accent">&amp; Pagos</span>
                </h1>
                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-2">
                    Gestiona tu suscripción y método de pago
                </p>
            </div>

            {/* Plan Card */}
            <div className={`relative rounded-[2.5rem] p-8 md:p-10 bg-gradient-to-br ${planColor} border overflow-hidden`}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none"
                    style={{ background: isPremium ? '#00f2ff' : isPro ? '#f59e0b' : '#94a3b8' }} />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${planBadgeColor} border`}>
                        {planIcon}
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${planBadgeColor}`}>
                                Plan {planLabel}
                            </span>
                            {!isFree && (
                                <span className="text-[10px] font-black uppercase px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} /> Activo
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                            {isFree ? 'Sin suscripción activa' : `Tianguis ${planLabel}`}
                        </h2>
                        {!isFree && (
                            <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-1">
                                {profile?.nivel_suscripcion?.toLowerCase() === 'premium' ? '$349 MXN / mes' : '$149 MXN / mes'}
                            </p>
                        )}
                    </div>

                    {isFree ? (
                        <Link
                            href="/pricing"
                            className="shrink-0 flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20"
                        >
                            Mejorar Plan <ArrowRight size={16} />
                        </Link>
                    ) : (
                        <button
                            onClick={handleManageBilling}
                            disabled={redirecting}
                            className="shrink-0 flex items-center gap-2 px-8 py-4 bg-card border border-border text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent transition-all active:scale-95 disabled:opacity-50"
                        >
                            {redirecting ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                            {redirecting ? 'Abriendo...' : 'Gestionar Plan'}
                        </button>
                    )}
                </div>
            </div>

            {/* Billing Dates */}
            {!isFree && (
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-[2rem] p-6 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                            <Calendar size={12} className="text-accent" /> Inicio del plan
                        </span>
                        <p className="text-lg font-black text-foreground">
                            {formatDate(profile?.fecha_inicio_suscripcion)}
                        </p>
                    </div>
                    <div className="bg-card border border-border rounded-[2rem] p-6 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                            <RefreshCcw size={12} className="text-accent" /> Próxima renovación
                        </span>
                        <p className="text-lg font-black text-foreground">
                            {formatDate(profile?.fecha_termino_suscripcion)}
                        </p>
                        {renewalDays !== null && (
                            <p className={`text-[9px] font-black uppercase tracking-widest ${renewalDays <= 7 ? 'text-amber-500' : 'text-muted'}`}>
                                {renewalDays === 0 ? 'Vence hoy' : `En ${renewalDays} día${renewalDays === 1 ? '' : 's'}`}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Method Card */}
            <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center">
                        <CreditCard size={18} className="text-accent" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Método de Pago</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Tarjeta guardada en Stripe</p>
                    </div>
                </div>

                {isFree ? (
                    <div className="p-6 rounded-2xl bg-slate-100 dark:bg-white/5 border border-dashed border-border text-center">
                        <p className="text-muted text-[11px] font-bold uppercase tracking-widest">
                            Sin método de pago registrado
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border">
                        <div className="flex items-center gap-4">
                            {/* Card placeholder icon */}
                            <div className="w-14 h-10 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded-xl flex items-center justify-center shadow-md">
                                <CreditCard size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="font-black text-foreground text-sm">•••• •••• •••• ••••</p>
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">
                                    Los datos de la tarjeta se gestionan en Stripe de forma segura
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleManageBilling}
                            disabled={redirecting}
                            className="shrink-0 px-6 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {redirecting ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                            Actualizar Tarjeta
                        </button>
                    </div>
                )}
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-4 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem]">
                <Shield size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Pago 100% seguro</p>
                    <p className="text-[10px] font-medium text-muted leading-relaxed">
                        Tianguis Beats nunca almacena los datos de tu tarjeta. Toda la información de pago está gestionada por <strong>Stripe</strong> con cifrado RSA de 256-bit. Al hacer clic en "Actualizar Tarjeta" o "Gestionar Plan", serás redirigido al portal seguro de Stripe.
                    </p>
                </div>
            </div>

            {/* Upgrade CTA if Free */}
            {isFree && (
                <div className="relative bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-[2.5rem] p-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={16} className="text-accent" fill="currentColor" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Desbloquea más</span>
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-2">
                                Mejora tu cuenta
                            </h3>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
                                Accede a comisiones reducidas, anillos premium, y más herramientas
                            </p>
                        </div>
                        <Link
                            href="/pricing"
                            className="shrink-0 flex items-center gap-3 px-10 py-5 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/25"
                        >
                            Ver Planes <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
