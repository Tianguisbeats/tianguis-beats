/* eslint-disable @next/next/no-img-element */
"use client";
/* ══════════════════════════════════════════════════════════════════════
   BeatCardPro.tsx
   Tarjeta principal para mostrar un beat en el catálogo y el perfil.
   — Soporta reproducción inline, like (favoritos), y apertura del
     modal de selección de licencia.
   — Diseñada para funcionar perfectamente en móvil y escritorio:
     en móvil el botón de play es siempre visible, no solo en hover.
   ══════════════════════════════════════════════════════════════════════ */

import { Beat } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Crown, Heart, Zap, Music2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getGlobalConfig, GlobalConfig } from '@/lib/config';
import { useState, useEffect } from 'react';
// Removed LicenseSelectionModal per user request
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import { useRouter } from 'next/navigation';

interface BeatCardProProps {
    beat: Beat;
    compact?: boolean;
    adminControls?: React.ReactNode;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.23, 1, 0.32, 1] as any
        }
    }
};

export default function BeatCardPro({ beat, compact = false, adminControls }: BeatCardProProps) {
    /* ── Contextos globales: reproductor, carrito, toasts, moneda ── */
    const { currentBeat, isPlaying, playBeat, likedBeatIds, toggleLike: globalToggleLike } = usePlayer();
    const { currentUserId } = useCart();
    const { showToast } = useToast();
    const router = useRouter();
    const [config, setConfig] = useState<GlobalConfig | null>(null);

    useEffect(() => {
        getGlobalConfig().then(setConfig);
    }, []);

    /* ── Fills Liked from Global State ── */
    const isLiked = likedBeatIds.has(beat.id);
    const isThisPlaying = currentBeat?.id === beat.id && isPlaying;
    const isOwner = currentUserId && beat.productor_id === currentUserId;

    /* ── Estado local para modales y efectos ── */
    // Modal state removed per user request
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

    /* ── Toggle de like / unlike en la tabla favoritos ── */
    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserId) { router.push('/login'); return; }
        await globalToggleLike(beat.id);
    };

    /* ── Reproduce o pausa el beat en el reproductor global ── */
    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Ensure mapping is correct for AudioPlayer badges
        const beatToPlay = {
            ...beat,
            productor_esta_verificado: beat.productor_esta_verificado ?? (beat as any).is_verified,
            productor_es_fundador: beat.productor_es_fundador ?? (beat as any).is_founder,
            product_type: 'beat'
        };

        playBeat(beatToPlay as any);
    };

    /* ── Manda a la página de detalle para seleccionar licencia ── */
    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/beats/${beat.id}`);
    };

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ 
                y: -8,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            className={`relative flex flex-col h-full overflow-hidden ${compact ? 'max-w-[260px]' : ''} group/main transition-all duration-500 perspective-1000`}
            style={{ transformStyle: 'preserve-3d' } as any}
        >
            {/* Shimmer Effect Sweep - Disabled on mobile for performance */}
            <div className="absolute inset-0 z-20 pointer-events-none opacity-0 md:group-hover/main:opacity-100 transition-opacity duration-700">
                <div 
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover/main:translate-x-full transition-transform duration-1000 ease-in-out hidden md:block"
                    style={{ transform: 'skewX(-20deg)' }}
                />
            </div>
            {/* Neon Border Glow (always present but subtle, pulses when playing) */}
            <motion.div 
                initial={{ opacity: 0.1 }}
                animate={isThisPlaying ? { opacity: [0.3, 0.6, 0.3] } : { opacity: 0.1 }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 rounded-[2.5rem] border-2 ${isThisPlaying ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-white/5'} pointer-events-none z-10 transition-colors duration-500`}
            />

            <div className="bg-white/95 dark:bg-[#0F0F0F] md:backdrop-blur-lg rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-2 flex flex-col h-full relative z-0 group-hover/main:border-emerald-500/30 transition-all duration-300 shadow-sm md:dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                {/* Visual Content Section */}
                <div className="relative aspect-square rounded-[2rem] overflow-hidden group/img">
                    {beat.portada_url ? (
                        <Image
                            src={beat.portada_url}
                            alt={beat.titulo}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                            quality={75}
                            className="object-cover transition-transform duration-700 group-hover/img:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-muted/30">
                            <Music2 size={48} strokeWidth={1} />
                        </div>
                    )}
                    
                    {/* Play Button — semitransparente para no tapar el cover */}
                    {!beat.esta_vendido && (
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isThisPlaying ? 'bg-black/20' : 'bg-transparent'}`}>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handlePlay}
                                className={`w-12 h-12 rounded-full text-white flex items-center justify-center border transition-all duration-300 ${
                                    isThisPlaying
                                        ? 'bg-emerald-500 border-white/30 shadow-lg shadow-emerald-500/50'
                                        : 'bg-black/30 border-white/20 backdrop-blur-sm'
                                }`}
                            >
                                {isThisPlaying ? <Pause fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} className="ml-0.5" />}
                            </motion.button>
                        </div>
                    )}

                    {/* Bandera de vendido */}
                    {beat.esta_vendido && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            <span className="bg-white/10 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest border border-white/10 -rotate-6">
                                Vendido
                            </span>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {beat.precio_basica_mxn === 0 && (
                            <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 flex items-center gap-1.5">
                                <Zap size={10} className="text-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Gratis</span>
                            </div>
                        )}
                        {(beat as any).es_exclusivo && (
                            <div className="px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-xl border border-amber-500/30 flex items-center gap-1.5">
                                <Crown size={10} className="text-amber-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Exclusivo</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Text Content Section */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 leading-none shadow-sm shadow-emerald-500/5">
                                {beat.genero || 'Trap'}
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-[7px] font-black uppercase tracking-[0.15em] text-rose-600 dark:text-rose-400 leading-none shadow-sm shadow-rose-500/5">
                                {beat.bpm} BPM
                            </span>
                            {beat.tono_escala && (
                                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[7px] font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 leading-none shadow-sm shadow-blue-500/5">
                                    {beat.tono_escala.replace(/_/g, ' ').replace(/sharp/gi, '#')}
                                </span>
                            )}
                        </div>
                        <Link href={`/beats/${beat.id}`}>
                            <h4 className="text-base font-black uppercase tracking-tighter text-black dark:text-white group-hover/main:text-transparent group-hover/main:bg-clip-text group-hover/main:bg-gradient-to-r group-hover/main:from-emerald-400 group-hover/main:to-teal-500 transition-all truncate leading-tight">
                                {beat.titulo}
                            </h4>
                        </Link>
                        <Link
                            href={`/${(beat as any).productor_nombre_usuario || (beat as any).nombre_usuario || '#'}`}
                            className="flex items-center gap-1.5 group/link"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group-hover/link:underline transition-all truncate max-w-[120px]">
                                {(beat as any).productor_nombre_artistico || (beat as any).nombre_artistico || (beat as any).productor_nombre_usuario || (beat as any).nombre_usuario || 'Productor'}
                            </span>
                            {(beat.productor_esta_verificado || (beat as any).esta_verificado || (beat as any).is_verified) && (
                                <img 
                                    src="/verified-badge.png" 
                                    alt="Verificado" 
                                    className="w-3.5 h-3.5 object-contain dark:brightness-0 dark:invert"
                                />
                            )}
                            {(beat.productor_es_fundador || (beat as any).es_fundador || (beat as any).is_founder) && (
                                <Crown 
                                    size={12} 
                                    className="text-amber-400 fill-amber-400 shadow-sm"
                                    style={{ filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.4))' }}
                                />
                            )}
                        </Link>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-200 dark:border-white/5">
                        {adminControls && (
                            <div className="mb-4">
                                {adminControls}
                            </div>
                        )}
                        {beat.esta_vendido && config?.bloqueo_exclusivos ? (
                            <div className="w-full h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-2">
                                <Crown size={14} className="text-rose-500" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-500">Vendido</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleLike}
                                    className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all border ${isLiked ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 dark:text-muted hover:text-red-500'}`}
                                >
                                    <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                                </motion.button>
                                {isOwner && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!currentUserId) { router.push('/login'); return; }
                                            setIsPlaylistModalOpen(true);
                                        }}
                                        className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 dark:text-muted hover:text-emerald-500 hover:border-emerald-500/30"
                                        title="Añadir a Playlist"
                                    >
                                        <Plus size={15} />
                                    </motion.button>
                                )}
                                {!isOwner && (
                                    <motion.button
                                        whileHover={config?.ventas_habilitadas !== false ? { scale: 1.02 } : {}}
                                        whileTap={config?.ventas_habilitadas !== false ? { scale: 0.97 } : {}}
                                        onClick={(e) => {
                                            if (config?.ventas_habilitadas === false) {
                                                showToast("Ventas pausadas temporalmente", "info");
                                                return;
                                            }
                                            handleAddToCart(e);
                                        }}
                                        className={`flex-1 h-9 rounded-xl text-white flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                            config?.ventas_habilitadas === false
                                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20'
                                        }`}
                                    >
                                        {config?.ventas_habilitadas === false ? 'Pausado' : 'Obtener'}
                                    </motion.button>
                                )}
                                {isOwner && (
                                    <div className="flex-1 h-9 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2">
                                        <Crown size={13} className="text-amber-500" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/50">Tu Beat</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Modal de licencias eliminado para simplificar flujo */}

            <AddToPlaylistModal
                isOpen={isPlaylistModalOpen}
                beatId={beat.id}
                onClose={() => setIsPlaylistModalOpen(false)}
            />
        </motion.div>
    );
}
