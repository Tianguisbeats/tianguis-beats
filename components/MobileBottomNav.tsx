"use client";
/* ══════════════════════════════════════════════════════════════════════
   MobileBottomNav.tsx
   Barra de navegación inferior para dispositivos móviles (md:hidden).
   Muestra 5 pestañas: Inicio, Explorar, Subir Beat, Studio y Perfil.
   Se adapta al estado de sesión: si el usuario no está autenticado,
   las pestañas de Subir y Studio redirigen al login.
   ══════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Upload, Sliders, User, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MobileBottomNav() {
    const pathname = usePathname();

    /* ── Estado del usuario y perfil ── */
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    /* ── Suscripción a cambios de sesión ── */
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

    /* ── Obtiene datos del perfil del usuario autenticado ── */
    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('perfiles')
            .select('foto_perfil, nombre_usuario, es_fundador, nivel_suscripcion, esta_verificado')
            .eq('id', userId)
            .single();
        if (data) setProfile(data);
    };

    /* ── Definición de las 5 pestañas de navegación ── */
    const tabs = [
        {
            id: 'home',
            name: 'Inicio',
            href: '/',
            icon: Home,
            isActive: pathname === '/',
        },
        {
            id: 'explorar',
            name: 'Explorar',
            href: '/beats',
            icon: Compass,
            isActive: pathname.startsWith('/beats') || pathname.startsWith('/productores'),
        },
        {
            id: 'subir',
            name: 'Subir',
            href: user ? '/upload' : '/login',
            icon: Upload,
            isActive: pathname === '/upload',
            isCTA: true, // Pestaña central con diseño destacado
        },
        {
            id: 'studio',
            name: 'Studio',
            href: user ? '/studio' : '/login',
            icon: Sliders,
            isActive: pathname.startsWith('/studio'),
        },
        {
            id: 'perfil',
            name: user ? 'Perfil' : 'Ingresar',
            href: user
                ? (profile?.nombre_usuario ? `/${profile.nombre_usuario}` : '/studio')
                : '/login',
            icon: User,
            isActive: user
                ? (pathname === `/${profile?.nombre_usuario}` || pathname.startsWith(`/${profile?.nombre_usuario}/`))
                : pathname === '/login',
            isProfile: true,
        },
    ];

    return (
        /* ── Contenedor principal: solo visible en mobile, fijo en la parte inferior ── */
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_30px_rgba(0,0,0,0.12)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-end justify-around h-[62px] px-2 max-w-lg mx-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;

                    /* ── Pestaña central "Subir Beat" con diseño CTA destacado ── */
                    if (tab.isCTA) {
                        return (
                            <Link key={tab.id} href={tab.href}
                                className="relative flex flex-col items-center justify-center -mt-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 ${tab.isActive
                                    ? 'bg-accent shadow-accent/40 scale-105'
                                    : 'bg-accent shadow-accent/30 hover:scale-105'
                                    }`}>
                                    <Icon size={22} className="text-white" strokeWidth={2.5} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest mt-1.5 text-accent">
                                    {tab.name}
                                </span>
                            </Link>
                        );
                    }

                    /* ── Pestañas regulares ── */
                    return (
                        <Link key={tab.id} href={tab.href}
                            className={`relative flex flex-col items-center justify-center gap-1 h-full w-14 transition-all duration-250 ${tab.isActive ? 'text-accent' : 'text-muted'}`}>

                            {/* Ícono o foto de perfil */}
                            <div className="relative flex items-center justify-center w-7 h-7">
                                {tab.isProfile && profile?.foto_perfil ? (
                                    <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${tab.isActive ? 'border-accent scale-110' : 'border-border'}`}>
                                        <img src={profile.foto_perfil} className="w-full h-full object-cover" alt="Perfil" />
                                    </div>
                                ) : (
                                    <Icon size={22} strokeWidth={tab.isActive ? 2.5 : 2}
                                        className={`transition-all duration-300 ${tab.isActive ? 'scale-110' : 'scale-100'}`} />
                                )}

                                {/* Corona de Founder en el perfil */}
                                {tab.isProfile && profile?.es_fundador && (
                                    <Crown size={11} className="absolute -top-2 -right-2 text-amber-500 fill-amber-500 drop-shadow-md" />
                                )}
                            </div>

                            {/* Etiqueta de texto */}
                            <span className={`text-[9px] font-bold tracking-tight leading-none transition-all duration-250 ${tab.isActive ? 'opacity-100 font-black' : 'opacity-50'}`}>
                                {tab.name}
                            </span>

                            {/* Punto indicador de pestaña activa */}
                            {tab.isActive && (
                                <span className="absolute bottom-1.5 w-1 h-1 bg-accent rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
