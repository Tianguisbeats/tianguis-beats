"use client";

import { Beat } from '@/lib/types';
import Link from 'next/link';
import { Play, Pause, ShoppingCart, Check, Music, Crown, ChevronRight, Flame } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import LicenseSelectionModal from '@/components/LicenseSelectionModal';

interface BeatCardProProps {
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

    const getGenreStyles = () => {
        return 'bg-card border-border hover:shadow-accent/5';
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLicenseModalOpen(true);
    };

    const cardStyles = getGenreStyles();

    return (
        <div className={`group relative rounded-[2rem] overflow-hidden border transition-all duration-700 hover:-translate-y-1 flex flex-col h-full ${cardStyles}`}>
            {/* Image Section */}
            <div className="relative aspect-square overflow-hidden p-3 pb-1">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative shadow-inner group">
                    {beat.portadabeat_url ? (
                        <img
                            src={beat.portadabeat_url}
                            alt={beat.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-accent-soft flex items-center justify-center text-muted/30">
                            <Music size={60} />
                        </div>
                    )}

                    {/* Trending Badge */}
                    <div className="absolute top-5 left-5 z-10 scale-90 origin-top-left">
                        <span className="bg-background/90 backdrop-blur-md text-foreground text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.1em] shadow-xl flex items-center gap-2 border border-border">
                            <Flame size={14} className="text-orange-500 fill-orange-500" /> TRENDING
                        </span>
                    </div>

                    {/* Play Button Overlay */}
                    <div className={`absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-center justify-center backdrop-blur-[1px] ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={handlePlay}
                            className="w-12 h-12 md:w-16 md:h-16 bg-background/95 text-accent rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all backdrop-blur-sm min-h-[48px] min-w-[48px]"
                        >
                            {isThisPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-4 md:px-6 pt-0 pb-6 flex flex-col flex-1">
                <Link href={`/beats/${beat.id}`} className="block mt-1 mb-2 min-h-[32px] flex items-center">
                    <h3 className="font-black text-foreground text-base md:text-lg tracking-tighter leading-none truncate hover:text-accent transition-colors lowercase font-heading">
                        {beat.title}
                    </h3>
                </Link>

                {/* Producer Row */}
                <Link href={`/${beat.producer_username || '#'}`} className="flex items-center gap-2 mb-4 group/prod min-h-[40px]">
                    <div className="relative">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-accent p-0.5 shadow-lg shadow-accent/10 transform transition-transform group-hover/prod:scale-110">
                            <img
                                src={beat.producer_foto_perfil || `https://ui-avatars.com/api/?name=${beat.producer_artistic_name}&background=random`}
                                className="w-full h-full object-cover rounded-full"
                                alt="Producer"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] md:text-[11px] font-black uppercase text-muted tracking-[0.15em] truncate group-hover/prod:text-accent transition-colors">
                                {beat.producer_artistic_name}
                            </p>
                            {beat.producer_is_verified && (
                                <img src="/verified-badge.png" className="w-3.5 h-3.5 object-contain" alt="Verificado" />
                            )}
                            {beat.producer_is_founder && (
                                <Crown size={12} className="text-yellow-400 fill-yellow-400" />
                            )}
                        </div>
                    </div>
                </Link>

                {/* Pills Section */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {beat.genre && (
                        <span className="text-[7px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-2xl border border-green-500/20 uppercase tracking-widest leading-none">
                            {beat.genre}
                        </span>
                    )}
                    <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-2xl border border-amber-500/20 uppercase tracking-widest leading-none">
                        {beat.bpm} BPM
                    </span>
                    <span className="text-[8px] font-black text-accent bg-accent/10 px-2 py-1 rounded-2xl border border-accent/20 uppercase tracking-widest leading-none">
                        {(beat.musical_key || 'C').replace('Maj', '').replace('Min', '')}
                    </span>
                    <span className="text-[8px] font-black text-purple-500 bg-purple-500/10 px-2 py-1 rounded-2xl border border-purple-500/20 uppercase tracking-widest leading-none">
                        {beat.musical_scale?.toUpperCase() === 'MINOR' || beat.musical_scale?.toUpperCase() === 'MENOR' ? 'MENOR' : 'MAYOR'}
                    </span>
                </div>

                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-muted font-black uppercase tracking-[0.2em] mb-0.5 italic">Desde</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl md:text-2xl font-black text-accent tracking-tighter">
                                {formatPriceMXN(beat.price_mxn).split('.')[0]}
                            </span>
                        </div>
                        <button onClick={handleAddToCart} className="text-[8px] font-black text-muted uppercase tracking-[0.1em] mt-1 group/lic flex items-center gap-1 hover:text-accent transition-colors min-h-[24px]">
                            VER LICENCIAS <ChevronRight size={8} className="group-hover/lic:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-[0.8rem] flex items-center justify-center transition-all shadow-xl active:scale-95 min-h-[36px] min-w-[36px] ${itemInCart
                            ? 'bg-green-500 text-white shadow-green-500/30'
                            : 'bg-accent text-white hover:bg-accent/90 shadow-accent/10 border border-transparent'
                            }`}
                    >
                        {itemInCart ? <Check size={20} strokeWidth={4} /> : <ShoppingCart size={18} />}
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
