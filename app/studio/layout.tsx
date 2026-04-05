"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, BarChart2, DollarSign, Settings, Home, Briefcase, Ticket, Crown, ShieldCheck, Package, LayoutGrid, FileText, CreditCard, Wallet, ChevronRight, Zap, MessageCircle, PanelLeftClose, PanelLeftOpen, ChevronLeft, Layers } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { NoiseOverlay, AbstractPuzzleBack } from '@/components/ui/BackgroundEffects';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const [navItems, setNavItems] = React.useState([
        { name: 'Mis Beats', href: '/studio/beats', icon: <Music size={18} /> },
        { name: 'Sound Kits', href: '/studio/soundkits', icon: <Layers size={18} /> },
        { name: 'Licencias', href: '/studio/licencias', icon: <FileText size={18} /> },
        { name: 'Cupones y Ofertas', href: '/studio/cupones-ofertas', icon: <Ticket size={18} /> },
        { name: 'Hub Premium', href: '/studio/premium', icon: <Crown size={18} /> },
        { name: 'Estadísticas', href: '/studio/stats', icon: <BarChart2 size={18} /> },
        { name: 'Ventas', href: '/studio/sales', icon: <DollarSign size={18} /> },
        { name: 'Pagos', href: '/studio/payments', icon: <Wallet size={18} /> },
        { name: 'Mis Compras', href: '/studio/purchases', icon: <Package size={18} /> },
        { name: 'Mi Suscripción', href: '/studio/billing', icon: <CreditCard size={18} /> },
        { name: 'Mi Cuenta', href: '/studio/account', icon: <Settings size={18} /> },
    ]);

    const [profile, setProfile] = React.useState<any>(null);
    const [deactivatedCount, setDeactivatedCount] = React.useState(0);

    // Persist sidebar state in localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem('studio_sidebar_open');
        if (saved !== null) setSidebarOpen(saved === 'true');
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(prev => {
            localStorage.setItem('studio_sidebar_open', String(!prev));
            return !prev;
        });
    };

    React.useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('perfiles').select('id, nivel_suscripcion, esta_verificado, es_admin, es_fundador, fecha_termino_suscripcion, es_prueba, es_regalo, stripe_connect_id, stripe_connect_onboarded').eq('id', user.id).single();
                setProfile(data);

                // Fetch deactivated beats count
                const { count } = await supabase
                    .from('beats')
                    .select('*', { count: 'exact', head: true })
                    .eq('productor_id', user.id)
                    .eq('esta_desactivado_por_plan', true);

                setDeactivatedCount(count || 0);

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

    const nivel_plan = profile?.nivel_suscripcion?.trim().toLowerCase() || 'free';
    const es_premium = nivel_plan === 'premium';
    const es_pro = nivel_plan === 'pro';
    const color_clase = es_premium ? 'text-blue-500 border-blue-500/30 bg-blue-500/[0.06]' :
        es_pro ? 'text-amber-500 border-amber-500/30 bg-amber-500/[0.06]' :
            'text-slate-500 border-slate-500/20 bg-slate-500/[0.06]';

    return (
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-blue-500/30 relative overflow-hidden transition-colors duration-300">
            <NoiseOverlay />
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-100">
                <AbstractPuzzleBack theme="blue" opacity={0.15} />
                <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-blue-600/[0.03] blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-600/[0.02] blur-[120px] rounded-full" />
            </div>

            <Navbar />

            {/* ── Navegación horizontal en móvil (lg:hidden) ── */}
            <div className="lg:hidden sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
                    <div className="flex gap-2 py-3.5 px-5 min-w-max w-full">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}
                                    className={`snap-center shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-black text-[9px] uppercase tracking-tighter whitespace-nowrap ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-black/5 dark:bg-white/[0.03] text-muted border border-border hover:text-foreground'
                                        }`}>
                                    {item.icon}
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Layout de escritorio: sidebar + contenido principal ── */}
            <div className="max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 lg:pt-16 pb-24 lg:pb-32 flex flex-col lg:flex-row gap-6 lg:gap-6">

                {/* ── Sidebar colapsable — solo en escritorio ── */}
                <aside className="hidden lg:block shrink-0 relative z-10">
                    <div className="sticky top-28">

                        {/* Toggle Button */}
                        <motion.button
                            onClick={toggleSidebar}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute -right-4 top-6 z-50 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center text-muted hover:text-blue-500 hover:border-blue-500/40 transition-all duration-300 shadow-lg shadow-black/10"
                            title={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
                        >
                            <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}>
                                <ChevronLeft size={14} />
                            </motion.div>
                        </motion.button>

                        {/* Sidebar Panel */}
                        <motion.div
                            animate={{ width: sidebarOpen ? 256 : 72 }}
                            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-8" style={{ width: sidebarOpen ? 256 : 72 }}>

                                {/* Title */}
                                <AnimatePresence>
                                    {sidebarOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="px-5 pt-1"
                                        >
                                            <h2 className="text-[9px] font-black uppercase tracking-[0.6em] text-blue-500/50 mb-3">Navegación</h2>
                                            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-[0.85] flex flex-col gap-1">
                                                <span className="opacity-40">Tianguis</span>
                                                <span className="text-blue-500 relative inline-block">
                                                    Studio
                                                    <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                                                </span>
                                            </h1>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Nav Items */}
                                <nav className={`space-y-1 ${sidebarOpen ? 'px-2' : 'px-1'}`}>
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link key={item.href} href={item.href} className="relative group block">
                                                <div title={!sidebarOpen ? item.name : undefined}
                                                    className={`flex items-center gap-4 rounded-2xl transition-all duration-300 relative overflow-hidden active:scale-95
                                                        ${sidebarOpen ? 'px-5 py-3.5' : 'px-0 py-3.5 justify-center'}
                                                        ${isActive
                                                            ? 'bg-black/[0.1] dark:bg-white/[0.05] text-blue-500 dark:text-blue-400 border border-border dark:border-white/[0.08]'
                                                            : 'text-muted hover:text-foreground bg-transparent hover:bg-black/5 dark:hover:bg-white/[0.02]'
                                                        }`}
                                                >
                                                    <span className={`shrink-0 transition-all duration-300 ${isActive ? 'text-blue-400 scale-110' : 'group-hover:text-blue-400/70 group-hover:scale-110'}`}>
                                                        {item.icon}
                                                    </span>

                                                    <AnimatePresence>
                                                        {sidebarOpen && (
                                                            <motion.span
                                                                initial={{ opacity: 0, width: 0 }}
                                                                animate={{ opacity: 1, width: 'auto' }}
                                                                exit={{ opacity: 0, width: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="font-black text-[12px] uppercase tracking-tighter whitespace-nowrap overflow-hidden"
                                                            >
                                                                {item.name}
                                                            </motion.span>
                                                        )}
                                                    </AnimatePresence>

                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="sidebar-active"
                                                            className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full"
                                                        />
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* ── Tarjeta de Membresía ── */}
                                {sidebarOpen && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className={`mx-2 rounded-[2.5rem] border overflow-hidden transition-all duration-700 flex flex-col items-center py-6 px-6 text-center shadow-xl shadow-black/5 ${color_clase}`}>
                                            <Link href="/pricing" className="w-full flex flex-col items-center group/member">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-1 active:scale-95 transition-transform">Membresía</h4>
                                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-0.5 select-none">
                                                    {es_premium ? 'Premium' : es_pro ? 'Pro' : 'Free'}
                                                </h3>
                                                {profile?.fecha_termino_suscripcion && nivel_plan !== 'free' && (
                                                    <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest mb-2">
                                                        Termina: {new Date(profile.fecha_termino_suscripcion).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </Link>

                                            <div className="w-full h-px bg-current opacity-10 my-3" />

                                            <Link
                                                href={profile?.esta_verificado ? "#" : "/studio/verification"}
                                                className="group/verify flex items-center justify-center gap-2 mt-1"
                                            >
                                                {profile?.esta_verificado ? (
                                                    <div className="flex flex-col items-center">
                                                        <p className={`text-[12px] font-black uppercase tracking-tighter flex items-center gap-2 ${color_clase.split(' ')[0]}`}>
                                                            Perfil Verificado
                                                            <img src="/verified-badge.png" alt="Verificado" className="w-4 h-4 object-contain" />
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 group-hover/verify:opacity-100 transition-opacity">Solicitar Verificación</span>
                                                )}
                                            </Link>
                                        </div>


                                    </motion.div>
                                )}

                                {/* Collapsed — plan badge only */}
                                {!sidebarOpen && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center px-1"
                                    >
                                        <Link href="/pricing"
                                            title={`Plan ${es_premium ? 'Premium' : es_pro ? 'Pro' : 'Free'}`}
                                            className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 ${color_clase}`}>
                                            {es_premium ? '★' : es_pro ? '◆' : '○'}
                                        </Link>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </aside>

                {/* ── Área principal de contenido del Studio ── */}
                <main className="flex-1 min-h-[85vh] relative z-10 transition-all">
                    <div className="bg-card/40 dark:bg-white/[0.015] backdrop-blur-3xl rounded-[2rem] md:rounded-[3.5rem] p-4 md:p-10 lg:p-14 border border-border h-full relative overflow-hidden">
                        {/* Background decor */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.04] blur-[140px] rounded-full pointer-events-none -mr-40 -mt-40 opactiy-50" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/[0.03] blur-[100px] rounded-full pointer-events-none -ml-20 -mb-20 opacity-50" />

                        {/* Status Banners */}
                        {deactivatedCount > 0 && (
                            <div className="mb-10 p-6 bg-rose-500/[0.03] border border-rose-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] via-transparent to-transparent pointer-events-none" />
                                <div className="flex items-center gap-4 relative z-10 text-center md:text-left">
                                    <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">Acceso Restringido</h3>
                                        <p className="text-[10px] font-bold text-rose-500/50 uppercase tracking-widest mt-1">
                                            Tienes <span className="text-rose-500/80 font-black">{deactivatedCount} beats</span> bloqueados. Pásate a Pro/Premium para reactivarlos.
                                        </p>
                                    </div>
                                </div>
                                <Link href="/pricing" className="relative z-10 px-8 py-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-300">
                                    Reactivar Beats
                                </Link>
                            </div>
                        )}

                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
