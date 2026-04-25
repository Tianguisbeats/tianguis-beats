"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Wallet, ArrowUpRight, Clock, CheckCircle2,
    AlertCircle, DollarSign, Info, ArrowDownLeft,
    TrendingUp, Loader2, ExternalLink, ShieldCheck, CreditCard
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';
import Link from 'next/link';

type PayoutRequest = {
    id: string;
    monto: number;
    estado: string;
    fecha_creacion: string;
    metodo_pago: string;
};

export default function PaymentsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [connectStatus, setConnectStatus] = useState<{
        status: 'none' | 'pending' | 'completed' | 'error';
        details: any;
        profileStatus: boolean;
    }>({ status: 'none', details: null, profileStatus: false });
    const [history, setHistory] = useState<PayoutRequest[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        try {
            // 1. Perfil del usuario
            const { data: profileData } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            // 2. Estado de Stripe Connect
            const res = await fetch('/api/stripe/connect', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const connectData = await res.json();
            setConnectStatus(connectData);

            // 3. Historial de retiros (o transacciones de tipo payout)
            const { data: payoutData } = await supabase
                .from('retiros')
                .select('*')
                .eq('vendedor_id', user.id)
                .order('fecha_creacion', { ascending: false });
            setHistory(payoutData || []);

        } catch (error) {
            console.error("Error fetching payment data:", error);
            showToast("Error al cargar datos de pagos", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleConnectStripe = async () => {
        if (!profile) return;
        setIsConnecting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Sesión no encontrada');
            }
            const res = await fetch('/api/stripe/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    email: profile.correo,
                    returnUrl: window.location.href
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "No se pudo generar el enlace de onboarding");
            }
        } catch (error: any) {
            showToast(error.message, "error");
            setIsConnecting(false);
        }
    };

    const formatMXN = (val: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

    const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
        completado: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Completado' },
        pendiente: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'En Proceso' },
        rechazado: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Rechazado' },
    };

    if (loading) return <LoadingTianguis />;

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Centro de Pagos · Tianguis Beats</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                        <span className="opacity-40">Configuración</span> <br />
                        <span className="text-blue-500 relative inline-block">
                            de Pagos.
                            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                        </span>
                    </h1>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-50 ml-1 mt-1">Gestiona tus ingresos y transferencias bancarias</p>
                </div>

            </div>            {/* Main Action / Status Card */}
            <div className={`group relative bg-card border ${connectStatus.status === 'completed' ? 'border-emerald-500/30 shadow-[0_0_50px_-12px_rgba(16,185,129,0.1)]' : 'border-border'} rounded-2xl md:rounded-[3.5rem] p-8 md:p-16 overflow-hidden transition-all text-center flex flex-col items-center`}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                
                {/* Visual indicator based on status */}
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center mb-10 transition-transform duration-700 group-hover:scale-110 shadow-2xl ${
                    connectStatus.status === 'completed' 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                        : connectStatus.status === 'pending'
                        ? 'bg-amber-500 text-white shadow-amber-500/20'
                        : 'bg-black/5 dark:bg-white/[0.05] text-muted'
                }`}>
                    {connectStatus.status === 'completed' ? (
                        <CheckCircle2 size={56} />
                    ) : connectStatus.status === 'pending' ? (
                        <Clock size={56} />
                    ) : (
                        <Wallet size={56} />
                    )}
                </div>

                <div className="max-w-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-accent mb-4">Estado de Cuenta Connect</h3>
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-6 leading-none">
                        {connectStatus.status === 'completed' 
                            ? 'Configuración Completa' 
                            : connectStatus.status === 'pending'
                            ? 'Pendiente de Verificación'
                            : 'Vincular cuenta bancaria'}
                    </h2>
                    
                    <p className="text-[12px] md:text-[14px] text-muted font-bold leading-relaxed mb-12 uppercase tracking-widest opacity-60">
                        {connectStatus.status === 'completed' 
                            ? 'Tu cuenta está lista para recibir depósitos automáticos. Todas tus transacciones, saldos y depósitos se gestionan directamente a través de Stripe para tu seguridad.'
                            : 'Conecta tu cuenta con Stripe para comenzar a recibir los ingresos por tus ventas de beats de forma automatizada.'}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        {connectStatus.status === 'completed' && connectStatus.details?.login_url ? (
                            <Link 
                                href={connectStatus.details.login_url}
                                target="_blank"
                                className="px-10 py-5 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-4"
                            >
                                <ExternalLink size={18} />
                                Abrir Panel de Stripe
                            </Link>
                        ) : (
                            <button
                                onClick={handleConnectStripe}
                                disabled={isConnecting}
                                className="px-10 py-5 bg-foreground text-background dark:bg-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-4 disabled:opacity-40"
                            >
                                {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                {connectStatus.status === 'none' ? 'Vincular Stripe Connect' : 'Completar en Stripe'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Ambient glow blobs inside the card */}
                <div className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 ${
                    connectStatus.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                }`} />
                <div className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-[80px] pointer-events-none opacity-10 ${
                    connectStatus.status === 'completed' ? 'bg-emerald-400' : 'bg-violet-400'
                }`} />
            </div>

            {/* Why Stripe? (Helpful Notice) */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] p-8 flex flex-col gap-5">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-2">Transparencia y Seguridad</h4>
                        <p className="text-[12px] text-muted font-bold leading-relaxed opacity-60">
                            Tianguis Beats nunca almacena tus datos bancarios ni retiene manualmente tu dinero. 
                            Utilizamos <span className="text-foreground">Stripe Connect</span> para garantizar que cada centavo de tus ventas se transfiera de forma íntegra y segura a tu cuenta bancaria.
                        </p>
                    </div>
                </div>
                
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] p-8 flex flex-col gap-5">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-2">Saldos y Depósitos</h4>
                        <p className="text-[12px] text-muted font-bold leading-relaxed opacity-60">
                            En el Dashboard oficial de Stripe podrás ver en tiempo real tu saldo disponible, el saldo en revisión y las fechas estimadas de depósito bancario.
                            Normalmente, los fondos tardan entre 7 y 14 días en liberarse tras una venta por seguridad anti-fraude.
                        </p>
                    </div>
                </div>
            </div>

            {/* Simplified Payout history mention */}
            <div className="text-center pt-8 border-t border-border mt-12">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted opacity-30">
                    Historial financiero gestionado por Stripe Express
                </p>
            </div>
        </div>
    );
}
