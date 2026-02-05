"use client";

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

    const playBeat = async (beat: Beat) => {
        if (!audioRef.current) return;

        if (currentBeat?.id === beat.id) {
            togglePlay();
            return;
        }

        // Increment play count in Supabase
        try {
            await supabase.rpc('increment_play_count', { beat_id: beat.id });
        } catch (err) {
            console.error("Error incrementing play count:", err);
            // Fallback: simple update if RPC is missing
            await supabase
                .from('beats')
                .update({ play_count: (beat.play_count || 0) + 1 })
                .eq('id', beat.id);
        }

        setCurrentBeat(beat);
        audioRef.current.src = beat.mp3_url || '';
        audioRef.current.play();
        setIsPlaying(true);
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
