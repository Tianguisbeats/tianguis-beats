"use client";

import React, { useEffect, useState } from 'react';
import { getGlobalConfig } from '@/lib/config';
import { Megaphone } from 'lucide-react';

export default function AnuncioBanner() {
    const [activo, setActivo] = useState(false);
    const [texto, setTexto] = useState('');

    useEffect(() => {
        getGlobalConfig().then(cfg => {
            setActivo(cfg.banner_noticia_activa);
            setTexto(cfg.banner_texto || '');
        });
    }, []);

    if (!activo || !texto) return null;

    // Duplicamos el texto para el loop continuo del marquee
    const contenido = `${texto}     •     ${texto}     •     ${texto}     •     ${texto}`;

    return (
        <div className="w-full bg-amber-500 text-black overflow-hidden" style={{ height: '34px' }}>
            <div className="flex items-center h-full">
                {/* Ícono fijo a la izquierda */}
                <div className="flex items-center gap-2 px-3 shrink-0 z-10 bg-amber-500 border-r border-black/10 h-full">
                    <Megaphone size={13} strokeWidth={2.5} />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Aviso</span>
                </div>

                {/* Texto en marquee */}
                <div className="flex-1 overflow-hidden relative">
                    <div
                        className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider"
                        style={{
                            display: 'inline-block',
                            animation: 'marquee-scroll 30s linear infinite',
                            paddingLeft: '100%',
                        }}
                    >
                        {contenido}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes marquee-scroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
}
