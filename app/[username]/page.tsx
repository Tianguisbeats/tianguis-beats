"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, Instagram, Youtube, Twitter,
    Share2, MoreHorizontal, Calendar, MapPin,
    Music, Play, Users, Crown, Settings, Camera,
    Edit3, CheckCircle2, Copy, Trash2, Layout,
    BarChart2, ShieldCheck, Globe, Zap, Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { usePlayer } from '@/context/PlayerContext';
import { Profile, Beat } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [beats, setBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    // Editing State (Owner Only)
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editArtisticName, setEditArtisticName] = useState('');
    const [editSocials, setEditSocials] = useState<any>({});
    const [saving, setSaving] = useState(false);

    const { playBeat, currentBeat, isPlaying } = usePlayer();

    const fetchAll = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (profileData) {
            setProfile(profileData);
            setEditBio(profileData.bio || '');
            setEditArtisticName(profileData.artistic_name || '');
            setEditSocials(profileData.social_links || {});

            if (user?.id === profileData.id) {
                setIsOwner(true);
            }

            const { data: beatsData } = await supabase
                .from('beats')
                .select('*')
                .eq('producer_id', profileData.id)
                .order('created_at', { ascending: false });

            if (beatsData) setBeats(beatsData);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
    }, [username]);

    const handleUpdateProfile = async () => {
        if (!profile) return;
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                bio: editBio,
                artistic_name: editArtisticName,
                social_links: editSocials
            })
            .eq('id', profile.id);

        if (!error) {
            setProfile({ ...profile, bio: editBio, artistic_name: editArtisticName, social_links: editSocials });
            setIsEditing(false);
        }
        setSaving(false);
    };

    const copyProfileLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("¡Link de perfil copiado!");
    };

    const handleUploadMedia = async (type: 'avatar' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        const fileExt = file.name.split('.').pop();
        const filePath = `${profile.id}/${type}-${Date.now()}.${fileExt}`;

        const bucket = type === 'avatar' ? 'avatars' : 'beats-previews';
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            const updateField = type === 'avatar' ? { avatar_url: publicUrl } : { cover_url: publicUrl };
            await supabase.from('profiles').update(updateField).eq('id', profile.id);
            setProfile({ ...profile, ...updateField });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <h1 className="text-2xl font-black uppercase tracking-widest text-slate-300">Usuario no encontrado</h1>
        </div>
    );

    const isPremium = profile.subscription_tier === 'premium';
    const isPro = profile.subscription_tier === 'pro';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
            <Navbar />

            <main className="flex-1 pb-20">
                {/* 1. SECCIÓN DE PORTADA Y AVATAR (Facebook Style) */}
                <div className="relative">
                    {/* Cover Photo */}
                    <div className="h-64 md:h-[450px] w-full bg-slate-200 relative group overflow-hidden">
                        {profile.cover_url ? (
                            <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-100" />
                        )}
                        {isOwner && (
                            <label className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-2xl hover:bg-slate-900 hover:text-white transition-all">
                                <Camera size={16} className="inline mr-2" /> Cambiar Portada
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMedia('cover', e)} />
                            </label>
                        )}
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent" />
                    </div>

                    {/* Profile Header Stats Area */}
                    <div className="max-w-7xl mx-auto px-4 relative -mt-32 md:-mt-40 z-10">
                        <div className="flex flex-col md:flex-row items-end gap-8">
                            {/* Avatar */}
                            <div className="relative group mx-auto md:mx-0">
                                <div className={`w-48 h-48 md:w-56 md:h-56 rounded-[3rem] border-8 shadow-2xl overflow-hidden bg-white ${isPremium ? 'border-blue-600' : isPro ? 'border-slate-400' : 'border-white'}`}>
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Users size={64} /></div>
                                    )}
                                </div>
                                {isOwner && (
                                    <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 text-white rounded-2xl border-4 border-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-900 transition-colors">
                                        <Camera size={20} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMedia('avatar', e)} />
                                    </label>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left pb-4">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editArtisticName}
                                                onChange={(e) => setEditArtisticName(e.target.value)}
                                                className="bg-transparent border-b-4 border-blue-600 outline-none w-full max-w-[400px]"
                                            />
                                        ) : (
                                            profile.artistic_name || profile.username
                                        )}
                                    </h1>

                                    <div className="flex gap-2">
                                        {profile.is_founder && (
                                            <div title="Founder Badge" className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-400/20">
                                                <Crown size={20} fill="currentColor" />
                                            </div>
                                        )}
                                        {profile.is_verified && (
                                            <div title="Verificado" className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                                {/* Blue Verified Badge Check icon from provider image */}
                                                <CheckCircle2 size={24} fill="currentColor" className="text-blue-50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Settings Gear (Owner Only) */}
                                    {isOwner && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowMenu(!showMenu)}
                                                className="w-10 h-10 bg-transparent text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors"
                                            >
                                                <Settings size={28} />
                                            </button>
                                            {showMenu && (
                                                <div className="absolute top-full left-0 mt-4 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 w-64 z-50 animate-in fade-in zoom-in duration-200">
                                                    <div className="space-y-1">
                                                        <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 font-bold text-sm">
                                                            <BarChart2 size={18} /> Estadísticas
                                                        </button>
                                                        <button className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 font-bold text-sm">
                                                            <Layout size={18} /> Gestionar Beats
                                                        </button>
                                                        <button onClick={() => { setIsEditing(!isEditing); setShowMenu(false) }} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 font-bold text-sm text-blue-600">
                                                            <Edit3 size={18} /> Editar Info Visual
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                                    <span className="text-blue-600">@{profile.username}</span>
                                    {profile.role === 'producer' && <span>• Productor</span>}
                                    <span>• {beats.length} Beats Subidos</span>
                                    <span>• {profile.country || 'México'}</span>
                                    <span>• Miembro desde {new Date(profile.created_at).getFullYear()}</span>
                                </div>
                            </div>

                            {/* Actions Right */}
                            <div className="flex gap-3 pb-4">
                                <button onClick={copyProfileLink} className="w-14 h-14 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-slate-900/5">
                                    <Copy size={20} />
                                </button>
                                <button className="px-10 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-600/30 hover:bg-slate-900 transition-all active:scale-95">
                                    Seguir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CONTENIDO PRINCIPAL (Bio, Socials & Beats) */}
                <div className="max-w-7xl mx-auto px-4 mt-16 grid lg:grid-cols-12 gap-12">

                    {/* Sidebar: About & Social */}
                    <div className="lg:col-span-4 space-y-10">
                        {/* Status Guard */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                                <ShieldCheck size={14} /> Estatus en el Tianguis
                            </h3>
                            <div className={`p-6 rounded-3xl border-2 flex items-center justify-between ${isPremium ? 'border-blue-600/20 bg-blue-50/20' : isPro ? 'border-slate-400/20 bg-slate-50' : 'border-slate-100 bg-white'}`}>
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-widest ${isPremium ? 'text-blue-600' : isPro ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Plan {profile.subscription_tier}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Nivel Actual</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${isPremium ? 'bg-blue-600 shadow-xl shadow-blue-600/30' : isPro ? 'bg-slate-500' : 'bg-slate-200'}`}>
                                    <Zap size={20} fill="currentColor" />
                                </div>
                            </div>
                        </div>

                        {/* About Me Area */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 font-poppins">Trayectoria</h3>
                            <div className="space-y-6">
                                {isEditing ? (
                                    <textarea
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        className="w-full h-32 bg-slate-50 rounded-2xl p-4 outline-none border-2 border-blue-600 text-sm font-medium"
                                        placeholder="Tu biografía..."
                                    />
                                ) : (
                                    <p className="text-slate-600 leading-relaxed font-medium">
                                        {profile.bio || "Este productor aún no ha compartido su historia. Pero sus beats hablan por sí solos."}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    {profile.social_links?.instagram && (
                                        <a href={`https://instagram.com/${profile.social_links.instagram}`} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all">
                                            <Instagram size={18} />
                                        </a>
                                    )}
                                    {profile.social_links?.youtube && (
                                        <a href={`https://youtube.com/${profile.social_links.youtube}`} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all">
                                            <Youtube size={18} />
                                        </a>
                                    )}
                                    {profile.social_links?.twitter && (
                                        <a href={`https://twitter.com/${profile.social_links.twitter}`} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all">
                                            <Twitter size={18} />
                                        </a>
                                    )}
                                    {isEditing && (
                                        <button className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border-2 border-dashed border-blue-200">
                                            <Globe size={18} />
                                        </button>
                                    )}
                                </div>

                                {isEditing && (
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={saving}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                        Guardar Cambios
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Colaboraciones Abiertas */}
                        {profile.open_collaborations && (
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border-4 border-slate-900 hover:border-blue-600 transition-colors">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Networking</h4>
                                <p className="text-xl font-black uppercase leading-tight mb-4">Colaboraciones Abiertas</p>
                                <p className="text-xs text-slate-400 font-bold">¡Hagamos algo épico! Mándame un mensaje al directo para conectar.</p>
                                <div className="absolute -bottom-4 -right-4 bg-slate-800 w-24 h-24 rounded-full blur-2xl opacity-50 group-hover:bg-blue-600 transition-all" />
                            </div>
                        )}
                    </div>

                    {/* Main Feed: Catalog (Playlist Style) */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Catálogo de <span className="text-blue-600 italic">Beats</span></h2>
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400"><MoreHorizontal size={18} /></button>
                            </div>
                        </div>

                        {beats.length === 0 ? (
                            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
                                <Music size={64} className="text-slate-100 mx-auto mb-6" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Este productor aún no tiene catálogo público</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                                {beats.map((b, idx) => {
                                    const isCurrent = currentBeat?.id === b.id;
                                    return (
                                        <div
                                            key={b.id}
                                            className={`group flex items-center gap-6 p-6 border-b border-slate-50 last:border-none transition-all hover:bg-slate-50/50 ${isCurrent ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                                <span className="text-[10px] font-black text-slate-300 w-4">{idx + 1}</span>
                                                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-all">
                                                    {b.cover_url ? (
                                                        <img src={b.cover_url} className="w-full h-full object-cover" alt={b.title} />
                                                    ) : (
                                                        <Music className="text-white/20" size={24} />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link href={`/beats/${b.id}`} className="font-black text-sm text-slate-900 uppercase tracking-tight block truncate hover:text-blue-600 transition-colors">
                                                        {b.title}
                                                    </Link>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{b.genre}</span>
                                                        <span className="text-blue-600 font-black text-[9px] uppercase tracking-widest">{b.bpm} BPM</span>
                                                        {b.musical_key && <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest">• {b.musical_key} {b.musical_scale}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex items-center gap-12 shrink-0">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Play size={12} fill="currentColor" />
                                                    <span className="text-[10px] font-black">{b.play_count || 0}</span>
                                                </div>
                                                <div className="w-24 text-right">
                                                    <span className="text-sm font-black text-slate-900">${b.price_mxn}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => playBeat(b)}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${isCurrent && isPlaying ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-slate-900'}`}
                                            >
                                                {isCurrent && isPlaying ? <Layout size={20} className="animate-pulse" /> : <Play size={20} fill="currentColor" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

