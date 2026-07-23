"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    Play, Pause, Heart, Share2, Music2, ArrowLeft, 
    Clock, ListMusic, User, Globe, Calendar, Shuffle, Edit2, Crown 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatRow from '@/components/BeatRow';
import PlaylistCover from '@/components/PlaylistCover';
import PlaylistManagerModal from '@/components/PlaylistManagerModal';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/context/PlayerContext';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';

export default function PlaylistDetailPage() {
    const { username, playlistId } = useParams();
    const router = useRouter();
    const { currentBeat, isPlaying, playBeat, setPlaylistAndPlay } = usePlayer();
    const { showToast } = useToast();
    const { currentUserId } = useCart();
    
    const [playlist, setPlaylist] = useState<any>(null);
    const [producer, setProducer] = useState<any>(null);
    const [beats, setBeats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isOwner = currentUserId === playlist?.usuario_id;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Playlist & Producer
                const { data: plData, error: plErr } = await supabase
                    .from('listas_reproduccion')
                    .select('*, perfiles!usuario_id(*)')
                    .eq('id', playlistId)
                    .single();

                if (plErr || !plData) {
                    showToast("No se encontró la playlist", "error");
                    router.push(`/${username}`);
                    return;
                }

                setPlaylist(plData);
                setProducer(plData.perfiles);

                // 2. Fetch Playlist Items (Beats)
                const { data: itemsData, error: itemsErr } = await supabase
                    .from('listas_reproduccion_items')
                    .select('*, beat:beats(*)')
                    .eq('playlist_id', playlistId)
                    .order('indice_orden', { ascending: true });

                if (itemsErr) throw itemsErr;
                
                const loadedBeats = itemsData.map(i => i.beat).filter(Boolean);
                // Attach producer info to each beat for compatibility
                const beatsWithPro = loadedBeats.map(b => ({
                    ...b,
                    productor_nombre_usuario: plData.perfiles.nombre_usuario,
                    productor_nombre_artistico: plData.perfiles.nombre_artistico || plData.perfiles.nombre_usuario,
                    productor_esta_verificado: plData.perfiles.esta_verificado,
                    productor_es_fundador: plData.perfiles.es_fundador
                }));
                
                setBeats(beatsWithPro);
            } catch (err: any) {
                console.error("Error loading playlist:", err);
                showToast("Error al cargar la playlist", "error");
            } finally {
                setIsLoading(false);
            }
        };

        if (playlistId) fetchData();
    }, [playlistId, username, router]);

    const handlePlayAll = () => {
        if (beats.length === 0) return;
        setPlaylistAndPlay(beats, 0);
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: playlist.nombre, url });
        } else {
            navigator.clipboard.writeText(url);
            showToast("Enlace copiado al portapapeles", "success");
        }
    };

    const handleRemoveBeat = async (beatId: string) => {
        try {
            const { error } = await supabase
                .from('listas_reproduccion_items')
                .delete()
                .eq('playlist_id', playlistId)
                .eq('beat_id', beatId);
            
            if (error) throw error;
            setBeats(prev => prev.filter(b => b.id !== beatId));
            showToast("Beat quitado de la playlist", "success");
        } catch (err: any) {
            console.error("Error removing beat:", err);
            showToast("Error al quitar el beat", "error");
        }
    };

    const handleMoveBeat = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === beats.length - 1) return;

        const newBeats = [...beats];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Swap
        const temp = newBeats[index];
        newBeats[index] = newBeats[swapIndex];
        newBeats[swapIndex] = temp;
        
        setBeats(newBeats);

        try {
            // Update indices individually mapping by beat_id to avoid constraint or missing ID upsert issues
            await Promise.all(newBeats.map((b, i) => 
                supabase
                    .from('listas_reproduccion_items')
                    .update({ indice_orden: i })
                    .eq('playlist_id', playlistId)
                    .eq('beat_id', b.id)
            ));
        } catch (err) {
            console.error("Error al reordenar:", err);
            showToast("Error al procesar el reordenamiento", "error");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
        );
    }

    if (!playlist) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            
            <main className="flex-1 pb-32 md:pb-24 min-h-screen">
                {/* Header Section */}
                <div className="relative pt-20 pb-10 md:pt-32 md:pb-16 overflow-hidden flex flex-col items-center justify-center">
                    {/* Background Blur — reducido en móvil para mejor rendimiento */}
                    <div className="absolute inset-0 z-0">
                        <PlaylistCover beats={beats} size="lg" className="w-[120%] h-[120%] -ml-[10%] -mt-[10%] object-cover blur-[60px] md:blur-[140px] opacity-50 md:opacity-60 saturate-150" />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
                    </div>

                    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 w-full flex flex-col items-center">
                        <button
                            onClick={() => router.back()}
                            className="mb-5 md:mb-8 self-start flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={14} /> Volver
                        </button>

                        <div className="flex flex-col items-center gap-5 md:gap-10 w-full mt-2 md:mt-4">
                            <PlaylistCover beats={beats} size="lg" className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 shadow-xl shadow-accent/20 rounded-2xl md:rounded-3xl overflow-hidden hover:scale-105 transition-transform duration-500" />

                            <div className="flex-1 text-center space-y-3 md:space-y-5 w-full flex flex-col items-center">
                                <span className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-black uppercase tracking-widest text-accent">
                                    <ListMusic size={12} /> Playlist {!playlist.es_publica && "(Privada)"}
                                </span>
                                <h1 className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-foreground leading-[0.85] filter drop-shadow-lg text-center px-2">
                                    {playlist.nombre}
                                </h1>
                                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[12px] font-bold text-muted uppercase tracking-widest mt-1 md:mt-2">
                                    <Link href={`/${producer?.nombre_usuario || '#'}`} className="flex items-center gap-2.5 text-foreground bg-foreground/[0.03] hover:bg-foreground/[0.08] transition-colors pr-4 rounded-full border border-border/50 pb-1 pt-1 pl-1">
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-accent/20 border border-accent/30 shadow-md">
                                            {producer?.foto_perfil && <Image src={producer.foto_perfil} alt={producer?.nombre_artistico || producer?.nombre_usuario || ''} fill sizes="32px" className="object-cover" />}
                                        </div>
                                        <span className="font-black">{producer?.nombre_artistico || producer?.nombre_usuario}</span>
                                        {producer?.esta_verificado && <img src="/verified-badge.png" className="w-3.5 h-3.5 object-contain" alt="Verificado"/>}
                                        {producer?.es_fundador && <Crown size={14} className="text-amber-500" fill="currentColor"/>}
                                    </Link>
                                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                    <span className="font-black text-foreground">{beats.length} Beats</span>
                                    {playlist.duracion && (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-border hidden sm:block" />
                                            <span className="flex items-center gap-1.5 hidden sm:flex"><Clock size={14} /> {playlist.duracion}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>

                        <div className="mt-8 md:mt-14 mb-4 flex flex-wrap items-center justify-center gap-3 md:gap-4 w-full">
                            <button
                                onClick={handlePlayAll}
                                className="flex-1 sm:flex-none px-6 sm:px-10 py-4 bg-accent text-white rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.03] active:scale-95 transition-all overflow-hidden relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <Play fill="currentColor" size={20} /> Reproducir Todo
                            </button>
                            <button
                                onClick={handleShare}
                                className="w-12 h-12 rounded-2xl bg-foreground/[0.03] border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-foreground/[0.05] active:scale-95 transition-all"
                            >
                                <Share2 size={20} />
                            </button>
                            {isOwner && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="px-5 h-12 flex items-center gap-2 rounded-2xl bg-foreground/[0.03] border border-border text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:bg-foreground/[0.05] active:scale-95 transition-all"
                                >
                                    <Edit2 size={16} /> <span className="hidden sm:inline">Editar Playlist</span><span className="sm:hidden">Editar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Beats List Section */}
                <div className="max-w-4xl mx-auto px-3 sm:px-6 mt-2 relative z-20">
                    <div className="grid gap-4">
                        {beats.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-border rounded-[2.5rem]">
                                <Music2 size={48} className="mx-auto text-muted/20 mb-4" />
                                <h3 className="text-xl font-black uppercase tracking-tight">Sin Beats aún</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">Esta playlist está vacía actualmente.</p>
                            </div>
                        ) : (
                            beats.map((beat, idx) => (
                                <motion.div
                                    key={beat.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                                >
                                    <BeatRow 
                                        beat={beat} 
                                        onRemoveFromPlaylist={isOwner ? () => handleRemoveBeat(beat.id) : undefined} 
                                        onMoveUp={isOwner && idx > 0 ? () => handleMoveBeat(idx, 'up') : undefined}
                                        onMoveDown={isOwner && idx < beats.length - 1 ? () => handleMoveBeat(idx, 'down') : undefined}
                                    />
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </main>
            
            <Footer />

            <PlaylistManagerModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                producerId={currentUserId || ''}
                existingPlaylist={playlist}
                onSuccess={() => {
                    // Update playlist data locally so it refreshes without full reload
                    const fetchData = async () => {
                        const { data } = await supabase.from('listas_reproduccion').select('*').eq('id', playlistId).single();
                        if (data) setPlaylist((prev: any) => ({...prev, ...data}));
                    };
                    fetchData();
                }}
            />
        </div>
    );
}
