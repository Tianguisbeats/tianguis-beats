"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Calendar,
    Music,
    Crown,
    Settings,
    LogOut,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Página de Perfil: Muestra y permite editar la información del usuario.
 * Gestiona el estado de la suscripción y detalles personales.
 */
export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
            setLoading(false);
        };

        fetchProfile();
    }, [router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: profile.full_name,
                artistic_name: profile.artistic_name,
                age: profile.age
            })
            .eq('id', profile.id);

        if (error) {
            setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
        } else {
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        }
        setSaving(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Mi <span className="text-blue-600">Perfil</span></h1>
                            <p className="text-slate-500 font-medium">Gestiona tu identidad en el Tianguis.</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-slate-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] transition-colors"
                        >
                            <LogOut size={16} />
                            Cerrar Sesión
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Sidebar / Badge */}
                        <div className="space-y-6">
                            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-600/20 rotate-3">
                                    <User size={40} />
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-tight">{profile.artistic_name || 'Sin Nombre'}</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{profile.role === 'producer' ? 'Productor' : 'Artista'}</p>

                                <div className="mt-8 pt-8 border-t border-slate-200 w-full">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${profile.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-600' :
                                            profile.subscription_tier === 'pro' ? 'bg-orange-100 text-orange-600' :
                                                'bg-slate-200 text-slate-600'
                                        }`}>
                                        {profile.subscription_tier === 'premium' ? <Crown size={12} /> : <Music size={12} />}
                                        Plan {profile.subscription_tier}
                                    </div>
                                    {profile.subscription_tier === 'free' && (
                                        <button
                                            onClick={() => router.push('/pricing')}
                                            className="block w-full mt-4 text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest text-[9px] transition-colors"
                                        >
                                            Mejorar Plan →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Info */}
                        <div className="md:col-span-2">
                            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 md:p-10">
                                <form onSubmit={handleUpdate} className="space-y-6">
                                    {message && (
                                        <div className={`p-4 rounded-xl text-xs font-bold text-center border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                                            }`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nombre Completo</label>
                                            <div className="relative">
                                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="text"
                                                    value={profile.full_name || ''}
                                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nombre Artístico</label>
                                            <div className="relative">
                                                <Music className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="text"
                                                    value={profile.artistic_name || ''}
                                                    onChange={(e) => setProfile({ ...profile, artistic_name: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Edad</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="number"
                                                    value={profile.age || ''}
                                                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
