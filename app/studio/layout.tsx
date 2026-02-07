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
        <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 shrink-0">
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border sticky top-24">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-2">
                            <Settings size={14} />
                            Tianguis Studio
                        </h2>

                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${isActive
                                            ? 'bg-foreground text-background shadow-lg shadow-black/10'
                                            : 'text-muted hover:bg-accent-soft hover:text-foreground'
                                            }`}
                                    >
                                        {item.icon}
                                        {item.name}
                                    </Link>
                                );
                            })}

                            <div className="h-px bg-border my-4"></div>

                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-muted hover:bg-accent-soft hover:text-foreground"
                            >
                                <Home size={18} />
                                Volver al Inicio
                            </Link>
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
