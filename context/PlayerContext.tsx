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
    playBeat: (beat: Beat) => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(0.8);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();

        const audio = audioRef.current;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const [playCountTracked, setPlayCountTracked] = useState<string | null>(null);

    // Rastrear el conteo de reproducciones con un retraso de 10 segundos
    useEffect(() => {
        if (!currentBeat || playCountTracked === currentBeat.id) return;

        if (currentTime >= 10) {
            const incrementPlays = async () => {
                try {
                    setPlayCountTracked(currentBeat.id);
                    // Usar la nueva función track_beat_activity que maneja stats semanales
                    await supabase.rpc('track_beat_activity', { p_beat_id: currentBeat.id, p_type: 'play' });
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

    const playBeat = async (beat: Beat) => {
        if (!audioRef.current) return;

        if (currentBeat?.id === beat.id) {
            togglePlay();
            return;
        }

        // Reiniciar el rastreo para el nuevo beat
        if (currentBeat?.id !== beat.id) {
            setPlayCountTracked(null);
        }

        // Resolver la URL si es una ruta relativa de Supabase Storage
        let finalUrl = beat.archivo_muestra_url || beat.archivo_mp3_url || '';

        if (finalUrl && !finalUrl.startsWith('http')) {
            const encodedPath = finalUrl.split('/').map((s: string) => encodeURIComponent(s)).join('/');
            const bucket = finalUrl.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);
            finalUrl = publicUrl;
        }

        setCurrentBeat({ ...beat, archivo_mp3_url: finalUrl });
        audioRef.current.src = finalUrl;

        try {
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            console.error("Error de reproducción:", err);
            setIsPlaying(false);
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
            playBeat,
            togglePlay,
            seek,
            setVolume: setVolumeState,
            closePlayer
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
