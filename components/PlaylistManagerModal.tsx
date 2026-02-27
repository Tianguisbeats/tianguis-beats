"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ListMusic, Loader2, Globe, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PlaylistManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    producerId: string; // This is now the user's auth ID (usuario_id in the new table)
    existingPlaylist?: any;
    allBeats?: any[]; // Kept for compatibility but not used in new schema
    onSuccess: () => void;
}

export default function PlaylistManagerModal({
    isOpen,
    onClose,
    producerId,
    existingPlaylist,
    onSuccess
}: PlaylistManagerModalProps) {
    const [name, setName] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (existingPlaylist) {
                setName(existingPlaylist.name || existingPlaylist.nombre || '');
                setIsPublic(existingPlaylist.es_publica ?? true);
            } else {
                setName('');
                setIsPublic(true);
            }
            setError(null);
            setConfirmDelete(false);
        }
    }, [existingPlaylist, isOpen]);

    const handleSave = async () => {
        if (!name.trim()) { setError('La playlist necesita un nombre.'); return; }
        setSaving(true);
        setError(null);
        try {
            if (existingPlaylist?.id) {
                // UPDATE existing playlist
                const { error: upErr } = await supabase
                    .from('listas_reproduccion')
                    .update({
                        nombre: name.trim(),
                        es_publica: isPublic,
                        es_privada: !isPublic
                    })
                    .eq('id', existingPlaylist.id);
                if (upErr) throw upErr;
            } else {
                // CREATE new playlist — only use the columns that exist in the new table
                const { error: insErr } = await supabase
                    .from('listas_reproduccion')
                    .insert({
                        usuario_id: producerId,
                        nombre: name.trim(),
                        es_publica: isPublic,
                        es_privada: !isPublic
                    });
                if (insErr) throw insErr;
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving playlist:', err);
            setError(err.message || 'Error al guardar la playlist.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingPlaylist?.id) return;
        setDeleting(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('listas_reproduccion')
                .delete()
                .eq('id', existingPlaylist.id);
            if (error) throw error;
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar la playlist.');
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-card w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-border border-b-0 sm:border-b flex flex-col overflow-hidden">

                {/* Pill handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-12 h-1.5 bg-foreground/15 rounded-full" />
                </div>

                {/* Header */}
                <div className="p-6 sm:p-8 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent">
                            <ListMusic size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black uppercase tracking-tighter text-foreground">
                                {existingPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}
                            </h2>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">
                                {existingPlaylist ? 'Actualiza los datos de tu colección' : 'Crea una nueva colección de beats'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-xl transition-colors text-muted hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold">{error}</p>
                        </div>
                    )}

                    {/* Name input */}
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 block">
                            Nombre de la Playlist <span className="text-accent">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Trap 2025, Mis Favoritas..."
                            value={name}
                            onChange={e => { setName(e.target.value); setError(null); }}
                            maxLength={60}
                            className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 text-sm font-medium text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
                        />
                        <div className="flex justify-end mt-1">
                            <span className="text-[9px] text-muted font-bold">{name.length}/60</span>
                        </div>
                    </div>

                    {/* Visibility toggle */}
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted mb-3 block">Visibilidad</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setIsPublic(true)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isPublic ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-background border-border text-muted hover:border-foreground/20'}`}>
                                <Globe size={16} />
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Pública</p>
                                    <p className="text-[8px] font-bold opacity-60">Visible para todos</p>
                                </div>
                            </button>
                            <button onClick={() => setIsPublic(false)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${!isPublic ? 'bg-foreground/5 border-foreground/20 text-foreground' : 'bg-background border-border text-muted hover:border-foreground/20'}`}>
                                <Lock size={16} />
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Privada</p>
                                    <p className="text-[8px] font-bold opacity-60">Solo tú puedes verla</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Info note */}
                    <p className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-60 leading-relaxed">
                        💡 Los beats se agregan a la playlist desde tu catálogo de beats
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 pt-0 space-y-3">
                    {/* Delete confirm */}
                    {confirmDelete && existingPlaylist && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                            <p className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-3">¿Eliminar definitivamente?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-2.5 bg-background border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all">
                                    Cancelar
                                </button>
                                <button onClick={handleDelete} disabled={deleting}
                                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        {existingPlaylist && !confirmDelete && (
                            <button onClick={() => setConfirmDelete(true)}
                                className="p-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button onClick={onClose}
                            className="px-5 py-3.5 bg-background border border-border rounded-2xl text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving || !name.trim()}
                            className="flex-1 py-3.5 bg-accent text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-95">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            {existingPlaylist ? 'Guardar Cambios' : 'Crear Playlist'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
