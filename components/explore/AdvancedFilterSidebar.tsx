"use client";

import React, { useState } from 'react';
import { SlidersHorizontal, Music, X, ChevronDown, Check, Zap } from 'lucide-react';

interface FilterState {
    searchQuery: string;
    genre: string;
    bpm: number | null;
    key: string;
    mood: string;
    priceRange: [number, number];
}

interface AdvancedFilterSidebarProps {
    filterState: FilterState;
    setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
    genres: string[];
    totalBeats: number;
    isOpen: boolean;
    onClose: () => void;
}

const MOODS = [
    { label: "Agresivo", emoji: "🔥", color: "text-red-500 bg-red-50 border-red-100" },
    { label: "Chill", emoji: "🌊", color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
    { label: "Oscuro", emoji: "🌑", color: "text-slate-600 bg-slate-100 border-slate-200" },
    { label: "Triste", emoji: "💔", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { label: "Melódico", emoji: "✨", color: "text-pink-600 bg-pink-50 border-pink-100" },
    { label: "Energético", emoji: "⚡", color: "text-amber-600 bg-amber-50 border-amber-100" },
];

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export default function AdvancedFilterSidebar({
    filterState,
    setFilterState,
    genres,
    totalBeats,
    isOpen,
    onClose
}: AdvancedFilterSidebarProps) {

    const updateFilter = (key: keyof FilterState, value: any) => {
        setFilterState(prev => ({ ...prev, [key]: value }));
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose}></div>
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed top-0 left-0 h-full w-[320px] bg-white border-r border-slate-100 shadow-2xl z-50 overflow-y-auto no-scrollbar
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-6rem)] lg:shadow-none lg:border-none lg:bg-transparent lg:w-[280px] lg:block
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="p-6 pb-24 lg:pb-6 space-y-8">

                    {/* Header Mobile */}
                    <div className="flex items-center justify-between lg:hidden mb-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Filtros</h3>
                        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Input (Sidebar version) */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Búsqueda</label>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={filterState.searchQuery}
                            onChange={(e) => updateFilter('searchQuery', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="h-[1px] bg-slate-100"></div>

                    {/* Genres */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Género</label>
                            {filterState.genre !== 'Todos' && (
                                <button onClick={() => updateFilter('genre', 'Todos')} className="text-[9px] font-bold text-red-500 uppercase hover:underline">Limpiar</button>
                            )}
                        </div>
                        <div className="max-h-[200px] overflow-y-auto pr-2 space-y-1 tiny-scrollbar">
                            {genres.map(g => (
                                <button
                                    key={g}
                                    onClick={() => updateFilter('genre', g)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${filterState.genre === g
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    {g}
                                    {filterState.genre === g && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-slate-100"></div>

                    {/* Moods */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vibe / Mood</label>
                            {filterState.mood && (
                                <button onClick={() => updateFilter('mood', '')} className="text-[9px] font-bold text-red-500 uppercase hover:underline">Limpiar</button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {MOODS.map(m => (
                                <button
                                    key={m.label}
                                    onClick={() => updateFilter('mood', filterState.mood === m.label ? '' : m.label)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border flex items-center gap-1.5 transition-all ${filterState.mood === m.label
                                            ? `${m.color} scale-105 shadow-md`
                                            : 'bg-white text-slate-400 border-slate-100 grayscale hover:grayscale-0'
                                        }`}
                                >
                                    <span>{m.emoji}</span> {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-slate-100"></div>

                    {/* BPM */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BPM</label>
                            {filterState.bpm && (
                                <button onClick={() => updateFilter('bpm', null)} className="text-[9px] font-bold text-red-500 uppercase hover:underline">Limpiar</button>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[80, 90, 100, 120, 140, 160].map(bpm => (
                                <button
                                    key={bpm}
                                    onClick={() => updateFilter('bpm', filterState.bpm === bpm ? null : bpm)}
                                    className={`px-2 py-2 rounded-lg text-[10px] font-black border text-center transition-all ${filterState.bpm === bpm
                                            ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'
                                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                        }`}
                                >
                                    {bpm}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Key */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tonalidad</label>
                            {filterState.key && (
                                <button onClick={() => updateFilter('key', '')} className="text-[9px] font-bold text-red-500 uppercase hover:underline">Limpiar</button>
                            )}
                        </div>
                        <select
                            value={filterState.key}
                            onChange={(e) => updateFilter('key', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500 appearance-none"
                        >
                            <option value="">Cualquier Nota</option>
                            {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                </div>
            </aside>
        </>
    );
}
