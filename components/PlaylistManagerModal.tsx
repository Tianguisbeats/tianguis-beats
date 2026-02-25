"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ListMusic, Check, Loader2, Music, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Beat } from '@/lib/types';

interface PlaylistManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    producerId: string;
    existingPlaylist?: any;
    allBeats: Beat[];
    onSuccess: () => void;
}

export default function PlaylistManagerModal({
    isOpen,
    onClose,
    producerId,
    existingPlaylist,
    allBeats,
    onSuccess
}: PlaylistManagerModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedBeatIds, setSelectedBeatIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (existingPlaylist) {
            setName(existingPlaylist.name || '');
            setDescription(existingPlaylist.description || '');
            setSelectedBeatIds(existingPlaylist.beats.map((b: any) => b.id));
        } else {
            setName('');
            setDescription('');
            setSelectedBeatIds([]);
        }
        setHasChanges(false);
    }, [existingPlaylist, isOpen]);

    // Comprobar cambios
    useEffect(() => {
        if (!existingPlaylist) {
            setHasChanges(!!name.trim() || selectedBeatIds.length > 0);
            return;
        }

        const currentIds = [...selectedBeatIds].sort().join(',');
        const originalIds = existingPlaylist.beats.map((b: any) => b.id).sort().join(',');

        const isNameChanged = name !== (existingPlaylist.name || '');
        const isDescChanged = description !== (existingPlaylist.description || '');
        const isBeatsChanged = currentIds !== originalIds;

        setHasChanges(isNameChanged || isDescChanged || isBeatsChanged);
    }, [name, description, selectedBeatIds, existingPlaylist]);

    const handleToggleBeat = (beatId: string) => {
        setSelectedBeatIds(prev =>
            prev.includes(beatId)
                ? prev.filter(id => id !== beatId)
                : [...prev, beatId]
        );
    };

    const moveBeat = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...selectedBeatIds];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newOrder.length) return;

        const temp = newOrder[index];
        newOrder[index] = newOrder[newIndex];
        newOrder[newIndex] = temp;
        setSelectedBeatIds(newOrder);
    };

    const handleSave = async () => {
        if (!name.trim()) return alert("La playlist necesita un nombre");

        setSaving(true);
        try {
            let playlistId = existingPlaylist?.id || existingPlaylist?.playlist_id;

            if (!playlistId) {
                // Generar un nuevo UUID para la playlist si no existe
                playlistId = crypto.randomUUID();
            }

            // Eliminar registros previos de esta playlist para reconstruirla (denormalización)
            await supabase
                .from('listas_reproduccion')
                .delete()
                .eq('playlist_id', playlistId);

            if (selectedBeatIds.length > 0) {
                // Insertar un registro por cada beat
                const { error: plError } = await supabase
                    .from('listas_reproduccion')
                    .insert(selectedBeatIds.map((bid, index) => ({
                        playlist_id: playlistId,
                        productor_id: producerId,
                        nombre: name,
                        descripcion: description,
                        es_publica: true,
                        beat_id: bid,
                        indice_orden_beat: index,
                        indice_orden_playlist: existingPlaylist?.indice_orden_playlist || 0
                    })));
                if (plError) throw plError;
            } else {
                // Insertar un registro vacío (sin beats) para preservar la playlist
                const { error: plError } = await supabase
                    .from('listas_reproduccion')
                    .insert({
                        playlist_id: playlistId,
                        productor_id: producerId,
                        nombre: name,
                        descripcion: description,
                        es_publica: true,
                        beat_id: null,
                        indice_orden_beat: 0,
                        indice_orden_playlist: existingPlaylist?.indice_orden_playlist || 0
                    });
                if (plError) throw plError;
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error saving playlist:", err);
            alert("Error: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Seguro que quieres eliminar esta playlist?")) return;
        setSaving(true);
        try {
            const playlistId = existingPlaylist?.id || existingPlaylist?.playlist_id;
            const { error } = await supabase
                .from('listas_reproduccion')
                .delete()
                .eq('playlist_id', playlistId);
            if (error) throw error;
            onSuccess();
            onClose();
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-card w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
                {/* Encabezado */}
                <div className="p-8 bg-accent-soft text-foreground border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                            <ListMusic size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">
                                {existingPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}
                            </h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Mueve u organiza la playlist</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-muted hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Cuerpo */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    {/* Información básica */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-muted mb-2 block tracking-widest">Nombre de la Playlist</label>
                            <input
                                type="text"
                                placeholder="Eje: Mis Favoritas, Trap 2024..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-muted/50 text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-muted mb-2 block tracking-widest">Descripción (Opcional)</label>
                            <textarea
                                placeholder="Escribe algo sobre esta colección..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-medium placeholder:text-muted/50 text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20 focus:border-accent transition-all h-24 resize-none"
                            />
                        </div>
                    </div>

                    {/* Orden de la Playlist */}
                    {selectedBeatIds.length > 0 && (
                        <div>
                            <label className="text-[10px] font-black uppercase text-muted mb-4 block tracking-widest">Orden de la Playlist (Mueve para organizar)</label>
                            <div className="space-y-2 mb-8">
                                {selectedBeatIds.map((id, index) => {
                                    const beat = allBeats.find(b => b.id === id);
                                    if (!beat) return null;
                                    return (
                                        <div key={id} className="flex items-center gap-3 bg-card border border-border p-2 rounded-2xl shadow-sm">
                                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                                                <img src={beat.portada_url || ''} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <span className="flex-1 text-[10px] font-black uppercase truncate text-foreground">{beat.titulo}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => moveBeat(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1.5 hover:bg-accent-soft rounded-lg text-muted hover:text-foreground disabled:opacity-20"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => moveBeat(index, 'down')}
                                                    disabled={index === selectedBeatIds.length - 1}
                                                    className="p-1.5 hover:bg-accent-soft rounded-lg text-muted hover:text-foreground disabled:opacity-20"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <hr className="border-border mb-8" />
                        </div>
                    )}

                    {/* Selección de Beats */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-muted mb-4 block tracking-widest flex items-center justify-between">
                            Seleccionar Beats
                            <span className="text-accent">{selectedBeatIds.length} seleccionados</span>
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {allBeats.map(beat => (
                                <button
                                    key={beat.id}
                                    onClick={() => handleToggleBeat(beat.id)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedBeatIds.includes(beat.id)
                                        ? 'bg-accent/10 border-accent/30 shadow-sm'
                                        : 'bg-background border-border hover:bg-card hover:border-accent/20'
                                        }`}
                                >
                                    <div className="w-10 h-10 bg-background rounded-lg border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                        {beat.portada_url ? (
                                            <img src={beat.portada_url} className="w-full h-full object-cover" alt="Cover" />
                                        ) : (
                                            <Music size={16} className="text-muted/50" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black uppercase truncate ${selectedBeatIds.includes(beat.id) ? 'text-accent' : 'text-foreground'}`}>{beat.titulo}</p>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{beat.genero} • {beat.bpm} BPM</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedBeatIds.includes(beat.id) ? 'bg-accent text-white' : 'bg-muted/20 text-muted'
                                        }`}>
                                        <Check size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pie de página */}
                <div className="p-8 bg-card border-t border-border flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 bg-background text-muted border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-soft hover:text-foreground transition-all hidden sm:block"
                    >
                        Cancelar
                    </button>
                    {!hasChanges && existingPlaylist ? (
                        <button
                            onClick={onClose}
                            className="flex-1 bg-accent-soft text-muted py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-muted/20 hover:text-foreground transition-all flex items-center justify-center gap-3"
                        >
                            <X size={18} />
                            Cancelar
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving || !name.trim()}
                            className="flex-1 btn-standard py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Plus size={18} />
                                    {existingPlaylist ? 'Actualizar Playlist' : 'Crear Playlist'}
                                </>
                            )}
                        </button>
                    )}
                    {existingPlaylist && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20"
                            title="Eliminar Playlist definitivamente"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
