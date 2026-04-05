"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    Play, Pause, Heart, Share2, Music2, ArrowLeft, 
    Clock, ListMusic, User, Globe, Calendar, Shuffle 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatRow from '@/components/BeatRow';
import PlaylistCover from '@/components/PlaylistCover';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/context/PlayerContext';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';

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
            
            <main className="flex-1 pb-24">
                {/* Header Section */}
                <div className="relative pt-32 pb-12 overflow-hidden">
                    {/* Background Blur */}
                    <div className="absolute inset-0 z-0">
                        <PlaylistCover beats={beats} size="lg" className="w-full h-full scale-150 blur-[100px] opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background" />
                    </div>

                    <div className="max-w-6xl mx-auto px-6 relative z-10">
                        <button 
                            onClick={() => router.back()}
                            className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={14} /> Volver
                        </button>

                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
                            <PlaylistCover beats={beats} size="lg" />
                            
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[9px] font-black uppercase tracking-widest text-accent">
                                    <ListMusic size={12} /> Playlist
                                </span>
                                <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground leading-[0.85]">
                                    {playlist.nombre}
                                </h1>
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 text-[11px] font-bold text-muted uppercase tracking-widest">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-accent/20">
                                            {producer?.foto_perfil && <img src={producer.foto_perfil} className="w-full h-full object-cover" />}
                                        </div>
                                        <span>{producer?.nombre_artistico || producer?.nombre_usuario}</span>
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{beats.length} Beats</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span className="flex items-center gap-1.5"><Clock size={12} /> Duración total próximamente</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <button 
                                onClick={handlePlayAll}
                                className="px-10 py-4 bg-accent text-white rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Play fill="currentColor" size={20} /> Reproducir Todo
                            </button>
                            <button 
                                onClick={handleShare}
                                className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-border flex items-center justify-center text-muted hover:text-foreground transition-all"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Beats List Section */}
                <div className="max-w-6xl mx-auto px-6 mt-12">
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
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <BeatRow beat={beat} />
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
