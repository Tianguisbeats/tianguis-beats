"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Play, AlertCircle, Heart, Music, TrendingUp, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import Switch from '@/components/ui/Switch';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';

export default function StudioBeatsPage() {
    const { showToast } = useToast();
    const [beats, setBeats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchBeats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('beats')
            .select('id, productor_id, titulo, genero, bpm, precio_basico_mxn, portada_url, archivo_mp3_url, es_publico, conteo_reproducciones, conteo_ventas, conteo_likes, fecha_creacion')
            .eq('productor_id', user.id)
            .order('fecha_creacion', { ascending: false });

        if (data) {
            const transformed = data.map((b: any) => {
                let finalCoverUrl = b.portada_url;
                if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
                    const { data: { publicUrl } } = supabase.storage.from('portadas_beats').getPublicUrl(finalCoverUrl);
                    finalCoverUrl = publicUrl;
                } else if (!finalCoverUrl) {
                    finalCoverUrl = null;
                }
                return { ...b, portada_url: finalCoverUrl };
            });
            setBeats(transformed);
        }
        setLoading(false);
    };

    useEffect(() => { fetchBeats(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Borrar este beat? Esta acción es permanente.')) return;
        const { error } = await supabase.from('beats').delete().eq('id', id);
        if (!error) {
            setBeats(prev => prev.filter(b => b.id !== id));
            showToast("Beat eliminado correctamente.", 'success');
        } else {
            showToast('Error al borrar el beat', 'error');
        }
    };

    const formatNumber = (n: number) => new Intl.NumberFormat('es-MX').format(n || 0);

    if (loading) return <LoadingTianguis />;

    const filtered = beats.filter(b =>
        b.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.genero && b.genero.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        /* ── Inventario de beats del productor en el Studio ── */
        <div className="space-y-8 pb-24 md:pb-0">
            {/* ── Encabezado: contador de beats activos y botón de subir ── */}
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">{beats.length} Beats activos</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-2 leading-[1]">
                        Inventario de<br /><span className="text-accent underline decoration-white/10 underline-offset-8">Beats.</span>
                    </h1>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-50 ml-1">Sincronizado con el Catálogo</p>
                </div>
                {/* Botón para subir un nuevo beat — full-width en móvil */}
                <Link
                    href="/upload"
                    className="group relative overflow-hidden bg-foreground text-background w-full md:w-auto px-7 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center gap-2.5 justify-center"
                >
                    <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <Plus size={16} className="relative z-10 group-hover:text-white transition-colors" />
                    <span className="relative z-10 group-hover:text-white transition-colors">Subir Nuevo Beat</span>
                </Link>
            </div>


            {/* Table container */}
            <div className="bg-card border border-border rounded-[3rem] p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                {/* Search */}
                <div className="relative mb-8 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-50" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o género..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-3.5 text-[11px] font-bold text-slate-700 dark:text-foreground uppercase tracking-widest focus:outline-none focus:border-accent/40 transition-all placeholder:text-muted/50 shadow-inner"
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="p-20 text-center bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                        <div className="w-20 h-20 bg-white dark:bg-card border border-slate-200 dark:border-border/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-muted shadow-sm">
                            <AlertCircle size={36} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-foreground uppercase tracking-tight mb-3">Tu galería está vacía</h3>
                        <p className="text-muted text-[11px] font-bold uppercase tracking-widest mb-8 max-w-sm mx-auto opacity-60">Tus beats aparecerán aquí una vez que los subas.</p>
                        <Link href="/upload" className="bg-accent text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl inline-block">
                            Comenzar Ahora
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((beat) => (
                            <div
                                key={beat.id}
                                className="group relative bg-slate-50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/5 hover:border-accent/20 rounded-[2.5rem] p-5 transition-all duration-500 flex flex-col gap-5 shadow-sm hover:shadow-2xl dark:hover:shadow-black/30 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/30 transition-all" />

                                {/* Cover */}
                                <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-inner">
                                    {beat.portada_url ? (
                                        <img src={beat.portada_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={beat.titulo} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-muted font-black text-4xl uppercase tracking-tighter">
                                            {beat.titulo.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                                        <Play size={36} className="text-white fill-current drop-shadow-lg" />
                                    </div>
                                    {/* Genre + BPM badge */}
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                        {beat.genero && <span className="bg-black/60 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">{beat.genero}</span>}
                                        {beat.bpm && <span className="bg-black/60 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">{beat.bpm} BPM</span>}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-900 dark:text-foreground text-lg tracking-tight truncate mb-3 group-hover:text-accent transition-colors">{beat.titulo}</h4>

                                    {/* Mini stats */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-widest">
                                            <Play size={10} className="text-blue-500" fill="currentColor" /> {formatNumber(beat.conteo_reproducciones)}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-widest">
                                            <Heart size={10} className="text-rose-500" fill="currentColor" /> {formatNumber(beat.conteo_likes)}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-widest">
                                            <TrendingUp size={10} className="text-emerald-500" /> {formatNumber(beat.conteo_ventas || 0)}
                                        </span>
                                    </div>

                                    {/* Visibility toggle */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted/60 mb-0.5">Visibilidad</p>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${beat.es_publico ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {beat.es_publico ? 'Público' : 'Oculto'}
                                            </span>
                                        </div>
                                        <Switch
                                            active={beat.es_publico}
                                            onChange={async (newStatus) => {
                                                const { error } = await supabase.from('beats').update({ es_publico: newStatus }).eq('id', beat.id);
                                                if (!error) {
                                                    setBeats(prev => prev.map(b => b.id === beat.id ? { ...b, es_publico: newStatus } : b));
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

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                                    <Link
                                        href={`/studio/beats/edit/${beat.id}`}
                                        className="flex-1 h-10 bg-foreground/5 border border-border text-foreground rounded-xl flex items-center justify-center hover:bg-foreground hover:text-background transition-all duration-300 text-[10px] font-black uppercase tracking-widest gap-2"
                                    >
                                        <Edit size={12} /> Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(beat.id)}
                                        className="w-10 h-10 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
