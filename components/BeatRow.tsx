"use client";

import { Music, Play, Pause, ShoppingCart, Check, ChevronRight, Crown } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
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
    const { addItem, isInCart } = useCart();
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
    const isThisPlaying = currentBeat?.id === beat.id && isPlaying;
    const itemInCart = isInCart(beat.id);

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
        <div className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all flex items-center p-3 gap-6">
            {/* Artwork Mini */}
            <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-slate-100 group/artwork">
                {beat.portadabeat_url ? (
                    <img
                        src={beat.portadabeat_url}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/artwork:scale-110"
                        alt={beat.title}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Music size={24} />
                    </div>
                )}
                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/artwork:opacity-100 flex items-center justify-center transition-all">
                    <button onClick={handlePlay} className="text-white drop-shadow-lg transform active:scale-90 transition-transform">
                        {isThisPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-0.5" />}
                    </button>
                </div>
            </div>

            {/* Title & Producer */}
            <div className="flex-1 min-w-0">
                <Link href={`/beats/${beat.id}`} className="block">
                    <h3 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight group-hover:text-blue-600 transition-colors click-highlight">
                        {beat.title || "Sin título"}
                    </h3>
                </Link>
                <Link href={`/${beat.producer_username || (typeof beat.producer === 'object' ? beat.producer.username : beat.producer)}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors mt-0.5">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate username-highlight">
                        {beat.producer_artistic_name || (typeof beat.producer === 'object' ? beat.producer.artistic_name : (beat.producer || "—"))}
                    </p>
                    {(beat.producer_is_verified || (typeof beat.producer === 'object' && beat.producer?.is_verified)) && (
                        <img src="/verified-badge.png" className="w-2.5 h-2.5 object-contain" alt="Verificado" />
                    )}
                </Link>
            </div>

            {/* Metadata (Desktop Only for space) */}
            <div className="hidden md:flex items-center gap-3">
                {beat.genre && (
                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 uppercase tracking-widest whitespace-nowrap">
                        {beat.genre}
                    </span>
                )}
                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 uppercase tracking-widest whitespace-nowrap">
                    {beat.bpm || "—"} BPM
                </span>
                {beat.musical_key && (
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 uppercase tracking-widest whitespace-nowrap">
                        {beat.musical_key}
                    </span>
                )}
                {beat.musical_scale && (
                    <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 uppercase tracking-widest whitespace-nowrap">
                        {beat.musical_scale}
                    </span>
                )}
            </div>

            {/* Price & Cart */}
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-blue-600 font-black text-lg leading-none">
                        {formatPriceMXN(beat.price_mxn || 299)}
                    </p>
                    <button onClick={handleAddToCart} className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 hover:text-blue-600 transition-colors flex items-center justify-end gap-1">
                        Ver Licencias <ChevronRight size={8} />
                    </button>
                </div>
                <button
                    onClick={handleAddToCart}
                    className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${itemInCart ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                >
                    {itemInCart ? <Check size={20} strokeWidth={3} /> : <ShoppingCart size={20} />}
                </button>
            </div>

            <LicenseSelectionModal
                beat={beat}
                isOpen={isLicenseModalOpen}
                onClose={() => setIsLicenseModalOpen(false)}
            />
        </div>
    );
}
