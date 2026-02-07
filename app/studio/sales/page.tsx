"use client";

import Link from 'next/link';
import { DollarSign, Clock, User, ArrowUpRight } from 'lucide-react';
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
        <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-2">Ventas e Ingresos</h1>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest">Gestiona tus ganancias</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Card */}
                <div className="lg:col-span-1 bg-foreground rounded-3xl p-8 text-background relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-background/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                            <DollarSign size={24} />
                        </div>
                        <p className="text-background/60 font-bold text-[10px] uppercase tracking-widest mb-2">Ingresos Totales</p>
                        <h2 className="text-4xl font-black tracking-tighter mb-8">${totalRevenue.toLocaleString('es-MX')} MXN</h2>

                        <button className="w-full py-3 bg-background text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-colors">
                            Retirar Fondos
                        </button>
                    </div>
                </div>

                {/* Sales Feed */}
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-foreground">
                        <Clock size={18} className="text-muted" />
                        Historial de Ventas
                    </h3>

                    {sales.length > 0 ? (
                        <div className="space-y-4">
                            {sales.map((sale) => (
                                <div key={sale.id} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border hover:bg-card hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-accent-soft rounded-xl overflow-hidden shrink-0">
                                            {sale.beats?.portadabeat_url && (
                                                <img src={sale.beats.portadabeat_url} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xs uppercase tracking-wide text-foreground line-clamp-1">{sale.beats?.title || 'Beat eliminado'}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${sale.license_type === 'EXCLUSIVE' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {sale.license_type || 'Licencia'}
                                                </span>
                                                <span className="text-[9px] text-muted font-bold">•</span>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-muted uppercase">
                                                    <User size={10} />
                                                    {sale.buyer?.username || 'Anónimo'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-black text-sm text-foreground">${sale.amount}</span>
                                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                            {new Date(sale.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-background rounded-[2rem] border-2 border-dashed border-border">
                            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-muted/30">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="font-black text-foreground uppercase tracking-tight mb-2">Aún no hay ventas</h3>
                            <p className="text-muted text-xs font-bold uppercase tracking-widest max-w-xs mx-auto mb-6">
                                Comparte tu perfil y sube más beats para comenzar a generar ingresos.
                            </p>
                            <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-colors">
                                Subir Beat <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
