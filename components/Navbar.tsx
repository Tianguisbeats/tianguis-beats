"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Menu, X, User, LayoutDashboard, LogOut, Check, Settings, CheckCircle2, Crown, ShoppingCart, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ThemeToggle from '@/components/ThemeToggle';

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
            <nav className="fixed top-0 left-0 right-0 w-full bg-background border-b border-border shadow-sm z-50 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo Area */}
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
                                <ThemeToggle />

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
                                        <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground border-2 border-foreground px-6 py-3 rounded-full hover:bg-accent-soft transition-all min-h-[48px] flex items-center">
                                            Log In
                                        </Link>
                                        <Link href="/signup" className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-foreground border-2 border-foreground px-6 py-3 rounded-full hover:bg-accent hover:border-accent transition-all shadow-lg shadow-foreground/20 min-h-[48px] flex items-center">
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:hidden">
                            <ThemeToggle />
                            <Link href="/cart" className="relative w-12 h-12 flex items-center justify-center text-muted hover:text-accent transition-colors group">
                                <ShoppingCart size={24} strokeWidth={2.5} />
                                {itemCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-accent text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-background shadow-lg animate-in fade-in zoom-in duration-300">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-12 h-12 flex items-center justify-center text-foreground p-2">
                                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-background border-b border-border pb-8 px-4 animate-in slide-in-from-top duration-300">
                        <div className="flex flex-col gap-2 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                            <Link href="/beats" className="hover:text-accent transition-colors py-5 border-b border-border flex items-center justify-between min-h-[48px]">
                                Explorar Tianguis <ArrowRight size={16} className="text-muted/30" />
                            </Link>
                            <Link href="/pricing" className="hover:text-accent transition-colors py-5 border-b border-border flex items-center justify-between min-h-[48px]">
                                Planes <ArrowRight size={16} className="text-muted/30" />
                            </Link>

                            <div className="flex flex-col gap-3 mt-4">
                                {user ? (
                                    <>
                                        <div className="bg-accent-soft p-4 rounded-2xl flex items-center gap-3 mb-2 border border-border">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-background shadow-sm">
                                                {profile?.foto_perfil ? (
                                                    <img src={profile.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted bg-background">
                                                        <User size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-foreground lowercase font-bold">@{profile?.username}</span>
                                                <span className="text-[9px] text-accent uppercase tracking-widest">{profile?.subscription_tier}</span>
                                            </div>
                                        </div>

                                        <Link href="/upload" className="flex items-center gap-4 py-4 text-foreground font-black px-2 min-h-[48px] hover:bg-accent-soft rounded-xl transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                                                <Music size={20} />
                                            </div>
                                            Sube tu Beat
                                        </Link>

                                        <Link href="/studio" className="flex items-center gap-4 py-4 text-foreground font-black px-2 min-h-[48px] hover:bg-accent-soft rounded-xl transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted flex items-center justify-center">
                                                <Settings size={20} />
                                            </div>
                                            Tianguis Studio
                                        </Link>

                                        <Link href={`/${profile?.username || 'profile'}`} className="flex items-center gap-4 py-4 text-foreground font-black px-2 min-h-[48px] hover:bg-accent-soft rounded-xl transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted flex items-center justify-center">
                                                <User size={20} />
                                            </div>
                                            Mi Perfil Público
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            className="mt-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 min-h-[48px]"
                                        >
                                            <LogOut size={18} />
                                            Cerrar Sesión
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 pt-2">
                                        <Link href="/login" className="flex items-center justify-center gap-2 py-5 border-2 border-border rounded-2xl font-black text-foreground uppercase min-h-[48px] hover:bg-accent-soft">
                                            Log In
                                        </Link>
                                        <Link href="/signup" className="flex items-center justify-center gap-2 py-5 bg-foreground text-background rounded-2xl font-black uppercase shadow-lg shadow-foreground/20 min-h-[48px] hover:bg-accent hover:text-white transition-colors">
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}
