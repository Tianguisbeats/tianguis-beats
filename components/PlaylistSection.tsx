"use client";

import React from 'react';
import { ListMusic, ChevronRight, Play } from 'lucide-react';
import BeatCardPro from './explore/BeatCardPro';
import { Beat } from '@/lib/types';
import Link from 'next/link';

interface Playlist {
    id: string;
    name: string;
    description?: string;
    beats: Beat[];
}

interface PlaylistSectionProps {
    playlists: Playlist[];
    isOwner: boolean;
    onEdit?: (playlistId: string) => void;
}

export default function PlaylistSection({ playlists, isOwner, onEdit }: PlaylistSectionProps) {
    if (playlists.length === 0) return null;

    return (
        <div className="space-y-16">
            {playlists.map((playlist) => (
                <div key={playlist.id} className="relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <ListMusic size={16} className="text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Colección</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                {playlist.name}
                            </h2>
                            {playlist.description && (
                                <p className="text-slate-400 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-3">
                                    {playlist.description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {isOwner && (
                                <button
                                    onClick={() => onEdit?.(playlist.id)}
                                    className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all shadow-sm"
                                >
                                    Editar Playlist
                                </button>
                            )}
                            <Link
                                href={`/${playlist.beats[0]?.producer_username || 'beats'}/playlists/${playlist.id}`}
                                className="px-6 py-2.5 bg-blue-50 dark:bg-blue-600/10 border border-blue-100 dark:border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                            >
                                Ver playlist <ChevronRight size={12} />
                            </Link>
                        </div>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        {playlist.beats.map((beat) => (
                            <div key={beat.id} className="w-[300px] shrink-0">
                                <BeatCardPro beat={beat} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
