"use client";

/**
 * TIANGUIS BEATS - Contexto del Reproductor (Player)
 * Maneja el estado global del reproductor de audio, reproducción de beats,
 * control de volumen y actualización de conteo de reproducciones.
 */

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Beat } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export type LoopMode = 'none' | 'one' | 'all';

interface PlayerContextType {
    currentBeat: Beat | null;
    isPlaying: boolean;
    duration: number;
    currentTime: number;
    volume: number;
    likedBeatIds: Set<string>;
    likedKitIds: Set<string>;
    likesCounts: Record<string, number>;
    loopMode: LoopMode;
    isShuffle: boolean;
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
    toggleLoopMode: () => void;
    toggleShuffle: () => void;
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
    const [loopMode, setLoopMode] = useState<LoopMode>('none');
    const [isShuffle, setIsShuffle] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Refs para evitar stale closures en event listeners
    const playNextRef = useRef<() => void>(() => {});

    // Inicializar el audio element una sola vez
    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const onEnded = () => playNextRef.current(); // siempre llama la versión más reciente

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onEnded);
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
                if (beatsData.data) setLikedBeatIds(new Set(beatsData.data.map(f => f.beat_id)));
                if (kitsData.data) setLikedKitIds(new Set(kitsData.data.map(f => f.kit_id)));
            }
        };
        fetchLikes();

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
                    const targetId = newLike.beat_id || newLike.kit_id;
                    if (targetId) setLikesCounts(prev => ({ ...prev, [targetId]: (prev[targetId] || 0) + 1 }));
                } else if (payload.eventType === 'DELETE') {
                    fetchLikes();
                }
            })
            .subscribe();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) { setLikedBeatIds(new Set()); setLikedKitIds(new Set()); }
            else fetchLikes();
        });

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    const [playCountTracked, setPlayCountTracked] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!currentBeat || playCountTracked.has(currentBeat.id)) return;
        if (currentTime >= 10) {
            const incrementPlays = async () => {
                try {
                    setPlayCountTracked(prev => new Set(prev).add(currentBeat.id));
                    await supabase.rpc('incrementar_reproduccion', { id_beat: currentBeat.id });
                } catch (err) {
                    console.error("Error al incrementar el conteo de reproducciones:", err);
                    await supabase
                        .from('beats')
                        .update({ conteo_reproducciones: (currentBeat.conteo_reproducciones || 0) + 1 })
                        .eq('id', currentBeat.id);
                }
            };
            incrementPlays();
        }
    }, [currentTime, currentBeat, playCountTracked]);

    useEffect(() => {
        return () => {
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
                            metadatos: { duration: durationLocal, completion_percent: percent, beat_title: currentBeat.titulo }
                        });
                    } catch (err) {
                        console.error("Error tracking retention:", err);
                    }
                };
                trackRetention();
            }
        };
    }, [currentBeat?.id]);

    const playBeat = async (beat: Beat) => {
        if (!audioRef.current) return;

        if (currentBeat?.id === beat.id) {
            togglePlay();
            return;
        }

        if (currentBeat?.id !== beat.id) setPlayCountTracked(new Set());

        let finalUrl = beat.archivo_muestra_url || beat.archivo_mp3_url || (beat as any).url_audio || '';
        if (!finalUrl.startsWith('http') && finalUrl) {
            const { data } = supabase.storage.from('muestras_beats').getPublicUrl(finalUrl);
            if (data?.publicUrl) finalUrl = data.publicUrl;
        }
        if (!finalUrl) { console.error("No audio found for beat:", beat.id); return; }

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

    const playNext = async () => {
        // Loop one: reiniciar la canción actual
        if (loopMode === 'one' && audioRef.current && currentBeat) {
            audioRef.current.currentTime = 0;
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch { setIsPlaying(false); }
            return;
        }

        // Sin playlist: auto-fetch del mismo productor
        if (playlist.length === 0) {
            if (currentBeat?.productor_id) {
                const { data } = await supabase
                    .from('beats')
                    .select('*')
                    .eq('productor_id', currentBeat.productor_id)
                    .neq('id', currentBeat.id)
                    .eq('es_publico', true)
                    .order('conteo_reproducciones', { ascending: false })
                    .limit(10);

                if (data && data.length > 0) {
                    // Heredar info del productor del beat actual (mismo productor)
                    const beatsWithProducer = data.map(b => ({
                        ...b,
                        productor_nombre_artistico: currentBeat.productor_nombre_artistico,
                        productor_nombre_usuario: currentBeat.productor_nombre_usuario,
                        productor_foto_perfil: currentBeat.productor_foto_perfil,
                        productor_esta_verificado: currentBeat.productor_esta_verificado,
                        productor_es_fundador: currentBeat.productor_es_fundador,
                        productor_nivel_suscripcion: currentBeat.productor_nivel_suscripcion,
                    })) as Beat[];
                    setPlaylist(beatsWithProducer);
                    setPlaylistIndex(0);
                    playBeat(beatsWithProducer[0]);
                } else {
                    setIsPlaying(false);
                }
            } else {
                setIsPlaying(false);
            }
            return;
        }

        // Determinar el siguiente índice
        let nextIndex: number;
        if (isShuffle && playlist.length > 1) {
            do { nextIndex = Math.floor(Math.random() * playlist.length); }
            while (nextIndex === playlistIndex);
        } else {
            nextIndex = playlistIndex + 1;
        }

        if (nextIndex < playlist.length) {
            setPlaylistIndex(nextIndex);
            playBeat(playlist[nextIndex]);
        } else if (loopMode === 'all') {
            setPlaylistIndex(0);
            playBeat(playlist[0]);
        } else {
            setIsPlaying(false);
        }
    };

    // Mantener la ref siempre actualizada (se ejecuta después de cada render)
    useEffect(() => { playNextRef.current = playNext; });

    const playPrevious = () => {
        if (playlist.length === 0) return;

        // Si llevamos más de 3s, reiniciar la canción actual
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        let prevIndex: number;
        if (isShuffle && playlist.length > 1) {
            do { prevIndex = Math.floor(Math.random() * playlist.length); }
            while (prevIndex === playlistIndex);
        } else {
            prevIndex = playlistIndex - 1;
        }

        if (prevIndex >= 0) {
            setPlaylistIndex(prevIndex);
            playBeat(playlist[prevIndex]);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !currentBeat) return;
        if (isPlaying) { audioRef.current.pause(); }
        else { audioRef.current.play(); }
        setIsPlaying(toggle => !toggle);
    };

    const seek = (time: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const toggleLoopMode = () => {
        setLoopMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none');
    };

    const toggleShuffle = () => setIsShuffle(prev => !prev);

    const toggleLike = async (id: string, type: 'beat' | 'sound_kit' = 'beat') => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isCurrentlyLiked = type === 'sound_kit' ? likedKitIds.has(id) : likedBeatIds.has(id);
        const column = type === 'sound_kit' ? 'kit_id' : 'beat_id';

        if (type === 'sound_kit') {
            setLikedKitIds(prev => { const next = new Set(prev); if (isCurrentlyLiked) next.delete(id); else next.add(id); return next; });
        } else {
            setLikedBeatIds(prev => { const next = new Set(prev); if (isCurrentlyLiked) next.delete(id); else next.add(id); return next; });
        }
        setLikesCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + (isCurrentlyLiked ? -1 : 1)) }));

        try {
            if (isCurrentlyLiked) {
                const { error } = await supabase.from('favoritos').delete().eq(column, id).eq('usuario_id', user.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('favoritos').insert({ [column]: id, usuario_id: user.id });
                if (error) throw error;
            }
        } catch (err) {
            console.error("Error en toggleLike (revirtiendo estado):", err);
            if (type === 'sound_kit') {
                setLikedKitIds(prev => { const next = new Set(prev); if (isCurrentlyLiked) next.add(id); else next.delete(id); return next; });
            } else {
                setLikedBeatIds(prev => { const next = new Set(prev); if (isCurrentlyLiked) next.add(id); else next.delete(id); return next; });
            }
            setLikesCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + (isCurrentlyLiked ? 1 : -1)) }));
        }
    };

    const closePlayer = () => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
        setCurrentBeat(null);
        setIsPlaying(false);
    };

    return (
        <PlayerContext.Provider value={{
            currentBeat, isPlaying, duration, currentTime, volume,
            likedBeatIds, likedKitIds, likesCounts,
            loopMode, isShuffle,
            playBeat, togglePlay, seek,
            setVolume: (v: number) => {
                setVolumeState(v);
                if (typeof window !== 'undefined') localStorage.setItem('tianguis_volume', String(v));
            },
            toggleLike, closePlayer,
            playlist, playlistIndex,
            setPlaylistAndPlay, playNext, playPrevious,
            toggleLoopMode, toggleShuffle,
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) throw new Error('usePlayer must be used within a PlayerProvider');
    return context;
}
