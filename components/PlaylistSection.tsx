"use client";

import React from 'react';
import { ListMusic, ChevronRight, Edit3, Lock, Globe, Music } from 'lucide-react';
import Link from 'next/link';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist, idx) => (
                <div key={playlist.id} className="group relative bg-card border border-border rounded-[2rem] overflow-hidden hover:border-foreground/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: `${idx * 60}ms` }}>

                    {/* Cover art mosaic */}
                    <div className="relative h-36 bg-gradient-to-br from-accent/10 via-foreground/5 to-foreground/10 overflow-hidden">
                        {playlist.beats.length > 0 ? (
                            <div className="grid grid-cols-2 h-full gap-0.5">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="overflow-hidden bg-foreground/5">
                                        {playlist.beats[i]?.portada_url
                                            ? <img src={playlist.beats[i].portada_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                            : <div className="w-full h-full flex items-center justify-center text-muted/20"><Music size={20} strokeWidth={1} /></div>
                                        }
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ListMusic size={40} className="text-foreground/20" strokeWidth={1} />
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />

                        {/* Visibility badge */}
                        <div className="absolute top-3 right-3">
                            {playlist.es_publica === false ? (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-background/80 backdrop-blur-sm border border-border rounded-full text-[8px] font-black uppercase tracking-widest text-muted">
                                    <Lock size={9} /> Privada
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-background/80 backdrop-blur-sm border border-border rounded-full text-[8px] font-black uppercase tracking-widest text-accent">
                                    <Globe size={9} /> Pública
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                                <h3 className="font-black text-sm uppercase tracking-tight text-foreground truncate leading-tight">
                                    {playlist.name}
                                </h3>
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                                    {playlist.beats.length > 0 ? `${playlist.beats.length} beats` : 'Colección vacía'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <Link href={`/${username}/playlists/${playlist.id}`}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-foreground/5 hover:bg-accent hover:text-white border border-border hover:border-accent rounded-xl text-[9px] font-black uppercase tracking-widest text-muted transition-all">
                                Ver Playlist <ChevronRight size={11} />
                            </Link>
                            {isOwner && (
                                <button onClick={() => onEdit?.(playlist.id)}
                                    className="p-2.5 bg-foreground/5 hover:bg-foreground hover:text-background border border-border rounded-xl text-muted transition-all">
                                    <Edit3 size={13} />
                                </button>
                            )}
                        </div>
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
