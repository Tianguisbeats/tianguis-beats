"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, BarChart2, DollarSign, Settings, Home, Briefcase, Ticket, Palette } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Mis Beats', href: '/studio/beats', icon: <Music size={18} /> },
        { name: 'Mis Servicios', href: '/studio/services', icon: <Briefcase size={18} /> },
        { name: 'Cupones', href: '/studio/coupons', icon: <Ticket size={18} /> },
        { name: 'Personalizar', href: '/studio/customize', icon: <Palette size={18} /> },
        { name: 'Estadísticas', href: '/studio/stats', icon: <BarChart2 size={18} /> },
        { name: 'Ventas', href: '/studio/sales', icon: <DollarSign size={18} /> },
        { name: 'Mi Suscripción', href: '/pricing', icon: <Settings size={18} /> },
    ];

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

                        {/* Producer Tier Quick Status (Optional Visual) */}
                        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-900 to-black text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-accent/20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Membresía</p>
                            <h4 className="text-sm font-black uppercase tracking-tight">Pro Vitaminado</h4>
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
