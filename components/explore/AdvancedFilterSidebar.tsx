"use client";

import React, { useState } from 'react';
import { SlidersHorizontal, Music, X, ChevronDown, Check, Zap } from 'lucide-react';
import { MOODS, SUBGENRES } from '@/lib/constants';

interface FilterState {
    searchQuery: string;
    genre: string;
    subgenre: string;
    bpmMin: number | string;
    bpmMax: number | string;
    key: string;
    scale: string;
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
                        </div>
                        <select
                            value={filterState.genre}
                            onChange={(e) => {
                                updateFilter('genre', e.target.value);
                                updateFilter('subgenre', '');
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            {genres.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subgenres (Conditional) */}
                    {filterState.genre !== 'Todos' && SUBGENRES[filterState.genre] && (
                        <div className="space-y-3 animate-fade-in">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subgénero</label>
                            <select
                                value={filterState.subgenre}
                                onChange={(e) => updateFilter('subgenre', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Todos los subgéneros</option>
                                {SUBGENRES[filterState.genre].map(sg => (
                                    <option key={sg} value={sg}>{sg}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="h-[1px] bg-slate-100"></div>

                    {/* Moods */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vibe / Mood</label>
                        <select
                            value={filterState.mood}
                            onChange={(e) => updateFilter('mood', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Cualquier Vibe</option>
                            {MOODS.map(m => (
                                <option key={m.label} value={m.label}>{m.emoji} {m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-[1px] bg-slate-100"></div>

                    {/* BPM (Rango) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BPM (Rango)</label>
                            {(filterState.bpmMin || filterState.bpmMax) && (
                                <button onClick={() => { updateFilter('bpmMin', ''); updateFilter('bpmMax', ''); }} className="text-[9px] font-bold text-red-500 uppercase hover:underline">Limpiar</button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filterState.bpmMin || ''}
                                onChange={(e) => updateFilter('bpmMin', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                            />
                            <span className="text-slate-300">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filterState.bpmMax || ''}
                                onChange={(e) => updateFilter('bpmMax', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>


                    {/* Key & Scale */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tonalidad & Escala</label>
                            {(filterState.key || filterState.scale) && (
                                <button onClick={() => { updateFilter('key', ''); updateFilter('scale', ''); }} className="text-[9px] font-bold text-red-500 uppercase hover:underline">Limpiar</button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={filterState.key}
                                onChange={(e) => updateFilter('key', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="">Nota</option>
                                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <select
                                value={filterState.scale}
                                onChange={(e) => updateFilter('scale', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-500 appearance-none"
                            >
                                <option value="">Escala</option>
                                <option value="Major">Mayor</option>
                                <option value="Minor">Menor</option>
                            </select>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
