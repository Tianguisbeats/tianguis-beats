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
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-3">Ventas <span className="text-accent">& Ingresos</span></h1>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Stats Summary - Pro Card */}
                <div className="lg:col-span-12 xl:col-span-4 self-start">
                    <div className="bg-white dark:bg-[#08080a] rounded-[2.5rem] p-8 text-slate-900 dark:text-white relative overflow-hidden shadow-2xl transition-all hover:scale-[1.01] duration-500 border border-slate-100 dark:border-white/10 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center mb-8 border border-slate-200 dark:border-white/10">
                                <DollarSign size={24} className="text-accent" />
                            </div>
                            <p className="text-slate-500 dark:text-white/80 font-black text-[9px] uppercase tracking-[0.3em] mb-2">Balance Acumulado</p>
                            <h2 className="text-4xl font-black tracking-tighter mb-10 text-slate-900 dark:text-white">${totalRevenue.toLocaleString('es-MX')} <span className="text-xs font-bold text-slate-400 dark:text-white/60">MXN</span></h2>

                            <button className="w-full py-4 bg-slate-900 dark:bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-accent dark:hover:bg-white dark:hover:text-slate-900 transition-all shadow-xl active:scale-95">
                                Retirar Fondos
                            </button>
                            <p className="mt-4 text-[8px] font-bold text-slate-400 dark:text-white text-center uppercase tracking-widest">
                                2-3 días hábiles para el retiro
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sales Feed - Refined List */}
                <div className="lg:col-span-12 xl:col-span-8">
                    <div className="bg-white dark:bg-[#08080a] rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-tight mb-8 flex items-center gap-3 text-foreground">
                            <Clock size={14} className="text-accent" />
                            Historial Reciente
                        </h3>

                        {sales.length > 0 ? (
                            <div className="space-y-3">
                                {sales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-accent/20 transition-all duration-300 group">
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-white dark:bg-black rounded-xl overflow-hidden shrink-0 shadow-sm">
                                                {sale.beats?.portadabeat_url ? (
                                                    <img src={sale.beats.portadabeat_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-white/5">
                                                        <Music size={16} className="text-muted/30" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-[12px] uppercase tracking-tight text-foreground truncate">{sale.beats?.title || 'Beat eliminado'}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${sale.license_type === 'EXCLUSIVE' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {sale.license_type || 'Licencia'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted uppercase tracking-wider">
                                                        <User size={10} className="text-accent/40" />
                                                        {sale.buyer?.username || 'Comprador'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right pl-4">
                                            <span className="block font-black text-sm text-foreground tracking-tight">${sale.amount}</span>
                                            <span className="text-[8px] font-black text-muted/50 uppercase tracking-widest">
                                                {new Date(sale.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-slate-50 dark:bg-black/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                                <DollarSign size={24} className="mx-auto text-muted/20 mb-4" />
                                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Sin transacciones aún</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
