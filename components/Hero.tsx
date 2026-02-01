/**
 * Componente Hero: Sección de bienvenida con buscador integrado.
 * @param searchQuery Estado del término de búsqueda.
 * @param setSearchQuery Función para actualizar el término de búsqueda.
 */
"use client";

import React from 'react';
import { Search, Zap, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeroProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeGenre?: string;
    setActiveGenre?: (genre: string) => void;
    activeMood?: string;
    setActiveMood?: (mood: string) => void;
    activeBpm?: string;
    setActiveBpm?: (bpm: string) => void;
    activeKey?: string;
    setActiveKey?: (key: string) => void;
}

export default function Hero({
    searchQuery,
    setSearchQuery,
    activeGenre,
    setActiveGenre,
    activeMood,
    setActiveMood,
    activeBpm,
    setActiveBpm,
    activeKey,
    setActiveKey
}: HeroProps) {
    const router = useRouter();

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (activeGenre && activeGenre !== 'Todos') params.set('genre', activeGenre);
        if (activeMood) params.set('mood', activeMood);
        if (activeBpm) params.set('bpm', activeBpm);
        // Fix: Page.tsx seemed to map 'artist' to refArtist, let's check page.tsx again to ensure keys are consistent.
        // Actually best to use standard keys. Page.tsx uses: genre, mood, artist, bpm.
        // Wait, Page.tsx implemented: g=genre, m=mood, a=artist, b=bpm.
        // And it sets searchQuery to combining them.
        // Real logic should be distinct params.

        // Let's standardise on:
        // q -> text search
        // genre -> genre
        // mood -> mood
        // bpm -> bpm
        // key -> key (new)

        if (activeKey) params.set('key', activeKey);

        router.push(`/beats?${params.toString()}`);
    };

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
                    Tu sonido.<br />
                    <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">Tu negocio.</span>
                </h1>

                <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mb-12">
                    "Vende tus beats a artistas de todo el mundo. Encuentra el sonido perfecto para tu próximo hit."
                </p>

                {/* BUSCADOR INTEGRADO CON FILTROS */}
                <div className="max-w-4xl mx-auto mb-12 relative group">
                    <div className="absolute inset-0 bg-blue-600/5 rounded-[2.5rem] blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-white border-2 border-slate-100 rounded-[2.5rem] p-2 shadow-2xl focus-within:border-blue-600 transition-all gap-2">

                        {/* Search Input */}
                        <div className="flex-1 flex items-center min-w-0">
                            <div className="pl-6 pr-3 text-slate-400">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Título, artista o estilo..."
                                className="w-full py-4 bg-transparent border-none focus:ring-0 text-base font-bold placeholder:text-slate-300 outline-none text-slate-900"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="h-8 w-[2px] bg-slate-100 hidden md:block"></div>

                        {/* Genre Filter */}
                        <div className="px-2">
                            <select
                                className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer w-full md:w-auto"
                                value={activeGenre}
                                onChange={(e) => setActiveGenre?.(e.target.value)}
                            >
                                <option value="Todos">Género</option>
                                <option value="Trap">Trap</option>
                                <option value="Reggaeton">Reggaeton</option>
                                <option value="Corridos">Corridos</option>
                                <option value="Hip Hop">Hip Hop</option>
                            </select>
                        </div>

                        <div className="h-8 w-[2px] bg-slate-100 hidden md:block"></div>

                        {/* Mood Filter */}
                        <div className="px-2">
                            <select
                                className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer w-full md:w-auto"
                                value={activeMood}
                                onChange={(e) => setActiveMood?.(e.target.value)}
                            >
                                <option value="">Mood</option>
                                <option value="Agresivo">Agresivo</option>
                                <option value="Triste">Triste</option>
                                <option value="Feliz">Feliz</option>
                                <option value="Chill">Chill</option>
                                <option value="Oscuro">Oscuro</option>
                            </select>
                        </div>

                        <div className="h-8 w-[2px] bg-slate-100 hidden md:block"></div>

                        {/* BPM Filter */}
                        <div className="px-2">
                            <select
                                className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer w-full md:w-auto"
                                value={activeBpm}
                                onChange={(e) => setActiveBpm?.(e.target.value)}
                            >
                                <option value="">BPM</option>
                                {[80, 90, 100, 110, 120, 130, 140, 150, 160, 170].map(val => (
                                    <option key={val} value={val}>{val} BPM</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-8 w-[2px] bg-slate-100 hidden md:block"></div>

                        {/* Key Filter */}
                        <div className="px-2">
                            <select
                                className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer w-full md:w-auto"
                                value={activeKey}
                                onChange={(e) => setActiveKey?.(e.target.value)}
                            >
                                <option value="">Escala</option>
                                {['C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'D#', 'D#m', 'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'G', 'Gm', 'G#', 'G#m', 'A', 'Am', 'A#', 'A#m', 'B', 'Bm'].map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all active:scale-95 items-center gap-2 shadow-lg shadow-blue-600/20 shrink-0"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                        Explora
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/30"></span>
                        Escucha
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600/30"></span>
                        Crea
                    </p>
                </div>
            </div>
        </header>
    );
}
