"use client";

import Link from 'next/link';
import { DollarSign, Clock, User, ArrowUpRight, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function StudioSalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        const fetchSales = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    beats (title, portadabeat_url),
                    buyer:buyer_id (username, artistic_name, foto_perfil)
                `)
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setSales(data);
                const total = data.reduce((acc, sale) => acc + (sale.amount || 0), 0);
                setTotalRevenue(total);
            }
            setLoading(false);
        };

        fetchSales();
    }, []);

    if (loading) return (
        <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm min-h-[500px] flex items-center justify-center">
            <div className="animate-spin text-muted w-8 h-8 rounded-full border-2 border-border border-t-transparent"></div>
        </div>
    );

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-3">Ventas <span className="text-muted/40">& Ingresos</span></h1>
                    <div className="flex items-center gap-4">
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <DollarSign size={12} className="text-emerald-500" />
                            Panel de Tesorería Pro
                        </p>
                        <div className="h-3 w-px bg-border" />
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Sincronizado con Stripe/PayPal</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Stats Summary - Pro Card */}
                <div className="lg:col-span-4 self-start">
                    <div className="bg-foreground rounded-[3rem] p-10 text-background relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] transition-transform hover:scale-[1.02] duration-500">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-[50px] -mr-20 -mt-20" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-background/10 rounded-2xl flex items-center justify-center mb-10 backdrop-blur-xl border border-white/10">
                                <DollarSign size={32} />
                            </div>
                            <p className="text-background/40 font-black text-[10px] uppercase tracking-[0.3em] mb-3">Balance acumulado</p>
                            <h2 className="text-5xl font-black tracking-tighter mb-12">${totalRevenue.toLocaleString('es-MX')} <span className="text-sm font-bold opacity-40">MXN</span></h2>

                            <button className="w-full py-5 bg-background text-foreground rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95">
                                Retirar Fondos
                            </button>
                            <p className="mt-6 text-[9px] font-bold text-background/30 text-center uppercase tracking-widest leading-loose">
                                Las transferencias pueden tardar <br /> 2-3 días hábiles.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sales Feed - Refined List */}
                <div className="lg:col-span-8">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-4 text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center">
                            <Clock size={18} className="text-muted" />
                        </div>
                        Historial de Transacciones
                    </h3>

                    {sales.length > 0 ? (
                        <div className="space-y-4">
                            {sales.map((sale) => (
                                <div key={sale.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-card/30 border border-border/40 hover:bg-card hover:border-accent/20 hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group">
                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                        <div className="w-14 h-14 bg-background rounded-2xl overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                            {sale.beats?.portadabeat_url ? (
                                                <img src={sale.beats.portadabeat_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-white/5">
                                                    <Music size={20} className="text-muted/30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-sm uppercase tracking-tight text-foreground truncate">{sale.beats?.title || 'Beat eliminado'}</h4>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${sale.license_type === 'EXCLUSIVE' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {sale.license_type || 'Licencia'}
                                                </span>
                                                <div className="h-3 w-px bg-border/50" />
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-muted uppercase tracking-wider group-hover:text-foreground/80 transition-colors">
                                                    <User size={12} strokeWidth={3} className="text-accent/40" />
                                                    {sale.buyer?.username || 'Buyer'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right pl-6">
                                        <span className="block font-black text-lg text-foreground tracking-tighter">${sale.amount}</span>
                                        <span className="text-[9px] font-black text-muted/50 uppercase tracking-[0.2em]">
                                            {new Date(sale.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-background/50 rounded-[3rem] border-2 border-dashed border-border/60">
                            <div className="w-20 h-20 bg-card rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner text-muted/20">
                                <DollarSign size={32} />
                            </div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Aún no hay ventas</h3>
                            <p className="text-muted text-xs font-bold uppercase tracking-widest max-w-xs mx-auto mb-10 opacity-60">
                                Tu carrera está comenzando. Sigue compartiendo tu perfil.
                            </p>
                            <Link href="/upload" className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all active:scale-95 shadow-lg shadow-black/5">
                                Subir Más Beats <ArrowUpRight size={16} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
