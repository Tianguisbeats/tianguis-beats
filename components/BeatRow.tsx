"use client";

import { Music, Play, Pause, ShoppingCart, Check, ChevronRight, Crown } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import { Beat } from '@/lib/types';
import LicenseSelectionModal from './LicenseSelectionModal';
import { useState } from 'react';

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
    const isOwner = currentUserId && beat.producer_id === currentUserId;

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        playBeat({
            ...beat,
            is_verified: beat.producer_is_verified,
            is_founder: beat.producer_is_founder
        } as any);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLicenseModalOpen(true);
    };

    return (
        <div className="group bg-white dark:bg-[#020205] rounded-[2rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl dark:hover:shadow-white/5 transition-all flex flex-row items-center p-3 sm:p-4 gap-3 sm:gap-6 relative">
            {/* 1. Miniatura del arte (Touch Target Grande en Móvil) */}
            <div
                onClick={handlePlay}
                className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 group/artwork cursor-pointer active:scale-95 transition-transform"
            >
                {beat.portadabeat_url ? (
                    <img
                        src={beat.portadabeat_url}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/artwork:scale-110"
                        alt={beat.title}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
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
                    <h3 className="font-black text-slate-900 dark:text-foreground text-sm sm:text-base truncate uppercase tracking-tight hover:text-accent transition-colors">
                        {beat.title || "Sin título"}
                    </h3>
                </Link>
                <Link href={`/${beat.producer_username || (typeof beat.producer === 'object' ? beat.producer.username : beat.producer)}`} className="flex items-center gap-1.5 hover:text-accent transition-colors mt-0.5 w-max">
                    <p className="text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">
                        {beat.producer_artistic_name || (typeof beat.producer === 'object' ? beat.producer.artistic_name : (beat.producer || "—"))}
                    </p>
                    {(beat.producer_is_verified || (typeof beat.producer === 'object' && beat.producer?.is_verified)) && (
                        <img src="/verified-badge.png" className="w-3 h-3 object-contain" alt="Verificado" />
                    )}
                    {(beat.producer_is_founder || (typeof beat.producer === 'object' && beat.producer?.is_founder)) && (
                        <Crown size={12} className="text-amber-500" fill="currentColor" />
                    )}
                </Link>

                {/* Metadatos (Ocultos en ultra-móvil, visibles en desktop) */}
                <div className="hidden sm:flex items-center gap-2 mt-2">
                    {beat.musical_key && (
                        <span className="text-[9px] font-black text-accent bg-accent/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                            {beat.musical_key}
                        </span>
                    )}
                    {beat.musical_scale && (
                        <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                            {beat.musical_scale}
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
                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                        >
                            Es tu Beat
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-right hidden sm:block">
                            <p className="text-accent font-black text-lg leading-none mb-1">
                                {formatPrice(beat.price_mxn || 299)}
                            </p>
                            <Link href={`/beats/${beat.id}`} className="text-[8px] font-black text-muted uppercase tracking-widest hover:text-accent transition-colors flex items-center justify-end gap-1 p-2 -mr-2">
                                Ver Licencias <ChevronRight size={10} />
                            </Link>
                        </div>

                        <div className="flex flex-col items-end sm:hidden mb-1">
                            <span className="text-accent font-black text-sm">{formatPrice(beat.price_mxn || 299)}</span>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className={`w-12 h-12 shrink-0 rounded-[1.25rem] flex items-center justify-center transition-all shadow-lg active:scale-90 ${itemInCart
                                ? 'bg-green-500 text-white shadow-green-500/20'
                                : 'bg-accent text-white hover:bg-slate-900 dark:hover:bg-slate-800 hover:shadow-accent/30'}`}
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
