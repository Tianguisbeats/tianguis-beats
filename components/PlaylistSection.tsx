"use client";

import React from 'react';
import { ListMusic, ChevronRight, Play } from 'lucide-react';
import BeatCard from './BeatCard';
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
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Colección Curada</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                                {playlist.name}
                            </h2>
                            {playlist.description && (
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-3">
                                    {playlist.description}
                                </p>
                            )}
                        </div>

                        {isOwner && (
                            <button
                                onClick={() => onEdit?.(playlist.id)}
                                className="px-6 py-2.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                                Editar Playlist
                            </button>
                        )}
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        {playlist.beats.map((beat) => (
                            <div key={beat.id} className="w-[300px] shrink-0">
                                <BeatCard beat={beat} />
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
