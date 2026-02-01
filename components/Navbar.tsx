"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Menu, X, User, LayoutDashboard, LogOut, Check, Settings, CheckCircle2, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/**
 * Componente Navbar: Barra de navegación principal.
 * Incluye enlaces a rutas clave y botones de autenticación dinámicos.
 */
export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();

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
            .select('avatar_url, artistic_name, role, username, is_founder, is_verified, subscription_tier, country')
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
        <div className="fixed top-0 left-0 w-full z-50">
            <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
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

                            <div className="flex items-center gap-4">
                                {user ? (
                                    <div className="flex items-center gap-6">

                                        <Link href="/upload" className="bg-blue-600 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5">
                                            Sube tu Beat
                                        </Link>

                                        <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
                                            <Link href={`/${profile?.username || 'profile'}`} className="group flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all duration-300 ${profile?.subscription_tier === 'premium' ? 'border-blue-600 shadow-lg shadow-blue-600/20' :
                                                    profile?.subscription_tier === 'pro' ? 'border-amber-400' : 'border-slate-200'
                                                    }`}>
                                                    {profile?.avatar_url ? (
                                                        <img src={profile.avatar_url} alt="Perfil" className="w-full h-full object-cover" />
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

                                            {/* Settings Gear */}
                                            <Link href={`/${profile?.username}`} className="text-slate-400 hover:text-slate-900 transition-colors">
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

                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-100 pb-6 px-4">
                        <div className="flex flex-col gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <Link href="/beats" className="hover:text-blue-600 transition-colors py-2">Explorar Tianguis</Link>
                            <Link href="/pricing" className="hover:text-blue-600 transition-colors py-2">Planes</Link>

                            <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                                {user ? (
                                    <>
                                        <Link href={`/${profile?.username || 'profile'}`} className="flex items-center justify-center gap-2 py-3 text-slate-900 font-black">
                                            <User size={16} />
                                            Mi Perfil
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="bg-red-50 text-red-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]"
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-xl font-black text-slate-900 uppercase">
                                            Log In
                                        </Link>
                                        <Link href="/signup" className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-black uppercase">
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}
