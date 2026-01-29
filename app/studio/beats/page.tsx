"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Play, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StudioBeatsPage() {
    const [beats, setBeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBeats();
    }, []);

    const fetchBeats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('beats')
            .select('*')
            .eq('producer_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setBeats(data);
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

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold">Cargando tu inventario...</div>;

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">Tus Beats</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestión de catálogo</p>
                </div>
                <Link href="/upload" className="bg-blue-600 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors shadow-xl shadow-blue-600/20">
                    Subir Nuevo
                </Link>
            </div>

            {beats.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="font-black text-slate-900 mb-2">No has subido beats</h3>
                    <p className="text-slate-500 text-sm mb-6">Empieza a construir tu legado hoy.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="py-4 pl-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Beat</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Stats</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Precio</th>
                                <th className="py-4 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {beats.map((beat) => (
                                <tr key={beat.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative group-hover:shadow-md transition-all">
                                                {beat.cover_url && <img src={beat.cover_url} className="w-full h-full object-cover" />}
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <Play size={16} className="text-white fill-current" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm">{beat.title}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{beat.bpm} BPM • {beat.musical_key || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <div className="inline-flex items-center gap-4 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <Play size={10} /> {beat.play_count || 0}
                                            </div>
                                            <div className="w-px h-3 bg-slate-100"></div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <span className="text-red-400">♥</span> {beat.like_count || 0}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="font-black text-slate-700 text-sm">${beat.price_mxn}</span>
                                    </td>
                                    <td className="py-4 pr-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors" title="Editar (Próximamente)">
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(beat.id)}
                                                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                            >
                                                <Trash2 size={14} />
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
