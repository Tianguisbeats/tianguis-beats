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
        <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-2">Tus Beats</h1>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest">Gestión de catálogo</p>
                </div>
                <Link href="/upload" className="bg-accent text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors shadow-xl shadow-accent/20">
                    Subir Nuevo
                </Link>
            </div>

            {beats.length === 0 ? (
                <div className="text-center py-20 bg-background rounded-3xl border-2 border-dashed border-border">
                    <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted/30">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="font-black text-foreground mb-2">No has subido beats</h3>
                    <p className="text-muted text-sm mb-6">Empieza a construir tu legado hoy.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-4 pl-4 text-[10px] font-black uppercase tracking-widest text-muted">Beat</th>
                                <th className="py-4 pr-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {beats.map((beat) => (
                                <tr key={beat.id} className="group border-b border-border hover:bg-background/50 transition-colors">
                                    <td className="py-4 pl-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-accent-soft shrink-0 relative group-hover:shadow-md transition-all">
                                                {beat.portadabeat_url && <img src={beat.portadabeat_url} className="w-full h-full object-cover" />}
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <Play size={16} className="text-white fill-current" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-foreground text-sm">{beat.title}</h4>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 pr-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link
                                                href={`/studio/beats/edit/${beat.id}`}
                                                className="bg-accent text-white px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-all shadow-md flex items-center gap-2"
                                            >
                                                <Edit size={12} /> Editar
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(beat.id)}
                                                className="bg-red-500 text-white px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-md flex items-center gap-2"
                                            >
                                                <Trash2 size={12} /> Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
