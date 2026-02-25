"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, BarChart2, DollarSign, Settings, Home, Briefcase, Ticket, Crown, ShieldCheck, Package, LayoutGrid, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const [navItems, setNavItems] = React.useState([
        { name: 'Mis Beats', href: '/studio/beats', icon: <Music size={18} /> },
        { name: 'Licencias', href: '/studio/licencias', icon: <FileText size={18} /> },
        { name: 'Mis Servicios', href: '/studio/services', icon: <Briefcase size={18} /> },
        { name: 'Cupones', href: '/studio/coupons', icon: <Ticket size={18} /> },
        { name: 'Hub Premium', href: '/studio/premium', icon: <Crown size={18} /> },
        { name: 'Estadísticas', href: '/studio/stats', icon: <BarChart2 size={18} /> },
        { name: 'Ventas', href: '/studio/sales', icon: <DollarSign size={18} /> },
        { name: 'Mis Compras', href: '/studio/purchases', icon: <Package size={18} /> },
        { name: 'Mi Suscripción', href: '/pricing', icon: <Settings size={18} /> },
    ]);

    const [profile, setProfile] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('perfiles').select('nivel_suscripcion, esta_verificado, es_admin, fecha_termino_suscripcion').eq('id', user.id).single();
                setProfile(data);

                if (data?.es_admin) {
                    setNavItems(prev => {
                        if (prev.find(item => item.href === '/studio/admin')) return prev;
                        return [...prev, { name: 'Administrador', href: '/studio/admin', icon: <LayoutGrid size={18} /> }];
                    });
                }
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020205] font-sans text-foreground transition-all duration-500">
            <Navbar />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pt-32 pb-20 flex flex-col lg:flex-row gap-12">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="sticky top-32 space-y-10">
                        <div className="px-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/60 mb-2">Plataforma</h2>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground">Tianguis <span className="text-accent">Studio</span></h1>
                        </div>

                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-4 px-6 py-4 rounded-[1.25rem] transition-all duration-300 font-bold text-[13px] uppercase tracking-wider group ${isActive
                                            ? 'bg-foreground dark:bg-white text-background dark:text-slate-900 shadow-2xl shadow-black/20 dark:shadow-white/5 scale-[1.02]'
                                            : 'text-muted hover:bg-card dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white hover:translate-x-1'
                                            }`}
                                    >
                                        <span className={`transition-transform duration-500 ${isActive ? 'rotate-0' : 'group-hover:scale-120'}`}>
                                            {item.icon}
                                        </span>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="px-6 pt-6 border-t border-border/50">
                            <Link
                                href="/"
                                className="flex items-center gap-4 py-4 text-muted hover:text-foreground transition-all font-black text-[11px] uppercase tracking-[0.2em] group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                                    <Home size={16} />
                                </div>
                                Volver al Inicio
                            </Link>
                        </div>

                        {/* Producer Tier Quick Status */}
                        <div className={`p-6 rounded-[2rem] relative overflow-hidden group transition-all duration-500 ${profile?.nivel_suscripcion === 'premium' ? 'bg-gradient-to-br from-blue-600 to-indigo-900 text-white shadow-[0_20px_50px_-10px_rgba(37,99,235,0.3)]' :
                            profile?.nivel_suscripcion === 'pro' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.2)]' :
                                'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 shadow-sm'
                            }`}>
                            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 ${profile?.nivel_suscripcion === 'premium' ? 'bg-white/20' :
                                profile?.nivel_suscripcion === 'pro' ? 'bg-white/40' :
                                    'bg-slate-400/20'
                                }`} />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 text-center w-full">Membresía</p>
                            <h4 className="text-sm font-black uppercase tracking-tight flex items-center justify-center gap-2 w-full">
                                {profile?.nivel_suscripcion === 'premium' ? <><Crown size={14} /> Plan Premium</> :
                                    profile?.nivel_suscripcion === 'pro' ? <><Crown size={14} /> Plan Pro</> :
                                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black tracking-widest border border-slate-300 dark:border-slate-700">PLAN FREE</span>}
                            </h4>
                            {profile?.fecha_termino_suscripcion && (profile.nivel_suscripcion === 'premium' || profile.nivel_suscripcion === 'pro') && (
                                <p className="text-[9px] font-black tracking-widest opacity-80 mt-2 flex items-center justify-center text-center gap-1 w-full">
                                    Válido hasta: {new Date(profile.fecha_termino_suscripcion).toLocaleDateString()}
                                </p>
                            )}

                            {profile?.esta_verificado ? (
                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2 flex-nowrap min-w-fit w-full">
                                    <img src="/verified-badge.png" alt="Verificado" className="w-3.5 h-3.5 object-contain shadow-lg" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 whitespace-nowrap">Verificado</span>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                    <Link href="/studio/verification" className="flex flex-col items-center justify-center gap-1 group/verify hover:opacity-80 transition-opacity w-full">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                                                <ShieldCheck size={10} />
                                            </div>
                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-100">Sin Verificar</span>
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-500/60 transition-colors group-hover/verify:text-blue-500">solicita la verificación</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Experience Area */}
                <main className="flex-1 min-h-[70vh]">
                    <div className="bg-white dark:bg-[#050508]/40 dark:backdrop-blur-3xl rounded-[2.5rem] p-8 lg:p-12 border border-border/40 dark:border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
