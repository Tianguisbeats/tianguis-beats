"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ListMusic, Plus, Check, Loader2, Minus, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface AddToPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    beatId: string;
}

export default function AddToPlaylistModal({ isOpen, onClose, beatId }: AddToPlaylistModalProps) {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [containedInIds, setContainedInIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch playlists
            const { data: plData, error: plErr } = await supabase
                .from('listas_reproduccion')
                .select('*')
                .eq('usuario_id', user.id)
                .order('fecha_creacion', { ascending: false });

            if (plErr) throw plErr;
            setPlaylists(plData || []);

            // Check which ones contain this beat
            const { data: relData, error: relErr } = await supabase
                .from('listas_reproduccion_items')
                .select('playlist_id')
                .eq('beat_id', beatId);

            if (relErr) throw relErr;
            const contained = new Set(relData.map(r => r.playlist_id));
            setContainedInIds(contained);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePlaylist = async (playlistId: string) => {
        const isAlreadyAdded = containedInIds.has(playlistId);
        setProcessingId(playlistId);

        try {
            if (isAlreadyAdded) {
                // Remove from playlist
                const { error: delErr } = await supabase
                    .from('listas_reproduccion_items')
                    .delete()
                    .eq('playlist_id', playlistId)
                    .eq('beat_id', beatId);

                if (delErr) throw delErr;

                const newContained = new Set(containedInIds);
                newContained.delete(playlistId);
                setContainedInIds(newContained);
                showToast("Eliminado de la playlist", "info");
            } else {
                // Add to playlist
                // Get max order index first
                const { data: items } = await supabase
                    .from('listas_reproduccion_items')
                    .select('indice_orden')
                    .eq('playlist_id', playlistId)
                    .order('indice_orden', { ascending: false })
                    .limit(1);

                const nextOrder = (items?.[0]?.indice_orden ?? -1) + 1;

                const { error: insErr } = await supabase
                    .from('listas_reproduccion_items')
                    .insert({
                        playlist_id: playlistId,
                        beat_id: beatId,
                        indice_orden: nextOrder
                    });

                if (insErr) throw insErr;

                const newContained = new Set(containedInIds);
                newContained.add(playlistId);
                setContainedInIds(newContained);
                showToast("Añadido a la playlist", "success");
            }
        } catch (err: any) {
            showToast(err.message || "Error en la operación", "error");
        } finally {
            setProcessingId(null);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-card w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                <div className="p-6 sm:p-8 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent">
                            <ListMusic size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black uppercase tracking-tighter text-foreground">Mis Playlists</h2>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">Gestiona este beat en tus playlists</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-xl transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-accent" size={32} />
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Cargando...</p>
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="py-12 text-center space-y-4">
                            <Music size={40} className="mx-auto text-muted/20" />
                            <h3 className="text-xl font-black uppercase tracking-tighter">Sin Playlists</h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest max-w-[180px] mx-auto">Crea una playlist primero en tu perfil para organizar tus beats.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {playlists.map(pl => {
                                const isAdded = containedInIds.has(pl.id);
                                const isProcessing = processingId === pl.id;

                                return (
                                    <button
                                        key={pl.id}
                                        onClick={() => togglePlaylist(pl.id)}
                                        disabled={isProcessing}
                                        className={`flex items-center justify-between p-4 border rounded-2xl transition-all group ${isAdded ? 'bg-accent/5 border-accent/30' : 'bg-foreground/[0.03] border-border hover:border-accent/40'}`}
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all ${isAdded ? 'bg-accent text-white border-accent' : 'bg-card border-border text-muted group-hover:scale-110'}`}>
                                                {isAdded ? <Check size={16} /> : <Plus size={16} />}
                                            </div>
                                            <div>
                                                <span className={`block text-sm font-black uppercase tracking-tight ${isAdded ? 'text-accent' : 'text-foreground'}`}>{pl.nombre}</span>
                                                <span className="text-[8px] font-bold text-muted uppercase tracking-widest leading-none">
                                                    {isAdded ? "Ya está en esta lista" : "Añadir a esta lista"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAdded ? 'text-red-500 hover:bg-red-500/10' : 'text-accent group-hover:scale-125'}`}>
                                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : (isAdded ? <Minus size={16} /> : <Plus size={16} />)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 sm:p-8 pt-0">
                    <button onClick={onClose} className="w-full py-4 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                        Listo
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
