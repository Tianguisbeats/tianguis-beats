"use client";

import React, { useState } from 'react';
import { SlidersHorizontal, Music, X, ChevronDown, Check, Zap } from 'lucide-react';
import { MOODS, SUBGENRES, MUSICAL_KEYS } from '@/lib/constants';

interface FilterState {
    searchQuery: string;
    genre: string;
    subgenre: string;
    bpmMin: number | string;
    bpmMax: number | string;
    tonoEscala: string;
    vibe: string;
    mood: string;
    refArtist: string;
    beatType: string;
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
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={onClose}></div>
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed top-0 left-0 h-full w-[320px] bg-card border-r border-border shadow-2xl z-50 overflow-y-auto no-scrollbar
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-6rem)] lg:shadow-none lg:border-none lg:bg-transparent lg:w-[280px] lg:block
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="p-6 pb-24 lg:pb-6 space-y-8">

                    {/* Header Mobile */}
                    <div className="flex items-center justify-between lg:hidden mb-6">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight font-heading">Filtros</h3>
                        <button onClick={onClose} className="p-3 bg-accent-soft rounded-full text-muted min-h-[48px] min-w-[48px] flex items-center justify-center">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Búsqueda</label>
                            {filterState.searchQuery && (
                                <button onClick={() => updateFilter('searchQuery', '')} className="text-[9px] font-bold text-red-500 uppercase hover:underline min-h-[48px] px-2 flex items-center">Limpiar</button>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar título..."
                            value={filterState.searchQuery}
                            onChange={(e) => updateFilter('searchQuery', e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-4 text-sm font-bold outline-none focus:border-accent transition-all text-foreground min-h-[56px]"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest text-accent">Beat Type (Artistas Ref.)</label>
                            {filterState.refArtist && (
                                <button onClick={() => updateFilter('refArtist', '')} className="text-[9px] font-bold text-error uppercase hover:underline min-h-[48px] px-2 flex items-center">Limpiar</button>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Ej: Bad Bunny, Mora..."
                            value={filterState.refArtist}
                            onChange={(e) => updateFilter('refArtist', e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-4 text-sm font-bold outline-none focus:border-accent transition-all text-foreground min-h-[56px]"
                        />
                    </div>

                    <div className="h-[1px] bg-border"></div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Género</label>
                            {filterState.genre !== 'Todos' && (
                                <button onClick={() => { updateFilter('genre', 'Todos'); updateFilter('subgenre', ''); }} className="text-[9px] font-bold text-error uppercase hover:underline min-h-[48px] px-2 flex items-center">Limpiar</button>
                            )}
                        </div>
                        <select
                            value={filterState.genre}
                            onChange={(e) => {
                                updateFilter('genre', e.target.value);
                                updateFilter('subgenre', '');
                            }}
                            className="w-full bg-background border border-border rounded-xl px-4 py-4 text-sm font-bold outline-none focus:border-accent transition-all appearance-none cursor-pointer text-foreground min-h-[56px]"
                        >
                            {genres.map(g => (
                                <option key={g} value={g} className="bg-card text-foreground">{g}</option>
                            ))}
                        </select>
                    </div>

                    {filterState.genre !== 'Todos' && SUBGENRES[filterState.genre] && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Subgénero</label>
                                {filterState.subgenre && (
                                    <button onClick={() => updateFilter('subgenre', '')} className="text-[9px] font-bold text-error uppercase hover:underline min-h-[48px] px-2 flex items-center">Limpiar</button>
                                )}
                            </div>
                            <select
                                value={filterState.subgenre}
                                onChange={(e) => updateFilter('subgenre', e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-4 py-4 text-sm font-bold outline-none focus:border-accent transition-all appearance-none cursor-pointer text-foreground min-h-[56px]"
                            >
                                <option value="" className="bg-card text-foreground">Todos los subgéneros</option>
                                {SUBGENRES[filterState.genre].map(sg => (
                                    <option key={sg} value={sg} className="bg-card text-foreground">{sg}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="h-[1px] bg-border"></div>

                    {/* Vibe / Sentiment Filter */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Sentimiento / Vibe</label>
                            {filterState.vibe && (
                                <button onClick={() => updateFilter('vibe', '')} className="text-[9px] font-bold text-red-500 uppercase hover:underline min-h-[48px] px-2 flex items-center">Limpiar</button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'happy', label: 'Alegre', emoji: '😊' },
                                { id: 'sad', label: 'Triste', emoji: '💔' },
                                { id: 'dark', label: 'Oscuro', emoji: '🌑' },
                                { id: 'aggressive', label: 'Pesado', emoji: '🔥' }
                            ].map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => updateFilter('vibe', filterState.vibe === v.id ? '' : v.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${filterState.vibe === v.id
                                        ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                                        : 'bg-background border-border text-muted hover:border-accent/30 hover:text-foreground'
                                        }`}
                                >
                                    <span className="text-xl mb-1">{v.emoji}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{v.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[1px] bg-border"></div>

                    {/* Moods (Legacy Tags) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest text-[8px]">Mood Tags (Manual)</label>
                            {filterState.mood && (
                                <button onClick={() => updateFilter('mood', '')} className="text-[9px] font-bold text-red-500 uppercase hover:underline min-h-[48px] px-2 flex items-center">Limpiar</button>
                            )}
                        </div>
                        <select
                            value={filterState.mood}
                            onChange={(e) => updateFilter('mood', e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-4 text-sm font-bold outline-none focus:border-accent transition-all appearance-none cursor-pointer text-foreground min-h-[56px]"
                        >
                            <option value="" className="bg-card text-foreground">Cualquier Mood</option>
                            {MOODS.map(m => (
                                <option key={m.label} value={m.label} className="bg-card text-foreground">{m.emoji} {m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-[1px] bg-border"></div>

                    {/* BPM (Rango) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">BPM (Rango)</label>
                            {(filterState.bpmMin || filterState.bpmMax) && (
                                <button onClick={() => { updateFilter('bpmMin', ''); updateFilter('bpmMax', ''); }} className="text-[9px] font-bold text-error uppercase hover:underline min-h-[48px] px-2 flex items-center">Limpiar</button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filterState.bpmMin || ''}
                                onChange={(e) => updateFilter('bpmMin', e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent text-foreground min-h-[48px]"
                            />
                            <span className="text-muted">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filterState.bpmMax || ''}
                                onChange={(e) => updateFilter('bpmMax', e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent text-foreground min-h-[48px]"
                            />
                        </div>
                    </div>


                    {/* Key & Scale (Unified) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Tonalidad & Escala</label>
                            {filterState.tonoEscala && (
                                <button onClick={() => updateFilter('tonoEscala', '')} className="text-[9px] font-bold text-error uppercase hover:underline min-h-[40px] px-2 flex items-center">Limpiar</button>
                            )}
                        </div>
                        <select
                            value={filterState.tonoEscala || ''}
                            onChange={(e) => {
                                updateFilter('tonoEscala', e.target.value);
                            }}
                            className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent appearance-none min-h-[48px]"
                        >
                            <option value="" className="bg-card">Cualquier Tonalidad</option>
                            <optgroup label="NOTAS NATURALES" className="bg-card text-accent font-black">
                                {MUSICAL_KEYS.filter(k => k.group === 'natural').map(k => (
                                    <option key={k.value} value={k.value} className="bg-card text-foreground">{k.label}</option>
                                ))}
                            </optgroup>
                            <optgroup label="SOLO PARA PROS (ALTERADAS)" className="bg-card text-accent font-black">
                                {MUSICAL_KEYS.filter(k => k.group === 'accidental').map(k => (
                                    <option key={k.value} value={k.value} className="bg-card text-foreground">{k.label}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                </div>
            </aside>
        </>
    );
}
