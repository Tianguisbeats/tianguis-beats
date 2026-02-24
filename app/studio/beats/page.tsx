"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Play, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Switch from '@/components/ui/Switch';
import { useToast } from '@/context/ToastContext';

/**
 * StudioBeatsPage: Interfaz de gestión para productores.
 * Permite ver, eliminar y navegar a la edición de beats propios.
 */

export default function StudioBeatsPage() {
    const { showToast } = useToast();
    const [beats, setBeats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);



    const fetchBeats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('beats')
            .select('id, producer_id, title, genre, bpm, price_mxn, portadabeat_url, mp3_url, is_public, play_count, sale_count, like_count, created_at')
            .eq('producer_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            const transformed = data.map((b: any) => {
                let finalCoverUrl = b.portadabeat_url;
                if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
                    const { data: { publicUrl: cpUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(finalCoverUrl);
                    finalCoverUrl = cpUrl;
                } else if (!finalCoverUrl) {
                    finalCoverUrl = null;
                }
                return { ...b, portadabeat_url: finalCoverUrl };
            });
            setBeats(transformed);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBeats();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de borrar este beat? Esta acción no se puede deshacer.')) return;

        const { error } = await supabase.from('beats').delete().eq('id', id);
        if (!error) {
            setBeats(prev => prev.filter(b => b.id !== id));
            showToast("Beat eliminado correctamente.", 'success');
        } else {
            showToast('Error al borrar el beat', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted font-bold">Cargando tu inventario...</div>;

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-4">
                        Inventario de <span className="text-accent underline decoration-white/10 underline-offset-8">Beats</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-muted">
                        <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/10">
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            {beats.length} Activos
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                            Sincronizado con Catálogo Maestro
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/upload"
                        className="bg-accent text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:scale-105 transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center gap-2"
                    >
                        Subir Nuevo Beat <Play size={14} className="fill-current" />
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-none rounded-[3rem] p-8 md:p-10 relative overflow-hidden transition-all">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-blue-600 opacity-20" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="relative w-full group">
                        <input
                            type="text"
                            placeholder="Buscar beat por nombre o género..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-[11px] text-slate-700 dark:text-white uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all placeholder:text-slate-400 dark:placeholder:text-muted shadow-inner"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted opacity-40">
                            <Play size={14} className="rotate-90" />
                        </div>
                    </div>
                </div>

                {beats.length === 0 ? (
                    <div className="p-20 text-center bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                        <div className="w-24 h-24 bg-white dark:bg-[#020205] border border-slate-200 dark:border-border/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-muted shadow-sm shadow-black/5 dark:shadow-white/5">
                            <AlertCircle size={48} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-foreground uppercase tracking-tight mb-3">Tu galería está vacía</h3>
                        <p className="text-muted text-[11px] font-bold uppercase tracking-widest mb-10 max-w-sm mx-auto opacity-70">Es momento de compartir tu talento con el mundo. Tus beats aparecerán aquí una vez que los subas.</p>
                        <Link href="/upload" className="bg-accent text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl inline-block">
                            Comenzar Ahora
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {beats.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || (b.genre && b.genre.toLowerCase().includes(searchTerm.toLowerCase()))).map((beat) => (
                            <div
                                key={beat.id}
                                className="group bg-slate-50 dark:bg-[#08080a]/60 hover:bg-white dark:hover:bg-[#0c0c0f] border border-slate-200 dark:border-white/5 hover:border-accent/30 rounded-[2.5rem] p-6 transition-all duration-500 flex flex-col gap-6 shadow-sm hover:shadow-2xl dark:shadow-none dark:hover:shadow-black/40"
                            >
                                <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-[#020205] shadow-inner group-hover:shadow-2xl transition-all duration-500 border border-slate-300 dark:border-white/5">
                                    {beat.portadabeat_url ? (
                                        <img src={beat.portadabeat_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={beat.title} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-muted font-black text-[10px] uppercase tracking-[0.3em]">
                                            {beat.title.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                                        <Play size={32} className="text-white fill-current drop-shadow-lg" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-900 dark:text-foreground text-xl tracking-tight truncate mb-4">{beat.title}</h4>
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-muted mb-1">Visibilidad</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${beat.is_public ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {beat.is_public ? 'Público' : 'Oculto'}
                                            </span>
                                        </div>

                                        <Switch
                                            active={beat.is_public}
                                            onChange={async (newStatus) => {
                                                const { error } = await supabase
                                                    .from('beats')
                                                    .update({ is_public: newStatus })
                                                    .eq('id', beat.id);

                                                if (!error) {
                                                    const updatedBeats = beats.map(b =>
                                                        b.id === beat.id ? { ...b, is_public: newStatus } : b
                                                    );
                                                    setBeats(updatedBeats);
                                                    showToast(newStatus ? 'Beat publicado' : 'Beat ocultado', 'success');
                                                } else {
                                                    showToast('Error al actualizar estado', 'error');
                                                }
                                            }}
                                            activeColor="bg-emerald-500"
                                            size="md"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                                    <Link
                                        href={`/studio/beats/edit/${beat.id}`}
                                        className="flex-1 h-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-foreground rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white dark:hover:bg-white/10 dark:hover:border-accent/40 transition-all duration-300 group/btn shadow-sm text-[10px] font-black uppercase tracking-widest gap-2"
                                        title="Editar"
                                    >
                                        <Edit size={14} className="transition-transform group-hover/btn:scale-110" />
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(beat.id)}
                                        className="w-12 h-12 bg-white dark:bg-rose-500/5 border border-slate-200 dark:border-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 group/btn shadow-sm"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} className="transition-transform group-hover/btn:scale-110" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
                }
            </div>
        </div>
    );
}
