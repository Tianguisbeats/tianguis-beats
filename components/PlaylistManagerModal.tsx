"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ListMusic, Check, Loader2, Music } from 'lucide-react';
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
    }, [existingPlaylist, isOpen]);

    const handleToggleBeat = (beatId: string) => {
        setSelectedBeatIds(prev =>
            prev.includes(beatId)
                ? prev.filter(id => id !== beatId)
                : [...prev, beatId]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) return alert("La playlist necesita un nombre");

        setSaving(true);
        try {
            let playlistId = existingPlaylist?.id;

            if (existingPlaylist) {
                // Update
                const { error } = await supabase
                    .from('playlists')
                    .update({ name, description })
                    .eq('id', existingPlaylist.id);
                if (error) throw error;
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('playlists')
                    .insert({
                        producer_id: producerId,
                        name,
                        description,
                        is_public: true
                    })
                    .select()
                    .single();
                if (error) throw error;
                playlistId = data.id;
            }

            // Sync Beats (Delete old, insert new)
            // Note: In a production app we'd do this more efficiently with a diff
            await supabase
                .from('playlist_beats')
                .delete()
                .eq('playlist_id', playlistId);

            if (selectedBeatIds.length > 0) {
                const { error: plError } = await supabase
                    .from('playlist_beats')
                    .insert(selectedBeatIds.map((bid, index) => ({
                        playlist_id: playlistId,
                        beat_id: bid,
                        order_index: index
                    })));
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
            const { error } = await supabase
                .from('playlists')
                .delete()
                .eq('id', existingPlaylist.id);
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                            <ListMusic size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">
                                {existingPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personaliza tu colección</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Nombre de la Playlist</label>
                            <input
                                type="text"
                                placeholder="Eje: Mis Favoritas, Trap 2024..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Descripción (Opcional)</label>
                            <textarea
                                placeholder="Escribe algo sobre esta colección..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all h-24 resize-none"
                            />
                        </div>
                    </div>

                    {/* Beats Selection */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest flex items-center justify-between">
                            Seleccionar Beats
                            <span className="text-blue-600">{selectedBeatIds.length} seleccionados</span>
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {allBeats.map(beat => (
                                <button
                                    key={beat.id}
                                    onClick={() => handleToggleBeat(beat.id)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedBeatIds.includes(beat.id)
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200'
                                        }`}
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                        {beat.portadabeat_url ? (
                                            <img src={beat.portadabeat_url} className="w-full h-full object-cover" alt="Cover" />
                                        ) : (
                                            <Music size={16} className="text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black uppercase truncate ${selectedBeatIds.includes(beat.id) ? 'text-blue-900' : 'text-slate-900'}`}>{beat.title}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{beat.genre} • {beat.bpm} BPM</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedBeatIds.includes(beat.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                        <Check size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
                    {existingPlaylist && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className="p-4 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            title="Eliminar Playlist"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-300"
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
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
