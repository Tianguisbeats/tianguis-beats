"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit3, Trash2, Briefcase, DollarSign, Clock, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Tipos
type Service = {
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    tipo_servicio: string;
    tiempo_entrega_dias: number;
    is_active: boolean;
};

export default function ServicesManagerPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTier, setUserTier] = useState<string | null>(null);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Tier
        const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
        setUserTier(profile?.subscription_tier);

        // Get Services
        const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (servicesData) setServices(servicesData);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !currentService) return;

        try {
            const payload = {
                user_id: user.id,
                titulo: currentService.titulo,
                descripcion: currentService.descripcion,
                precio: currentService.precio,
                tipo_servicio: currentService.tipo_servicio || 'mixing',
                tiempo_entrega_dias: currentService.tiempo_entrega_dias || 3,
                is_active: true
            };

            let error;
            if (currentService.id) {
                // Update
                const { error: err } = await supabase.from('services').update(payload).eq('id', currentService.id);
                error = err;
            } else {
                // Create
                const { error: err } = await supabase.from('services').insert(payload);
                error = err;
            }

            if (error) throw error;
            setIsEditing(false);
            setCurrentService(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error al guardar el servicio");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este servicio?")) return;

        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) {
            alert("Error al eliminar");
        } else {
            fetchData();
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;

    if (userTier !== 'premium') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-amber-100 p-6 rounded-full mb-6 text-amber-600">
                    <Briefcase size={48} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-4">Venta de Servicios Exclusiva</h1>
                <p className="text-slate-500 max-w-md mb-8">
                    La venta de servicios (Mezcla, Master, Mentorías, etc.) es una característica exclusiva para miembros
                    <span className="text-blue-600 font-bold"> Premium</span>.
                </p>
                <Link href="/pricing" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Mejorar a Premium
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Mis Servicios</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Gestiona tu oferta profesional</p>
                </div>
                <button
                    onClick={() => { setCurrentService({}); setIsEditing(true); }}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                    <Plus size={16} />
                    Nuevo Servicio
                </button>
            </div>

            {/* Empty State */}
            {services.length === 0 && !isEditing && (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-12 text-center">
                    <Briefcase className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No tienes servicios activos</h3>
                    <p className="text-slate-400 text-sm mb-6">Comienza a monetizar tus habilidades ofreciendo Mezcla, Mastering o Beats a medida.</p>
                    <button
                        onClick={() => { setCurrentService({}); setIsEditing(true); }}
                        className="text-blue-600 font-bold uppercase tracking-widest text-xs hover:underline"
                    >
                        Crear mi primer servicio
                    </button>
                </div>
            )}

            {/* List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                    <div key={service.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                                <Briefcase size={20} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setCurrentService(service); setIsEditing(true); }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600">
                                    <Edit3 size={16} />
                                </button>
                                <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{service.titulo}</h3>
                        <p className="text-slate-500 text-xs mb-4 line-clamp-2">{service.descripcion}</p>

                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
                            <div className="flex items-center gap-1">
                                <DollarSign size={14} />
                                ${service.precio} MXN
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {service.tiempo_entrega_dias} Días
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit/Create Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-hidden">
                        <h2 className="text-xl font-black uppercase tracking-tighter mb-6">
                            {currentService?.id ? "Editar Servicio" : "Nuevo Servicio"}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Título</label>
                                <input
                                    required
                                    value={currentService?.titulo || ''}
                                    onChange={e => setCurrentService({ ...currentService, titulo: e.target.value })}
                                    placeholder="Ej. Mezcla de Voces Pro"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Precio (MXN)</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={currentService?.precio || ''}
                                            onChange={e => setCurrentService({ ...currentService, precio: Number(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Entrega (Días)</label>
                                    <div className="relative">
                                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={currentService?.tiempo_entrega_dias || ''}
                                            onChange={e => setCurrentService({ ...currentService, tiempo_entrega_dias: Number(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Categoría</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none"
                                    value={currentService?.tipo_servicio || 'mixing'}
                                    onChange={e => setCurrentService({ ...currentService, tipo_servicio: e.target.value })}
                                >
                                    <option value="mixing">Mezcla (Mixing)</option>
                                    <option value="mastering">Masterización</option>
                                    <option value="beat_custom">Beat a Medida</option>
                                    <option value="mentoria">Mentoría / Clase</option>
                                    <option value="sound_kit">Sound Kit / Librería</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={currentService?.descripcion || ''}
                                    onChange={e => setCurrentService({ ...currentService, descripcion: e.target.value })}
                                    placeholder="Describe qué incluye tu servicio..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setCurrentService(null); }}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors shadow-lg"
                                >
                                    {saving ? "Guardando..." : "Guardar Servicio"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
