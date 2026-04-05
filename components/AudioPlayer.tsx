// AudioPlayer.tsx — Reproductor Premium con soporte Modo Claro/Oscuro
"use client";

import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import {
    Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, Music, Crown, X, Heart, Star, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import WaveformPlayer from './WaveformPlayer';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

// Detecta el tema actual del documento
function useIsDarkMode() {
    const [isDark, setIsDark] = useState(true);
    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches);
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    return isDark;
}

export default function AudioPlayer() {
    const {
        currentBeat, isPlaying, togglePlay,
        duration, currentTime, volume, setVolume,
        likedBeatIds, likedKitIds,
        toggleLike: globalToggleLike, closePlayer
    } = usePlayer();
    const { currentUserId } = useCart();
    const isDark = useIsDarkMode();
    const router = useRouter();
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(volume);

    const isSoundKit = currentBeat
        ? ((currentBeat as any).product_type === 'sound_kit' || (currentBeat as any).product_type === 'soundkit')
        : false;

    const isOwner = !!(currentUserId && currentBeat && currentBeat.productor_id === currentUserId);
    const isLiked = currentBeat
        ? (isSoundKit ? likedKitIds.has(currentBeat.id) : likedBeatIds.has(currentBeat.id))
        : false;

    const accentColor = isSoundKit ? '#f97316' : '#3b82f6';
    const accentText = isSoundKit ? 'text-orange-500' : 'text-blue-500';

    // Onda con mucho más contraste — distinguible en ambos modos
    const waveColor = isDark
        ? (isSoundKit ? 'rgba(249,115,22,0.35)' : 'rgba(59,130,246,0.35)')
        : (isSoundKit ? 'rgba(249,115,22,0.25)' : 'rgba(59,130,246,0.25)');
    const progressColor = accentColor;

    // Colores del contenedor adaptados al tema
    const bgPlayer = isDark ? 'rgba(6,6,10,0.95)' : 'rgba(250,252,255,0.97)';
    const borderColor = isDark ? `${accentColor}20` : `${accentColor}30`;
    const boxShadow = isDark
        ? `0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`
        : `0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.9)`;
    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textMuted = isDark ? 'text-white/40' : 'text-slate-500';
    const controlBg = isDark ? 'bg-white/[0.05]' : 'bg-slate-100';
    const controlBorder = isDark ? 'border-white/[0.06]' : 'border-slate-200';

    const toggleLike = () => {
        if (!currentUserId || !currentBeat) return;
        globalToggleLike(currentBeat.id, isSoundKit ? 'sound_kit' : 'beat');
    };

    if (!currentBeat) return null;

    const formatTime = (time: number) => {
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (v > 0) setIsMuted(false);
    };

    const toggleMute = () => {
        if (isMuted) { setVolume(prevVolume); setIsMuted(false); }
        else { setPrevVolume(volume); setVolume(0); setIsMuted(true); }
    };

    const producerName = currentBeat.productor_nombre_artistico
        || currentBeat.productor_nombre_usuario
        || 'Productor';

    const beatLink = isSoundKit ? `/sound-kits/${currentBeat.id}` : `/beats/${currentBeat.id}`;
    const producerLink = `/${currentBeat.productor_nombre_usuario || ''}`;

    return (
        <>
            {/* ═══════════ VERSIÓN MÓVIL ═══════════ */}
            <div className="md:hidden fixed bottom-[68px] left-0 right-0 z-[100] px-3 animate-in slide-in-from-bottom-2 duration-300">
                <div
                    className="relative rounded-[1.75rem] overflow-hidden shadow-2xl border"
                    style={{ background: bgPlayer, borderColor, boxShadow }}
                >
                    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-full"
                        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

                    <div className="px-3.5 py-3 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            {/* Carátula */}
                            <div className="relative shrink-0 w-[46px] h-[46px] rounded-2xl overflow-hidden border shadow-lg"
                                style={{ borderColor: `${accentColor}30` }}>
                                {currentBeat.portada_url ? (
                                    <Image src={currentBeat.portada_url} alt={currentBeat.titulo} fill className="object-cover" sizes="46px" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"
                                        style={{ background: `${accentColor}18` }}>
                                        <Music size={18} style={{ color: accentColor }} />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <span className="text-[7.5px] font-black uppercase tracking-widest mb-0.5 px-1.5 py-0.5 rounded inline-block"
                                    style={{ background: `${accentColor}18`, color: accentColor }}>
                                    {isSoundKit ? 'Sound Kit' : 'Beat'}
                                </span>
                                <Link href={beatLink}
                                    className={`block font-black text-[13px] truncate uppercase tracking-tight leading-none hover:opacity-70 transition-opacity ${textPrimary}`}>
                                    {currentBeat.titulo}
                                </Link>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Link href={producerLink}
                                        className={`text-[10px] font-bold uppercase truncate hover:opacity-80 transition-opacity ${textMuted}`}>
                                        {producerName}
                                    </Link>
                                    {(currentBeat.productor_esta_verificado || (currentBeat as any).is_verified) && (
                                        <img 
                                            src="/verified-badge.png" 
                                            alt="V" 
                                            className={`w-3.5 h-3.5 object-contain shrink-0 ${isDark ? 'brightness-0' : 'brightness-0 invert opacity-80'}`} 
                                        />
                                    )}
                                    {(currentBeat.productor_es_fundador || (currentBeat as any).is_founder) && (
                                        <Crown size={11} className="text-amber-400 shrink-0" fill="currentColor" />
                                    )}
                                    {currentBeat.productor_nivel_suscripcion?.toLowerCase() === 'premium' && !currentBeat.productor_es_fundador && (
                                        <Crown size={11} className="text-blue-500 shrink-0" fill="currentColor" />
                                    )}
                                </div>
                            </div>

                            {/* Controles */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={toggleLike}
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${isLiked ? 'text-red-500' : `${textMuted} hover:text-red-400`}`}>
                                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                </button>
                                <button onClick={togglePlay}
                                    className="w-11 h-11 flex items-center justify-center rounded-2xl text-white shadow-lg transition-all active:scale-90"
                                    style={{ background: accentColor, boxShadow: `0 4px 16px ${accentColor}50` }}>
                                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                                </button>
                                <button onClick={closePlayer}
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl hover:text-red-400 transition-colors active:scale-90 ${textMuted}`}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Waveform + tiempo */}
                        <div className="px-1">
                            <div className="h-7">
                                <WaveformPlayer
                                    url={currentBeat.archivo_mp3_url || ''}
                                    height={28} hideControls isSync beatId={currentBeat.id}
                                    waveColor={waveColor}
                                    progressColor={progressColor}
                                    muted
                                />
                            </div>
                            <div className={`flex items-center justify-between font-mono text-[9px] font-black mt-0.5 ${textMuted}`}>
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ VERSIÓN ESCRITORIO ═══════════ */}
            <div className="hidden md:block fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] w-[97%] max-w-[1400px] animate-in slide-in-from-bottom-6 duration-500">
                <div
                    className="relative rounded-[2rem] overflow-hidden"
                    style={{
                        background: bgPlayer,
                        backdropFilter: 'blur(32px)',
                        border: `1px solid ${borderColor}`,
                        boxShadow
                    }}
                >
                    {/* Línea superior dinámica */}
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }} />

                    <div className="px-6 py-3 flex items-center gap-6">

                        {/* ── 1. TRACK INFO (28%) ── */}
                        <div className="flex items-center gap-4 w-[28%] shrink-0">
                            {/* Carátula */}
                            <div className="relative group/cover shrink-0">
                                <div className="relative w-[52px] h-[52px] rounded-xl overflow-hidden border shadow-xl"
                                    style={{ borderColor: `${accentColor}30`, boxShadow: `0 8px 24px ${accentColor}20` }}>
                                    {currentBeat.portada_url ? (
                                        <Image src={currentBeat.portada_url} alt={currentBeat.titulo}
                                            fill className="object-cover transition-transform duration-500 group-hover/cover:scale-110" sizes="80px" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"
                                            style={{ background: `${accentColor}15` }}>
                                            <Music size={22} style={{ color: accentColor }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Datos del track */}
                            <div className="min-w-0 flex flex-col gap-0.5">
                                {/* Etiqueta tipo */}
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded w-fit"
                                    style={{ background: `${accentColor}15`, color: accentColor }}>
                                    {isSoundKit ? 'Sound Kit' : 'Beat'}
                                </span>
                                {/* Nombre del beat → su página */}
                                <Link href={beatLink}
                                    className={`font-black text-[13px] truncate uppercase tracking-tight leading-tight transition-opacity hover:opacity-60 ${textPrimary}`}>
                                    {currentBeat.titulo}
                                </Link>
                                {/* Nombre del productor → perfil */}
                                <div className="flex items-center gap-1.5">
                                    <Link href={producerLink}
                                        className={`text-[10px] font-bold truncate transition-colors hover:underline underline-offset-2 uppercase tracking-widest ${textMuted} hover:${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                                        {producerName}
                                    </Link>
                                    {(currentBeat.productor_esta_verificado || (currentBeat as any).is_verified) && (
                                        <img 
                                            src="/verified-badge.png" 
                                            alt="V" 
                                            className={`w-4 h-4 object-contain shrink-0 ${isDark ? 'brightness-0' : 'brightness-0 invert opacity-80'}`} 
                                        />
                                    )}
                                    {(currentBeat.productor_es_fundador || (currentBeat as any).is_founder) && (
                                        <Crown size={12} className="text-amber-400 shrink-0" fill="currentColor" />
                                    )}
                                    {currentBeat.productor_nivel_suscripcion?.toLowerCase() === 'premium' && !currentBeat.productor_es_fundador && (
                                        <Crown size={12} className="text-blue-500 shrink-0" fill="currentColor" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── 2. WAVEFORM + CONTROLES (flex-1) ── */}
                        <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
                            {/* Waveform con color fuerte */}
                            <div className="w-full h-12 relative">
                                <WaveformPlayer
                                    url={currentBeat.archivo_mp3_url || ''}
                                    height={48}
                                    hideControls isSync beatId={currentBeat.id}
                                    waveColor={waveColor}
                                    progressColor={progressColor}
                                    muted
                                />
                            </div>

                            <div className="flex items-center justify-between px-1">
                                {/* Play + tiempo */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={togglePlay}
                                        className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95"
                                        style={{ background: accentColor, boxShadow: `0 6px 20px ${accentColor}45` }}>
                                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                                    </button>
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-black">
                                        <span className={textPrimary}>{formatTime(currentTime)}</span>
                                        <span className={textMuted}>/</span>
                                        <span className={textMuted}>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Like + Skip */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleLike}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 border ${isLiked
                                            ? 'text-red-500 bg-red-500/10 border-red-500/20'
                                            : `${textMuted} hover:text-red-400 ${controlBg} ${controlBorder} hover:border-red-500/20`}`}>
                                        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                    </button>
                                    <button className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${controlBg} border ${controlBorder} ${accentText} opacity-60 hover:opacity-100`}>
                                        <SkipBack size={16} fill="currentColor" />
                                    </button>
                                    <button className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${controlBg} border ${controlBorder} ${accentText} opacity-60 hover:opacity-100`}>
                                        <SkipForward size={16} fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── 3. VOLUMEN Y ACCIONES (24%) ── */}
                        <div className="flex items-center gap-4 w-[24%] shrink-0 justify-end">
                            {/* Volumen */}
                            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${controlBg} ${controlBorder}`}>
                                <button onClick={toggleMute} className={`transition-colors shrink-0 ${isMuted || volume === 0 ? textMuted : accentText}`}>
                                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <div className="w-20 relative flex items-center h-5">
                                    <input
                                        type="range" min="0" max="1" step="0.01" value={volume}
                                        onChange={handleVolumeChange}
                                        className="w-full cursor-pointer h-[3px] rounded-full appearance-none"
                                        style={{
                                            accentColor,
                                            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Botón Ver Licencias */}
                            {!isOwner && (
                                <button
                                    onClick={() => router.push(beatLink)}
                                    className="px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-md"
                                    style={{ color: accentColor, borderColor: `${accentColor}30`, background: `${accentColor}10` }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = accentColor;
                                        (e.currentTarget as HTMLElement).style.color = 'white';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = `${accentColor}10`;
                                        (e.currentTarget as HTMLElement).style.color = accentColor;
                                    }}
                                >
                                    Ver Licencias
                                </button>
                            )}

                            {/* Cerrar */}
                            <button
                                onClick={closePlayer}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-90 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 ${controlBg} ${controlBorder} ${textMuted}`}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}
