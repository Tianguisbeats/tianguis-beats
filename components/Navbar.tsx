"use client";
/**
 * Navbar.tsx
 * Componente de navegación principal de la aplicación.
 * Maneja la autenticación, navegación entre páginas y cambio de tema.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Menu, X, User, LayoutDashboard, LogOut, Check, Settings, CheckCircle2, Crown, ShoppingCart, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ThemeToggle from '@/components/ThemeToggle';
import CurrencySwitcher from '@/components/CurrencySwitcher';

/**
 * Componente Navbar: Barra de navegación principal.
 * Incluye enlaces a rutas clave y botones de autenticación dinámicos.
 */
export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();
    const { itemCount } = useCart();

    // URL del Logo oficial
    const logoUrl = "/logo.png";
    const hasLogo = true;

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('foto_perfil, artistic_name, username, is_founder, is_verified, subscription_tier, country')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setProfile(data);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <div className="relative w-full z-50 h-20">
            <nav className="fixed top-0 left-0 right-0 w-full bg-white/80 dark:bg-[#020205]/80 border-b border-border dark:border-white/5 backdrop-blur-xl shadow-sm z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Área del Logo */}
                        <Link href="/" className="flex items-center gap-3 group min-h-[48px]">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover:scale-110 transition-transform overflow-hidden">
                                {hasLogo ? (
                                    <img src={logoUrl} alt="Tianguis Beats Logo" className="w-full h-full object-contain p-1 invert" />
                                ) : (
                                    <Music size={24} fill="currentColor" />
                                )}
                            </div>
                            <span className="text-xl font-heading font-black text-foreground tracking-tighter uppercase whitespace-nowrap">
                                Tianguis<span className="text-accent">Beats</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <div className="flex items-baseline space-x-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                                <Link href="/beats" className="hover:text-accent transition-colors py-2">Explorar Tianguis</Link>
                                {!user && (
                                    <Link href="/pricing" className="hover:text-accent transition-colors py-2">Planes</Link>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {user ? (
                                    <div className="flex items-center gap-6">
                                        <Link href="/upload" className="bg-accent text-white px-5 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 dark:hover:bg-slate-800 transition-all shadow-lg shadow-accent/20 transform hover:-translate-y-0.5 min-h-[48px] flex items-center">
                                            Sube tu Beat
                                        </Link>

                                        <Link href="/cart" className="relative w-12 h-12 flex items-center justify-center text-muted hover:text-accent transition-colors group">
                                            <ShoppingCart size={22} strokeWidth={2.5} />
                                            {itemCount > 0 && (
                                                <span className="absolute top-1 right-1 bg-accent text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-background shadow-lg animate-in fade-in zoom-in duration-300">
                                                    {itemCount}
                                                </span>
                                            )}
                                        </Link>

                                        <div className="flex items-center gap-4 border-l border-border pl-6">
                                            <Link href={`/${profile?.username || 'profile'}`} className="group flex items-center gap-3 min-h-[48px]">
                                                <div className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 ${profile?.subscription_tier === 'premium' ? 'border-accent shadow-lg shadow-accent/20' :
                                                    profile?.subscription_tier === 'pro' ? 'border-amber-400' : 'border-border'
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
                                                    <span className="text-[10px] font-black font-heading uppercase tracking-[0.2em] text-foreground group-hover:text-accent transition-colors flex items-center gap-1.5">
                                                        {profile?.username || 'Perfil'}
                                                    </span>
                                                    {profile?.is_verified && (
                                                        <img src="/verified-badge.png" alt="Verificado" className="w-4 h-4 object-contain translate-y-[-1px]" />
                                                    )}
                                                    {profile?.is_founder && (
                                                        <Crown size={16} className="text-yellow-400 translate-y-[-1px]" fill="currentColor" />
                                                    )}
                                                </div>
                                            </Link>

                                            <Link href="/studio" className="w-12 h-12 flex items-center justify-center text-muted hover:text-foreground transition-colors" title="Tianguis Studio">
                                                <Settings size={20} />
                                            </Link>
                                            <CurrencySwitcher />
                                            <ThemeToggle />

                                            <button
                                                onClick={handleLogout}
                                                className="w-12 h-12 flex items-center justify-center text-muted hover:text-red-500 transition-colors"
                                                title="Salir"
                                            >
                                                <LogOut size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <Link href="/cart" className="relative w-12 h-12 flex items-center justify-center text-muted hover:text-accent transition-colors group">
                                            <ShoppingCart size={22} strokeWidth={2.5} />
                                            {itemCount > 0 && (
                                                <span className="absolute top-1 right-1 bg-accent text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-background shadow-lg animate-in fade-in zoom-in duration-300">
                                                    {itemCount}
                                                </span>
                                            )}
                                        </Link>
                                        <CurrencySwitcher />
                                        <ThemeToggle />
                                        <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground border-2 border-foreground px-6 py-3 rounded-full hover:bg-accent-soft hover:text-accent hover:border-accent transition-all min-h-[48px] flex items-center">
                                            Log In
                                        </Link>
                                        <Link href="/signup" className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-accent border-2 border-accent px-6 py-3 rounded-full hover:bg-slate-900 dark:hover:bg-slate-800 hover:border-slate-900 dark:hover:border-slate-800 transition-all shadow-lg shadow-accent/25 min-h-[48px] flex items-center">
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:hidden">
                            <CurrencySwitcher />
                            <ThemeToggle />
                        </div>
                    </div>
                </div>

            </nav>
        </div>
    );
}
