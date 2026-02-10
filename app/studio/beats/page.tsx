"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Play, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * StudioBeatsPage: Interfaz de gestión para productores.
 * Permite ver, eliminar y navegar a la edición de beats propios.
 */

export default function StudioBeatsPage() {
    const [beats, setBeats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBeats();
    }, []);

    const fetchBeats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('beats')
            .select('id, title, genre, bpm, price_mxn, portadabeat_url, mp3_url, is_public, play_count, sale_count, like_count, created_at')
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

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de borrar este beat? Esta acción no se puede deshacer.')) return;

        const { error } = await supabase.from('beats').delete().eq('id', id);
        if (!error) {
            setBeats(prev => prev.filter(b => b.id !== id));
        } else {
            alert('Error al borrar el beat');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted font-bold">Cargando tu inventario...</div>;

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-3">Inventario <span className="text-accent">de Beats</span></h1>
                    <div className="flex items-center gap-4">
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent" />
                            {(beats.length)} Beats Activos
                        </p>
                        <div className="h-3 w-px bg-border" />
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Sincronizado con Catálogo</p>
                    </div>
                </div>
                <Link
                    href="/upload"
                    className="bg-accent text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:-translate-y-1 active:scale-95 flex items-center gap-3 w-fit"
                >
                    Subir Nuevo Beat
                </Link>
            </div>

            <div className="relative group">
                <input
                    type="text"
                    placeholder="Buscar beat por nombre o género..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl px-8 py-5 font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all group-hover:dark:bg-white/10 shadow-sm"
                />
            </div>

            {beats.length === 0 ? (
                <div className="p-20 text-center bg-background/50 rounded-[3rem] border-2 border-dashed border-border/60">
                    <div className="w-24 h-24 bg-card rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-muted/20 shadow-inner">
                        <AlertCircle size={48} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-3">Tu galería está vacía</h3>
                    <p className="text-muted text-sm mb-10 max-w-sm mx-auto font-medium">Es momento de compartir tu talento con el mundo. Tus beats aparecerán aquí una vez que los subas.</p>
                    <Link href="/upload" className="text-accent font-black text-[10px] uppercase tracking-[0.3em] hover:underline">
                        Comenzar Ahora
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {beats.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || (b.genre && b.genre.toLowerCase().includes(searchTerm.toLowerCase()))).map((beat) => (
                        <div
                            key={beat.id}
                            className="bg-white/50 dark:bg-[#08080a]/60 hover:bg-white dark:hover:bg-[#0c0c0f] border border-slate-100 dark:border-white/5 hover:border-accent/30 rounded-[2.5rem] p-6 transition-all duration-300 group flex flex-col gap-6 shadow-sm hover:shadow-2xl dark:hover:shadow-white/5"
                        >
                            <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-zinc-950 shadow-sm group-hover:shadow-2xl transition-all duration-500 border border-slate-200 dark:border-white/5">
                                {beat.portadabeat_url ? (
                                    <img src={beat.portadabeat_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={beat.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted font-black text-xs italic">
                                        {beat.title.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                                    <Play size={32} className="text-white fill-current" />
                                </div>
                                <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${beat.is_public ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'}`}>
                                        {beat.is_public ? 'Público' : 'Privado'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-foreground text-xl tracking-tight truncate mb-1">{beat.title}</h4>
                                <div className="flex items-center justify-between text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                                    <span className="flex items-center gap-2">Sincronizado</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                                <Link
                                    href={`/studio/beats/edit/${beat.id}`}
                                    className="flex-1 h-12 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-foreground dark:text-white rounded-xl flex items-center justify-center hover:bg-foreground dark:hover:bg-white hover:text-background dark:hover:text-slate-900 transition-all duration-300 group/btn shadow-sm text-[10px] font-black uppercase tracking-widest gap-2"
                                    title="Editar"
                                >
                                    <Edit size={16} className="transition-transform group-hover/btn:scale-110" />
                                    Editar
                                </Link>
                                <button
                                    onClick={() => handleDelete(beat.id)}
                                    className="w-12 h-12 bg-slate-50 dark:bg-rose-500/5 border border-slate-100 dark:border-rose-500/10 text-rose-500/60 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 group/btn shadow-sm"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} className="transition-transform group-hover/btn:scale-110" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
