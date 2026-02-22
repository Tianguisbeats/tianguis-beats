"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Wallet,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    CreditCard,
    Info,
    ChevronRight,
    ArrowDownLeft
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

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // 1. Fetch balance from profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('balance_pendiente, balance_disponible')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            setBalance({
                pendiente: profile.balance_pendiente || 0,
                disponible: profile.balance_disponible || 0
            });

            // 2. Fetch payout history
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
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPayout = async () => {
        if (balance.disponible < 500) {
            showToast("El monto mínimo de retiro es de $500 MXN", "info");
            return;
        }

        showToast("Solicitud de retiro enviada correctamente. Nuestro equipo la revisará.", "success");
        // Aquí iría la lógica de inserción en la tabla 'retiros'
    };

    if (loading) return <div className="p-10 animate-pulse bg-white/5 rounded-[3rem] h-64" />;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-3">Mis <span className="text-accent">Ganancias</span></h1>
                    <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <Wallet size={12} className="text-accent" />
                        Gestiona tus saldos y retiros
                    </p>
                </div>

                <button
                    onClick={handleRequestPayout}
                    className="px-10 py-5 bg-foreground text-background dark:bg-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3 group"
                >
                    Retirar Fondos
                    <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
            </div>

            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur-3xl border-2 border-accent/20 rounded-[3.5rem] p-10 relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-accent/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-accent text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-accent/40">
                                <DollarSign size={28} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Saldo Disponible</h3>
                                <p className="text-muted text-[9px] font-bold uppercase tracking-widest mt-1">Listo para retirar</p>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black tracking-tighter text-foreground">${balance.disponible.toFixed(2)}</span>
                            <span className="text-sm font-black text-muted tracking-widest uppercase">MXN</span>
                        </div>
                    </div>
                </div>

                {/* Pending Balance */}
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-3xl border border-border/50 rounded-[3.5rem] p-10 relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-white/10 text-muted rounded-[1.25rem] flex items-center justify-center">
                                <Clock size={28} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Saldo Pendiente</h3>
                                <p className="text-muted/60 text-[9px] font-bold uppercase tracking-widest mt-1">En verificación (14 días)</p>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black tracking-tighter text-foreground/40">${balance.pendiente.toFixed(2)}</span>
                            <span className="text-sm font-black text-muted/40 tracking-widest uppercase">MXN</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] p-8 flex items-start gap-6">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Info size={24} />
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-blue-400">Sobre tus pagos</h4>
                    <p className="text-xs text-muted/80 leading-relaxed font-bold">
                        Las ganancias de tus ventas entran primero a <span className="text-foreground">Saldo Pendiente</span> por un periodo de seguridad de 14 días.
                        Una vez liberado, se transfiere a <span className="text-foreground">Saldo Disponible</span>.
                        Descontamos un 10% de comisión de plataforma y la comisión de Stripe (3.6% + $3 MXN).
                    </p>
                </div>
            </div>

            {/* History Table */}
            <div className="space-y-6 pt-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 pl-4 flex items-center gap-3">
                    <Clock size={14} className="text-accent" />
                    Historial de Retiros
                </h2>

                <div className="bg-white/60 dark:bg-white/5 border border-border/50 rounded-[3rem] overflow-hidden">
                    {history.length === 0 ? (
                        <div className="p-20 text-center">
                            <p className="text-muted text-[10px] font-black uppercase tracking-widest opacity-50">No hay solicitudes de retiro registradas</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {history.map((item) => (
                                <div key={item.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.estado === 'completado' ? 'bg-emerald-500/10 text-emerald-500' :
                                                item.estado === 'pendiente' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            <ArrowDownLeft size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-black tracking-tight text-foreground">${item.monto}</span>
                                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">{item.metodo_pago}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                                {new Date(item.fecha_creacion).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${item.estado === 'completado' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                                            item.estado === 'pendiente' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'
                                        }`}>
                                        {item.estado}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
