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
    waveColor = '#cbd5e1',
    progressColor = '#2563eb'
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
        <div className="w-full bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleTogglePlay}
                        className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <div className="flex items-center gap-2">
                        <button onClick={() => handleSeek(-10)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <SkipBack size={20} />
                        </button>
                        <button onClick={() => handleSeek(10)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <SkipForward size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    <button onClick={handleMute} className="text-slate-400 hover:text-blue-600 transition-colors">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="cursor-pointer" />

            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 text-center">
                Haz clic en la onda para navegar por la canción
            </p>
        </div>
    );
}
