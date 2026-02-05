"use client";

import { Beat } from '@/lib/types';
import Link from 'next/link';
import { Play, Pause, ShoppingCart, Check, Music, Crown, ChevronRight } from 'lucide-react';
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

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLicenseModalOpen(true);
    };

    return (
        <div className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2">
            {/* Image & Overlay */}
            <div className="relative aspect-square overflow-hidden p-3">
                <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-slate-100 shadow-inner">
                    {beat.portadabeat_url ? (
                        <img
                            src={beat.portadabeat_url}
                            alt={beat.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Music size={48} />
                        </div>
                    )}

                    {/* Quick Badges (BPM/Key) */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        <span className="bg-white/80 backdrop-blur-md text-slate-900 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm">
                            {(beat as any).tag || "🔥 TRENDING"}
                        </span>
                    </div>

                    {/* Play Overlay */}
                    <div className={`absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-all flex items-center justify-center backdrop-blur-[2px] ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={handlePlay}
                            className="w-16 h-16 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                        >
                            {isThisPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} className="ml-1" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-2">
                <Link href={`/beats/${beat.id}`} className="block group/title mb-3">
                    <h3 className="font-black text-slate-900 text-xl tracking-tight leading-tight truncate group-hover/title:text-blue-600 transition-colors">
                        {beat.title}
                    </h3>
                </Link>

                {/* Producer Info */}
                <Link href={`/${beat.producer_username || '#'}`} className="flex items-center gap-3 mb-6 group/prod">
                    <div className={`w-10 h-10 rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${beat.producer_tier === 'premium' ? 'border-amber-400 shadow-lg shadow-amber-400/20' :
                        beat.producer_tier === 'pro' ? 'border-blue-400' : 'border-slate-100'
                        }`}>
                        <img
                            src={beat.producer_foto_perfil || `https://ui-avatars.com/api/?name=${beat.producer_artistic_name}&background=random`}
                            className="w-full h-full object-cover rounded-[0.8rem]"
                            alt="Producer"
                        />
                    </div>
                    <div className="flex flex-col flex-1 truncate">
                        <div className="flex items-center gap-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest truncate group-hover/prod:text-blue-500 transition-colors">
                                {beat.producer_artistic_name}
                            </p>
                            {beat.producer_is_verified && (
                                <div className="p-0.5 bg-blue-500 text-white rounded-full"><Check size={6} strokeWidth={4} /></div>
                            )}
                            {beat.producer_is_founder && (
                                <Crown size={10} className="text-amber-500" fill="currentColor" />
                            )}
                        </div>
                    </div>
                </Link>

                {/* Tags Section */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {beat.genre && (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest">
                            {beat.genre}
                        </span>
                    )}
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 uppercase tracking-widest">
                        {beat.bpm} BPM
                    </span>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 uppercase tracking-widest">
                        {(beat.musical_key || 'C').replace('Maj', '').replace('Min', '')}
                    </span>
                    {beat.musical_scale && (
                        <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 uppercase tracking-widest">
                            {beat.musical_scale === 'Major' ? 'MAYOR' : 'MENOR'}
                        </span>
                    )}
                </div>

                <div className="h-px bg-slate-50 w-full mb-6" />

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 italic">Desde</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-blue-600">
                                {formatPriceMXN(beat.price_mxn)}
                            </span>
                        </div>
                        <button onClick={handleAddToCart} className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 hover:text-blue-500 transition-colors flex items-center gap-1 group/lic">
                            VER LICENCIAS <ChevronRight size={10} className="group-hover/lic:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${itemInCart
                            ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                            : 'bg-slate-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-blue-500/10'
                            }`}
                    >
                        {itemInCart ? <Check size={28} strokeWidth={3} /> : <ShoppingCart size={24} />}
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
