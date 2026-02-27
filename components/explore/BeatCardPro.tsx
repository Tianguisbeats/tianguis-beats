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
import Link from 'next/link';
import { Play, Pause, Music, Crown, Heart, DollarSign, ListMusic, Plus } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useState, useEffect } from 'react';
import LicenseSelectionModal from '@/components/LicenseSelectionModal';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MUSICAL_KEYS } from '@/lib/constants';

interface BeatCardProProps {
    beat: Beat;
    compact?: boolean;
}

export default function BeatCardPro({ beat, compact = false }: BeatCardProProps) {
    /* ── Contextos globales: reproductor, carrito, toasts, moneda ── */
    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { isInCart, currentUserId } = useCart();
    const { showToast } = useToast();
    const { formatPrice } = useCurrency();
    const router = useRouter();

    /* ── Estado local: like y modal de licencias ── */
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    /* ── Helpers de estado ── */
    const isThisPlaying = currentBeat?.id === beat.id && isPlaying;
    const isOwner = currentUserId && beat.productor_id === currentUserId;

    /* ── Verifica si el beat ya está en favoritos del usuario ── */
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

    /* ── Toggle de like / unlike en la tabla favoritos ── */
    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        if (isLiked) {
            const { error } = await supabase.from('favoritos').delete()
                .eq('beat_id', beat.id).eq('usuario_id', user.id);
            if (!error) setIsLiked(false);
        } else {
            const { error } = await supabase.from('favoritos')
                .insert({ beat_id: beat.id, usuario_id: user.id });
            if (!error) setIsLiked(true);
        }
    };

    /* ── Reproduce o pausa el beat en el reproductor global ── */
    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        playBeat({ ...beat, is_verified: beat.productor_esta_verificado, is_founder: beat.productor_es_fundador } as unknown as Beat);
    };

    /* ── Abre el modal de selección de licencia (si no es el dueño) ── */
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

    return (
        <div className={`tianguis-card flex flex-col h-full ${compact ? 'max-w-[260px]' : ''}`}>

            {/* ── Portada del beat ── */}
            <div className="relative aspect-square overflow-hidden p-2 pb-0">
                <div className="w-full h-full rounded-[1.2rem] overflow-hidden relative shadow-inner group">

                    {/* Imagen de portada */}
                    {beat.portada_url ? (
                        <img src={beat.portada_url} alt={beat.titulo}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full bg-accent-soft flex items-center justify-center text-muted/30">
                            <Music size={48} strokeWidth={1} />
                        </div>
                    )}

                    {/* Indicador de ondas cuando está sonando */}
                    {isThisPlaying && (
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-[3px] h-5 bg-black/60 backdrop-blur-md px-2 py-2 rounded-xl border border-white/20 shadow-lg">
                            <div className="w-[3px] h-3 bg-accent animate-wave-sm" />
                            <div className="w-[3px] h-4 bg-accent animate-wave-lg" />
                            <div className="w-[3px] h-3 bg-accent animate-wave-md" />
                            <div className="w-[3px] h-1 bg-accent animate-pulse" />
                        </div>
                    )}

                    {/* Botón Play/Pause:
                        — En escritorio: solo visible en hover (opacity-0 group-hover:opacity-100)
                        — En móvil: siempre visible en la esquina inferior derecha */}
                    {!beat.esta_vendido && (
                        <>
                            {/* Versión escritorio (hover) */}
                            <div className={`hidden md:flex absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-all items-center justify-center ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <button onClick={handlePlay}
                                    className="w-12 h-12 bg-background/95 text-accent rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all backdrop-blur-sm">
                                    {isThisPlaying ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-1" />}
                                </button>
                            </div>

                            {/* Versión móvil: botón siempre visible en esquina inferior derecha */}
                            <button onClick={handlePlay}
                                className={`md:hidden absolute bottom-2.5 right-2.5 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isThisPlaying
                                    ? 'bg-accent text-white scale-110'
                                    : 'bg-background/95 text-accent backdrop-blur-sm'
                                    }`}>
                                {isThisPlaying ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} className="ml-0.5" />}
                            </button>
                        </>
                    )}

                    {/* Badge de beat vendido */}
                    {beat.esta_vendido && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-background/90 text-foreground font-black px-3 py-1.5 rounded-xl text-[9px] uppercase tracking-widest shadow-2xl border border-border -rotate-6">
                                Vendido
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Información del beat ── */}
            <div className="px-3 pt-2 pb-3 flex flex-col flex-1 items-center text-center gap-1">

                {/* Título */}
                <Link href={`/beats/${beat.id}`} className="block w-full">
                    <h3 className={`font-black text-foreground tracking-tighter leading-tight truncate hover:text-accent transition-colors lowercase font-heading w-full text-center ${compact ? 'text-base' : 'text-lg md:text-xl'}`}>
                        {beat.titulo}
                    </h3>
                </Link>

                {/* Fila del productor: avatar + nombre + badges */}
                <Link href={`/${beat.productor_nombre_usuario || '#'}`}
                    className="flex items-center gap-1.5 group/prod min-h-[32px] justify-center w-full">
                    <div className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full overflow-hidden border-2 shrink-0 transition-transform group-hover/prod:scale-110 ${beat.productor_nivel_suscripcion === 'premium'
                        ? 'border-[#00f2ff] shadow-sm shadow-[#00f2ff]/20'
                        : beat.productor_es_fundador
                            ? 'border-amber-500 shadow-sm shadow-amber-500/20'
                            : beat.productor_nivel_suscripcion === 'pro'
                                ? 'border-accent shadow-sm shadow-accent/20'
                                : 'border-border'
                        }`}>
                        <img src={beat.productor_foto_perfil || `https://ui-avatars.com/api/?name=${beat.productor_nombre_artistico}&background=random`}
                            className="w-full h-full object-cover rounded-full" alt="Producer" />
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                        <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-black uppercase text-muted tracking-tight truncate group-hover/prod:text-accent transition-colors`}>
                            {beat.productor_nombre_artistico || beat.productor_nombre_usuario || 'Artista'}
                        </p>
                        {beat.productor_esta_verificado && (
                            <img src="/verified-badge.png" className="w-3 h-3 object-contain shrink-0" alt="Verificado" />
                        )}
                        {beat.productor_es_fundador && (
                            <Crown size={10} className="text-amber-500 fill-amber-500 shrink-0" />
                        )}
                    </div>
                </Link>

                {/* Pills: género, BPM, tonalidad */}
                <div className="flex flex-wrap gap-1.5 justify-center w-full">
                    {beat.genero && (
                        <span className="text-[7px] font-black text-accent bg-accent/10 px-2 py-1 rounded-full border border-accent/20 uppercase tracking-widest leading-none">
                            {beat.genero}
                        </span>
                    )}
                    <span className="text-[7px] font-black text-accent bg-accent/10 px-2 py-1 rounded-full border border-accent/20 uppercase tracking-widest leading-none">
                        {beat.bpm} BPM
                    </span>
                    {beat.tono_escala && (
                        <span className="text-[7px] font-black text-accent bg-accent/10 px-2 py-1 rounded-full border border-accent/20 uppercase tracking-widest leading-none">
                            {MUSICAL_KEYS.find(k => k.value === beat.tono_escala)?.label || beat.tono_escala}
                        </span>
                    )}
                </div>

                {/* ── Pie de la tarjeta: licencias + like ── */}
                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2 w-full">
                    <div className="flex-1 min-w-0">
                        {isOwner ? (
                            /* Si es el dueño del beat, muestra "Es tu Beat" */
                            <div className="h-9 flex items-center justify-center gap-2">
                                <Crown size={13} className="text-accent fill-accent" />
                                <span className="font-black uppercase tracking-[0.3em] text-[8px] opacity-70 text-foreground">Es tu Beat</span>
                            </div>
                        ) : (
                            /* Si no es el dueño, botón para ver licencias */
                            <Link href={`/beats/${beat.id}`}
                                className="h-9 flex items-center justify-center gap-1.5 group/btn transition-colors hover:text-accent w-full">
                                {beat.esta_vendido ? (
                                    <span className="font-black text-[8px] uppercase tracking-widest text-muted">No Disponible</span>
                                ) : (
                                    <>
                                        <DollarSign size={13} className="text-success shrink-0" />
                                        <span className="font-black text-[8px] uppercase tracking-[0.2em] text-foreground/80 group-hover/btn:text-accent transition-colors">
                                            Ver Licencias
                                        </span>
                                    </>
                                )}
                            </Link>
                        )}
                    </div>

                    {/* Botón de like / favorito — target táctil mínimo 44px */}
                    <div className="flex gap-2 shrink-0">
                        {/* Añadir a Playlist: SOLO PARA EL DUEÑO */}
                        {isOwner && (
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsPlaylistModalOpen(true); }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-border bg-card hover:border-accent/40 hover:bg-accent/5 text-muted hover:text-accent shadow-sm active:scale-90"
                                title="Gestionar en mis playlists">
                                <Plus size={16} />
                            </button>
                        )}

                        <button onClick={handleLike}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border shadow-sm active:scale-90 shrink-0 group/heart touch-manipulation ${isLiked
                                ? 'text-red-500 border-red-500/50 bg-red-50 dark:bg-red-500/10'
                                : 'text-red-400 border-border hover:border-red-500/50 hover:bg-red-500/5'
                                }`}
                            title={isLiked ? "Quitar de favoritos" : "Añadir a favoritos"}>
                            <Heart size={16} className={`transition-all duration-300 ${isLiked ? 'fill-red-500 scale-110' : 'group-hover/heart:scale-110'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Modales ── */}
            <LicenseSelectionModal
                beat={beat}
                isOpen={isLicenseModalOpen}
                onClose={() => setIsLicenseModalOpen(false)}
            />

            <AddToPlaylistModal
                isOpen={isPlaylistModalOpen}
                beatId={beat.id}
                onClose={() => setIsPlaylistModalOpen(false)}
            />
        </div>
    );
}
