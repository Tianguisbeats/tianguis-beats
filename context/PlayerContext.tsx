"use client";

/**
 * TIANGUIS BEATS - Contexto del Reproductor (Player)
 * Maneja el estado global del reproductor de audio, reproducción de beats,
 * control de volumen y actualización de conteo de reproducciones.
 */

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Beat } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface PlayerContextType {
    currentBeat: Beat | null;
    isPlaying: boolean;
    duration: number;
    currentTime: number;
    volume: number;
    likedBeatIds: Set<string>;
    likedKitIds: Set<string>;
    likesCounts: Record<string, number>; // Nuevo: Mapa global de conteos
    playBeat: (beat: Beat & { product_type?: string, url_audio?: string }) => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleLike: (id: string, type?: 'beat' | 'sound_kit') => Promise<void>;
    closePlayer: () => void;
    playlist: Beat[];
    playlistIndex: number;
    setPlaylistAndPlay: (beats: Beat[], startIndex?: number) => void;
    playNext: () => void;
    playPrevious: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tianguis_volume');
            if (saved !== null) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
            }
        }
        return 0.8;
    });
    const [likedBeatIds, setLikedBeatIds] = useState<Set<string>>(new Set());
    const [likedKitIds, setLikedKitIds] = useState<Set<string>>(new Set());
    const [likesCounts, setLikesCounts] = useState<Record<string, number>>({});
    const [playlist, setPlaylist] = useState<Beat[]>([]);
    const [playlistIndex, setPlaylistIndex] = useState(-1);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();

        const audio = audioRef.current;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        const handleEndedLocal = () => playNext();
        audio.addEventListener('ended', handleEndedLocal);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEndedLocal);
            audio.pause();
        };
    }, []);

    // Fetch initial likes + Realtime Subscription
    useEffect(() => {
        const fetchLikes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [beatsData, kitsData] = await Promise.all([
                    supabase.from('favoritos').select('beat_id').eq('usuario_id', user.id).not('beat_id', 'is', null),
                    supabase.from('favoritos').select('kit_id').eq('usuario_id', user.id).not('kit_id', 'is', null)
                ]);

                if (beatsData.data) {
                    setLikedBeatIds(new Set(beatsData.data.map(f => f.beat_id)));
                }
                if (kitsData.data) {
                    setLikedKitIds(new Set(kitsData.data.map(f => f.kit_id)));
                }

                // Los conteos iniciales se obtienen de los beats ya cargados en cada página.
                // Los cambios en tiempo real se aplican vía suscripción de Supabase Realtime.
            }
        };
        fetchLikes();

        // Realtime subscription for "favoritos" table
        const channel = supabase
            .channel('realtime_favoritos')
            .on('postgres_changes', { event: '*', table: 'favoritos', schema: 'public' }, async (payload) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                if (payload.eventType === 'INSERT') {
                    const newLike = payload.new;
                    if (newLike.usuario_id === user.id) {
                        if (newLike.beat_id) setLikedBeatIds(prev => new Set(prev).add(newLike.beat_id));
                        if (newLike.kit_id) setLikedKitIds(prev => new Set(prev).add(newLike.kit_id));
                    }
                    // Actualizar conteo global (para todos los usuarios viendo el beat)
                    const targetId = newLike.beat_id || newLike.kit_id;
                    if (targetId) setLikesCounts(prev => ({ ...prev, [targetId]: (prev[targetId] || 0) + 1 }));
                } 
                else if (payload.eventType === 'DELETE') {
                    const oldLike = payload.old;
                    // Note: payload.old for DELETE only contains primary keys unless 'replica identity full' is set.
                    // But in our case, 'id' is PK. We might need to handle this carefully.
                    // Usually, for favorites, we just re-fetch or use optimistic logic + realtime as backup.
                    // Since DELETE payload might not have beat_id/usuario_id, we can re-fetch just the user's likes.
                    fetchLikes();
                }
            })
            .subscribe();

        // Listen for auth changes to reset likes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setLikedBeatIds(new Set());
                setLikedKitIds(new Set());
            }
            else fetchLikes();
        });

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const [playCountTracked, setPlayCountTracked] = useState<Set<string>>(new Set());

    // Rastrear el conteo de reproducciones con un retraso de 10 segundos
    useEffect(() => {
        if (!currentBeat || playCountTracked.has(currentBeat.id)) return;

        if (currentTime >= 10) {
            const incrementPlays = async () => {
                try {
                    setPlayCountTracked(prev => new Set(prev).add(currentBeat.id));
                    // Usar la función correcta definida en el master logic
                    await supabase.rpc('incrementar_reproduccion', { id_beat: currentBeat.id });
                } catch (err) {
                    console.error("Error al incrementar el conteo de reproducciones:", err);
                    // Respaldo en caso de fallo del RPC
                    await supabase
                        .from('beats')
                        .update({ conteo_reproducciones: (currentBeat.conteo_reproducciones || 0) + 1 })
                        .eq('id', currentBeat.id);
                }
            };
            incrementPlays();
        }
    }, [currentTime, currentBeat, playCountTracked]);

    // Tracking: Play Retention
    useEffect(() => {
        return () => {
            // Cuando el componente se desmonta o el beat cambia, registramos hasta dónde llegó
            if (currentBeat && currentTime > 0) {
                const trackRetention = async () => {
                    try {
                        const durationLocal = audioRef.current?.duration || 0;
                        const percent = durationLocal > 0 ? (currentTime / durationLocal) * 100 : 0;

                        await supabase.from('analiticas_eventos').insert({
                            productor_id: currentBeat.productor_id,
                            beat_id: currentBeat.id,
                            tipo_evento: 'play_retention',
                            valor_numerico: currentTime,
                            metadatos: {
                                duration: durationLocal,
                                completion_percent: percent,
                                beat_title: currentBeat.titulo
                            }
                        });
                    } catch (err) {
                        console.error("Error tracking retention:", err);
                    }
                };
                trackRetention();
            }
        };
    }, [currentBeat?.id]); // Solo se activa cuando cambia el ID del beat

    const trackFreeDownload = async (beat: Beat) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('analiticas_eventos').insert({
                productor_id: beat.productor_id,
                beat_id: beat.id,
                tipo_evento: 'free_download',
                usuario_id: user?.id || null,
                metadatos: {
                    beat_title: beat.titulo
                }
            });
        } catch (err) {
            console.error("Error tracking free download:", err);
        }
    };

    const playBeat = async (beat: Beat) => {
        if (!audioRef.current) return;

        if (currentBeat?.id === beat.id) {
            togglePlay();
            return;
        }

        // Reiniciar el rastreo para el nuevo beat
        if (currentBeat?.id !== beat.id) {
            setPlayCountTracked(new Set());
        }

        // Resolve URLs
        let finalUrl = beat.archivo_muestra_url || beat.archivo_mp3_url || (beat as any).url_audio || '';

        if (!finalUrl.startsWith('http') && finalUrl) {
            const { data } = supabase.storage.from('muestras_beats').getPublicUrl(finalUrl);
            if (data?.publicUrl) finalUrl = data.publicUrl;
        }

        if (!finalUrl) {
            console.error("No audio found for beat:", beat.id);
            return;
        }

        setCurrentBeat({ ...beat, archivo_mp3_url: finalUrl });
        audioRef.current.src = finalUrl;

        try {
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            setIsPlaying(false);
        }
    };

    const setPlaylistAndPlay = (beats: Beat[], startIndex = 0) => {
        setPlaylist(beats);
        setPlaylistIndex(startIndex);
        if (beats[startIndex]) playBeat(beats[startIndex]);
    };

    const playNext = () => {
        if (playlist.length === 0) {
            setIsPlaying(false);
            return;
        }
        const nextIndex = playlistIndex + 1;
        if (nextIndex < playlist.length) {
            setPlaylistIndex(nextIndex);
            playBeat(playlist[nextIndex]);
        } else {
            setIsPlaying(false);
        }
    };

    const playPrevious = () => {
        if (playlist.length === 0) return;
        const prevIndex = playlistIndex - 1;
        if (prevIndex >= 0) {
            setPlaylistIndex(prevIndex);
            playBeat(playlist[prevIndex]);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !currentBeat) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(toggle => !toggle);
    };

    const seek = (time: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const toggleLike = async (id: string, type: 'beat' | 'sound_kit' = 'beat') => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isCurrentlyLiked = type === 'sound_kit' ? likedKitIds.has(id) : likedBeatIds.has(id);
        const column = type === 'sound_kit' ? 'kit_id' : 'beat_id';

        // 1. ACTUALIZACIÓN OPTIMISTA INMEDIATA (Zero Latency)
        // Actualizar el Set de IDs
        if (type === 'sound_kit') {
            setLikedKitIds(prev => {
                const next = new Set(prev);
                if (isCurrentlyLiked) next.delete(id);
                else next.add(id);
                return next;
            });
        } else {
            setLikedBeatIds(prev => {
                const next = new Set(prev);
                if (isCurrentlyLiked) next.delete(id);
                else next.add(id);
                return next;
            });
        }

        // Actualizar conteos globalmente de inmediato
        setLikesCounts(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + (isCurrentlyLiked ? -1 : 1))
        }));

        // 2. EJECUCIÓN EN SERVIDOR
        try {
            if (isCurrentlyLiked) {
                const { error } = await supabase
                    .from('favoritos')
                    .delete()
                    .eq(column, id)
                    .eq('usuario_id', user.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('favoritos')
                    .insert({ [column]: id, usuario_id: user.id });

                if (error) throw error;
            }
        } catch (err) {
            console.error("Error en toggleLike (revirtiendo estado):", err);
            // REVERTIR el estado en caso de error
            if (type === 'sound_kit') {
                setLikedKitIds(prev => {
                    const next = new Set(prev);
                    if (isCurrentlyLiked) next.add(id);
                    else next.delete(id);
                    return next;
                });
            } else {
                setLikedBeatIds(prev => {
                    const next = new Set(prev);
                    if (isCurrentlyLiked) next.add(id);
                    else next.delete(id);
                    return next;
                });
            }
            setLikesCounts(prev => ({
                ...prev,
                [id]: Math.max(0, (prev[id] || 0) + (isCurrentlyLiked ? 1 : -1))
            }));
        }
    };

    const closePlayer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setCurrentBeat(null);
        setIsPlaying(false);
    };

    return (
        <PlayerContext.Provider value={{
            currentBeat,
            isPlaying,
            duration,
            currentTime,
            volume,
            likedBeatIds,
            likedKitIds,
            likesCounts,
            playBeat,
            togglePlay,
            seek,
            setVolume: (v: number) => {
            setVolumeState(v);
            if (typeof window !== 'undefined') localStorage.setItem('tianguis_volume', String(v));
        },
            toggleLike,
            closePlayer,
            playlist,
            playlistIndex,
            setPlaylistAndPlay,
            playNext,
            playPrevious
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
