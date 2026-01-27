"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Menu, X, User, LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/**
 * Componente Navbar: Barra de navegación principal.
 * Incluye enlaces a rutas clave y botones de autenticación dinámicos.
 */
export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Obtener sesión inicial
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        getSession();

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center transform rotate-2 shadow-lg shadow-blue-600/20">
                            <Music className="text-white w-5 h-5" />
                        </div>
                        <span className="font-black text-2xl tracking-tighter uppercase">
                            Tianguis<span className="text-blue-600">Beats</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex items-baseline space-x-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <Link href="/beats" className="hover:text-blue-600 transition-colors">Explorar</Link>
                            {user && <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Panel</Link>}
                            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Planes</Link>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <Link href="/profile" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2">
                                        <User size={14} />
                                        Perfil
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        Salir
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2">
                                        <User size={14} />
                                        Entrar
                                    </Link>
                                    <Link href="/signup" className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg transform hover:-translate-y-0.5">
                                        Vender Beats
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
                        <Link href="/beats" className="hover:text-blue-600 transition-colors py-2">Explorar</Link>
                        {user && <Link href="/dashboard" className="hover:text-blue-600 transition-colors py-2">Panel</Link>}
                        <Link href="/pricing" className="hover:text-blue-600 transition-colors py-2">Planes</Link>

                        <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                            {user ? (
                                <>
                                    <Link href="/profile" className="flex items-center justify-center gap-2 py-3 text-slate-900 font-black">
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
                                    <Link href="/login" className="flex items-center justify-center gap-2 py-3 text-slate-900 font-black">
                                        <User size={16} />
                                        Entrar
                                    </Link>
                                    <Link href="/signup" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg text-center">
                                        Vender Beats
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
