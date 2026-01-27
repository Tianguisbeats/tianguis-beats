/**
 * Componente Hero: Sección de bienvenida con buscador integrado.
 * @param searchQuery Estado del término de búsqueda.
 * @param setSearchQuery Función para actualizar el término de búsqueda.
 */
"use client";

import React from 'react';
import { Search, Zap, Headphones } from 'lucide-react';
import Link from 'next/link';

interface HeroProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export default function Hero({ searchQuery, setSearchQuery }: HeroProps) {
    return (
        <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-40">
                <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-20 left-10 w-80 h-80 bg-cyan-100 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    La plataforma #1 de beats en México 🇲🇽
                </div>

                <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.85]">
                    Sube el nivel.<br />
                    <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">Rompe la escena.</span>
                </h1>

                <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mb-12">
                    "Donde el talento mexa se encuentra con los próximos éxitos mundiales. Trato directo, sin letras chiquitas."
                </p>

                {/* BUSCADOR INTEGRADO */}
                <div className="max-w-2xl mx-auto mb-12 relative group">
                    <div className="absolute inset-0 bg-blue-600/10 rounded-[2rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-2 shadow-2xl focus-within:border-blue-600 focus-within:bg-white transition-all">
                        <div className="pl-5 pr-3 text-slate-400">
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Busca trap, corridos, BPM, productor..."
                            className="flex-1 py-4 bg-transparent border-none focus:ring-0 text-lg font-bold placeholder:text-slate-300 outline-none text-slate-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="hidden sm:flex bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all active:scale-95 items-center gap-2 shadow-lg shadow-blue-600/20">
                            <Zap size={14} fill="white" />
                            Buscar
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-5">
                    <Link
                        href="/signup"
                        className="px-10 py-5 rounded-2xl bg-blue-600 text-white text-lg font-black hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Zap size={24} fill="white" />
                        Abre tu tianguis digital
                    </Link>

                    <Link
                        href="/beats"
                        className="px-10 py-5 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 text-lg font-black hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                    >
                        <Headphones size={24} />
                        Escuchar Beats
                    </Link>
                </div>
            </div>
        </header>
    );
}
