"use client";
/* ══════════════════════════════════════════════════════════════════════
   Navbar.tsx
   Barra de navegación principal de la aplicación.
   — En escritorio (md+): muestra logo, links, carrito y perfil completo.
   — En móvil (<md): muestra solo logo + carrito + toggle de tema.
     La navegación principal en móvil la maneja MobileBottomNav.tsx.
   ══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, User, Settings, LogOut, Crown, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ThemeToggle from '@/components/ThemeToggle';
import CurrencySwitcher from '@/components/CurrencySwitcher';

export default function Navbar() {
    /* ── Estado de sesión y perfil del usuario ── */
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();
    const { itemCount } = useCart();

    /* ── Configuración del logo ── */
    const logoUrl = "/logo.png";

    /* ── Suscripción a cambios de autenticación ── */
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setProfile(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    /* ── Carga datos del perfil actual ── */
    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('foto_perfil, nombre_artistico, nombre_usuario, es_fundador, esta_verificado, nivel_suscripcion, pais')
            .eq('id', userId)
            .single();
        if (!error && data) setProfile(data);
    };

    /* ── Cierre de sesión y redirección al inicio ── */
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        /* ── Espaciador para compensar la altura fija del navbar ── */
        <div className="relative w-full z-50 h-16 md:h-20">
            <nav className="fixed top-0 left-0 right-0 w-full bg-background/90 border-b border-border backdrop-blur-xl shadow-sm z-50 transition-all duration-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">

                        {/* ── Logo / Identidad de marca ── */}
                        <Link href="/" className="flex items-center gap-2.5 group min-h-[48px]">
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-accent text-white rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform overflow-hidden">
                                <img src={logoUrl} alt="Tianguis Beats Logo" className="w-full h-full object-contain p-1 dark:invert" />
                            </div>
                            <span className="text-lg md:text-xl font-heading font-black tracking-tighter uppercase whitespace-nowrap">
                                <span className="text-muted">Tianguis</span><span className="text-accent">Beats</span>
                            </span>
                        </Link>

                        {/* ── Navegación de escritorio (oculta en móvil) ── */}
                        <div className="hidden md:flex items-center gap-5">
                            <div className="flex items-center space-x-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                                <Link href="/beats" className="hover:text-accent transition-colors">Explorar Tianguis</Link>
                                {!user && (
                                    <Link href="/pricing" className="hover:text-accent transition-colors">Planes</Link>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {user ? (
                                    /* ── Área de usuario autenticado (escritorio) ── */
                                    <div className="flex items-center gap-4">
                                        <Link href="/upload"
                                            className="px-5 py-2.5 min-h-[42px] text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-accent transition-all flex items-center justify-center">
                                            Sube tu Beat
                                        </Link>

                                        {/* Carrito con badge de cantidad */}
                                        <Link href="/cart" className="relative w-12 h-12 flex items-center justify-center text-muted hover:text-accent transition-colors">
                                            <ShoppingCart size={22} strokeWidth={2.5} />
                                            {itemCount > 0 && (
                                                <span className="absolute top-1 right-1 bg-accent text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-background shadow-lg animate-in fade-in zoom-in duration-300">
                                                    {itemCount}
                                                </span>
                                            )}
                                        </Link>

                                        <div className="flex items-center gap-4 border-l border-border pl-6">
                                            {/* Avatar y nombre del productor */}
                                            <Link href={`/${profile?.nombre_usuario || 'profile'}`}
                                                className="group flex items-center gap-3 min-h-[48px]">
                                                <div className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 ${profile?.nivel_suscripcion === 'premium'
                                                    ? 'border-[#00f2ff] shadow-[0_0_15px_-3px_rgba(0,242,255,0.5)]'
                                                    : profile?.nivel_suscripcion === 'pro' || profile?.es_fundador
                                                        ? 'border-amber-500 shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]'
                                                        : 'border-border group-hover:border-accent'
                                                    }`}>
                                                    {profile?.foto_perfil ? (
                                                        <img src={profile.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted bg-accent-soft">
                                                            <User size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-black font-heading uppercase tracking-[0.2em] text-foreground group-hover:text-accent transition-colors">
                                                        {profile?.nombre_usuario || 'Perfil'}
                                                    </span>
                                                    {profile?.esta_verificado && (
                                                        <img src="/verified-badge.png" alt="Verificado" className="w-4 h-4 object-contain translate-y-[-1px]" />
                                                    )}
                                                    {profile?.es_fundador && (
                                                        <Crown size={16} className="text-amber-500 translate-y-[-1px]" fill="currentColor" />
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Accesos rápidos: Studio, Moneda, Tema, Salir */}
                                            <Link href="/studio" className="w-12 h-12 flex items-center justify-center text-muted hover:text-accent transition-colors" title="Tianguis Studio">
                                                <Settings size={20} />
                                            </Link>
                                            <CurrencySwitcher />
                                            <ThemeToggle />
                                            <button onClick={handleLogout}
                                                className="w-12 h-12 flex items-center justify-center text-muted hover:text-red-500 transition-colors"
                                                title="Salir">
                                                <LogOut size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Botones para usuarios no autenticados (escritorio) ── */
                                    <div className="flex items-center gap-4">
                                        <Link href="/cart" className="relative w-12 h-12 flex items-center justify-center text-muted hover:text-accent transition-colors">
                                            <ShoppingCart size={22} strokeWidth={2.5} />
                                            {itemCount > 0 && (
                                                <span className="absolute top-1 right-1 bg-accent text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-background shadow-lg animate-in fade-in zoom-in duration-300">
                                                    {itemCount}
                                                </span>
                                            )}
                                        </Link>
                                        <CurrencySwitcher />
                                        <ThemeToggle />
                                        <Link href="/login" className="px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-foreground bg-card border border-border hover:bg-accent-soft hover:text-accent hover:border-accent/20 hover:scale-[1.08] active:scale-[0.95] transition-all min-h-[48px] flex items-center shadow-sm">
                                            Log In
                                        </Link>
                                        <Link href="/signup" className="btn-standard px-6 py-3 min-h-[48px] bg-accent text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:opacity-90 hover:scale-[1.08] active:scale-[0.95] transition-all flex items-center">
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Controles del header móvil (la nav principal la maneja MobileBottomNav) ── */}
                        <div className="flex items-center gap-2 md:hidden">
                            {/* Carrito con badge */}
                            <Link href="/cart" className="relative w-11 h-11 flex items-center justify-center text-muted hover:text-accent transition-colors rounded-xl hover:bg-foreground/5">
                                <ShoppingCart size={20} strokeWidth={2.5} />
                                {itemCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 bg-accent text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-[1.5px] border-background shadow-lg animate-in fade-in zoom-in duration-300">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                            <CurrencySwitcher />
                            <ThemeToggle />
                        </div>

                    </div>
                </div>
            </nav>
        </div>
    );
}
