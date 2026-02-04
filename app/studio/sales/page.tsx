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
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[500px] flex items-center justify-center">
            <div className="animate-spin text-slate-300 w-8 h-8 rounded-full border-2 border-slate-300 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">Ventas e Ingresos</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestiona tus ganancias</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Card */}
                <div className="lg:col-span-1 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                            <DollarSign size={24} />
                        </div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">Ingresos Totales</p>
                        <h2 className="text-4xl font-black tracking-tighter mb-8">${totalRevenue.toLocaleString('es-MX')} MXN</h2>

                        <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">
                            Retirar Fondos
                        </button>
                    </div>
                </div>

                {/* Sales Feed */}
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <Clock size={18} className="text-slate-400" />
                        Historial de Ventas
                    </h3>

                    {sales.length > 0 ? (
                        <div className="space-y-4">
                            {sales.map((sale) => (
                                <div key={sale.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden shrink-0">
                                            {sale.beats?.portadabeat_url && (
                                                <img src={sale.beats.portadabeat_url} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xs uppercase tracking-wide text-slate-900 line-clamp-1">{sale.beats?.title || 'Beat eliminado'}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${sale.license_type === 'EXCLUSIVE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {sale.license_type || 'Licencia'}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold">•</span>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                                                    <User size={10} />
                                                    {sale.buyer?.username || 'Anónimo'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-black text-sm text-slate-900">${sale.amount}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(sale.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-tight mb-2">Aún no hay ventas</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto mb-6">
                                Comparte tu perfil y sube más beats para comenzar a generar ingresos.
                            </p>
                            <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors">
                                Subir Beat <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
