"use client";

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Music,
    Crown,
    X,
    ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import LicenseSelectionModal from './LicenseSelectionModal';
import { useCart } from '@/context/CartContext';

export default function AudioPlayer() {
    const {
        currentBeat,
        isPlaying,
        togglePlay,
        duration,
        currentTime,
        seek,
        volume,
        setVolume,
        closePlayer
    } = usePlayer();
    const { currentUserId } = useCart();
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(volume);
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

    const isOwner = currentUserId && currentBeat && currentBeat.producer_id === currentUserId;

    if (!currentBeat) return null;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(parseFloat(e.target.value));
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (v > 0) setIsMuted(false);
    };

    const toggleMute = () => {
        if (isMuted) {
            setVolume(prevVolume);
            setIsMuted(false);
        } else {
            setPrevVolume(volume);
            setVolume(0);
            setIsMuted(true);
        }
    };

    return (
        <>
            {/* ====== VERSIÓN MÓVIL (MINI-PLAYER) ====== */}
            <div className="md:hidden fixed bottom-[72px] left-0 right-0 z-[100] px-2 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden relative">
                    {/* Barra de Progreso Superior */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-800">
                        <div
                            className="absolute top-0 left-0 h-full bg-accent transition-all duration-100"
                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                    </div>

                    <div className="p-2 flex items-center justify-between gap-3">
                        {/* Artwork & Info (Clic para abrir modal = Futuro) */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative">
                                {currentBeat.portadabeat_url ? (
                                    <img src={currentBeat.portadabeat_url} alt={currentBeat.title} className="w-full h-full object-cover" />
                                ) : (
                                    <Music size={18} className="text-muted" />
                                )}
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <span className="font-heading font-black text-sm text-foreground truncate uppercase">{currentBeat.title}</span>
                                <div className="flex items-center gap-1 min-w-0">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest truncate">
                                        {currentBeat.producer_artistic_name || (typeof currentBeat.producer === 'object' ? currentBeat.producer?.artistic_name : currentBeat.producer) || 'Productor'}
                                    </span>
                                    {(currentBeat.producer_is_verified || currentBeat.is_verified || (typeof currentBeat.producer === 'object' && currentBeat.producer?.is_verified)) && (
                                        <img src="/verified-badge.png" className="w-2.5 h-2.5 object-contain" alt="V" />
                                    )}
                                    {(currentBeat.producer_is_founder || currentBeat.is_founder || (typeof currentBeat.producer === 'object' && currentBeat.producer?.is_founder)) && (
                                        <Crown size={10} className="text-amber-500" fill="currentColor" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Controles Básicos */}
                        <div className="flex items-center justify-end gap-1 pr-1 shrink-0">
                            {/* Opcional: Ver Licencias Móvil */}
                            {!isOwner && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsLicenseModalOpen(true); }}
                                    className="w-10 h-10 flex items-center justify-center text-muted hover:text-accent transition-colors"
                                >
                                    <ShoppingCart size={18} />
                                </button>
                            )}

                            {/* Play / Pause */}
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                className="w-10 h-10 flex items-center justify-center text-foreground hover:scale-110 transition-transform active:scale-90"
                            >
                                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                            </button>

                            {/* Cerrar Productor */}
                            <button
                                onClick={(e) => { e.stopPropagation(); closePlayer(); }}
                                className="w-10 h-10 flex items-center justify-center text-muted hover:text-red-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====== VERSIÓN ESCRITORIO (FULL-PLAYER) ====== */}
            <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl animate-in slide-in-from-bottom-8 duration-700">
                {/* Contenedor principal estilo cristal */}
                <div className="relative bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] overflow-hidden">

                    {/* Efecto de brillo de progreso (Sólo en modo oscuro) */}
                    <div className="absolute top-0 left-0 h-[2px] bg-accent shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-300 z-50 rounded-full"
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />

                    <div className="px-6 py-4 flex items-center gap-8">

                        {/* 1. Sección de información de la pista */}
                        <div className="flex items-center gap-4 w-[30%] shrink-0">
                            <div className="relative group/artwork">
                                <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-2xl blur opacity-20 group-hover/artwork:opacity-40 transition-opacity" />
                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl overflow-hidden shrink-0 border border-white/10 relative z-10 transition-transform group-hover/artwork:scale-105">
                                    {currentBeat.portadabeat_url ? (
                                        <img src={currentBeat.portadabeat_url} alt={currentBeat.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full p-2 flex items-center justify-center bg-accent/20">
                                            <Music size={24} className="text-accent" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0 flex-1">
                                <Link href={`/beats/${currentBeat.id}`} className="block group">
                                    <h4 className="font-heading font-black text-base text-slate-900 dark:text-white truncate uppercase tracking-tight group-hover:text-accent transition-colors">
                                        {currentBeat.title}
                                    </h4>
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Link
                                        href={`/${currentBeat.producer_username || (typeof currentBeat.producer === 'object' ? currentBeat.producer?.username : currentBeat.producer)}`}
                                        className="flex items-center gap-1.5 truncate group"
                                    >
                                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] group-hover:text-accent transition-colors">
                                            {currentBeat.producer_artistic_name || (typeof currentBeat.producer === 'object' ? currentBeat.producer?.artistic_name : currentBeat.producer) || 'Productor'}
                                        </span>
                                        {(currentBeat.producer_is_verified || currentBeat.is_verified || (typeof currentBeat.producer === 'object' && currentBeat.producer?.is_verified)) && (
                                            <img src="/verified-badge.png" className="w-4 h-4 object-contain" alt="V" />
                                        )}
                                        {(currentBeat.producer_is_founder || currentBeat.is_founder || (typeof currentBeat.producer === 'object' && currentBeat.producer?.is_founder)) && (
                                            <Crown size={14} className="text-amber-500" fill="currentColor" />
                                        )}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* 2. Sección de controles y barra de progreso */}
                        <div className="flex flex-col items-center gap-2 flex-1 w-full">
                            <div className="flex items-center gap-8">
                                <button className="text-muted hover:text-accent hover:scale-110 transition-all active:scale-95">
                                    <SkipBack size={22} fill="currentColor" />
                                </button>

                                <button
                                    onClick={togglePlay}
                                    className="w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-xl shadow-accent/30 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                </button>

                                <button className="text-muted hover:text-accent hover:scale-110 transition-all active:scale-95">
                                    <SkipForward size={22} fill="currentColor" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 w-full px-2">
                                <span className="text-[10px] font-black text-muted w-10 text-right font-mono tabular-nums">{formatTime(currentTime)}</span>
                                <div className="relative flex-1 group py-3">
                                    {/* Fondo de la barra de progreso */}
                                    <div className="absolute inset-y-0 my-auto h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    {/* Progreso activo */}
                                    <div
                                        className="absolute inset-y-0 my-auto h-1.5 bg-accent rounded-full z-10"
                                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-slate-100 rounded-full shadow-lg border-2 border-accent scale-0 group-hover:scale-100 transition-transform" />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        step="0.1"
                                        value={currentTime}
                                        onChange={handleProgressChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    />
                                </div>
                                <span className="text-[10px] font-black text-muted w-10 font-mono tabular-nums">{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* 3. Sección de volumen y compras */}
                        <div className="flex items-center justify-end gap-6 w-[30%] shrink-0">
                            {/* Control de volumen - Ahora más profesional */}
                            <div className="flex items-center gap-3 group/vol">
                                <button onClick={toggleMute} className="text-muted hover:text-accent transition-colors">
                                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                                <div className="w-24 relative flex items-center h-8">
                                    <div className="absolute h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    <div className="absolute h-1 bg-accent rounded-full" style={{ width: `${volume * 100}%` }} />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                            </div>

                            {/* Llamadas a la acción (CTAs) */}
                            <div className="flex items-center gap-2">
                                {!isOwner && (
                                    <button
                                        onClick={() => setIsLicenseModalOpen(true)}
                                        className="bg-accent text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black dark:hover:bg-white dark:hover:text-black transition-all shadow-lg shadow-accent/20 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        Ver Licencias
                                    </button>
                                )}

                                <button
                                    onClick={closePlayer}
                                    className="w-11 h-11 flex items-center justify-center rounded-2xl bg-card border border-border text-muted hover:text-red-500 hover:border-red-500/20 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90"
                                    title="Cerrar"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <LicenseSelectionModal
                beat={currentBeat}
                isOpen={isLicenseModalOpen}
                onClose={() => setIsLicenseModalOpen(false)}
            />
        </>
    );
}

