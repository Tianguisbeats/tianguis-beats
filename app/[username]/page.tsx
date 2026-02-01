"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, Instagram, Youtube, Twitter,
    Share2, MoreHorizontal, Calendar, MapPin,
    Music, Play, Users, Crown, Settings, Camera,
    Edit3, CheckCircle2, Copy, Trash2, Layout,
    BarChart2, ShieldCheck, Globe, Zap, Loader2, UserPlus, UserCheck
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { usePlayer } from '@/context/PlayerContext';
import { Profile, Beat } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
    "México 🇲🇽", "Colombia 🇨🇴", "Argentina 🇦🇷", "España 🇪🇸", "Chile 🇨🇱",
    "Perú 🇵🇪", "Ecuador 🇪🇨", "Guatemala 🇬🇹", "Estados Unidos 🇺🇸",
    "Puerto Rico 🇵🇷", "República Dominicana 🇩🇴", "Venezuela 🇻🇪", "Panamá 🇵🇦", "Costa Rica 🇨🇷"
];

/**
 * PublicProfilePage: Muestra el perfil público de un productor o usuario.
 * Incluye su biografía, redes sociales, y catálogo de beats.
 * @param username El nombre de usuario obtenido de la URL dinámica.
 */
export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [beats, setBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Follow System
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editArtisticName, setEditArtisticName] = useState('');
    const [editCountry, setEditCountry] = useState('');
    const [editSocials, setEditSocials] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [isAdjustingCover, setIsAdjustingCover] = useState(false);
    const [tempOffset, setTempOffset] = useState(50);

    const { playBeat, currentBeat, isPlaying } = usePlayer();

    // Fetch Data
    const fetchAll = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // 1. Get Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, username, artistic_name, avatar_url, cover_url, cover_offset_y, bio, country, social_links, is_verified, is_founder, subscription_tier, created_at')
                .eq('username', username)
                .single();

            if (profileData) {
                setProfile(profileData);
                setEditBio(profileData.bio || '');
                setEditArtisticName(profileData.artistic_name || '');
                setEditCountry(profileData.country || '');
                setEditSocials(profileData.social_links || {});
                setTempOffset(profileData.cover_offset_y ?? 50);

                if (user?.id === profileData.id) {
                    setIsOwner(true);
                }

                // 2. Get Beats (Optimized Select)
                const { data: beatsData } = await supabase
                    .from('beats')
                    .select('id, title, genre, bpm, price_mxn, cover_url, mp3_url, musical_key, mood, is_public, play_count, like_count, created_at')
                    .eq('producer_id', profileData.id)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });

                if (beatsData) {
                    // Transform internal storage paths to public URLs with encoding for spaces
                    const transformedBeats = await Promise.all(beatsData.map(async (b: Beat) => {
                        const path = b.mp3_url || '';
                        const encodedPath = path.split('/').map(s => encodeURIComponent(s)).join('/');

                        const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';

                        const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(encodedPath);

                        // Resolve Cover URL
                        const finalCoverUrl = b.cover_url?.startsWith('http')
                            ? b.cover_url
                            : b.cover_url
                                ? supabase.storage.from('portadas-beats').getPublicUrl(b.cover_url).data.publicUrl
                                : null;

                        return { ...b, mp3_url: publicUrl, cover_url: finalCoverUrl };
                    }));
                    setBeats(transformedBeats);
                }

                // 3. Get Follow Status & Count
                const { count } = await supabase
                    .from('follows')
                    .select('id', { count: 'exact', head: true })
                    .eq('following_id', profileData.id);
                setFollowersCount(count || 0);

                if (user) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('id')
                        .eq('follower_id', user.id)
                        .eq('following_id', profileData.id)
                        .single();
                    setIsFollowing(!!followData);
                }
            }
        } catch (err) {
            console.error("Error fetching profile data:", err);
        } finally {
            setLoading(false);
        }
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
                country: editCountry,
                // artistic_name: editArtisticName, // Only update if needed, maybe restricted?
                social_links: editSocials
            })
            .eq('id', profile.id);

        if (!error) {
            setProfile({ ...profile, bio: editBio, country: editCountry, social_links: editSocials });
            setIsEditing(false);
        }
        setSaving(false);
    };

    const handleFollowToggle = async () => {
        if (!currentUserId || !profile) return router.push('/login');

        if (isFollowing) {
            await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', profile.id);
            setFollowersCount(prev => prev - 1);
            setIsFollowing(false);
        } else {
            await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id });
            setFollowersCount(prev => prev + 1);
            setIsFollowing(true);
        }
    };

    const handleUploadMedia = async (type: 'avatar' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        // Relaxed Validation
        if (file.size > 10 * 1024 * 1024) {
            alert("El peso máximo permitido es de 10MB.");
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert("Formato no soportado. Usa JPG, PNG o WebP.");
            return;
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${profile.username}/${type}-${Date.now()}.${fileExt}`;
        const bucket = type === 'avatar' ? 'fotos-perfil' : 'fotos-portada';

        // Use upsert to avoid duplicate errors if any, though timestamp makes it unique
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
            upsert: true,
            cacheControl: '3600'
        });

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            const updateField = type === 'avatar' ? { avatar_url: publicUrl } : { cover_url: publicUrl };

            const { error: dbUpdateError } = await supabase.from('profiles').update(updateField).eq('id', profile.id);
            if (dbUpdateError) {
                alert("Error al actualizar base de datos: " + dbUpdateError.message);
                return;
            }

            setProfile({ ...profile, ...updateField });

            if (type === 'cover') {
                setIsAdjustingCover(true);
            } else {
                alert("¡Avatar actualizado con éxito!");
                window.location.reload();
            }
        } else {
            console.error("Upload Error:", uploadError);
            alert("Error al subir archivo: " + uploadError.message);
        }
    };

    const handleSaveAdjustment = async () => {
        if (!profile) return;
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({ cover_offset_y: tempOffset })
            .eq('id', profile.id);

        if (!error) {
            setProfile({ ...profile, cover_offset_y: tempOffset });
            setIsAdjustingCover(false);
            alert("Posición guardada");
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
    );

    if (!profile && !loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white pt-32 p-4 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                <Users size={40} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">Usuario no encontrado</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">Ese tianguis aún no se ha puesto</p>
            <Link href="/" className="px-8 py-3 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">
                Volver al Inicio
            </Link>
        </div>
    );

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col pt-24">
            <Navbar />

            <main className="flex-1 pb-20">
                {/* 1. Portada */}
                <div className={`relative h-48 md:h-80 bg-slate-100 group overflow-hidden ${isAdjustingCover ? 'ring-4 ring-blue-500 ring-inset' : ''}`}>
                    {profile.cover_url ? (
                        <img
                            src={profile.cover_url}
                            className="w-full h-full object-cover transition-all duration-300"
                            style={{ objectPosition: `center ${isAdjustingCover ? tempOffset : (profile.cover_offset_y ?? 50)}%` }}
                            alt="Cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-100" />
                    )}

                    {isOwner && !isAdjustingCover && (
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={() => setIsAdjustingCover(true)}
                                className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm transition-all flex items-center gap-2"
                            >
                                <Edit3 size={14} /> Ajustar
                            </button>
                            <label className="bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-xl transition-all flex items-center gap-2 border border-slate-200">
                                <Camera size={14} className="text-blue-600" /> Cambiar Portada
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMedia('cover', e)} />
                            </label>
                        </div>
                    )}

                    {isAdjustingCover && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 backdrop-blur-md">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-100">
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                                        <Layout size={24} />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Ajustar Portada</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Desliza para centrar la imagen</p>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={tempOffset}
                                    onChange={(e) => setTempOffset(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-8"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setIsAdjustingCover(false);
                                            setTempOffset(profile.cover_offset_y ?? 50);
                                        }}
                                        className="flex-1 px-6 py-3 border border-slate-100 rounded-full font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveAdjustment}
                                        disabled={saving}
                                        className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-8 mb-8 flex flex-col md:flex-row items-end gap-6">

                        {/* Avatar */}
                        <div className="relative group shrink-0 mx-auto md:mx-0">
                            <div className={`w-40 h-40 rounded-full border-4 shadow-2xl overflow-hidden transition-all duration-500 ${profile.subscription_tier === 'premium'
                                ? 'border-blue-600 shadow-blue-500/30'
                                : profile.subscription_tier === 'pro'
                                    ? 'border-amber-400 shadow-amber-400/30'
                                    : 'border-white shadow-lg'
                                }`}>
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Users size={48} /></div>
                                )}
                            </div>
                            {isOwner && (
                                <label className="absolute bottom-2 right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors border-2 border-white shadow-sm">
                                    <Camera size={14} />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMedia('avatar', e)} />
                                </label>
                            )}
                        </div>

                        {/* Info Header */}
                        <div className="flex-1 text-center md:text-left pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-3 mb-3 text-center md:text-left pt-12">
                                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                                            {profile.artistic_name || profile.username}
                                        </h1>
                                        {profile.is_verified && (
                                            <div title="Verificado" className="self-center md:self-end md:mb-2 translate-y-[-2px]">
                                                <img src="/verified-badge.png" alt="Verificado" className="w-5 h-5 object-contain" />
                                            </div>
                                        )}
                                        {profile.is_founder && (
                                            <div title="Founder" className="text-yellow-400 self-center md:self-end md:mb-2 ml-[-4px]">
                                                <Crown size={22} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center md:justify-start gap-2">
                                        {profile.username}
                                        {profile.country && <span className="text-slate-300 ml-1">• {profile.country}</span>}
                                        <span className="text-slate-300 ml-1">• Miembro desde {profile.created_at ? new Date(profile.created_at).getFullYear() : (new Date().getFullYear())}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-3">
                                    {isOwner ? (
                                        <button
                                            onClick={() => {
                                                if (isEditing) {
                                                    const hasChanges = editBio !== (profile?.bio || '') ||
                                                        editArtisticName !== (profile?.artistic_name || '') ||
                                                        editCountry !== (profile?.country || '') ||
                                                        JSON.stringify(editSocials) !== JSON.stringify(profile?.social_links || {});

                                                    if (hasChanges) {
                                                        handleUpdateProfile();
                                                    } else {
                                                        setIsEditing(false);
                                                    }
                                                } else {
                                                    setIsEditing(true);
                                                }
                                            }}
                                            className={`px-6 py-2 rounded-full border-2 font-black text-[10px] uppercase tracking-widest transition-all ${isEditing ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'}`}
                                        >
                                            {isEditing ? (
                                                (editBio !== (profile?.bio || '') ||
                                                    editArtisticName !== (profile?.artistic_name || '') ||
                                                    editCountry !== (profile?.country || '') ||
                                                    JSON.stringify(editSocials) !== JSON.stringify(profile?.social_links || {}))
                                                    ? 'Guardar Cambios' : 'Cancelar'
                                            ) : 'Editar Perfil'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFollowToggle}
                                            className={`px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${isFollowing ? 'bg-white border-2 border-slate-200 text-slate-900' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                                        >
                                            {isFollowing ? <><Check size={14} /> Siguiendo</> : <><UserPlus size={14} /> Seguir</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* Stats */}
                            <div className="flex items-center justify-around bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <div className="text-center">
                                    <span className="block text-xl font-black text-slate-900">{followersCount}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seguidores</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl font-black text-slate-900">{beats.length}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Beats</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl font-black text-slate-900">0</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seguidos</span>
                                </div>
                            </div>

                            {/* Status Sidebar (AHORA ARRIBA) */}
                            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 font-outfit">Estatus Tianguis</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">Plan</span>
                                        <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg ${profile.subscription_tier === 'premium' ? 'bg-blue-600 text-white' : profile.subscription_tier === 'pro' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>{profile.subscription_tier}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">Verificación</span>
                                        {profile.is_verified ? (
                                            <span className="text-xs font-black uppercase text-blue-600 flex items-center gap-1.5">
                                                <img src="/verified-badge.png" className="w-3.5 h-3.5" />
                                                Verificado
                                            </span>
                                        ) : (
                                            <span className="text-xs font-black uppercase text-slate-400">Sin Verificar</span>
                                        )}
                                    </div>
                                    {profile.is_founder && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-600">Insignia</span>
                                            <span className="text-xs font-black uppercase text-yellow-600 bg-yellow-100 px-2 py-1 rounded-lg flex items-center gap-1"><Crown size={10} /> Founder</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bio Box (AHORA ABAJO) */}
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                                {/* Socials */}
                                <div className="flex gap-2 mb-6 justify-center md:justify-start">
                                    {profile.social_links?.instagram && (
                                        <a href={`https://instagram.com/${profile.social_links.instagram}`} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all"><Instagram size={18} /></a>
                                    )}
                                    {profile.social_links?.youtube && (
                                        <a href={`https://youtube.com/${profile.social_links.youtube}`} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all"><Youtube size={18} /></a>
                                    )}
                                </div>

                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-4">Trayectoria</h3>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">País</label>
                                            <select
                                                value={editCountry}
                                                onChange={(e) => setEditCountry(e.target.value)}
                                                className="w-full bg-slate-50 rounded-xl px-4 py-2 text-xs font-bold border border-transparent focus:border-blue-500 outline-none appearance-none"
                                            >
                                                <option value="">Seleccionar País</option>
                                                {COUNTRIES.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Biografía</label>
                                            <textarea
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                                className="w-full h-32 bg-slate-50 rounded-xl p-4 text-sm font-medium border border-transparent focus:border-blue-500 outline-none resize-none"
                                                placeholder="Escribe tu historia..."
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={saving}
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
                                        >
                                            {saving ? 'Guardando...' : 'Guardar Perfil'}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        {profile.bio || "Sin biografía aún."}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Beats Feed */}
                        <div className="lg:col-span-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Beats Recientes</h2>
                                <Link href="/beats" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Ver Todo</Link>
                            </div>

                            <div className="space-y-3">
                                {beats.length === 0 ? (
                                    <div className="bg-slate-50 rounded-2xl p-12 text-center">
                                        <Music size={48} className="text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay beats publicos</p>
                                    </div>
                                ) : (
                                    beats.map((b, idx) => (
                                        <div key={b.id} className="group bg-white rounded-2xl p-3 flex items-center gap-4 hover:shadow-lg transition-all border border-slate-50">
                                            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 overflow-hidden">
                                                {b.cover_url ? <img src={b.cover_url} className="w-full h-full object-cover" /> : <Music size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/beats/${b.id}`} className="block font-black text-sm text-slate-900 truncate hover:text-blue-600 transition-colors uppercase">{b.title}</Link>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{b.bpm} BPM • {b.genre}</p>
                                            </div>
                                            <button
                                                onClick={() => playBeat({
                                                    ...b,
                                                    producer: profile.artistic_name || profile.username,
                                                    producer_username: profile.username,
                                                    is_verified: profile.is_verified,
                                                    is_founder: profile.is_founder,
                                                    mp3_url: (b as any).mp3_url
                                                })}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentBeat?.id === b.id && isPlaying ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-blue-600 hover:text-white'}`}
                                            >
                                                {currentBeat?.id === b.id && isPlaying ? <Layout size={16} className="animate-pulse" /> : <Play size={16} fill="currentColor" />}
                                            </button>
                                        </div>
                                    ))
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
