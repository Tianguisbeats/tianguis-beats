"use client";

import { Music, Play, Pause, ShoppingCart, Check, ChevronRight, Crown, ListMusic, Trash2, ChevronUp, ChevronDown, Edit3 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import { Beat } from '@/lib/types';
import { useState } from 'react';
import { MUSICAL_KEYS } from '@/lib/constants';
import AddToPlaylistModal from './AddToPlaylistModal';
import { useRouter } from 'next/navigation';

interface BeatRowProps {
    beat: Beat;
    onRemoveFromPlaylist?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
}

function formatPriceMXN(value?: number | null) {
    if (value === null || value === undefined) return "$—";
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function BeatRow({ beat, onRemoveFromPlaylist, onMoveUp, onMoveDown }: BeatRowProps) {
    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { addItem, isInCart, currentUserId } = useCart();
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const isThisPlaying = currentBeat?.id === beat.id && isPlaying;
    const itemInCart = isInCart(beat.id);
    const isOwner = currentUserId && beat.productor_id === currentUserId;

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        playBeat({
            ...beat,
            is_verified: beat.productor_esta_verificado,
            is_founder: beat.productor_es_fundador
        } as any);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/beats/${beat.id}`);
    };

    return (
        <div className="tianguis-card flex flex-row items-center p-3 sm:p-4 gap-3 sm:gap-6 relative">
            {/* 1. Miniatura del arte (Touch Target Grande en Móvil) */}
            <div
                onClick={handlePlay}
                className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden bg-background border border-border group/artwork cursor-pointer active:scale-95 transition-transform"
            >
                {beat.portada_url ? (
                    <img
                        src={beat.portada_url}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/artwork:scale-110"
                        alt={beat.titulo}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                        <Music size={24} />
                    </div>
                )}
                {/* Overlay Oscuro Siempre Visible si está reproduciendo o Hover */}
                <div className={`absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center transition-all duration-300 ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover/artwork:opacity-100'}`}>
                    <div className="text-white drop-shadow-lg bg-black/40 p-1.5 rounded-full backdrop-blur-sm">
                        {isThisPlaying ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-0.5" />}
                    </div>
                </div>
            </div>

            {/* 2. Título y Productor (Texto un poco más grande y fácil de leer) */}
            <div className="flex-1 min-w-0 pr-2">
                <Link href={`/beats/${beat.id}`} className="block">
                    <h3 className="font-black text-foreground text-sm sm:text-base truncate uppercase tracking-tight hover:text-accent transition-colors">
                        {beat.titulo || "Sin título"}
                    </h3>
                </Link>
                <Link href={`/${beat.productor_nombre_usuario || '#'}`} className="flex items-center gap-1.5 hover:text-accent transition-colors mt-0.5 w-max">
                    <p className="text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">
                        {beat.productor_nombre_artistico || beat.productor_nombre_usuario || "—"}
                    </p>
                    {beat.productor_esta_verificado && (
                        <img src="/verified-badge.png" className="w-3 h-3 object-contain" alt="Verificado" />
                    )}
                    {beat.productor_es_fundador && (
                        <Crown size={12} className="text-amber-500" fill="currentColor" />
                    )}
                </Link>

                {/* Metadatos */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    {beat.tono_escala && (
                        <span className="text-[9px] font-black text-accent bg-accent/10 px-3 py-1 rounded-xl uppercase tracking-widest border border-accent/20">
                            {MUSICAL_KEYS.find(k => k.value === beat.tono_escala)?.label || beat.tono_escala}
                        </span>
                    )}
                    {beat.bpm && (
                        <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-xl uppercase tracking-widest border border-rose-500/20">
                            {beat.bpm} BPM
                        </span>
                    )}
                    {beat.genero && (
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-xl uppercase tracking-widest border border-indigo-500/20 truncate max-w-[80px] sm:max-w-none">
                            {beat.genero}
                        </span>
                    )}
                </div>
            </div>

            {/* 3. Precio y Acción (Touch Target de 48x48 mínimo para Carrito) */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 shrink-0">
                {isOwner ? (
                    <div className="flex flex-col items-end gap-1">
                        <Link
                            href={`/studio/beats/edit/${beat.id}`}
                            className="w-10 h-10 rounded-xl bg-foreground/[0.03] border border-border flex items-center justify-center text-muted hover:text-foreground transition-all shadow-sm group/edit"
                            title="Editar en Studio"
                        >
                            <Edit3 size={16} className="group-hover/edit:scale-110 transition-transform" />
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-right hidden xl:block">
                            <p className="text-accent font-black text-lg leading-none mb-1">
                                {formatPrice(beat.precio_basica_mxn || 299)}
                            </p>
                            <Link href={`/beats/${beat.id}`} className="text-[8px] font-black text-muted uppercase tracking-widest hover:text-accent transition-colors flex items-center justify-end gap-1 p-2 -mr-2">
                                Ver Licencias <ChevronRight size={10} />
                            </Link>
                        </div>

                        <div className="flex flex-col items-end xl:hidden mb-1">
                            <span className="text-accent font-black text-sm">{formatPrice(beat.precio_basica_mxn || 299)}</span>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className={`px-4 sm:px-6 h-10 sm:h-12 shrink-0 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${itemInCart
                                ? 'bg-green-500 text-white shadow-green-500/20'
                                : 'bg-accent text-white hover:bg-accent/80'}`}
                        >
                            {itemInCart ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} />}
                            <span>{itemInCart ? 'Agregado' : 'Obtener'}</span>
                        </button>
                    </>
                )}
            </div>

            <div className="flex flex-row items-center gap-2 shrink-0">
                {onMoveUp && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveUp(); }}
                        className="w-8 h-10 rounded-xl bg-foreground/[0.03] border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent/30 transition-all"
                        title="Mover Arriba"
                    >
                        <ChevronUp size={16} />
                    </button>
                )}
                {onMoveDown && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveDown(); }}
                        className="w-8 h-10 rounded-xl bg-foreground/[0.03] border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent/30 transition-all"
                        title="Mover Abajo"
                    >
                        <ChevronDown size={16} />
                    </button>
                )}
                {onRemoveFromPlaylist && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemoveFromPlaylist();
                        }}
                        className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Quitar de la Playlist"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!currentUserId) return;
                        setIsPlaylistModalOpen(true);
                    }}
                    className="w-10 h-10 rounded-xl bg-foreground/[0.03] border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent/30 transition-all"
                    title="Añadir a Playlist"
                >
                    <ListMusic size={18} />
                </button>
            </div>

            <AddToPlaylistModal
                beatId={beat.id}
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
            />
        </div>
    );
}
