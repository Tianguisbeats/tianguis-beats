"use client";

import { Beat } from '@/lib/types';
import Link from 'next/link';
import { Play, Pause, ShoppingCart, Check, Music } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import LicenseSelectionModal from '@/components/LicenseSelectionModal';

interface BeatCardProProps {
    beat: Beat;
}

export default function BeatCardPro({ beat }: BeatCardProProps) {
    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { addItem, isInCart } = useCart();
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

    const isThisPlaying = currentBeat?.id === beat.id && isPlaying;
    const itemInCart = isInCart(beat.id);

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
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
        <div className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-blue-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            {/* Image & Overlay */}
            <div className="relative aspect-square overflow-hidden bg-slate-100">
                {beat.portadabeat_url ? (
                    <img
                        src={beat.portadabeat_url}
                        alt={beat.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Music size={40} />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {beat.bpm && (
                        <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wide">
                            {beat.bpm} BPM
                        </span>
                    )}
                    {beat.musical_key && (
                        <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wide">
                            {beat.musical_key}
                        </span>
                    )}
                </div>

                {/* Play Overlay */}
                <div className={`absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                        onClick={handlePlay}
                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-xl hover:scale-110 active:scale-95 transition-all"
                    >
                        {isThisPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <Link href={`/beats/${beat.id}`} className="block group/title">
                    <h3 className="font-black text-slate-900 text-base truncate mb-1 group-hover/title:text-blue-600 transition-colors">
                        {beat.title}
                    </h3>
                </Link>
                <Link href={`/${beat.producer_username || '#'}`} className="block mb-4">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest hover:text-blue-500 transition-colors">
                        {beat.producer_artistic_name || "Productor"}
                    </p>
                </Link>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Desde</span>
                        <span className="text-sm font-black text-slate-900">
                            ${beat.price_mxn || "299"}
                        </span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${itemInCart
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                : 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30'
                            }`}
                    >
                        {itemInCart ? <Check size={18} strokeWidth={3} /> : <ShoppingCart size={18} />}
                    </button>
                </div>
            </div>

            <LicenseSelectionModal
                beat={beat}
                isOpen={isLicenseModalOpen}
                onClose={() => setIsLicenseModalOpen(false)}
            />
        </div>
    );
}
