"use client";
/* ══════════════════════════════════════════════════════════════════════
   MobileBottomNav.tsx  ·  Tianguis Beats  ·  v4.0 Premium 2026
   Barra de navegación inferior para dispositivos móviles (md:hidden).
   5 pestañas   Inicio · Explorar · Subir Beat · Studio · Perfil/Ingresar
   Glassmorphism · Gradiente activo · Indicador lineal animado
   ══════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, Upload, Sliders, User, Crown, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function MobileBottomNav() {
    const pathname = usePathname();

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchNotifCount(session.user.id);
            }
        };
        getSession();


        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchNotifCount(session.user.id);
            } else {
                setProfile(null);
                setNotifCount(0);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('perfiles')
            .select('foto_perfil, nombre_usuario, es_fundador, nivel_suscripcion, esta_verificado')
            .eq('id', userId)
            .single();
        if (data) setProfile(data);
    };

    const fetchNotifCount = async (userId: string) => {
        const { count } = await supabase
            .from('notificaciones')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', userId)
            .eq('esta_leida', false);
        setNotifCount(count ?? 0);
    };

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
            icon: Store,
            isActive: pathname.startsWith('/beats') || pathname.startsWith('/productores') || pathname.startsWith('/sound-kits'),
        },
        {
            id: 'subir',
            name: 'Subir',
            href: user ? '/upload' : '/login',
            icon: Upload,
            isActive: pathname === '/upload',
            isCTA: true,
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

    if (!user) return null;

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            {/* glassmorphism background - Solid Opacity Fix */}
            <div className="absolute inset-0 bg-white dark:bg-[#0A0A0A] border-t border-white/[0.06] dark:border-white/[0.04]" />

            {/* top gradient glow line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

            {/* tabs row */}
            <div className="relative flex items-end justify-around h-[66px] px-1 max-w-lg mx-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;

                    /* ── Pestaña central CTA «Subir» ── */
                    if (tab.isCTA) {
                        return (
                            <Link key={tab.id} href={tab.href}
                                className="relative flex flex-col items-center justify-center -mt-6 group">

                                {/* outer glow ring */}
                                <span className={`absolute inset-[-4px] rounded-[22px] transition-all duration-500 ${tab.isActive
                                    ? 'bg-accent/20 blur-md'
                                    : 'bg-accent/10 blur-sm group-active:blur-md'}`} />

                                {/* button */}
                                <div className={`relative w-[54px] h-[54px] rounded-[18px] flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 ${tab.isActive
                                    ? 'bg-gradient-to-br from-accent to-accent/80 shadow-accent/50 scale-105'
                                    : 'bg-gradient-to-br from-accent via-accent/90 to-accent/70 shadow-accent/30 group-hover:scale-105'
                                    }`}>
                                    {/* shine */}
                                    <div className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/20 to-transparent" />
                                    <Icon size={22} className="text-white relative z-10" strokeWidth={2.5} />
                                </div>

                                <span className="text-[8px] font-black uppercase tracking-widest mt-1.5 text-accent">
                                    {tab.name}
                                </span>
                            </Link>
                        );
                    }

                    /* ── Pestañas regulares ── */
                    return (
                        <Link key={tab.id} href={tab.href}
                            className="relative flex flex-col items-center justify-center gap-0.5 h-full w-14 group active:scale-95 transition-all duration-200">

                            {/* active indicator pill at top */}
                            <span className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full bg-accent transition-all duration-300 ${tab.isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'}`} />

                            {/* icon area */}
                            <div className="relative flex items-center justify-center w-8 h-8 mt-2">
                                {tab.isProfile && profile?.foto_perfil ? (
                                    <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all duration-300 ${tab.isActive
                                        ? 'border-accent scale-110 shadow-lg shadow-accent/30'
                                        : 'border-border/50 group-active:scale-95'}`}>
                                        <img src={profile.foto_perfil} className="w-full h-full object-cover" alt="Perfil" />
                                    </div>
                                ) : (
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${tab.isActive
                                        ? 'bg-accent/10 text-accent'
                                        : 'text-muted/70 group-active:bg-foreground/5'}`}>
                                        <Icon
                                            size={tab.isActive ? 21 : 20}
                                            strokeWidth={tab.isActive ? 2.5 : 2}
                                            className="transition-all duration-300"
                                        />
                                    </div>
                                )}

                                    {/* badge de notificaciones en Studio */}
                                {tab.id === 'studio' && notifCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none">
                                        {notifCount > 9 ? '9+' : notifCount}
                                    </span>
                                )}

                                {/* founder crown badge */}
                                {tab.isProfile && profile?.es_fundador && (
                                    <Crown size={10} className="absolute -top-1.5 -right-1 text-amber-500 fill-amber-500 drop-shadow-md" />
                                )}

                                {/* verified check badge */}
                                {tab.isProfile && profile?.esta_verificado && !profile?.es_fundador && (
                                    <span className="absolute -top-1.5 -right-1 w-[13px] h-[13px] rounded-full bg-[#1e9cff] flex items-center justify-center shadow">
                                        <Check size={8} strokeWidth={3} className="text-white" />
                                    </span>
                                )}
                            </div>

                            {/* label */}
                            <span className={`text-[8.5px] font-bold tracking-tight leading-none transition-all duration-300 ${tab.isActive
                                ? 'text-accent font-black opacity-100'
                                : 'text-muted/60 opacity-80'}`}>
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
