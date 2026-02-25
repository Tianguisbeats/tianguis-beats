/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Beat } from '@/lib/types';
import Link from 'next/link';
import { Play, Pause, Music, Crown, Flame, Heart, Edit3, DollarSign } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useState, useEffect } from 'react';
import LicenseSelectionModal from '@/components/LicenseSelectionModal';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface BeatCardProProps {
    beat: Beat;
    compact?: boolean;
}


export default function BeatCardPro({ beat, compact = false }: BeatCardProProps) {
    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { isInCart, currentUserId } = useCart();
    const { showToast } = useToast();
    const { formatPrice } = useCurrency();
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const router = useRouter();

    const isThisPlaying = currentBeat?.id === beat.id && isPlaying;
    const itemInCart = isInCart(beat.id);
    const isOwner = currentUserId && beat.productor_id === currentUserId;

    // Initial like state
    useEffect(() => {
        const checkLikeStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { count } = await supabase
                    .from('favoritos')
                    .select('id', { count: 'exact', head: true })
                    .eq('beat_id', beat.id)
                    .eq('usuario_id', user.id);
                setIsLiked(!!count);
            }
        };
        checkLikeStatus();
    }, [beat.id]);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        if (isLiked) {
            const { error } = await supabase
                .from('favoritos')
                .delete()
                .eq('beat_id', beat.id)
                .eq('usuario_id', user.id);

            if (!error) {
                setIsLiked(false);
            }
        } else {
            const { error } = await supabase
                .from('favoritos')
                .insert({
                    beat_id: beat.id,
                    usuario_id: user.id
                });

            if (!error) {
                setIsLiked(true);
            }
        }
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        playBeat({
            ...beat,
            is_verified: beat.productor_esta_verificado,
            is_founder: beat.productor_es_fundador
        } as unknown as Beat);
    };

    const getGenreStyles = () => {
        return 'bg-card border-border hover:shadow-accent/5';
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === beat.productor_id) {
            showToast("No puedes comprar tus propios beats.", "warning");
            return;
        }

        setIsLicenseModalOpen(true);
    };

    const cardStyles = getGenreStyles();

    return (
        <div className={`card-modern flex flex-col h-full ${compact ? 'max-w-[280px]' : ''} ${cardStyles}`}>
            {/* Image Section */}
            <div className="relative aspect-square overflow-hidden p-2 pb-0">
                <div className="w-full h-full rounded-[1.2rem] overflow-hidden relative shadow-inner group">
                    {beat.portada_url ? (
                        <img
                            src={beat.portada_url}
                            alt={beat.titulo}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-accent-soft flex items-center justify-center text-muted/30">
                            <Music size={60} />
                        </div>
                    )}

                    {/* Trending Badge */}
                    <div className={`absolute top-5 left-5 z-10 ${compact ? 'scale-75' : 'scale-90'} origin-top-left`}>
                        <span className={`bg-background/90 backdrop-blur-md text-foreground ${compact ? 'text-[8px]' : 'text-[10px]'} font-black px-4 py-2 rounded-2xl uppercase tracking-[0.1em] shadow-xl flex items-center gap-2 border border-border`}>
                            <Flame size={compact ? 12 : 14} className="text-accent fill-accent" /> TRENDING
                        </span>
                    </div>

                    {/* Playing Animation Indicator */}
                    {isThisPlaying && (
                        <div className="absolute top-5 right-5 z-10 flex items-center gap-[2px] h-4 bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/10">
                            <div className="w-[3px] h-full bg-accent animate-[playing-bar_0.6s_ease-in-out_infinite_alternate]" />
                            <div className="w-[3px] h-full bg-accent animate-[playing-bar_0.8s_ease-in-out_infinite_alternate_0.2s]" />
                            <div className="w-[3px] h-full bg-accent animate-[playing-bar_0.5s_ease-in-out_infinite_alternate_0.1s]" />
                        </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className={`absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-center justify-center backdrop-blur-[1px] ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {beat.esta_vendido ? (
                            <div className="bg-error/90 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-2xl border border-white/20 rotate-[-12deg]">
                                Vendido
                            </div>
                        ) : (
                            <button
                                onClick={handlePlay}
                                className={`${compact ? 'w-8 h-8' : 'w-10 h-10 md:w-12 md:h-12'} bg-background/95 text-accent rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all backdrop-blur-sm min-h-0 min-w-0 p-0`}
                            >
                                {isThisPlaying ? <Pause fill="currentColor" size={compact ? 16 : 20} /> : <Play fill="currentColor" size={compact ? 16 : 20} className="ml-1" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-3 md:px-4 pt-0 pb-4 flex flex-col flex-1 items-center text-center">
                <Link href={`/beats/${beat.id}`} className={`block mt-1 mb-1 ${compact ? 'min-h-[24px]' : 'min-h-[32px]'} flex items-center justify-center w-full`}>
                    <h3 className={`font-black text-foreground ${compact ? 'text-lg' : 'text-xl md:text-2xl'} tracking-tighter leading-none truncate hover:text-accent transition-colors lowercase font-heading w-full text-center`}>
                        {beat.titulo}
                    </h3>
                </Link>

                {/* Producer Row */}
                <Link href={`/${beat.productor_nombre_usuario || '#'}`} className={`flex items-center gap-2 ${compact ? 'mb-1.5' : 'mb-3'} group/prod ${compact ? 'min-h-[24px]' : 'min-h-[32px]'} justify-center w-full`}>
                    <div className="relative shrink-0">
                        <div className={`${compact ? 'w-5 h-5' : 'w-6 h-6 md:w-8 md:h-8'} rounded-full overflow-hidden border-2 transition-transform group-hover/prod:scale-110 border-border group-hover/prod:border-accent`}>
                            <img
                                src={beat.productor_foto_perfil || `https://ui-avatars.com/api/?name=${beat.productor_nombre_artistico}&background=random`}
                                className="w-full h-full object-cover rounded-full"
                                alt="Producer"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col truncate min-w-0">
                        <div className="flex items-center gap-1.5 justify-center">
                            <p className={`${compact ? 'text-[10px]' : 'text-xs md:text-sm'} font-black uppercase text-muted tracking-tight truncate group-hover/prod:text-accent transition-colors`}>
                                {beat.productor_nombre_artistico}
                            </p>
                            {beat.productor_esta_verificado && (
                                <img src="/verified-badge.png" className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} object-contain`} alt="Verificado" />
                            )}
                            {beat.productor_es_fundador && (
                                <Crown size={compact ? 10 : 12} className="text-accent fill-accent" />
                            )}
                        </div>
                    </div>
                </Link>

                {/* Pills Section */}
                <div className={`flex flex-wrap gap-1 ${compact ? 'mb-2' : 'mb-4'} justify-center w-full`}>
                    {beat.genero && (
                        <span className={`text-[7px] font-black text-success bg-success/10 ${compact ? 'px-1.5' : 'px-2'} py-1 rounded-2xl border border-success/20 uppercase tracking-widest leading-none`}>
                            {beat.genero}
                        </span>
                    )}
                    <span className={`text-[7px] font-black text-muted bg-accent-soft ${compact ? 'px-1.5' : 'px-2'} py-1 rounded-2xl border border-border uppercase tracking-widest leading-none`}>
                        {beat.bpm} BPM
                    </span>
                    <span className={`text-[7px] font-black text-muted bg-accent-soft ${compact ? 'px-1.5' : 'px-2'} py-1 rounded-2xl border border-border uppercase tracking-widest leading-none`}>
                        {(beat.nota_musical || 'C').split(' ')[0].replace('m', '')}
                    </span>
                    <span className={`text-[7px] font-black text-accent bg-accent/10 ${compact ? 'px-1.5' : 'px-2'} py-1 rounded-2xl border border-accent/20 uppercase tracking-widest leading-none`}>
                        {beat.escala_musical === 'Menor' ? 'minor' : 'Major'}
                    </span>
                </div>

                <div className={`mt-auto ${compact ? 'pt-2' : 'pt-4'} border-t border-border flex items-center justify-between gap-2`}>
                    <div className="flex-1 min-w-0">
                        {isOwner ? (
                            <div className={`w-full ${compact ? 'h-7' : 'h-9'} flex items-center justify-center gap-2 p-2 cursor-default select-none`}>
                                <div className="flex items-center gap-2 text-foreground dark:text-white">
                                    <Crown size={compact ? 12 : 14} className="text-accent fill-accent" />
                                    <span className={`font-black uppercase tracking-[0.4em] ${compact ? 'text-[8px]' : 'text-[9px]'} opacity-70`}>
                                        Es tu Beat
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href={`/beats/${beat.id}`}
                                className={`w-full ${compact ? 'h-7' : 'h-9'} flex items-center justify-center gap-2 group/btn transition-colors hover:text-accent`}
                            >
                                {beat.esta_vendido ? (
                                    <span className={`font-black ${compact ? 'text-[7px]' : 'text-[8px] md:text-[9px]'} uppercase tracking-widest text-slate-400`}>No Disponible</span>
                                ) : (
                                    <>
                                        <DollarSign size={compact ? 12 : 14} className="text-success" />
                                        <span className={`font-black ${compact ? 'text-[7px]' : 'text-[8px] md:text-[9px]'} uppercase tracking-[0.2em] text-foreground/80 group-hover/btn:text-accent transition-colors`}>
                                            {compact ? 'Ver Licencia' : `Ver Licencias`}
                                        </span>
                                    </>
                                )}
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={handleLike}
                        className={`${compact ? 'w-7 h-7' : 'w-10 h-10'} rounded-xl flex items-center justify-center transition-all bg-card border border-border/50 shadow-sm active:scale-95 shrink-0 ${isLiked ? 'text-error border-error/20 bg-error/10' : 'text-muted hover:text-error hover:border-error/20'}`}
                    >
                        <Heart size={compact ? 14 : 18} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
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
