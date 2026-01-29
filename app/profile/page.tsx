"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Calendar, Music, Crown, Settings,
    LogOut, Loader2, CheckCircle2, Camera, Upload,
    Instagram, Youtube, Twitter, Globe, Info, AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { usePlayer } from '@/context/PlayerContext';
import { Profile } from '@/lib/types';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
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

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (!error) setProfile(data);
            setLoading(false);
        };
        fetchProfile();
    }, [router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);
        setMessage(null);

        try {
            // Logic for checking duplicate username if changed
            // But for simplicity, we focus on the update
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    artistic_name: profile.artistic_name,
                    bio: profile.bio,
                    birth_date: profile.birth_date,
                    social_links: profile.social_links,
                    username: profile.username // The trigger/db should handle the logic for count
                })
                .eq('id', profile.id);

            if (error) throw error;
            setMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error al actualizar' });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);

            setProfile({ ...profile, avatar_url: publicUrl });
            setMessage({ type: 'success', text: 'Foto de perfil actualizada' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setUploading(false);
        }
    };

    if (loading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    const isPremium = profile.subscription_tier === 'premium';
    const isPro = profile.subscription_tier === 'pro';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-10">
                        {/* SIDEBAR SETTINGS */}
                        <div className="md:w-1/3 space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm text-center relative overflow-hidden">
                                {isPremium && <div className="absolute top-0 right-0 p-4"><Crown className="text-blue-200" size={64} /></div>}

                                <div className="relative group mx-auto w-32 h-32 mb-6">
                                    <div className={`w-full h-full rounded-[2rem] overflow-hidden border-4 ${isPremium ? 'border-blue-600' : isPro ? 'border-slate-400' : 'border-slate-100'}`}>
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><User size={48} /></div>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-slate-900 transition-colors">
                                        <Camera size={18} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                    </label>
                                </div>

                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">{profile.artistic_name || 'Tu Nombre'}</h2>
                                <p className="text-blue-600 font-black uppercase tracking-widest text-[10px] mb-8">@{profile.username}</p>

                                <div className="space-y-3">
                                    <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isPremium ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' :
                                            isPro ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        Plan {profile.subscription_tier}
                                    </div>
                                    {isPremium ? (
                                        <p className="text-[10px] font-bold text-blue-600 italic">"Estás en la cima. Sigue así rompiéndola."</p>
                                    ) : (
                                        <button onClick={() => router.push('/pricing')} className="text-blue-600 font-black uppercase tracking-widest text-[9px] hover:underline">
                                            Actualizar Membresía →
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/10">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Gestión</h3>
                                <div className="space-y-1">
                                    <button onClick={() => router.push('/upload')} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition-colors font-bold text-sm">
                                        <Upload size={18} /> Sube tu Beat
                                    </button>
                                    <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition-colors font-bold text-sm">
                                        <Music size={18} /> Ver mi Catálogo
                                    </button>
                                    <button onClick={() => router.push(`/${profile.username}`)} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition-colors font-bold text-sm text-blue-400">
                                        <Globe size={18} /> Ver Perfil Público
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MAIN SETTINGS FORM */}
                        <div className="flex-1">
                            <form onSubmit={handleUpdate} className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-200 shadow-sm space-y-10">
                                {message && (
                                    <div className={`p-5 rounded-2xl flex items-center gap-3 text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                        {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                        {message.text}
                                    </div>
                                )}

                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Datos de <span className="text-blue-600">Cuenta</span></h2>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="label-style">Username</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={profile.username}
                                                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                                    className="input-style"
                                                    disabled={profile.username_changes >= 2}
                                                />
                                                {profile.username_changes >= 2 && <span className="text-[9px] font-bold text-red-500 absolute -bottom-5 left-1">Límite de cambios alcanzado</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label-style">Nombre Artístico</label>
                                            <input type="text" value={profile.artistic_name || ''} onChange={(e) => setProfile({ ...profile, artistic_name: e.target.value })} className="input-style" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="label-style">Biografía</label>
                                            <textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="input-style h-24 resize-none" placeholder="Cuéntale al mundo quién eres..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100">
                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Redes <span className="text-blue-600">Sociales</span></h2>
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="label-style flex items-center gap-2"><Instagram size={14} /> Instagram</label>
                                            <input type="text" value={profile.social_links?.instagram || ''} onChange={(e) => setProfile({ ...profile, social_links: { ...profile.social_links, instagram: e.target.value } })} className="input-style" placeholder="usuario" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label-style flex items-center gap-2"><Youtube size={14} /> Youtube</label>
                                            <input type="text" value={profile.social_links?.youtube || ''} onChange={(e) => setProfile({ ...profile, social_links: { ...profile.social_links, youtube: e.target.value } })} className="input-style" placeholder="@canal" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label-style flex items-center gap-2"><Twitter size={14} /> Twitter</label>
                                            <input type="text" value={profile.social_links?.twitter || ''} onChange={(e) => setProfile({ ...profile, social_links: { ...profile.social_links, twitter: e.target.value } })} className="input-style" placeholder="usuario" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={saving} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-blue-600/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95">
                                    {saving ? <Loader2 className="animate-spin" size={24} /> : "Actualizar mis datos"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .label-style {
                    display: block;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: #94a3b8;
                    margin-left: 0.25rem;
                }
                .input-style {
                    width: 100%;
                    background: #f8fafc;
                    border: 2px solid #f1f5f9;
                    border-radius: 1.25rem;
                    padding: 1rem 1.25rem;
                    outline: none;
                    transition: all 0.2s;
                    font-weight: 700;
                    font-size: 0.875rem;
                    color: #0f172a;
                }
                .input-style:focus {
                    border-color: #2563eb;
                    background: white;
                }
                .input-style:disabled {
                    background: #f1f5f9;
                    color: #cbd5e1;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
