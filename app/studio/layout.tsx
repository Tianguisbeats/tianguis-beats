"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, BarChart2, DollarSign, Settings, Home, Briefcase, Ticket, Crown, ShieldCheck, Package, LayoutGrid } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const [navItems, setNavItems] = React.useState([
        { name: 'Mis Beats', href: '/studio/beats', icon: <Music size={18} /> },
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
                const { data } = await supabase.from('profiles').select('subscription_tier, is_verified, is_admin').eq('id', user.id).single();
                setProfile(data);

                if (data?.is_admin) {
                    setNavItems(prev => {
                        if (prev.find(item => item.href === '/studio/admin')) return prev;
                        return [...prev, { name: 'Admón', href: '/studio/admin', icon: <LayoutGrid size={18} /> }];
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
                        <div className={`p-6 rounded-[2rem] relative overflow-hidden group transition-all duration-500 ${profile?.subscription_tier === 'premium' ? 'bg-gradient-to-br from-blue-600 to-indigo-900 text-white shadow-[0_20px_50px_-10px_rgba(37,99,235,0.3)]' :
                            profile?.subscription_tier === 'pro' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.2)]' :
                                'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 border border-slate-200 dark:border-white/5'
                            }`}>
                            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 ${profile?.subscription_tier === 'premium' ? 'bg-white/20' :
                                profile?.subscription_tier === 'pro' ? 'bg-white/40' :
                                    'bg-slate-400/10'
                                }`} />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Membresía</p>
                            <h4 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                {profile?.subscription_tier === 'premium' ? <><Crown size={14} /> Plan Premium</> :
                                    profile?.subscription_tier === 'pro' ? <><Crown size={14} /> Plan Pro</> :
                                        'Plan Gratuito'}
                            </h4>

                            {profile?.is_verified ? (
                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 flex-nowrap min-w-fit">
                                    <img src="/verified-badge.png" alt="Verificado" className="w-3.5 h-3.5 object-contain shadow-lg" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 whitespace-nowrap">Verificado</span>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                    <Link href="/studio/verification" className="flex items-center gap-2 group/verify hover:opacity-80 transition-opacity">
                                        <div className="w-5 h-5 rounded-full bg-slate-950/5 dark:bg-white/10 flex items-center justify-center">
                                            <ShieldCheck size={10} className="text-slate-900 dark:text-white/60" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white/80 border-b border-transparent group-hover/verify:border-slate-900 dark:group-hover/verify:border-white/40">Solicitar Verificación</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Experience Area */}
                <main className="flex-1 min-h-[70vh]">
                    <div className="bg-white dark:bg-[#050508]/40 dark:backdrop-blur-3xl rounded-[3.5rem] p-10 lg:p-14 border border-border/40 dark:border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] h-full relative overflow-hidden">
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
