"use client";

import React, { useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Music,
    Crown,
    X
} from 'lucide-react';
import Link from 'next/link';
import LicenseSelectionModal from './LicenseSelectionModal';

export default function AudioPlayer() {
    const {
        currentBeat,
        isPlaying,
        togglePlay,
        duration,
        currentTime,
        seek,
        volume,
        setVolume,
        closePlayer
    } = usePlayer();
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(volume);
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

    if (!currentBeat) return null;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(parseFloat(e.target.value));
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (v > 0) setIsMuted(false);
    };

    const toggleMute = () => {
        if (isMuted) {
            setVolume(prevVolume);
            setIsMuted(false);
        } else {
            setPrevVolume(volume);
            setVolume(0);
            setIsMuted(true);
        }
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/40 backdrop-blur-2xl border-t border-white/20 px-4 py-3 md:py-4 animate-in slide-in-from-bottom duration-500 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] bg-gradient-to-r from-white/60 to-blue-50/40">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8 relative">
                    {/* Close Button */}
                    <button
                        onClick={closePlayer}
                        className="absolute -top-2 -right-2 md:top-0 md:-right-8 p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-white md:bg-transparent rounded-full shadow-sm md:shadow-none"
                        title="Cerrar reproductor"
                    >
                        <X size={16} />
                    </button>

                    {/* Track Info */}
                    <div className="flex items-center gap-4 w-full md:w-1/4">
                        <div className={`w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0 border border-slate-100`}>
                            {currentBeat.portadabeat_url ? (
                                <img src={currentBeat.portadabeat_url} alt={currentBeat.title || 'Beat'} className="w-full h-full object-cover" />
                            ) : (
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1 invert opacity-40 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <Link href={`/beats/${currentBeat.id}`} className="hover:text-blue-600 transition-colors">
                                <h4 className="font-black text-sm text-slate-900 truncate uppercase tracking-tight click-highlight">{currentBeat.title}</h4>
                            </Link>
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Link href={`/${currentBeat.producer_username || (typeof currentBeat.producer === 'object' ? currentBeat.producer?.username : currentBeat.producer)}`} className="hover:text-blue-600 transition-colors flex items-center gap-1.5 truncate">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest username-highlight">
                                        {typeof currentBeat.producer === 'object' ? currentBeat.producer?.artistic_name : currentBeat.producer}
                                    </p>
                                    {currentBeat.is_verified && (
                                        <img src="/verified-badge.png" className="w-3 h-3 object-contain shrink-0" alt="Verificado" />
                                    )}
                                    {currentBeat.is_founder && (
                                        <Crown size={12} className="text-yellow-400 shrink-0" fill="currentColor" />
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Controls & Progress */}
                    <div className="flex flex-col items-center gap-2 w-full md:w-2/4">
                        <div className="flex items-center gap-6">
                            <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                <SkipBack size={20} fill="currentColor" />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all transform active:scale-90 shadow-xl shadow-blue-900/10"
                            >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                            </button>
                            <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                <SkipForward size={20} fill="currentColor" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full">
                            <span className="text-[9px] font-black text-slate-400 w-8 text-right">{formatTime(currentTime)}</span>
                            <div className="relative flex-1 group py-2">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    step="0.1"
                                    value={currentTime}
                                    onChange={handleProgressChange}
                                    className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 group-hover:h-1.5 transition-all"
                                />
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full pointer-events-none group-hover:h-1.5 transition-all"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 w-8">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Volume & Actions */}
                    <div className="hidden md:flex items-center justify-end gap-4 w-1/4">
                        <div className="flex items-center gap-2 group">
                            <button onClick={toggleMute} className="text-slate-400 hover:text-blue-600 transition-colors">
                                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <div className="w-24 relative flex items-center py-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setIsLicenseModalOpen(true)}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            Ver Licencias
                        </button>
                    </div>
                </div>

                <LicenseSelectionModal
                    beat={currentBeat}
                    isOpen={isLicenseModalOpen}
                    onClose={() => setIsLicenseModalOpen(false)}
                />
            </div>
        </>
    );
}
