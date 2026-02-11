"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface WaveformPlayerProps {
    url: string;
    onPlayPause?: (isPlaying: boolean) => void;
    height?: number;
    waveColor?: string;
    progressColor?: string;
}

export default function WaveformPlayer({
    url,
    onPlayPause,
    height = 80,
    waveColor = 'rgba(255, 255, 255, 0.1)',
    progressColor = '#3b82f6'
}: WaveformPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: waveColor,
            progressColor: progressColor,
            height: height,
            barWidth: 2,
            barGap: 3,
            barRadius: 10,
            cursorWidth: 2,
            cursorColor: progressColor,
            normalize: true,
            backend: 'WebAudio',
            fillParent: true,
        });

        ws.load(url);

        ws.on('ready', () => {
            setDuration(ws.getDuration());
            wavesurfer.current = ws;
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('timeupdate', (time) => setCurrentTime(time));

        return () => {
            ws.destroy();
        };
    }, [url, height, waveColor, progressColor]);

    const handleTogglePlay = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
            onPlayPause?.(wavesurfer.current.isPlaying());
        }
    };

    const handleSeek = (seconds: number) => {
        if (wavesurfer.current) {
            wavesurfer.current.skip(seconds);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleMute = () => {
        if (wavesurfer.current) {
            wavesurfer.current.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="w-full bg-transparent">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleTogglePlay}
                        className="w-20 h-20 bg-background text-foreground rounded-[1.5rem] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all text-accent"
                    >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>

                    <div className="flex items-center gap-2">
                        <button onClick={() => handleSeek(-10)} className="w-10 h-10 flex items-center justify-center dark:text-white/40 text-blue-500/40 hover:text-blue-500 dark:hover:text-white transition-colors">
                            <SkipBack size={24} />
                        </button>
                        <button onClick={() => handleSeek(10)} className="w-10 h-10 flex items-center justify-center dark:text-white/40 text-blue-500/40 hover:text-blue-500 dark:hover:text-white transition-colors">
                            <SkipForward size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-[12px] font-black uppercase tracking-[0.3em] dark:text-white/60 text-slate-500 font-mono">
                        {formatTime(currentTime)} <span className="mx-2 dark:text-white/20 text-slate-300">/</span> {formatTime(duration)}
                    </div>

                    <button onClick={handleMute} className="w-10 h-10 flex items-center justify-center dark:text-white/60 text-blue-500 hover:scale-110 active:scale-95 transition-all">
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="cursor-pointer" />

            <div className="mt-8 flex items-center justify-center gap-4">
                <div className="h-px flex-1 dark:bg-white/5 bg-slate-100" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] dark:text-white/60 text-black">
                    Interactúa con la onda para navegar
                </p>
                <div className="h-px flex-1 dark:bg-white/5 bg-slate-100" />
            </div>
        </div>
    );
}
