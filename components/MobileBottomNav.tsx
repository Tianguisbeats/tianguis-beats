"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, ShoppingCart, User, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { itemCount } = useCart();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

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
        const { data } = await supabase
            .from('perfiles')
            .select('foto_perfil, nombre_usuario, es_fundador')
            .eq('id', userId)
            .single();
        if (data) setProfile(data);
    };

    const tabs = [
        { name: 'Inicio', href: '/', icon: Home, isActive: pathname === '/' },
        { name: 'Explorar', href: '/beats', icon: Compass, isActive: pathname === '/beats' },
        { name: 'Carrito', href: '/cart', icon: ShoppingCart, isActive: pathname === '/cart', count: itemCount },
        {
            name: user ? 'Perfil' : 'Ingresar',
            href: user ? (profile?.nombre_usuario ? `/${profile.nombre_usuario}` : '/studio') : '/login',
            icon: User,
            isActive: user ? pathname.includes(`/${profile?.nombre_usuario}`) : pathname === '/login',
            isProfile: true
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#020205] border-t border-border dark:border-white/5 pb-safe pt-2 px-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center h-16 max-w-sm mx-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`relative flex flex-col items-center justify-center w-14 h-full transition-all duration-300 ${tab.isActive ? 'text-accent' : 'text-muted hover:text-foreground'}`}
                        >
                            <div className="relative flex items-center justify-center h-8">
                                {tab.isProfile && profile?.foto_perfil ? (
                                    <div className={`w-7 h-7 rounded-full overflow-hidden border-[1.5px] ${tab.isActive ? 'border-accent' : 'border-slate-300 dark:border-slate-700'}`}>
                                        <img src={profile.foto_perfil} className="w-full h-full object-cover" alt="Perfil" />
                                    </div>
                                ) : (
                                    <Icon
                                        size={24}
                                        strokeWidth={tab.isActive ? 2.5 : 2}
                                        className={`transition-all duration-300 ${tab.isActive ? 'fill-accent/20 scale-110' : 'scale-100'}`}
                                    />
                                )}

                                {/* Notificador de Carrito o Fundador */}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-[#020205]">
                                        {tab.count}
                                    </span>
                                )}
                                {tab.isProfile && profile?.es_fundador && (
                                    <Crown size={12} className="absolute -top-1.5 -right-1 text-amber-500 fill-amber-500 drop-shadow-md" />
                                )}
                            </div>
                            <span className={`text-[9px] font-bold tracking-tight mt-1 transition-all duration-300 ${tab.isActive ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2 absolute bottom-0'}`}>
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
