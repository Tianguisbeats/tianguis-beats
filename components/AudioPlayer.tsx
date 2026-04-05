// AudioPlayer.tsx — Reproductor Premium con soporte Modo Claro/Oscuro
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import {
    Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, Music, Crown, X, Heart,
    Share2, Repeat, Repeat1, Shuffle, List
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import WaveformPlayer from './WaveformPlayer';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

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
        duration, currentTime, volume, setVolume, seek,
        likedBeatIds, likedKitIds,
        toggleLike: globalToggleLike, closePlayer,
        playNext, playPrevious, playlist, playlistIndex, setPlaylistAndPlay,
        loopMode, isShuffle, toggleLoopMode, toggleShuffle,
    } = usePlayer();
    const { currentUserId } = useCart();
    const isDark = useIsDarkMode();
    const router = useRouter();
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(volume);
    const [showUpNext, setShowUpNext] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const upNextRef = useRef<HTMLDivElement>(null);

    const isSoundKit = currentBeat
        ? ((currentBeat as any).product_type === 'sound_kit' || (currentBeat as any).product_type === 'soundkit')
        : false;

    const isOwner = !!(currentUserId && currentBeat && currentBeat.productor_id === currentUserId);
    const isLiked = currentBeat
        ? (isSoundKit ? likedKitIds.has(currentBeat.id) : likedBeatIds.has(currentBeat.id))
        : false;

    const accentColor = isSoundKit ? '#f97316' : '#3b82f6';
    const accentText = isSoundKit ? 'text-orange-500' : 'text-blue-500';

    const waveColor = isDark
        ? (isSoundKit ? 'rgba(249,115,22,0.3)' : 'rgba(59,130,246,0.3)')
        : (isSoundKit ? 'rgba(249,115,22,0.15)' : 'rgba(59,130,246,0.15)');
    const progressColor = accentColor;

    const playerBgClass = "bg-white/95 dark:bg-[#06060a]/95 backdrop-blur-2xl";
    const playerBorderClass = "border-slate-200 dark:border-white/10";
    const textPrimaryClass = "text-slate-900 dark:text-white";
    const textMutedClass = "text-slate-500 dark:text-white/40";
    const controlBgClass = "bg-slate-100 dark:bg-white/[0.05]";
    const controlBorderClass = "border-slate-200 dark:border-white/10";

    // Atajos de teclado
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
            if (!currentBeat) return;
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    seek(Math.max(0, currentTime - 10));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    seek(Math.min(duration, currentTime + 10));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolume(Math.min(1, volume + 0.1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolume(Math.max(0, volume - 0.1));
                    break;
                case 'KeyM':
                    if (isMuted) { setVolume(prevVolume); setIsMuted(false); }
                    else { setPrevVolume(volume); setVolume(0); setIsMuted(true); }
                    break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentBeat, currentTime, duration, volume, isMuted, prevVolume]);

    // Cerrar Up Next al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (upNextRef.current && !upNextRef.current.contains(e.target as Node)) {
                setShowUpNext(false);
            }
        };
        if (showUpNext) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUpNext]);

    const toggleLike = () => {
        if (!currentUserId || !currentBeat) return;
        globalToggleLike(currentBeat.id, isSoundKit ? 'sound_kit' : 'beat');
    };

    const handleShare = async () => {
        if (!currentBeat) return;
        const url = `${window.location.origin}${isSoundKit ? `/sound-kits/${currentBeat.id}` : `/beats/${currentBeat.id}`}`;
        try {
            await navigator.clipboard.writeText(url);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        } catch {
            // Fallback para navegadores sin clipboard API
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        }
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

    // Tracks siguientes para el panel Up Next
    const upNextTracks = playlist.slice(playlistIndex + 1, playlistIndex + 5);

    // Background del slider de volumen con fill visible en ambos modos
    const volumeTrackBg = `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${volume * 100}%, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} ${volume * 100}%, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} 100%)`;

    // Ícono y color del loop según el modo
    const LoopIcon = loopMode === 'one' ? Repeat1 : Repeat;
    const loopActive = loopMode !== 'none';

    return (
        <>
            {/* ═══════════ VERSIÓN MÓVIL ═══════════ */}
            <div className="md:hidden fixed bottom-[68px] left-0 right-0 z-[100] px-3 animate-in slide-in-from-bottom-2 duration-300">
                <div
                    className={`relative rounded-[1.75rem] overflow-visible shadow-2xl border ${playerBgClass} ${playerBorderClass}`}
                    style={{
                        boxShadow: isDark
                            ? `0 24px 80px rgba(0,0,0,0.6)`
                            : `0 8px 40px rgba(0,0,0,0.12)`
                    }}
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
                                    className={`block font-black text-[13px] truncate uppercase tracking-tight leading-none hover:opacity-70 transition-opacity ${textPrimaryClass}`}>
                                    {currentBeat.titulo}
                                </Link>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Link href={producerLink}
                                        className={`text-[10px] font-bold uppercase truncate hover:opacity-80 transition-opacity ${accentText}`}>
                                        {producerName}
                                    </Link>
                                    {(currentBeat.productor_esta_verificado || (currentBeat as any).is_verified) && (
                                        <img src="/verified-badge.png" alt="V"
                                            className={`w-3.5 h-3.5 object-contain shrink-0 ${isDark ? 'brightness-0 invert' : ''}`} />
                                    )}
                                    {(currentBeat.productor_es_fundador || (currentBeat as any).is_founder) && (
                                        <Crown size={11} className="text-amber-400 shrink-0" fill="currentColor" />
                                    )}
                                    {currentBeat.productor_nivel_suscripcion?.toLowerCase() === 'premium' && !currentBeat.productor_es_fundador && (
                                        <Crown size={11} className="text-blue-500 shrink-0" fill="currentColor" />
                                    )}
                                </div>
                            </div>

                            {/* Controles principales */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={toggleLike}
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${isLiked ? 'text-red-500' : `${textMutedClass} hover:text-red-400`}`}>
                                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                </button>
                                <button onClick={togglePlay}
                                    className="w-11 h-11 flex items-center justify-center rounded-2xl text-white shadow-lg transition-all active:scale-90"
                                    style={{ background: accentColor, boxShadow: `0 4px 16px ${accentColor}50` }}>
                                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                                </button>
                                <button onClick={closePlayer}
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl hover:text-red-400 transition-colors active:scale-90 ${textMutedClass}`}>
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
                                    waveColor={waveColor} progressColor={progressColor} muted
                                />
                            </div>
                            <div className={`flex items-center justify-between font-mono text-[9px] font-black mt-0.5 ${textMutedClass}`}>
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Fila extra: Shuffle / Loop / Compartir */}
                        <div className={`flex items-center justify-between px-1 pt-0.5 border-t ${playerBorderClass}`}>
                            <div className="flex items-center gap-1">
                                <button onClick={toggleShuffle}
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90 ${isShuffle ? accentText : textMutedClass}`}>
                                    <Shuffle size={14} />
                                </button>
                                <button onClick={toggleLoopMode}
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90 relative ${loopActive ? accentText : textMutedClass}`}>
                                    <LoopIcon size={14} />
                                    {loopMode === 'one' && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full text-[7px] font-black flex items-center justify-center text-white"
                                            style={{ background: accentColor }}>1</span>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={playPrevious} disabled={playlist.length === 0}
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${accentText} opacity-60 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed`}>
                                    <SkipBack size={14} fill="currentColor" />
                                </button>
                                <button onClick={playNext} disabled={playlist.length === 0}
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${accentText} opacity-60 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed`}>
                                    <SkipForward size={14} fill="currentColor" />
                                </button>
                            </div>

                            <button onClick={handleShare}
                                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90 ${shareCopied ? 'text-green-500' : textMutedClass}`}>
                                <Share2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ VERSIÓN ESCRITORIO ═══════════ */}
            <div className="hidden md:block fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] w-[97%] max-w-[1400px] animate-in slide-in-from-bottom-6 duration-500">
                <div
                    className={`relative rounded-[2rem] overflow-visible border ${playerBgClass} ${playerBorderClass}`}
                    style={{
                        boxShadow: isDark
                            ? `0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`
                            : `0 8px 40px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9)`
                    }}
                >
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }} />

                    <div className="px-6 py-3 flex items-center gap-6">

                        {/* ── 1. TRACK INFO (28%) ── */}
                        <div className="flex items-center gap-4 w-[28%] shrink-0">
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

                            <div className="min-w-0 flex flex-col gap-0.5">
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded w-fit"
                                    style={{ background: `${accentColor}15`, color: accentColor }}>
                                    {isSoundKit ? 'Sound Kit' : 'Beat'}
                                </span>
                                <Link href={beatLink}
                                    className={`font-black text-[13px] truncate uppercase tracking-tight leading-tight transition-opacity hover:opacity-60 ${textPrimaryClass}`}>
                                    {currentBeat.titulo}
                                </Link>
                                <div className="flex items-center gap-1.5">
                                    <Link href={producerLink}
                                        className={`text-[10px] font-bold truncate transition-colors hover:underline underline-offset-2 uppercase tracking-widest ${accentText} hover:${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                                        {producerName}
                                    </Link>
                                    {(currentBeat.productor_esta_verificado || (currentBeat as any).is_verified) && (
                                        <img src="/verified-badge.png" alt="V"
                                            className={`w-4 h-4 object-contain shrink-0 ${isDark ? 'brightness-0 invert' : ''}`} />
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
                            <div className="w-full h-12 relative">
                                <WaveformPlayer
                                    url={currentBeat.archivo_mp3_url || ''}
                                    height={48} hideControls isSync beatId={currentBeat.id}
                                    waveColor={waveColor} progressColor={progressColor} muted
                                />
                            </div>

                            <div className="flex items-center justify-between px-1">
                                {/* Play + tiempo */}
                                <div className="flex items-center gap-3">
                                    <button onClick={togglePlay}
                                        className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95"
                                        style={{ background: accentColor, boxShadow: `0 6px 20px ${accentColor}45` }}>
                                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                                    </button>
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-black">
                                        <span className={textPrimaryClass}>{formatTime(currentTime)}</span>
                                        <span className={textMutedClass}>/</span>
                                        <span className={textMutedClass}>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Like + controles de navegación + shuffle/loop */}
                                <div className="flex items-center gap-2">
                                    <button onClick={toggleLike}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 border ${isLiked
                                            ? 'text-red-500 bg-red-500/10 border-red-500/20'
                                            : `${textMutedClass} hover:text-red-400 ${controlBgClass} ${controlBorderClass} hover:border-red-500/20`}`}>
                                        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                    </button>

                                    <button onClick={playPrevious} disabled={playlist.length === 0}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${controlBgClass} border ${controlBorderClass} ${accentText} opacity-60 hover:opacity-100 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed`}>
                                        <SkipBack size={16} fill="currentColor" />
                                    </button>

                                    {/* SkipForward con panel Up Next */}
                                    <div className="relative" ref={upNextRef}>
                                        <button
                                            onClick={playNext}
                                            onMouseEnter={() => setShowUpNext(true)}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${controlBgClass} border ${controlBorderClass} ${accentText} opacity-60 hover:opacity-100 cursor-pointer`}>
                                            <SkipForward size={16} fill="currentColor" />
                                        </button>

                                        {/* Panel Up Next */}
                                        {showUpNext && (
                                            <div
                                                className={`absolute bottom-full right-0 mb-2 w-64 rounded-2xl border shadow-2xl overflow-hidden z-20 ${playerBgClass} ${playerBorderClass}`}
                                                style={{ boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.7)' : '0 8px 32px rgba(0,0,0,0.12)' }}
                                            >
                                                <div className={`flex items-center gap-2 px-3 py-2 border-b ${playerBorderClass}`}>
                                                    <List size={11} className={textMutedClass} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${textMutedClass}`}>
                                                        {upNextTracks.length > 0 ? 'Siguiente en la cola' : 'Sin cola activa'}
                                                    </span>
                                                </div>

                                                {upNextTracks.length > 0 ? (
                                                    <div className="py-1">
                                                        {upNextTracks.map((track, i) => (
                                                            <button
                                                                key={track.id}
                                                                onClick={() => { setPlaylistAndPlay(playlist, playlistIndex + 1 + i); setShowUpNext(false); }}
                                                                className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left hover:${isDark ? 'bg-white/5' : 'bg-black/5'}`}
                                                            >
                                                                <span className={`text-[9px] font-black w-3 shrink-0 ${textMutedClass}`}>
                                                                    {playlistIndex + 2 + i}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`text-[10px] font-black truncate uppercase ${textPrimaryClass}`}>{track.titulo}</div>
                                                                    <div className={`text-[9px] truncate ${textMutedClass}`}>
                                                                        {track.productor_nombre_artistico || track.productor_nombre_usuario}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className={`px-3 py-4 text-center text-[9px] ${textMutedClass}`}>
                                                        Al terminar se buscarán más beats del productor
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Shuffle */}
                                    <button onClick={toggleShuffle}
                                        title="Aleatorio"
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 border ${isShuffle
                                            ? `${accentText} border-current/20`
                                            : `${textMutedClass} ${controlBgClass} ${controlBorderClass}`}`}
                                        style={isShuffle ? { background: `${accentColor}15`, borderColor: `${accentColor}30` } : {}}>
                                        <Shuffle size={14} />
                                    </button>

                                    {/* Loop */}
                                    <button onClick={toggleLoopMode}
                                        title={loopMode === 'none' ? 'Sin repetición' : loopMode === 'all' ? 'Repetir todo' : 'Repetir una'}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 border relative ${loopActive
                                            ? `${accentText}`
                                            : `${textMutedClass} ${controlBgClass} ${controlBorderClass}`}`}
                                        style={loopActive ? { background: `${accentColor}15`, borderColor: `${accentColor}30` } : {}}>
                                        <LoopIcon size={14} />
                                        {loopMode === 'one' && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[7px] font-black flex items-center justify-center text-white"
                                                style={{ background: accentColor }}>1</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── 3. VOLUMEN Y ACCIONES (24%) ── */}
                        <div className="flex items-center gap-3 w-[24%] shrink-0 justify-end">
                            {/* Volumen */}
                            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${controlBgClass} ${controlBorderClass}`}>
                                <button onClick={toggleMute} className={`transition-colors shrink-0 ${isMuted || volume === 0 ? textMutedClass : accentText}`}>
                                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <div className="w-20 relative flex items-center h-5">
                                    <input
                                        type="range" min="0" max="1" step="0.01" value={volume}
                                        onChange={handleVolumeChange}
                                        className="w-full cursor-pointer h-[3px] rounded-full appearance-none"
                                        style={{ accentColor, background: volumeTrackBg }}
                                    />
                                </div>
                            </div>

                            {/* Compartir */}
                            <button
                                onClick={handleShare}
                                title="Copiar enlace"
                                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all hover:scale-110 active:scale-90 ${shareCopied
                                    ? 'text-green-500 bg-green-500/10 border-green-500/20'
                                    : `${textMutedClass} ${controlBgClass} ${controlBorderClass} hover:text-green-500 hover:bg-green-500/10 hover:border-green-500/20`}`}>
                                <Share2 size={15} />
                            </button>

                            {/* Ver Licencias */}
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
                                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-90 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 ${controlBgClass} ${controlBorderClass} ${textMutedClass}`}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
