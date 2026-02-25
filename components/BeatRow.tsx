"use client";

import { Music, Play, Pause, ShoppingCart, Check, ChevronRight, Crown } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import { Beat } from '@/lib/types';
import LicenseSelectionModal from './LicenseSelectionModal';
import { useState } from 'react';
import { MUSICAL_KEYS } from '@/lib/constants';

interface BeatRowProps {
    beat: Beat;
}

function formatPriceMXN(value?: number | null) {
    if (value === null || value === undefined) return "$—";
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function BeatRow({ beat }: BeatRowProps) {
    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { addItem, isInCart, currentUserId } = useCart();
    const { formatPrice } = useCurrency();
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
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
        setIsLicenseModalOpen(true);
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
                {/* Overlay Oscuro Siempre Visible en Móvil si está reproduciendo */}
                <div className={`absolute inset-0 bg-accent/20 flex items-center justify-center transition-all ${isThisPlaying ? 'opacity-100' : 'opacity-0 xl:group-hover/artwork:opacity-100'}`}>
                    <div className="text-white drop-shadow-lg">
                        {isThisPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-0.5" />}
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
                <Link href={`/${beat.productor_nombre_usuario || (typeof (beat as any).productor === 'object' ? (beat as any).productor?.nombre_usuario : (beat as any).productor)}`} className="flex items-center gap-1.5 hover:text-accent transition-colors mt-0.5 w-max">
                    <p className="text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">
                        {beat.productor_nombre_artistico || (typeof (beat as any).productor === 'object' ? (beat as any).productor?.nombre_artistico : ((beat as any).productor || "—"))}
                    </p>
                    {(beat.productor_esta_verificado || (typeof (beat as any).productor === 'object' && (beat as any).productor?.esta_verificado)) && (
                        <img src="/verified-badge.png" className="w-3 h-3 object-contain" alt="Verificado" />
                    )}
                    {(beat.productor_es_fundador || (typeof (beat as any).productor === 'object' && (beat as any).productor?.es_fundador)) && (
                        <Crown size={12} className="text-amber-500" fill="currentColor" />
                    )}
                </Link>

                {/* Metadatos (Ocultos en ultra-móvil, visibles en desktop) */}
                <div className="hidden sm:flex items-center gap-2 mt-2">
                    {beat.tono_escala && (
                        <span className="text-[9px] font-black text-accent bg-accent/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                            {MUSICAL_KEYS.find(k => k.value === beat.tono_escala)?.label || beat.tono_escala}
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
                            className="bg-foreground text-background px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                        >
                            Es tu Beat
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-right hidden sm:block">
                            <p className="text-accent font-black text-lg leading-none mb-1">
                                {formatPrice(beat.precio_basico_mxn || 299)}
                            </p>
                            <Link href={`/beats/${beat.id}`} className="text-[8px] font-black text-muted uppercase tracking-widest hover:text-accent transition-colors flex items-center justify-end gap-1 p-2 -mr-2">
                                Ver Licencias <ChevronRight size={10} />
                            </Link>
                        </div>

                        <div className="flex flex-col items-end sm:hidden mb-1">
                            <span className="text-accent font-black text-sm">{formatPrice(beat.precio_basico_mxn || 299)}</span>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className={`w-12 h-12 shrink-0 rounded-[1.25rem] flex items-center justify-center transition-all shadow-lg active:scale-90 ${itemInCart
                                ? 'bg-green-500 text-white shadow-green-500/20'
                                : 'bg-accent text-white hover:bg-accent/80'}`}
                        >
                            {itemInCart ? <Check size={20} strokeWidth={3} /> : <ShoppingCart size={20} />}
                        </button>
                    </>
                )}
            </div>

            <LicenseSelectionModal
                beat={beat}
                isOpen={isLicenseModalOpen}
                onClose={() => setIsLicenseModalOpen(false)}
            />
        </div>
    );
}
