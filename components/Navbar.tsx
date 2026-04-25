"use client";
/* ══════════════════════════════════════════════════════════════════════
   Navbar.tsx - Versión simplificada sin dropdowns
   Condicionado por sesión: Solo muestra lo esencial si no hay usuario.
   v4.1 - Reordenando: Explorar -> Sube tu Beat -> ThemeToggle
══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, Crown, ShoppingCart, Menu, X, Store, PlusSquare } from 'lucide-react';
import NotificacionesBell from '@/components/NotificacionesBell';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ThemeToggle from '@/components/ThemeToggle';

import Image from 'next/image';

export default function Navbar({ minimal = false }: { minimal?: boolean }) {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const router = useRouter();
    const { itemCount, setIsCartOpen } = useCart();
    const logoUrl = "/logo.png";

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

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('foto_perfil, nombre_artistico, nombre_usuario, es_fundador, esta_verificado, nivel_suscripcion, pais')
            .eq('id', userId)
            .single();
        if (!error && data) setProfile(data);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/beats');
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Efecto de scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Explorar', href: '/beats' },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 w-full z-[100] transition-all duration-700 pointer-events-none pt-4 md:pt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
                <motion.nav 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className={`pointer-events-auto relative flex items-center gap-2.5 md:gap-3 px-4 md:px-7 py-2.5 md:py-3.5 rounded-full transition-all duration-700 ${
                        !isScrolled
                        ? 'bg-transparent border-transparent'
                        : 'bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl scale-95'
                    }`}
                >
                    {/* 1. LOGO (Siempre al inicio) */}
                    <Link href="/" className="flex items-center gap-2.5 md:gap-3 transition-all duration-300 hover:scale-110 active:scale-95 group shrink-0">
                        <div className="w-7 h-7 md:w-9 md:h-9 relative flex items-center justify-center transform -rotate-12 group-hover:rotate-0 transition-transform">
                            <Image src={logoUrl} alt="Logo" width={36} height={36} className="object-contain" />
                        </div>
                        <span className={`hidden md:block font-heading font-black text-base tracking-tighter uppercase whitespace-nowrap transition-colors ${minimal ? 'text-gray-500' : 'text-slate-500 dark:text-white'}`}>
                            TIANGUIS <span className="text-blue-500">BEATS</span>
                        </span>
                    </Link>

                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* UNIFIED ACTION SECTION: Flujo único con gap consistente */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    
                    {/* EXPLORAR (Link) - Solo Desktop */}
                    <Link 
                        href="/beats" 
                        className={`hidden lg:inline-flex px-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-blue-500 ${minimal ? 'text-gray-500' : 'text-slate-500 dark:text-white'}`}
                    >
                        Explorar
                    </Link>

                    {/* EXPLORAR (Icono) - Solo Móvil Sin Sesión */}
                    {!user && (
                        <Link href="/beats" className={`lg:hidden p-1.5 transition-all hover:scale-110 ${minimal ? 'text-slate-600 dark:text-white' : 'text-gray-500 dark:text-white'}`}>
                            <Store size={18} />
                        </Link>
                    )}

                    {/* SUBE TU BEAT (Link) - Solo Desktop Logueado */}
                    {user && (
                        <Link 
                            href="/upload" 
                            className={`hidden lg:inline-flex px-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-blue-500 ${minimal ? 'text-gray-500' : 'text-slate-500 dark:text-white'}`}
                        >
                            Sube tu Beat
                        </Link>
                    )}

                    {/* PLANES (Crown) - Solo Sin Sesión */}
                    {!user && (
                        <Link href="/pricing" className="p-1.5 transition-all hover:scale-110">
                            <Crown size={18} className="text-amber-500" />
                        </Link>
                    )}

                    {/* TEMA (Siempre visible) */}
                    <div className="px-1 scale-90 md:scale-100">
                        <ThemeToggle />
                    </div>

                    {/* NOTIFICACIONES - Solo Logueado */}
                    {user && (
                        <NotificacionesBell userId={user.id} className={minimal ? 'text-slate-600 dark:text-white' : ''} />
                    )}

                    {/* CARRITO - Solo Logueado o con items */}
                    {user && (
                        <button onClick={() => setIsCartOpen(true)} className={`relative p-2 transition-all hover:scale-110 ${minimal ? 'text-slate-600 dark:text-white' : 'text-gray-500 dark:text-white'}`}>
                            <ShoppingCart size={18} />
                            {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">{itemCount}</span>}
                        </button>
                    )}

                    {/* ESTUDIO (Tuerquita) - Solo Desktop Logueado */}
                    {user && (
                        <Link href="/studio" title="Tianguis Estudio" className={`hidden lg:flex p-2 transition-all hover:scale-110 ${minimal ? 'text-slate-600 dark:text-white' : 'text-gray-500 dark:text-white'}`}>
                            <Settings size={18} className="hover:rotate-90 transition-transform" />
                        </Link>
                    )}

                    {/* LOGIN / SIGNUP - Solo Sin Sesión */}
                    {!user && (
                        <>
                            <Link href="/login" className="px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 whitespace-nowrap">
                                Login
                            </Link>
                            <Link href="/signup" className="px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-lime-500 hover:bg-lime-600 text-white shadow-lg shadow-lime-500/30 whitespace-nowrap">
                                Sign Up
                            </Link>
                        </>
                    )}

                    {/* LOGOUT - Solo Logueado */}
                    {user && (
                        <button onClick={handleLogout} className="p-2 transition-all hover:scale-110">
                            <LogOut size={18} className="text-red-500/70" />
                        </button>
                    )}

                    {/* FOTO PERFIL - Solo Desktop Logueado */}
                    {user && (
                        <Link 
                            href={`/${profile?.nombre_usuario || 'profile'}`} 
                            className={`hidden lg:flex w-9 h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-110 flex items-center justify-center p-[2px] ${
                                profile?.nivel_suscripcion?.toLowerCase() === 'premium' 
                                ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                : profile?.nivel_suscripcion?.toLowerCase() === 'pro' 
                                ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                : 'border-gray-400/50'
                            }`}
                        >
                            <div className="w-full h-full rounded-full overflow-hidden relative border border-black/5 dark:border-white/5">
                                {profile?.foto_perfil ? (
                                    <Image src={profile.foto_perfil} alt="Avatar" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <User size={14} />
                                    </div>
                                )}
                            </div>
                        </Link>
                    )}

                </motion.nav>
            </div>
        </div>
    );
}
