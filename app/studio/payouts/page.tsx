"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Wallet, ArrowUpRight, Clock, CheckCircle2,
    AlertCircle, DollarSign, Info, ArrowDownLeft,
    TrendingUp, Loader2
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

type PayoutRequest = {
    id: string;
    monto: number;
    estado: string;
    fecha_creacion: string;
    metodo_pago: string;
};

export default function PayoutsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState({ pendiente: 0, disponible: 0 });
    const [history, setHistory] = useState<PayoutRequest[]>([]);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => { fetchFinancialData(); }, []);

    const fetchFinancialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try {
            const { data: profile, error: profileError } = await supabase
                .from('perfiles')
                .select('balance_pendiente, balance_disponible')
                .eq('id', user.id).single();
            if (profileError) throw profileError;
            setBalance({ pendiente: profile.balance_pendiente || 0, disponible: profile.balance_disponible || 0 });

            const { data: payoutData, error: payoutError } = await supabase
                .from('retiros')
                .select('*')
                .eq('vendedor_id', user.id)
                .order('fecha_creacion', { ascending: false });
            if (payoutError) throw payoutError;
            setHistory(payoutData || []);
        } catch (error) {
            console.error("Error fetching financial data:", error);
            showToast("Error al cargar datos financieros", "error");
        } finally { setLoading(false); }
    };

    const handleRequestPayout = async () => {
        if (balance.disponible < 500) {
            showToast("El monto mínimo de retiro es $500 MXN", "info");
            return;
        }
        setIsRequesting(true);
        showToast("Solicitud de retiro enviada. Nuestro equipo la revisará en 1-3 días hábiles.", "success");
        setIsRequesting(false);
    };

    const formatMXN = (val: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

    const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
        completado: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Completado' },
        pendiente: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Pendiente' },
        rechazado: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Rechazado' },
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted animate-pulse">Cargando Tesorería...</p>
        </div>
    );

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Portal Seguro · Stripe</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground mb-2 leading-[1]">
                        Mis<br /><span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Ganancias.</span>
                    </h1>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-50 ml-1 mt-1">Gestiona tus saldos y retiros</p>
                </div>
                <button
                    onClick={handleRequestPayout}
                    disabled={isRequesting || balance.disponible < 500}
                    className="group relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 disabled:hidden" />
                    {isRequesting ? <Loader2 size={16} className="animate-spin relative z-10" /> : <Wallet size={16} className="relative z-10 group-hover:text-white transition-colors" />}
                    <span className="relative z-10 group-hover:text-white transition-colors">
                        {balance.disponible < 500 ? `Mínimo $500 MXN` : 'Retirar Fondos'}
                    </span>
                    <ArrowUpRight size={16} className="relative z-10 group-hover:text-white transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
            </div>

            {/* Balance Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Available — main accent */}
                <div className="group relative bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border border-accent/20 rounded-[3rem] p-10 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/10">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                    <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-accent/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-accent text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-accent/30">
                                <DollarSign size={28} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.25em]">Saldo Disponible</h3>
                                <p className="text-muted text-[9px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                    <TrendingUp size={9} /> Listo para retirar
                                </p>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter text-foreground">{formatMXN(balance.disponible)}</span>
                        </div>
                    </div>
                </div>

                {/* Pending */}
                <div className="group relative bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl shadow-lg dark:shadow-none">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/5 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-[1.5rem] flex items-center justify-center">
                                <Clock size={26} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em]">Saldo Pendiente</h3>
                                <p className="text-muted text-[9px] font-bold uppercase tracking-widest mt-0.5">En verificación (14 días)</p>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter text-foreground/40">{formatMXN(balance.pendiente)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] p-8 flex items-start gap-5">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                    <Info size={22} />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Sobre tus pagos</h4>
                    <p className="text-[11px] text-muted font-bold leading-relaxed">
                        Las ganancias entran primero a <span className="text-foreground">Saldo Pendiente</span> por 14 días de seguridad.
                        Luego pasan a <span className="text-foreground">Saldo Disponible</span>. Se descuenta{' '}
                        <span className="text-foreground">10% Tianguis + 3.6% + $3 MXN Stripe</span> por transacción.
                    </p>
                </div>
            </div>

            {/* History */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <Clock size={14} className="text-accent" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Historial de Retiros</h2>
                </div>

                <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl dark:shadow-none relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                    {history.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] flex items-center justify-center text-muted">
                                <Wallet size={28} strokeWidth={1.5} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40">No hay solicitudes de retiro todavía</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {history.map((item) => {
                                const s = statusConfig[item.estado] || statusConfig.pendiente;
                                return (
                                    <div key={item.id} className="group p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.bg} ${s.color}`}>
                                                <ArrowDownLeft size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-0.5">
                                                    <span className="text-lg font-black tracking-tight text-foreground">{formatMXN(item.monto)}</span>
                                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest">{item.metodo_pago || 'Stripe'}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                                    {new Date(item.fecha_creacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${s.bg} ${s.color} ${s.border}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
