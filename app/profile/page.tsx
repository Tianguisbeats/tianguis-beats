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
    CheckCircle2,
    Camera,
    Upload,
    Play,
    Pause
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { usePlayer } from '@/context/PlayerContext';

/**
 * Página de Perfil: Muestra y permite editar la información del usuario.
 * Gestiona el estado de la suscripción y detalles personales.
 */
export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [userBeats, setUserBeats] = useState<any[]>([]);
    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            // Fetch Profile
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

            // Fetch User Beats
            const { data: beats, error: beatsError } = await supabase
                .from('beats')
                .select('*')
                .eq('producer_id', session.user.id)
                .order('created_at', { ascending: false });

            if (!beatsError && beats) {
                const transformed = beats.map(b => {
                    const { data: { publicUrl } } = supabase.storage
                        .from('beats-previews')
                        .getPublicUrl(b.mp3_url);

                    return {
                        ...b,
                        producer: profile?.display_name || b.producer_id,
                        mp3_url: publicUrl
                    };
                });
                setUserBeats(transformed);
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
                display_name: profile.display_name,
                birth_date: profile.birth_date
            })
            .eq('id', profile.id);

        if (error) {
            setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
        } else {
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        }
        setSaving(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', session.user.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, avatar_url: publicUrl });
            setMessage({ type: 'success', text: 'Foto de perfil actualizada' });
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            setMessage({ type: 'error', text: 'Error al subir la imagen: ' + err.message });
        } finally {
            setUploading(false);
        }
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
                                <div className="relative group">
                                    <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-600/20 rotate-3 overflow-hidden">
                                        {profile.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt={profile.display_name}
                                                className="w-full h-full object-cover -rotate-3 scale-110"
                                            />
                                        ) : (
                                            <User size={40} />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-blue-600/80 flex items-center justify-center animate-pulse">
                                                <Loader2 className="animate-spin text-white" size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-all shadow-sm hover:scale-110">
                                        <Camera size={20} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-tight mt-4">{profile.display_name || 'Sin Nombre'}</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">@{profile.username}</p>
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
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Display Name (Nombre Artístico)</label>
                                            <div className="relative">
                                                <Music className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="text"
                                                    value={profile.display_name || ''}
                                                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Username (No editable)</label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">@</span>
                                                <input
                                                    type="text"
                                                    value={profile.username || ''}
                                                    disabled
                                                    className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl pl-10 pr-6 py-4 outline-none font-bold text-slate-500 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Fecha de Nacimiento</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="date"
                                                    value={profile.birth_date || ''}
                                                    onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
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

                            {/* Mis Beats Section */}
                            <div className="mt-12">
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Mis <span className="text-blue-600">Beats</span></h3>

                                {userBeats.length > 0 ? (
                                    <div className="grid gap-4">
                                        {userBeats.map((beat) => (
                                            <div key={beat.id} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex items-center justify-between group hover:border-blue-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => playBeat(beat)}
                                                        className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm transition-all ${currentBeat?.id === beat.id && isPlaying ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
                                                    >
                                                        {currentBeat?.id === beat.id && isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                                                    </button>
                                                    <div>
                                                        <h4 className="font-black uppercase tracking-tight text-sm">{beat.title}</h4>
                                                        <div className="flex gap-3 mt-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{beat.genre}</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">•</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{beat.bpm} BPM</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">•</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">${beat.price_mxn} MXN</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push('/dashboard')}
                                                    className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"
                                                >
                                                    <Settings size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-[2.5rem] text-center">
                                        <p className="text-slate-400 font-bold text-sm mb-4">Aún no has subido ningún beat.</p>
                                        <button
                                            onClick={() => router.push('/dashboard')}
                                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            <Upload size={14} />
                                            Subir mi primer Beat
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
