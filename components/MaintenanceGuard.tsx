"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getGlobalConfig } from '@/lib/config';
import { Hammer, Lock, Music } from 'lucide-react';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const [maintenance, setMaintenance] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkMaintenance = async () => {
            const config = await getGlobalConfig();
            
            if (config.modo_mantenimiento) {
                // Check if user is admin/support to bypass
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('perfiles')
                        .select('es_admin, es_soporte')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile?.es_admin || profile?.es_soporte) {
                        setIsAdmin(true);
                        setMaintenance(false);
                    } else {
                        setMaintenance(true);
                    }
                } else {
                    setMaintenance(true);
                }
            }
            setLoading(false);
        };

        checkMaintenance();
    }, []);

    if (loading) return children;

    if (maintenance && !isAdmin) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[150px] rounded-full" />
                </div>

                <div className="relative z-10 space-y-8 max-w-lg">
                    <div className="w-24 h-24 bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 animate-pulse">
                        <Hammer size={40} className="text-blue-500" />
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Tianguis Beats Studio</p>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white">
                            Modo <br /> <span className="text-blue-500">Mantenimiento</span>
                        </h1>
                    </div>

                    <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                        Estamos realizando mejoras técnicas para ofrecerte la mejor experiencia. Volveremos muy pronto con nuevas herramientas para tu música.
                    </p>

                    <div className="pt-8 flex flex-col items-center gap-4">
                         <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                            <Lock size={12} className="text-blue-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">Solo Acceso Administrativo</span>
                        </div>
                        <a 
                            href="/login" 
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                        >
                            ¿Eres Administrador? Inicia Sesión
                        </a>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Music size={16} className="text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-white">Tianguis Beats</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {isAdmin && (
                <div className="fixed top-0 left-0 right-0 z-[10000] bg-blue-600 text-white py-1 px-4 text-center">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">
                        ⚠️ MODO MANTENIMIENTO ACTIVO - Solo tú puedes ver este sitio
                    </p>
                </div>
            )}
            {children}
        </>
    );
}
