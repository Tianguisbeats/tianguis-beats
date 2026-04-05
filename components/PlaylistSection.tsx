"use client";

import React from 'react';
import { ChevronRight, Edit3, Lock, Play } from 'lucide-react';
import Link from 'next/link';
import PlaylistCover from './PlaylistCover';

interface Playlist {
    id: string;
    name: string;
    description?: string;
    es_publica?: boolean;
    fecha_creacion?: string;
    beats: any[];
}

interface PlaylistSectionProps {
    playlists: Playlist[];
    isOwner: boolean;
    username: string;
    onEdit?: (playlistId: string) => void;
}

export default function PlaylistSection({ playlists, isOwner, username, onEdit }: PlaylistSectionProps) {
    if (playlists.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {playlists.map((playlist, idx) => (
                <div key={playlist.id} 
                    className="group relative flex flex-col gap-4 rounded-[2.8rem] overflow-hidden transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both" 
                    style={{ animationDelay: `${idx * 60}ms` }}
                >
                    <div className="relative aspect-square z-0 group-hover:-translate-y-2 transition-transform duration-500">
                        <PlaylistCover 
                            beats={playlist.beats || []} 
                            size="lg" 
                            className="w-full h-full"
                        />
                        
                        {!playlist.es_publica && (
                            <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-2">
                                <Lock size={10} className="text-amber-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white">Privada</span>
                            </div>
                        )}
                        
                        <Link 
                            href={`/${username}/playlists/${playlist.id}`}
                            className="absolute inset-0 z-10 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-all duration-500">
                                <Play fill="currentColor" size={32} className="ml-1" />
                            </div>
                        </Link>
                    </div>

                    <div className="px-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <Link href={`/${username}/playlists/${playlist.id}`}>
                                    <h4 className="font-black text-xl uppercase tracking-tighter text-foreground truncate group-hover:text-blue-500 transition-colors">
                                        {playlist.name}
                                    </h4>
                                </Link>
                                <p className="text-[10px] font-bold text-muted/60 uppercase tracking-widest mt-1">
                                    {playlist.beats?.length || 0} Beats • {playlist.es_publica ? 'Pública' : 'Privada'}
                                </p>
                            </div>
                            {isOwner && (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onEdit?.(playlist.id);
                                    }}
                                    className="p-3 rounded-2xl bg-foreground/[0.03] border border-border text-muted hover:text-blue-500 hover:border-blue-500/30 transition-all"
                                >
                                    <Edit3 size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
