"use client";

import React, { useEffect, useState } from 'react';
import { supabase, getUserSafe } from '@/lib/supabase';
import { Edit, Trash2, AlertCircle, Plus, Search, Lock, ListMusic } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Switch from '@/components/ui/Switch';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import BeatHealthBadge from '@/components/studio/BeatHealthBadge';
import { resumenSaludCatalogo } from '@/lib/beatHealth';

export default function StudioBeatsPage() {
    const { showToast } = useToast();
    const [beats, setBeats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
    const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);

    const fetchBeats = async () => {
        const user = await getUserSafe();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('beats')
            .select('id, productor_id, titulo, genero, bpm, precio_basica_mxn, precio_gratis_mxn, portada_url, archivo_mp3_url, archivo_wav_url, archivo_stems_url, es_publico, esta_desactivado_por_plan, esta_archivado, es_visible, es_premium_activa, es_exclusiva_premium_activa, conteo_reproducciones, conteo_ventas, conteo_likes, fecha_creacion')
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

    const handleDelete = async (beat: any) => {
        const hasSales = (beat.conteo_ventas || 0) > 0;

        if (hasSales) {
            if (!confirm('Este beat tiene ventas. No se puede eliminar del servidor para proteger a los compradores, pero se archivará y ocultará del catálogo. ¿Continuar?')) return;

            const { error } = await supabase
                .from('beats')
                .update({ esta_archivado: true, es_visible: false, es_publico: false })
                .eq('id', beat.id);

            if (!error) {
                setBeats(prev => prev.map(b => b.id === beat.id ? { ...b, esta_archivado: true, es_visible: false, es_publico: false } : b));
                showToast("Beat archivado (ventas protegidas).", 'success');
            } else {
                showToast('Error al archivar el beat', 'error');
            }
        } else {
            if (!confirm('¿Borrar este beat? Esta acción es permanente y eliminará todos los archivos del servidor.')) return;

            // 1. Borrar de la DB
            const { error: dbError } = await supabase.from('beats').delete().eq('id', beat.id);

            if (!dbError) {
                // 2. Borrar archivos físicos del Storage
                const filesToDelete = [];
                if (beat.portada_url) filesToDelete.push({ bucket: 'portadas_beats', path: beat.portada_url });
                if (beat.archivo_mp3_url) filesToDelete.push({ bucket: 'beats_mp3', path: beat.archivo_mp3_url });
                if (beat.archivo_wav_url) filesToDelete.push({ bucket: 'beats_wav', path: beat.archivo_wav_url });
                if (beat.archivo_stems_url) filesToDelete.push({ bucket: 'beats_stems', path: beat.archivo_stems_url });

                for (const file of filesToDelete) {
                    const cleanPath = file.path.split('/').pop(); // Por si es URL completa o path
                    if (cleanPath) {
                        await supabase.storage.from(file.bucket).remove([cleanPath]);
                    }
                }

                setBeats(prev => prev.filter(b => b.id !== beat.id));
                showToast("Beat y archivos eliminados correctamente.", 'success');
            } else {
                showToast('Error al borrar el beat de la base de datos', 'error');
            }
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
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500">{beats.length} Beats activos</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                        <span className="opacity-40">Inventario</span> <br />
                        <span className="text-blue-500 relative inline-block">
                            de Beats
                            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                        </span>
                    </h1>
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40 ml-1">Universo Sincronizado</p>
                </div>

                <Link
                    href="/upload"
                    className="bg-blue-500 text-white px-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95 flex items-center gap-3 w-fit h-fit shadow-xl shadow-blue-500/20"
                >
                    <Plus size={20} className="stroke-[3]" /> Subir Beat
                </Link>
            </div>

            {/* Buscador Premium */}
            <div className="relative mb-8 max-w-2xl group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500/40 group-focus-within:text-blue-500 transition-all duration-300" size={20} />
                <input
                    type="text"
                    placeholder="Buscar en tu inventario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 group-focus-within:border-blue-500/40 rounded-2xl md:rounded-3xl pl-14 md:pl-16 pr-6 md:pr-8 py-4 md:py-5 text-[11px] font-black text-foreground uppercase tracking-[0.2em] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-muted/40"
                />
            </div>

            {/* Resumen de salud del catálogo — sólo si hay algo por mejorar */}
            {(() => {
                const s = resumenSaludCatalogo(beats);
                if (s.total === 0 || (s.aviso === 0 && s.critico === 0)) return null;
                return (
                    <div className="mb-10 rounded-[2rem] border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground mb-3">Salud de tu catálogo</p>
                            <div className="flex h-2.5 rounded-full overflow-hidden bg-foreground/5 max-w-md">
                                {s.ok > 0 && <div className="bg-emerald-500" style={{ width: `${(s.ok / s.total) * 100}%` }} />}
                                {s.aviso > 0 && <div className="bg-amber-500" style={{ width: `${(s.aviso / s.total) * 100}%` }} />}
                                {s.critico > 0 && <div className="bg-rose-500" style={{ width: `${(s.critico / s.total) * 100}%` }} />}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] font-black uppercase tracking-widest shrink-0">
                            {s.ok > 0 && <span className="text-emerald-500">{s.ok} óptimos</span>}
                            {s.aviso > 0 && <span className="text-amber-500">{s.aviso} con avisos</span>}
                            {s.critico > 0 && <span className="text-rose-500">{s.critico} críticos</span>}
                        </div>
                    </div>
                );
            })()}

                {filtered.length === 0 ? (
                    <div className="p-10 md:p-20 text-center bg-black/5 dark:bg-white/5 rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-border text-foreground">
                        <div className="w-20 h-20 bg-card border border-border rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-muted">
                            <AlertCircle size={36} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-foreground uppercase tracking-tight mb-3">Tu galería está vacía</h3>
                        <p className="text-muted text-[11px] font-bold uppercase tracking-widest mb-8 max-w-sm mx-auto">Sube tu primer beat y aparecerá aquí en segundos.</p>
                        <Link href="/upload" className="bg-accent text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all inline-block">
                            Comenzar Ahora
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((beat) => (
                            <div
                                key={beat.id}
                                className="group relative bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-5 transition-all duration-500 flex flex-col gap-5 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-500/20"
                            >
                                {/* Cover - Minimalist Layout */}
                                <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    {beat.portada_url ? (
                                        <Image src={beat.portada_url} fill sizes="(max-width: 768px) 45vw, 220px" className="object-cover transition-transform duration-1000 group-hover:scale-105" alt={beat.titulo} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-muted font-black text-5xl uppercase tracking-tighter">
                                            {beat.titulo.charAt(0)}
                                        </div>
                                    )}
                                    
                                    {/* Deactivated overlay for plan limits */}
                                    {beat.esta_desactivado_por_plan && (
                                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-8 text-center transition-all duration-500 group-hover:bg-slate-900/90">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl">
                                                    <Lock size={24} className="text-white opacity-80" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] block">Límite Superado</span>
                                                    <Link href="/pricing" className="text-[8px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">Upgrade Plan ↗</Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Info Block */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-4">
                                        <h4 className="font-black text-foreground text-lg tracking-tighter truncate uppercase group-hover:text-blue-500 transition-colors min-w-0">
                                            {beat.titulo}
                                        </h4>
                                        <div className="shrink-0"><BeatHealthBadge beat={beat} /></div>
                                    </div>

                                    {/* Minimal Quick Stats */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-muted opacity-40 mb-0.5">Visibilidad</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${beat.es_publico ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {beat.es_publico ? 'Público' : 'Oculto'}
                                            </span>
                                        </div>
                                        <Switch
                                            active={beat.es_publico && !beat.esta_desactivado_por_plan}
                                            onChange={async (newStatus) => {
                                                if (beat.esta_desactivado_por_plan) {
                                                    showToast('Mejora tu plan para activar este beat', 'error');
                                                    return;
                                                }
                                                const { error } = await supabase.from('beats').update({ es_publico: newStatus }).eq('id', beat.id);
                                                if (!error) {
                                                    setBeats(prev => prev.map(b => b.id === beat.id ? { ...b, es_publico: newStatus } : b));
                                                    showToast(newStatus ? 'Beat publicado' : 'Beat ocultado', 'success');
                                                } else {
                                                    showToast('Error al actualizar estado', 'error');
                                                }
                                            }}
                                            activeColor="bg-emerald-500"
                                            size="sm"
                                            disabled={beat.esta_desactivado_por_plan}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons Footer */}
                                <div className="flex items-center gap-2 mt-auto">
                                    <Link
                                        href={`/studio/beats/edit/${beat.id}`}
                                        className="flex-1 h-11 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-foreground rounded-2xl flex items-center justify-center hover:bg-foreground hover:text-background transition-all duration-300 text-[9px] font-black uppercase tracking-widest gap-2"
                                    >
                                        <Edit size={11} /> Editar
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setSelectedBeatId(beat.id);
                                            setPlaylistModalOpen(true);
                                        }}
                                        className="w-11 h-11 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-muted hover:text-accent hover:border-accent/30 rounded-2xl flex items-center justify-center transition-all duration-300"
                                        title="Gestionar en Playlists"
                                    >
                                        <ListMusic size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(beat)}
                                        className={`w-11 h-11 border rounded-2xl flex items-center justify-center transition-all duration-300 ${beat.esta_archivado ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-rose-500/[0.03] border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                                        disabled={beat.esta_archivado}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {selectedBeatId && (
                <AddToPlaylistModal
                    isOpen={playlistModalOpen}
                    beatId={selectedBeatId}
                    onClose={() => {
                        setPlaylistModalOpen(false);
                        setSelectedBeatId(null);
                    }}
                />
            )}
        </div>
    );
}
