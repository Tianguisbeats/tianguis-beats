"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Menu, X, User, LayoutDashboard, LogOut, Check, Settings, CheckCircle2, Crown, ShoppingCart, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

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
            <nav className="fixed top-0 left-0 right-0 w-full bg-slate-50 border-b border-slate-100 shadow-sm z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo Area */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover:scale-110 transition-transform overflow-hidden">
                                {hasLogo ? (
                                    <img src={logoUrl} alt="Tianguis Beats Logo" className="w-full h-full object-contain p-1 invert" />
                                ) : (
                                    <Music size={24} fill="currentColor" />
                                )}
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">
                                Tianguis<span className="text-blue-600">Beats</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <div className="flex items-baseline space-x-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <Link href="/beats" className="hover:text-blue-600 transition-colors">Explorar Tianguis</Link>
                                {!user && (
                                    <Link href="/pricing" className="hover:text-blue-600 transition-colors">Planes</Link>
                                )}
                            </div>

                            <div className="flex items-center gap-6">

                                {user ? (
                                    <div className="flex items-center gap-6">

                                        <Link href="/upload" className="bg-blue-600 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5">
                                            Sube tu Beat
                                        </Link>

                                        <Link href="/cart" className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors group">
                                            <ShoppingCart size={22} strokeWidth={2.5} />
                                            {itemCount > 0 && (
                                                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in fade-in zoom-in duration-300">
                                                    {itemCount}
                                                </span>
                                            )}
                                        </Link>

                                        <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                                            <Link href={`/${profile?.username || 'profile'}`} className="group flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all duration-300 ${profile?.subscription_tier === 'premium' ? 'border-blue-600 shadow-lg shadow-blue-600/20' :
                                                    profile?.subscription_tier === 'pro' ? 'border-amber-400' : 'border-slate-200'
                                                    }`}>
                                                    {profile?.foto_perfil ? (
                                                        <img src={profile.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                                            <User size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
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

                                            <Link href="/studio" className="text-slate-400 hover:text-slate-900 transition-colors" title="Tianguis Studio">
                                                <Settings size={18} />
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                title="Salir"
                                            >
                                                <LogOut size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Link href="/cart" className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors group mr-2">
                                            <ShoppingCart size={22} strokeWidth={2.5} />
                                            {itemCount > 0 && (
                                                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in fade-in zoom-in duration-300">
                                                    {itemCount}
                                                </span>
                                            )}
                                        </Link>
                                        <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 border-2 border-slate-900 px-5 py-2 rounded-full hover:bg-slate-50 transition-all">
                                            Log In
                                        </Link>
                                        <Link href="/signup" className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 border-2 border-slate-900 px-5 py-2 rounded-full hover:bg-blue-600 hover:border-blue-600 transition-all shadow-lg shadow-slate-900/20">
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:hidden">
                            <Link href="/cart" className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors group">
                                <ShoppingCart size={22} strokeWidth={2.5} />
                                {itemCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in fade-in zoom-in duration-300">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-900">
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-100 pb-8 px-4 animate-in slide-in-from-top duration-300">
                        <div className="flex flex-col gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <Link href="/beats" className="hover:text-blue-600 transition-colors py-4 border-b border-slate-50 flex items-center justify-between">
                                Explorar Tianguis <ArrowRight size={14} className="text-slate-300" />
                            </Link>
                            <Link href="/pricing" className="hover:text-blue-600 transition-colors py-4 border-b border-slate-50 flex items-center justify-between">
                                Planes <ArrowRight size={14} className="text-slate-300" />
                            </Link>

                            <div className="flex flex-col gap-3 mt-4">
                                {user ? (
                                    <>
                                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                                                {profile?.foto_perfil ? (
                                                    <img src={profile.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-white">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 lowercase">@{profile?.username}</span>
                                                <span className="text-[8px] text-blue-600 uppercase tracking-widest">{profile?.subscription_tier}</span>
                                            </div>
                                        </div>

                                        <Link href="/upload" className="flex items-center gap-3 py-3 text-slate-900 font-bold px-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Music size={16} />
                                            </div>
                                            Sube tu Beat
                                        </Link>

                                        <Link href="/studio" className="flex items-center gap-3 py-3 text-slate-900 font-bold px-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                                <Settings size={16} />
                                            </div>
                                            Tianguis Studio
                                        </Link>

                                        <Link href={`/${profile?.username || 'profile'}`} className="flex items-center gap-3 py-3 text-slate-900 font-bold px-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                                <User size={16} />
                                            </div>
                                            Mi Perfil Público
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            className="mt-4 bg-red-50 text-red-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            Cerrar Sesión
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 pt-2">
                                        <Link href="/login" className="flex items-center justify-center gap-2 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-900 uppercase">
                                            Log In
                                        </Link>
                                        <Link href="/signup" className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase shadow-lg shadow-slate-900/20">
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
