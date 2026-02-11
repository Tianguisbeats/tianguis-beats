/**
 * Componente BeatCard: Tarjeta para mostrar información individual de un beat.
 * @param beat Datos del beat provenientes de la base de datos o dummy data.
 */
import { Music, Play, Pause, ShoppingCart, CheckCircle2, Crown, Check, ChevronRight, Flame } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Beat } from '@/lib/types';
import LicenseSelectionModal from './LicenseSelectionModal';
import { useState } from 'react';

interface BeatCardProps {
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

export default function BeatCard({ beat }: BeatCardProps) {
    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { addItem, isInCart, currentUserId } = useCart();
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
    const isThisPlaying = currentBeat?.id === beat.id && isPlaying;
    const itemInCart = isInCart(beat.id);
    const isOwner = currentUserId && beat.producer_id === currentUserId;

    const coverColor = beat.coverColor || "bg-slate-50";
    const tagColor = beat.tagColor || "bg-blue-600";

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Use tagged URL for public listening if available
        const playbackUrl = beat.mp3_url;
        playBeat({
            ...beat,
            mp3_url: playbackUrl,
            is_verified: beat.producer_is_verified,
            is_founder: beat.producer_is_founder
        });
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLicenseModalOpen(true);
    };

    return (
        <div className="group relative bg-white rounded-[3.5rem] overflow-hidden border border-slate-100/60 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-700 hover:-translate-y-2 flex flex-col h-full">
            {/* Image Section */}
            <div className="relative aspect-square overflow-hidden p-4 pb-2">
                <div className="w-full h-full rounded-[3rem] overflow-hidden relative shadow-inner group">
                    {beat.portadabeat_url ? (
                        <img
                            src={beat.portadabeat_url}
                            alt={beat.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <Music size={60} />
                        </div>
                    )}

                    {/* Trending Badge */}
                    <div className="absolute top-5 left-5 z-10 scale-90 origin-top-left">
                        <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.1em] shadow-xl flex items-center gap-2 border border-white">
                            <Flame size={14} className="text-orange-500 fill-orange-500" /> TRENDING
                        </span>
                    </div>

                    {/* Play Button Overlay */}
                    <div className={`absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-center justify-center backdrop-blur-[1px] ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={handlePlay}
                            className="w-20 h-20 bg-white/95 text-blue-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all backdrop-blur-sm"
                        >
                            {isThisPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} className="ml-1" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-8 pt-0 pb-8 flex flex-col flex-1">
                <Link href={`/beats/${beat.id}`} className="block mt-4 mb-5">
                    <h3 className="font-black text-[#0F172A] text-3xl tracking-tighter leading-none truncate hover:text-blue-600 transition-colors lowercase">
                        {beat.title}
                    </h3>
                </Link>

                {/* Producer Row */}
                <Link href={`/${beat.producer_username || (typeof beat.producer === 'object' ? beat.producer.username : beat.producer) || '#'}`} className="flex items-center gap-3 mb-8 group/prod">
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 p-0.5 shadow-lg shadow-blue-500/10 transform transition-transform group-hover/prod:scale-110 ${beat.producer_tier === 'premium' ? 'border-blue-500' :
                            beat.producer_tier === 'pro' ? 'border-amber-400' : 'border-slate-100'
                            }`}>
                            <img
                                src={beat.producer_foto_perfil || (typeof beat.producer === 'object' ? beat.producer.foto_perfil : '') || `https://ui-avatars.com/api/?name=${beat.producer_artistic_name || (typeof beat.producer === 'object' ? beat.producer.artistic_name : 'P')}&background=random`}
                                className="w-full h-full object-cover rounded-full"
                                alt="Producer"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.15em] truncate group-hover/prod:text-blue-600 transition-colors">
                                {beat.producer_artistic_name || (typeof beat.producer === 'object' ? beat.producer.artistic_name : (beat.producer || "—"))}
                            </p>
                            {(beat.producer_is_verified || (typeof beat.producer === 'object' && beat.producer?.is_verified)) && (
                                <img src="/verified-badge.png" className="w-3.5 h-3.5 object-contain" alt="Verificado" />
                            )}
                            {(beat.producer_is_founder || (typeof beat.producer === 'object' && beat.producer?.is_founder)) && (
                                <Crown size={12} className="text-amber-500 fill-amber-500" />
                            )}
                        </div>
                    </div>
                </Link>

                {/* Pills Section */}
                <div className="flex flex-wrap gap-2.5 mb-8">
                    {beat.genre && (
                        <span className="text-[9px] font-black text-[#10B981] bg-[#ECFDF5] px-4 py-2 rounded-2xl border border-emerald-100 uppercase tracking-widest shadow-sm shadow-emerald-500/5">
                            {beat.genre}
                        </span>
                    )}
                    <span className="text-[10px] font-black text-[#F59E0B] bg-[#FFFBEB] px-4 py-2 rounded-2xl border border-amber-100 uppercase tracking-widest shadow-sm shadow-amber-500/5">
                        {beat.bpm || "—"} BPM
                    </span>
                    <span className="text-[10px] font-black text-[#3B82F6] bg-[#EFF6FF] px-3.5 py-2 rounded-2xl border border-blue-100 uppercase tracking-widest shadow-sm shadow-blue-500/5">
                        {(beat.musical_key || 'C').replace('Maj', '').replace('Min', '')}
                    </span>
                    <span className="text-[10px] font-black text-[#8B5CF6] bg-[#F5F3FF] px-4 py-2 rounded-2xl border border-purple-100 uppercase tracking-widest shadow-sm shadow-purple-500/5">
                        {beat.musical_scale?.toUpperCase() === 'MINOR' || beat.musical_scale?.toUpperCase() === 'MENOR' ? 'MENOR' : 'MAYOR'}
                    </span>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 italic">Desde</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-blue-600 tracking-tighter">
                                {formatPriceMXN(
                                    Math.max(
                                        beat.price_mxn || 0,
                                        beat.price_wav_mxn || 0,
                                        beat.price_stems_mxn || 0,
                                        beat.exclusive_price_mxn || 0
                                    )
                                ).split('.')[0]}
                            </span>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={!!isOwner}
                            className={`text-[10px] font-black uppercase tracking-[0.1em] mt-2 group/lic flex items-center gap-1.5 transition-colors ${isOwner ? 'text-slate-300 cursor-not-allowed hidden' : 'text-slate-400 hover:text-blue-600'}`}
                        >
                            VER LICENCIAS <ChevronRight size={10} className="group-hover/lic:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {!isOwner && (
                        <button
                            onClick={handleAddToCart}
                            className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl active:scale-95 ${itemInCart
                                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white shadow-blue-500/10 border border-slate-50'
                                }`}
                        >
                            {itemInCart ? <Check size={32} strokeWidth={4} /> : <ShoppingCart size={28} />}
                        </button>
                    )}
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
