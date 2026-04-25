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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

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

function PlayerTooltip({ label, children }: { label: string; children: React.ReactElement }) {
    return (
        <Tooltip>
            <TooltipTrigger render={children} />
            <TooltipContent side="top" className="text-[10px] font-black uppercase tracking-widest">
                {label}
            </TooltipContent>
        </Tooltip>
    );
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
    const [shareCopied, setShareCopied] = useState(false);
    const [colaAbierta, setColaAbierta] = useState(false);

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

    // (El antiguo handler de click-outside para Up Next se reemplazó por
    // el comportamiento nativo del Sheet de shadcn — focus trap incluido.)

    const toggleLike = () => {
        if (!currentUserId || !currentBeat) return;
        globalToggleLike(currentBeat.id, isSoundKit ? 'sound_kit' : 'beat');
    };

    const handleShare = async () => {
        if (!currentBeat) return;
        const url = `${window.location.origin}${isSoundKit ? `/sound-kits/${currentBeat.id}` : `/beats/${currentBeat.id}`}`;
        // Use native share sheet on mobile if available
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: currentBeat.titulo, url });
                return;
            } catch {
                // User cancelled or not supported — fall through to clipboard
            }
        }
        try {
            await navigator.clipboard.writeText(url);
        } catch { /* ignore */ }
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
    };

    if (!currentBeat) return null;

    const formatTime = (time: number) => {
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleVolumeChange = (value: number | readonly number[]) => {
        const v = Array.isArray(value) ? value[0] : value;
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

    // Ícono y color del loop según el modo
    const LoopIcon = loopMode === 'one' ? Repeat1 : Repeat;
    const loopActive = loopMode !== 'none';

    return (
        <TooltipProvider delay={200}>
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
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <Link href={producerLink}
                                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase truncate hover:opacity-80 transition-opacity ${accentText}`}>
                                        <span>{producerName}</span>
                                        {(currentBeat.productor_esta_verificado || (currentBeat as any).is_verified) && (
                                            <img src="/verified-badge.png" alt="V"
                                                className={`w-3.5 h-3.5 object-contain shrink-0 ${isDark ? 'brightness-0 invert' : ''}`} />
                                        )}
                                        {(currentBeat.productor_es_fundador || (currentBeat as any).is_founder) && (
                                            <Crown size={11} className="text-amber-400 shrink-0" fill="currentColor" />
                                        )}
                                        {currentBeat.productor_nivel_suscripcion?.toLowerCase() === 'premium' && !currentBeat.productor_es_fundador && !((currentBeat as any).is_founder) && (
                                            <Crown size={11} className="text-blue-500 shrink-0" fill="currentColor" />
                                        )}
                                    </Link>
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

                        {/* Barra de progreso — ligera en móvil (evita doble carga de audio) */}
                        <div className="px-1">
                            <div
                                className="relative h-8 flex items-center cursor-pointer group/prog"
                                onClick={(e) => {
                                    if (!duration) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    seek(Math.max(0, Math.min(duration, ((e.clientX - rect.left) / rect.width) * duration)));
                                }}
                            >
                                <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: waveColor }}>
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                                            background: progressColor
                                        }}
                                    />
                                </div>
                                <div
                                    className="absolute w-3 h-3 rounded-full shadow-md pointer-events-none"
                                    style={{
                                        left: duration ? `calc(${(currentTime / duration) * 100}% - 6px)` : '-6px',
                                        background: progressColor
                                    }}
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
                                    <HoverCard>
                                        <HoverCardTrigger
                                            render={
                                                <Link
                                                    href={producerLink}
                                                    className={`flex items-center gap-1.5 text-[10px] font-bold truncate transition-colors hover:underline underline-offset-2 uppercase tracking-widest ${accentText} hover:${isDark ? 'text-white/80' : 'text-slate-700'}`}
                                                >
                                                    <span>{producerName}</span>
                                                    {(currentBeat.productor_esta_verificado || (currentBeat as any).esta_verificado || (currentBeat as any).is_verified) && (
                                                        <img src="/verified-badge.png" alt="V"
                                                            className={`w-3.5 h-3.5 md:w-4 md:h-4 object-contain shrink-0 ${isDark ? 'brightness-0 invert' : ''}`} />
                                                    )}
                                                    {(currentBeat.productor_es_fundador || (currentBeat as any).es_fundador || (currentBeat as any).is_founder) && (
                                                        <Crown size={12} className="text-amber-400 shrink-0 fill-amber-400" />
                                                    )}
                                                    {(currentBeat.productor_nivel_suscripcion?.toLowerCase() === 'premium' || (currentBeat as any).nivel_suscripcion?.toLowerCase() === 'premium') && !currentBeat.productor_es_fundador && !((currentBeat as any).es_fundador) && !((currentBeat as any).is_founder) && (
                                                        <Crown size={12} className="text-blue-500 shrink-0 fill-blue-500" />
                                                    )}
                                                </Link>
                                            }
                                        />
                                        <HoverCardContent side="top" className="w-72 p-0 overflow-hidden">
                                            <div className="p-4 flex items-start gap-3">
                                                <div className="shrink-0 w-14 h-14 rounded-2xl overflow-hidden border border-border bg-foreground/5">
                                                    {currentBeat.productor_foto_perfil ? (
                                                        <Image
                                                            src={currentBeat.productor_foto_perfil}
                                                            width={56}
                                                            height={56}
                                                            className="w-full h-full object-cover"
                                                            alt={producerName}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-foreground/40 font-black text-lg">
                                                            {(producerName || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Link href={producerLink} className="font-black text-sm text-foreground hover:text-accent transition-colors truncate">
                                                            {producerName}
                                                        </Link>
                                                        {currentBeat.productor_esta_verificado && (
                                                            <img src="/verified-badge.png" alt="Verificado" className={`w-3.5 h-3.5 object-contain shrink-0 ${isDark ? 'brightness-0 invert' : ''}`} />
                                                        )}
                                                        {currentBeat.productor_es_fundador && (
                                                            <Crown size={12} className="text-amber-400 shrink-0 fill-amber-400" />
                                                        )}
                                                    </div>
                                                    {currentBeat.productor_nombre_usuario && (
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 truncate">
                                                            @{currentBeat.productor_nombre_usuario}
                                                        </p>
                                                    )}
                                                    <Link
                                                        href={producerLink}
                                                        className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
                                                    >
                                                        Ver perfil
                                                    </Link>
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
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

                                    {/* Volumen (Movido aquí para espacio) */}
                                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${controlBgClass} ${controlBorderClass}`}>
                                        <PlayerTooltip label={isMuted || volume === 0 ? 'Activar sonido' : 'Silenciar'}>
                                            <button onClick={toggleMute} className={`transition-colors shrink-0 ${isMuted || volume === 0 ? textMutedClass : accentText}`}>
                                                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                            </button>
                                        </PlayerTooltip>
                                        <div className="w-16 relative flex items-center h-4">
                                            <Slider
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                value={volume}
                                                onValueChange={handleVolumeChange}
                                                aria-label="Volumen"
                                                className="cursor-pointer [&_[data-slot=slider-range]]:bg-[var(--player-accent)] [&_[data-slot=slider-thumb]]:border-[var(--player-accent)] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-sm"
                                                style={{ '--player-accent': accentColor } as React.CSSProperties}
                                            />
                                        </div>
                                    </div>

                                    <PlayerTooltip label="Anterior">
                                        <button onClick={playPrevious} disabled={playlist.length === 0}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${controlBgClass} border ${controlBorderClass} ${accentText} opacity-60 hover:opacity-100 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed`}>
                                            <SkipBack size={16} fill="currentColor" />
                                        </button>
                                    </PlayerTooltip>

                                    {/* SkipForward */}
                                    <PlayerTooltip label="Siguiente">
                                        <button onClick={playNext} disabled={playlist.length === 0}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${controlBgClass} border ${controlBorderClass} ${accentText} opacity-60 hover:opacity-100 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed`}>
                                            <SkipForward size={16} fill="currentColor" />
                                        </button>
                                    </PlayerTooltip>

                                    {/* Botón "Ver cola" — abre el Sheet con la lista completa */}
                                    <PlayerTooltip label="Cola de reproducción">
                                        <button
                                            onClick={() => setColaAbierta(true)}
                                            aria-label="Ver cola de reproducción"
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${controlBgClass} border ${controlBorderClass} ${textMutedClass} hover:opacity-100 cursor-pointer relative`}
                                        >
                                            <List size={14} />
                                            {playlist.length - playlistIndex - 1 > 0 && (
                                                <span
                                                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[7px] font-black flex items-center justify-center text-white"
                                                    style={{ background: accentColor }}
                                                >
                                                    {Math.min(playlist.length - playlistIndex - 1, 9)}
                                                </span>
                                            )}
                                        </button>
                                    </PlayerTooltip>

                                    {/* Shuffle */}
                                    <PlayerTooltip label={isShuffle ? 'Aleatorio activado' : 'Aleatorio'}>
                                        <button onClick={toggleShuffle}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 border ${isShuffle
                                                ? `${accentText} border-current/20`
                                                : `${textMutedClass} ${controlBgClass} ${controlBorderClass}`}`}
                                            style={isShuffle ? { background: `${accentColor}15`, borderColor: `${accentColor}30` } : {}}>
                                            <Shuffle size={14} />
                                        </button>
                                    </PlayerTooltip>

                                    {/* Loop */}
                                    <PlayerTooltip label={loopMode === 'none' ? 'Sin repetición' : loopMode === 'all' ? 'Repetir todo' : 'Repetir una canción'}>
                                        <button onClick={toggleLoopMode}
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
                                    </PlayerTooltip>
                                </div>
                            </div>
                        </div>

                        {/* ── 3. VOLUMEN Y ACCIONES (24%) ── */}
                        <div className="flex flex-col items-end gap-2 w-[24%] shrink-0 py-1">
                            {/* Fila Superior: Compartir y Cerrar */}
                            <div className="flex items-center gap-2">
                                <PlayerTooltip label={shareCopied ? 'Enlace copiado' : 'Copiar enlace'}>
                                    <button
                                        onClick={handleShare}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all hover:scale-110 active:scale-90 ${shareCopied
                                            ? 'text-green-500 bg-green-500/10 border-green-500/20'
                                            : `${textMutedClass} ${controlBgClass} ${controlBorderClass} hover:text-green-500 hover:bg-green-500/10 hover:border-green-500/20`}`}>
                                        <Share2 size={15} />
                                    </button>
                                </PlayerTooltip>

                                <button
                                    onClick={closePlayer}
                                    className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-90 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 ${controlBgClass} ${controlBorderClass} ${textMutedClass}`}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Fila Inferior: Ver Licencias */}
                            {!isOwner && (
                                <button
                                    onClick={() => router.push(beatLink)}
                                    className="w-full max-w-[190px] py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-md text-center"
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Sheet con la cola de reproducción completa (controlado, abre desde el botón "Ver cola") */}
            <Sheet open={colaAbierta} onOpenChange={setColaAbierta}>
                <SheetContent side="right" className="w-[360px] sm:w-[420px] bg-[#06060a] border-white/10 text-white">
                    <SheetHeader>
                        <SheetTitle className="text-white text-[10px] font-black uppercase tracking-[0.3em]">
                            Cola de reproducción
                        </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 px-4 pb-6 overflow-y-auto max-h-[calc(100vh-120px)] space-y-1">
                        {playlist.length === 0 ? (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center py-12">
                                Sin cola activa
                            </p>
                        ) : (
                            playlist.map((track, i) => {
                                const esActual = i === playlistIndex;
                                const yaSono = i < playlistIndex;
                                return (
                                    <button
                                        key={`${track.id}-${i}`}
                                        onClick={() => { setPlaylistAndPlay(playlist, i); setColaAbierta(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                            esActual
                                                ? 'bg-white/[0.08] border border-white/10'
                                                : 'hover:bg-white/[0.04] border border-transparent'
                                        } ${yaSono ? 'opacity-40' : ''}`}
                                    >
                                        <span className={`text-[9px] font-black w-4 shrink-0 ${esActual ? accentText : 'text-white/30'}`}>
                                            {esActual ? '▶' : i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[11px] font-black truncate uppercase tracking-tight ${esActual ? accentText : 'text-white'}`}>
                                                {track.titulo}
                                            </div>
                                            <div className="text-[9px] truncate text-white/40 uppercase tracking-widest">
                                                {track.productor_nombre_artistico || track.productor_nombre_usuario}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </TooltipProvider>
    );
}
