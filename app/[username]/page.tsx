"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, Instagram, Youtube, Twitter,
    Share2, MoreHorizontal, Calendar, MapPin,
    Music, Play, Users, Crown, Settings, Camera,
    Edit3, CheckCircle2, Copy, Trash2, Layout,
    BarChart2, ShieldCheck, Globe, Zap, Loader2, UserPlus, UserCheck, LayoutGrid, ListMusic, Plus, MoveVertical, Save, ChevronUp, ChevronDown, List, Briefcase, Clock, DollarSign, Package
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCardPro from '@/components/explore/BeatCardPro';
import BeatRow from '@/components/BeatRow';
import PlaylistSection from '@/components/PlaylistSection';
import PlaylistManagerModal from '@/components/PlaylistManagerModal';
import { usePlayer } from '@/context/PlayerContext';
import { Profile, Beat } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const COUNTRIES = [
    "México 🇲🇽", "Colombia 🇨🇴", "Argentina 🇦🇷", "España 🇪🇸", "Chile 🇨🇱",
    "Perú 🇵🇪", "Ecuador 🇪🇨", "Guatemala 🇬🇹", "Estados Unidos 🇺🇸",
    "Puerto Rico 🇵🇷", "República Dominicana 🇩🇴", "Venezuela 🇻🇪", "Panamá 🇵🇦", "Costa Rica 🇨🇷"
];

// Social Media Icons Mapping
const SOCIAL_ICONS: Record<string, any> = {
    web: { icon: Globe, color: "hover:text-blue-500" },
    tiktok: {
        path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77-1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
        color: "hover:text-black dark:hover:text-white"
    },
    spotify: {
        path: "M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8m3.93 11c-.3.06-.62 0-.85-.14-2.34-1.42-5.3-1.74-8.77-1.74-.29 0-.58.07-.82.2a.57.57 0 0 1-.78-.23c-.16-.28-.06-.63.22-.79 3.86.06 7.18.42 9.9 2a1 1 0 0 1 .4.15c.29.17.38.54.21.83-.11.19-.3.29-.51.29zM12 9.04c-3.15 0-5.83.33-8.08 1.05-.38.12-.58.53-.46.9.11.33.45.52.8.52.1 0 .21-.03.31-.06 2.02-.65 4.49-.95 7.43-.95 2.81 0 5.2.28 7.15.86.1.03.2.05.3.05.28 0 .55-.13.7-.37.21-.34.11-.78-.23-.99-2.22-.69-5.11-1.01-7.92-1.01zm-7.6 2.87c2.68-.8 6.09-1.12 9.06-1.12 2.62 0 5.64.26 8.27 1.05.47.14.73.65.59 1.12-.13.43-.53.7-1.02.7-.1 0-.21-.02-.3-.05-2.29-.68-4.99-.91-7.54-.91-2.6 0-5.63.29-8.04 1.01-.1.03-.2.04-.3.04-.4 0-.8-.25-.94-.64-.2-.47.05-1 .52-1.2z",
        color: "hover:text-green-500"
    },
    applemusic: {
        icon: Music,
        color: "hover:text-rose-500"
    },
    tidal: {
        path: "M12.01 2.24L9.77 4.48l2.24 2.24 2.24-2.24-2.24-2.24zM5.29 6.72L3.05 8.96l2.24 2.24 2.24-2.24-2.24-2.24zM12.01 11.2l-2.24 2.24 2.24 2.24 2.24-2.24-2.24-2.24zM18.73 6.72l-2.24 2.24 2.24 2.24 2.24-2.24-2.24-2.24z",
        color: "hover:text-black dark:hover:text-white"
    }
};

const SOCIAL_KEYS = ['instagram', 'youtube', 'tiktok', 'spotify', 'applemusic', 'tidal', 'web'];

const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    let videoId = '';
    try {
        // Handle standard watch URLs
        if (url.includes('youtube.com/watch')) {
            const urlObj = new URL(url);
            videoId = urlObj.searchParams.get('v') || '';
        }
        // Handle short URLs (youtu.be)
        else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
        }
        // Handle embed URLs
        else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1].split(/[?#]/)[0];
        }
        // Handle Shorts URLs
        else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('shorts/')[1].split(/[?#]/)[0];
        }
    } catch (e) {
        console.error("Error parsing YouTube URL:", e);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : '';
};

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
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [soundKits, setSoundKits] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'beats' | 'services' | 'playlists' | 'sound_kits'>('beats');
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Playlist Management
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<any>(null);

    // Follow System
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editArtisticName, setEditArtisticName] = useState('');
    const [editCountry, setEditCountry] = useState('');
    const [editSocials, setEditSocials] = useState<any>({});
    const [editVideoUrl, setEditVideoUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [isAdjustingCover, setIsAdjustingCover] = useState(false);
    const [tempOffset, setTempOffset] = useState(50);
    const [isReordering, setIsReordering] = useState(false);
    const [hasChangedOrder, setHasChangedOrder] = useState(false);

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
                .select('id, username, artistic_name, foto_perfil, portada_perfil, ajuste_portada, bio, country, social_links, is_verified, is_founder, subscription_tier, fecha_de_creacion, tema_perfil, color_acento, video_destacado_url')
                .eq('username', username)
                .single();

            if (profileData) {
                setProfile(profileData);
                setEditBio(profileData.bio || '');
                setEditArtisticName(profileData.artistic_name || '');
                setEditCountry(profileData.country || '');
                setEditSocials(profileData.social_links || {});
                setEditVideoUrl(profileData.video_destacado_url || '');
                setTempOffset(profileData.ajuste_portada ?? 50);

                if (user?.id === profileData.id) {
                    setIsOwner(true);
                }

                // 2. Get Beats (Optimized Select)
                const { data: beatsData } = await supabase
                    .from('beats')
                    .select('id, title, genre, bpm, price_mxn, portadabeat_url, mp3_url, mp3_tag_url, musical_key, mood, is_public, play_count, like_count, created_at')
                    .eq('producer_id', profileData.id)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });

                if (beatsData) {
                    // Transform internal storage paths to public URLs with encoding for spaces
                    const transformedBeats = await Promise.all(beatsData.map(async (b: any) => {
                        const path = b.mp3_tag_url || b.mp3_url || '';
                        const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');

                        const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';

                        const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(encodedPath);

                        // Resolve Cover URL
                        const finalCoverUrl = b.portadabeat_url?.startsWith('http')
                            ? b.portadabeat_url
                            : b.portadabeat_url
                                ? supabase.storage.from('portadas-beats').getPublicUrl(b.portadabeat_url).data.publicUrl
                                : null;

                        return {
                            ...b,
                            mp3_url: publicUrl,
                            portadabeat_url: finalCoverUrl,
                            producer_artistic_name: profileData.artistic_name,
                            producer_username: profileData.username,
                            producer_foto_perfil: profileData.foto_perfil,
                            producer_is_verified: profileData.is_verified,
                            producer_is_founder: profileData.is_founder,
                            producer_tier: profileData.subscription_tier
                        };
                    }));
                    setBeats(transformedBeats);
                }

                // 3. Get Playlists
                const { data: playlistsData } = await supabase
                    .from('playlists')
                    .select(`
                        id, 
                        name, 
                        description, 
                        playlist_beats (
                            order_index,
                            beats (*)
                        )
                    `)
                    .eq('producer_id', profileData.id)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });

                if (playlistsData) {
                    const formattedPlaylists = await Promise.all(playlistsData.map(async (pl: any) => {
                        const playlistBeats = pl.playlist_beats
                            .map((pb: any) => pb.beats)
                            .filter(Boolean);

                        // Transform URLs for playlist beats (reusing logic)
                        const transformedPLBeats = await Promise.all(playlistBeats.map(async (b: any) => {
                            const path = b.mp3_tag_url || b.mp3_url || '';
                            const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
                            const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';
                            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

                            const finalCoverUrl = b.portadabeat_url?.startsWith('http')
                                ? b.portadabeat_url
                                : b.portadabeat_url
                                    ? supabase.storage.from('portadas-beats').getPublicUrl(b.portadabeat_url).data.publicUrl
                                    : null;

                            return {
                                ...b,
                                mp3_url: publicUrl,
                                portadabeat_url: finalCoverUrl,
                                producer_artistic_name: profileData.artistic_name,
                                producer_username: profileData.username,
                                producer_foto_perfil: profileData.foto_perfil,
                                producer_is_verified: profileData.is_verified,
                                producer_is_founder: profileData.is_founder,
                                producer_tier: profileData.subscription_tier
                            };
                        }));

                        return {
                            id: pl.id,
                            name: pl.name,
                            description: pl.description,
                            order_index: pl.order_index,
                            beats: transformedPLBeats
                        };
                    }));
                    setPlaylists(formattedPlaylists as any);
                }

                // 4. Get Follow Status & Counts
                const { count: followersCountData } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', profileData.id);
                setFollowersCount(followersCountData || 0);

                const { count: followingCountData } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('follower_id', profileData.id);
                setFollowingCount(followingCountData || 0);

                if (user) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('id')
                        .eq('follower_id', user.id)
                        .eq('following_id', profileData!.id)
                        .single();
                    setIsFollowing(!!followData);
                }

                // 5. Get Services
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('user_id', profileData!.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                setServices(servicesData || []);
            }

            // 6. Get Sound Kits
            const { data: kitsData } = await supabase
                .from('sound_kits')
                .select('*')
                .eq('producer_id', profileData!.id)
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            if (kitsData) {
                const transformedKits = await Promise.all(kitsData.map(async (kit: any) => {
                    let coverUrl = null;
                    if (kit.cover_url) {
                        coverUrl = kit.cover_url; // Already full URL from studio logic saving publicUrl
                    }
                    return { ...kit, cover_url: coverUrl };
                }));
                setSoundKits(transformedKits);
            } else {
                setSoundKits([]);
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

    const hasChanges = () => {
        if (!profile) return false;
        const socialsChanged = JSON.stringify(editSocials) !== JSON.stringify(profile.social_links || {});
        return (
            editBio !== (profile.bio || '') ||
            editArtisticName !== (profile.artistic_name || '') ||
            editCountry !== (profile.country || '') ||
            editVideoUrl !== (profile.video_destacado_url || '') ||
            socialsChanged
        );
    };

    const handleUpdateProfile = async () => {
        if (!profile) return;
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                bio: editBio,
                country: editCountry,
                artistic_name: editArtisticName,
                social_links: editSocials,
                video_destacado_url: editVideoUrl
            })
            .eq('id', profile.id);

        if (!error) {
            setProfile({
                ...profile,
                bio: editBio,
                country: editCountry,
                artistic_name: editArtisticName,
                social_links: editSocials,
                video_destacado_url: editVideoUrl
            });
            setIsEditing(false);
        } else {
            console.error("Error updating profile:", error);
            alert("Error al actualizar perfil");
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
        if (file.size > 2048 * 1024 * 1024) {
            alert("El archivo es demasiado grande (Máximo 2GB)");
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
            const updateField = type === 'avatar' ? { foto_perfil: publicUrl } : { portada_perfil: publicUrl };

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
            .update({ ajuste_portada: tempOffset })
            .eq('id', profile.id);

        if (!error) {
            setProfile({ ...profile, ajuste_portada: tempOffset });
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
        <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${profile.tema_perfil === 'dark' ? 'bg-[#0F172A] text-white selection:bg-white selection:text-slate-900' :
            profile.tema_perfil === 'neon' ? 'bg-[#09090b] text-white selection:bg-green-400 selection:text-black' :
                profile.tema_perfil === 'gold' ? 'bg-[#1a1610] text-amber-50 font-serif selection:bg-amber-400 selection:text-black' :
                    'bg-white text-slate-900 selection:bg-blue-600 selection:text-white'
            }`} style={{
                '--accent': profile.color_acento || '#2563eb'
            } as React.CSSProperties}>

            <Navbar />

            <main className="flex-1 pb-20">
                {/* 1. Portada */}
                <div
                    className={`relative h-56 md:h-96 bg-slate-100 group overflow-hidden ${isAdjustingCover ? 'cursor-ns-resize ring-4 ring-blue-500 ring-inset z-50' : ''}`}
                    onMouseDown={(e) => {
                        if (!isAdjustingCover) return;
                        (e.currentTarget as any)._isDragging = true;
                        (e.currentTarget as any)._startY = e.clientY;
                        (e.currentTarget as any)._startOffset = tempOffset;
                    }}
                    onMouseMove={(e) => {
                        if (!(e.currentTarget as any)._isDragging) return;
                        const delta = e.clientY - (e.currentTarget as any)._startY;
                        // Sensitivity: 0.2% per pixel
                        let newOffset = (e.currentTarget as any)._startOffset - (delta * 0.2);
                        newOffset = Math.max(0, Math.min(100, newOffset));
                        setTempOffset(newOffset);
                    }}
                    onMouseUp={(e) => {
                        (e.currentTarget as any)._isDragging = false;
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as any)._isDragging = false;
                    }}
                >
                    {profile.portada_perfil ? (
                        <img
                            src={profile.portada_perfil}
                            className="w-full h-full object-cover pointer-events-none select-none"
                            style={{ objectPosition: `center ${isAdjustingCover ? tempOffset : (profile.ajuste_portada ?? 50)}%` }}
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
                        <div className="absolute inset-x-0 bottom-8 flex justify-center z-50 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-slate-900/90 backdrop-blur-xl px-2 py-2 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-2">
                                <div className="px-6 py-3">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <Layout size={14} className="text-blue-400" /> Arrastra para ajustar
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-white/10 mx-2" />
                                <button
                                    onClick={() => {
                                        setIsAdjustingCover(false);
                                        setTempOffset(profile.ajuste_portada ?? 50);
                                    }}
                                    className="px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveAdjustment}
                                    disabled={saving}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : 'Guardar Posición'}
                                </button>
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
                                {profile.foto_perfil ? (
                                    <img src={profile.foto_perfil} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${profile.tema_perfil === 'neon' ? 'bg-black text-green-500' : profile.tema_perfil === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-300'}`}><Users size={48} /></div>
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
                                        <h1 className={`text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none ${profile.tema_perfil === 'neon' ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' :
                                            profile.tema_perfil === 'gold' ? 'text-amber-300 drop-shadow-lg' :
                                                profile.tema_perfil === 'dark' ? 'text-white' :
                                                    'text-slate-900'
                                            }`}>
                                            {profile.artistic_name || profile.username}
                                        </h1>
                                        {profile.is_verified && (
                                            <div title="Verificado" className="self-center md:self-end md:mb-2 translate-y-[-2px]">
                                                <img src="/verified-badge.png" alt="Verificado" className="w-5 h-5 object-contain" />
                                            </div>
                                        )}
                                        {profile.is_founder && (
                                            <div title="Founder" className="text-[#FDE047] self-center md:self-end md:mb-2 ml-[-4px]">
                                                <Crown size={22} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                        <p className={`font-bold uppercase tracking-widest text-[10px] ${profile.tema_perfil === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            @{profile.username}
                                        </p>
                                        <span className="text-slate-300">•</span>
                                        {isEditing ? (
                                            <div className="relative group/country">
                                                <select
                                                    value={editCountry}
                                                    onChange={(e) => setEditCountry(e.target.value)}
                                                    className="bg-slate-50 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest border border-slate-200 focus:border-blue-500 outline-none appearance-none pr-6 text-slate-600"
                                                >
                                                    <option value="">País</option>
                                                    {COUNTRIES.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                                <Edit3 size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1">
                                                {profile.country || "Selecciona tu país o nacionalidad"}
                                            </p>
                                        )}
                                        <span className="text-slate-300">•</span>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                            Miembro desde {profile.fecha_de_creacion ? new Date(profile.fecha_de_creacion).getFullYear() : (new Date().getFullYear())}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3">
                                    {isOwner ? (
                                        <button
                                            onClick={() => {
                                                if (isEditing) {
                                                    if (hasChanges()) {
                                                        handleUpdateProfile();
                                                    } else {
                                                        setIsEditing(false);
                                                    }
                                                } else {
                                                    setIsEditing(true);
                                                }
                                            }}
                                            className={`px-8 py-2.5 rounded-full border-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${isEditing ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400 hover:shadow-md'}`}
                                        >
                                            {isEditing ? (hasChanges() ? 'Guardar Cambios' : 'Aceptar') : 'Editar Perfil'}
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
                            <div className={`flex items-center justify-around rounded-3xl p-6 border ${profile.tema_perfil === 'dark' ? 'bg-slate-800 border-slate-700' :
                                profile.tema_perfil === 'neon' ? 'bg-black border-green-900 shadow-[0_0_20px_rgba(74,222,128,0.05)]' :
                                    profile.tema_perfil === 'gold' ? 'bg-slate-800 border-amber-900/50 shadow-xl' :
                                        'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                                }`}>
                                <div className="text-center">
                                    <span className={`block text-2xl font-black ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>{followersCount}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguidores</span>
                                </div>
                                <div className="h-8 w-px bg-slate-100"></div>
                                <div className="text-center">
                                    <span className={`block text-2xl font-black ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>{beats.length}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beats</span>
                                </div>
                                <div className="h-8 w-px bg-slate-100"></div>
                                <div className="text-center">
                                    <span className={`block text-2xl font-black ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>{followingCount}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguidos</span>
                                </div>
                            </div>

                            {/* Status Sidebar */}
                            <div className={`rounded-[2.5rem] p-8 border ${profile.tema_perfil === 'dark' ? 'bg-slate-800 border-slate-700' :
                                profile.tema_perfil === 'neon' ? 'bg-zinc-900 border-zinc-800' :
                                    profile.tema_perfil === 'gold' ? 'bg-slate-800 border-amber-900/30' :
                                        'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                                }`}>
                                <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-8 font-outfit ${profile.tema_perfil === 'dark' ? 'text-slate-400' :
                                    profile.tema_perfil === 'neon' ? 'text-green-600' :
                                        profile.tema_perfil === 'gold' ? 'text-amber-500' :
                                            'text-slate-400'
                                    }`}>Estatus Tianguis</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${profile.tema_perfil === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Plan</span>
                                        <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-xl ${profile.subscription_tier === 'premium' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : profile.subscription_tier === 'pro' ? 'bg-amber-400 text-slate-900 border border-amber-500/20' : 'bg-slate-200 text-slate-600'}`}>{profile.subscription_tier}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${profile.tema_perfil === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Verificación</span>
                                        {profile.is_verified ? (
                                            <span className="text-xs font-black uppercase text-blue-600 flex items-center gap-2">
                                                <img src="/verified-badge.png" className="w-4 h-4" />
                                                Verificado
                                            </span>
                                        ) : (
                                            <span className="text-xs font-black uppercase text-slate-400">Sin Verificar</span>
                                        )}
                                    </div>
                                    {profile.is_founder && (
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold ${profile.tema_perfil === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Insignia</span>
                                            <span className="text-xs font-black uppercase text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-amber-100"><Crown size={12} fill="#FDE047" className="text-[#FDE047]" /> Founder</span>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Video Sidebar (Moved below Status) */}
                            {profile.subscription_tier === 'premium' && profile.video_destacado_url && getYouTubeEmbedUrl(profile.video_destacado_url) && (
                                <div className={`rounded-[2.5rem] overflow-hidden border animate-in fade-in slide-in-from-bottom-4 duration-700 ${profile.tema_perfil === 'dark' ? 'border-slate-700 bg-slate-800' :
                                    profile.tema_perfil === 'neon' ? 'border-green-900 bg-black shadow-[0_0_15px_rgba(74,222,128,0.1)]' :
                                        profile.tema_perfil === 'gold' ? 'border-amber-900/50 bg-slate-900' :
                                            'border-slate-100 bg-white shadow-xl shadow-slate-200/50'
                                    }`}>
                                    <div className="aspect-video bg-black">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={getYouTubeEmbedUrl(profile.video_destacado_url)}
                                            title="Video Destacado"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                        ></iframe>
                                    </div>
                                </div>
                            )}

                            {/* Bio Box (Trayectoria + Socials Integrated) */}
                            <div className={`border rounded-[2.5rem] p-8 shadow-sm mb-0 relative overflow-hidden ${profile.tema_perfil === 'dark' ? 'bg-slate-800/50 border-slate-700/50 text-slate-300' :
                                profile.tema_perfil === 'neon' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300' :
                                    profile.tema_perfil === 'gold' ? 'bg-[#2a241c] border-amber-900/30 text-amber-100' :
                                        'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                                }`}>
                                {/* Integrated Socials Section (Now at the top) */}
                                {!isEditing && (
                                    <div className="mb-8 pb-8 border-b border-slate-100/10">
                                        <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-6 ${profile.tema_perfil === 'neon' ? 'text-green-500' :
                                            profile.tema_perfil === 'gold' ? 'text-amber-500' :
                                                'text-slate-400'
                                            }`}>Redes Sociales</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {SOCIAL_KEYS.map(key => {
                                                const url = profile.social_links?.[key as keyof typeof profile.social_links];
                                                if (!url) return null;

                                                let finalUrl = url.startsWith('http') ? url : `https://${key}.com/${url}`;
                                                if (key === 'whatsapp') finalUrl = `https://wa.me/${url}`;

                                                const item = SOCIAL_ICONS[key];
                                                if (!item) return null;

                                                return (
                                                    <a key={key} href={finalUrl} target="_blank" rel="noopener noreferrer"
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm group border ${profile.tema_perfil === 'light'
                                                            ? 'bg-slate-50 border-slate-100 text-slate-900 hover:bg-slate-900 hover:text-white'
                                                            : 'bg-white/5 border-white/5 text-white hover:bg-white hover:text-black'
                                                            }`}>
                                                        {item.icon ? (
                                                            <item.icon size={18} />
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                                                                <path d={item.path} />
                                                            </svg>
                                                        )}
                                                    </a>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-6 ${profile.tema_perfil === 'neon' ? 'text-green-500' :
                                    profile.tema_perfil === 'gold' ? 'text-amber-500' :
                                        'text-slate-400'
                                    }`}>Trayectoria</h3>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Biografía</label>
                                            <textarea
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                                className="w-full h-32 bg-slate-50 rounded-xl p-4 text-sm font-medium border border-transparent focus:border-blue-500 outline-none resize-none text-slate-900"
                                                placeholder="Escribe tu historia..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {SOCIAL_KEYS.map(key => (
                                                <div key={key}>
                                                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">{key}</label>
                                                    <input
                                                        placeholder={`Usuario/Link ${key}`}
                                                        value={editSocials[key] || ''}
                                                        onChange={e => setEditSocials({ ...editSocials, [key]: e.target.value })}
                                                        className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium border-transparent focus:border-blue-500 text-slate-900"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400 block">Video Destacado (YouTube)</label>
                                                <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Premium</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={editVideoUrl}
                                                onChange={(e) => setEditVideoUrl(e.target.value)}
                                                disabled={profile.subscription_tier !== 'premium'}
                                                className={`w-full rounded-xl p-4 text-sm font-medium border border-transparent outline-none transition-all ${profile.subscription_tier === 'premium'
                                                    ? 'bg-slate-50 focus:border-blue-500 text-slate-900'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale'
                                                    }`}
                                                placeholder={profile.subscription_tier === 'premium' ? "Link de YouTube o Shorts..." : "Mejora a Premium para destacar un video"}
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                            >
                                                {hasChanges() ? 'Descartar' : 'Cerrar'}
                                            </button>
                                            <button
                                                onClick={handleUpdateProfile}
                                                disabled={saving || !hasChanges()}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${hasChanges()
                                                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'
                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`text-sm font-medium leading-relaxed ${profile.tema_perfil === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                                        {profile.bio || "Sin biografía aún."}
                                    </p>
                                )}
                            </div>



                        </div>

                        {/* Beats Feed */}
                        <div className="lg:col-span-8">
                            <div className={`flex items-center gap-2 mb-10 p-1 rounded-[1.8rem] overflow-x-auto no-scrollbar border ${profile.tema_perfil === 'light' ? 'bg-slate-50/50 border-slate-100' : 'bg-white/5 border-white/10'}`}>
                                {/* 1. Beats */}
                                <button
                                    onClick={() => setActiveTab('beats')}
                                    className={`px-6 py-3 rounded-[1.3rem] font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2.5 ${activeTab === 'beats'
                                        ? (profile.tema_perfil === 'light' ? 'bg-white text-blue-600 shadow-md border border-blue-50' : 'bg-white text-black shadow-lg shadow-white/10')
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <Music size={14} className={activeTab === 'beats' ? 'text-blue-500' : 'text-slate-300'} />
                                    Beats
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] ${activeTab === 'beats' ? 'bg-blue-600 text-white' : 'bg-slate-200/50 text-slate-500'}`}>{beats.length}</span>
                                </button>

                                {/* 2. Colecciones */}
                                <button
                                    onClick={() => setActiveTab('playlists')}
                                    className={`px-6 py-3 rounded-[1.3rem] font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2.5 ${activeTab === 'playlists'
                                        ? (profile.tema_perfil === 'light' ? 'bg-white text-purple-600 shadow-md border border-purple-50' : 'bg-white text-black shadow-lg shadow-white/10')
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <Layout size={14} className={activeTab === 'playlists' ? 'text-purple-500' : 'text-slate-300'} />
                                    Colecciones
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] ${activeTab === 'playlists' ? 'bg-purple-600 text-white' : 'bg-slate-200/50 text-slate-500'}`}>{playlists.length}</span>
                                </button>

                                {/* 3. Servicios (Premium Lock for Free/Pro) */}
                                <div className="relative group/tab">
                                    <button
                                        onClick={() => {
                                            if (profile.subscription_tier === 'premium' || isOwner) {
                                                setActiveTab('services');
                                            } else {
                                                router.push('/pricing');
                                            }
                                        }}
                                        className={`px-6 py-3 rounded-[1.3rem] font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2.5 ${activeTab === 'services'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <Briefcase size={14} className={activeTab === 'services' ? 'text-white' : 'text-slate-300'} />
                                        Servicios
                                        {(profile.subscription_tier !== 'premium' && !isOwner) && (
                                            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter shadow-sm">
                                                Premium
                                            </div>
                                        )}
                                        {services.length > 0 && (profile.subscription_tier === 'premium' || isOwner) && (
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] ${activeTab === 'services' ? 'bg-white text-blue-600' : 'bg-slate-200/50 text-slate-500'}`}>{services.length}</span>
                                        )}
                                    </button>
                                </div>

                                {/* 4. Sound Kits (Premium Lock for Free/Pro) */}
                                <div className="relative group/tab">
                                    <button
                                        onClick={() => {
                                            if (profile.subscription_tier === 'premium' || isOwner) {
                                                setActiveTab('sound_kits');
                                            } else {
                                                router.push('/pricing');
                                            }
                                        }}
                                        className={`px-6 py-3 rounded-[1.3rem] font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2.5 ${activeTab === 'sound_kits'
                                            ? (profile.tema_perfil === 'light' ? 'bg-amber-400 text-slate-900 shadow-md border border-amber-300' : 'bg-amber-500 text-black shadow-lg shadow-amber-500/20')
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <Zap size={14} className={activeTab === 'sound_kits' ? 'text-slate-900' : 'text-slate-300'} />
                                        Sound Kits
                                        {(profile.subscription_tier !== 'premium' && !isOwner) && (
                                            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter shadow-sm">
                                                Premium
                                            </div>
                                        )}
                                        {soundKits.length > 0 && (profile.subscription_tier === 'premium' || isOwner) && (
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] ${activeTab === 'sound_kits' ? 'bg-white/50 text-current' : 'bg-slate-200/50 text-slate-500'}`}>{soundKits.length}</span>
                                        )}
                                    </button>
                                </div>
                            </div>


                            {activeTab === 'beats' && (
                                <>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                <Music size={20} />
                                            </div>
                                            <div>
                                                <h2 className={`text-3xl font-black uppercase tracking-tighter ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>Recién Horneados 🔥</h2>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Últimas creaciones del productor</p>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/${username}/beats`}
                                            className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-600 hover:text-white transition-all border-dashed"
                                        >
                                            Ver catálogo completo <ChevronRight size={14} />
                                        </Link>
                                    </div>

                                    {beats.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {beats.slice(0, 6).map((beat) => (
                                                <BeatCardPro key={beat.id} beat={beat} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 rounded-2xl p-12 text-center">
                                            <Music size={48} className="text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay beats públicos</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'services' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <h2 className={`text-3xl font-black uppercase tracking-tighter ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>Servicios Profesionales</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contrata talento experto</p>
                                        </div>
                                    </div>

                                    {/* Owner Upsell for Non-Premium (Services) */}
                                    {isOwner && profile.subscription_tier !== 'premium' ? (
                                        <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-[2.5rem] p-12 text-center text-white overflow-hidden relative group">
                                            <div className="absolute top-0 right-0 p-32 bg-indigo-600/20 blur-[100px] rounded-full group-hover:bg-indigo-600/30 transition-all pointer-events-none" />
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10">
                                                    <Briefcase size={32} className="text-indigo-400" />
                                                </div>
                                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Venta de Servicios</h3>
                                                <p className="text-indigo-100 max-w-lg mx-auto mb-8 font-medium">
                                                    Ofrece servicios de Mezcla, Masterización, Composición o Clases. Los usuarios Premium pueden listar sus servicios y ser contactados directamente. ¡Desbloquea esta función ahora!
                                                </p>
                                                <Link href="/pricing" className="inline-flex items-center gap-2 bg-white text-indigo-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all transform hover:scale-105">
                                                    <Crown size={18} fill="currentColor" className="text-amber-500" /> Mejorar a Premium
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {services.map(service => (
                                                <div key={service.id} className={`p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition-all group ${profile.tema_perfil === 'dark' ? 'bg-slate-800 border-slate-700' :
                                                    profile.tema_perfil === 'neon' ? 'bg-black border-green-900 shadow-green-900/20' :
                                                        profile.tema_perfil === 'gold' ? 'bg-slate-800 border-amber-900/50' :
                                                            'bg-white border-slate-100'
                                                    }`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                            {service.tipo_servicio}
                                                        </span>
                                                        <span className={`text-xl font-black ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>${service.precio}</span>
                                                    </div>
                                                    <h3 className={`font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>{service.titulo}</h3>
                                                    <p className={`text-xs mb-6 line-clamp-3 leading-relaxed ${profile.tema_perfil === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{service.descripcion}</p>

                                                    <div className={`flex items-center justify-between pt-4 border-t ${profile.tema_perfil === 'light' ? 'border-slate-50' : 'border-white/10'}`}>
                                                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                            <Clock size={12} />
                                                            {service.tiempo_entrega_dias} Días hábiles
                                                        </div>
                                                        <button className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">
                                                            Contratar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'playlists' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">


                                    {/* Acciones de Colecciones (Solo Dueño) */}
                                    {isOwner && (
                                        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 py-8 border-y border-slate-50 bg-slate-50/30 rounded-[2.5rem]">
                                            <button
                                                onClick={() => {
                                                    setEditingPlaylist(null);
                                                    setIsPlaylistModalOpen(true);
                                                }}
                                                className="px-8 py-4 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 shadow-sm hover:shadow-xl hover:shadow-blue-600/10 active:scale-95"
                                            >
                                                <Plus size={18} /> Nueva Playlist
                                            </button>

                                            <button
                                                onClick={() => setIsReordering(!isReordering)}
                                                className={`px-8 py-4 border rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm active:scale-95 ${isReordering ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                                            >
                                                {isReordering ? <><MoveVertical size={18} className="animate-bounce" /> Reordenando...</> : <><MoveVertical size={18} /> Organizar Colecciones</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* Reordering Controls (Only visible when isReordering is true) */}
                                    {isReordering && (
                                        <div className="mt-8 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 animate-in fade-in slide-in-from-top-4">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Cambiar orden de aparición</h3>
                                                <button
                                                    onClick={() => {
                                                        setIsReordering(false);
                                                        setHasChangedOrder(false);
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                                >
                                                    {hasChangedOrder ? "Guardar cambios" : "Cancelar cambios"}
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {playlists.map((pl, idx) => (
                                                    <div key={pl.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black text-slate-300 w-4">#{idx + 1}</span>
                                                            <span className="text-xs font-bold text-slate-700">{pl.name}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                disabled={idx === 0}
                                                                onClick={async () => {
                                                                    const newPlaylists = [...playlists];
                                                                    [newPlaylists[idx], newPlaylists[idx - 1]] = [newPlaylists[idx - 1], newPlaylists[idx]];
                                                                    setPlaylists(newPlaylists);
                                                                    setHasChangedOrder(true);
                                                                    // Persist order
                                                                    await Promise.all(newPlaylists.map((p, i) =>
                                                                        supabase.from('playlists').update({ order_index: i }).eq('id', p.id)
                                                                    ));
                                                                }}
                                                                className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg disabled:opacity-20"
                                                            >
                                                                <ChevronUp size={16} />
                                                            </button>
                                                            <button
                                                                disabled={idx === playlists.length - 1}
                                                                onClick={async () => {
                                                                    const newPlaylists = [...playlists];
                                                                    [newPlaylists[idx], newPlaylists[idx + 1]] = [newPlaylists[idx + 1], newPlaylists[idx]];
                                                                    setPlaylists(newPlaylists);
                                                                    setHasChangedOrder(true);
                                                                    // Persist order
                                                                    await Promise.all(newPlaylists.map((p, i) =>
                                                                        supabase.from('playlists').update({ order_index: i }).eq('id', p.id)
                                                                    ));
                                                                }}
                                                                className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg disabled:opacity-20"
                                                            >
                                                                <ChevronDown size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Playlists Section */}
                                    {playlists.length > 0 && (
                                        <div className="mt-8">
                                            <PlaylistSection
                                                playlists={playlists}
                                                isOwner={isOwner}
                                                onEdit={(id) => {
                                                    const pl = playlists.find(p => p.id === id);
                                                    setEditingPlaylist(pl);
                                                    setIsPlaylistModalOpen(true);
                                                }}
                                            />
                                        </div>
                                    )}

                                </div>
                            )}

                            {activeTab === 'sound_kits' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <h2 className={`text-3xl font-black uppercase tracking-tighter ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>Sound Kits</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Librerías de sonidos oficiales</p>
                                        </div>
                                    </div>

                                    {/* Owner Upsell for Non-Premium */}
                                    {isOwner && profile.subscription_tier !== 'premium' ? (
                                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-12 text-center text-white overflow-hidden relative group">
                                            <div className="absolute top-0 right-0 p-32 bg-blue-600/20 blur-[100px] rounded-full group-hover:bg-blue-600/30 transition-all pointer-events-none" />
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10">
                                                    <Crown size={32} className="text-amber-400" />
                                                </div>
                                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Característica Premium</h3>
                                                <p className="text-slate-300 max-w-lg mx-auto mb-8 font-medium">
                                                    Vende tus propios Sample Packs, Drum Kits y Presets directamente desde tu perfil. Mejora tu cuenta para desbloquear esta sección y comenzar a generar ingresos pasivos.
                                                </p>
                                                <Link href="/pricing" className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-amber-300 transition-all transform hover:scale-105">
                                                    <Zap size={18} fill="currentColor" /> Mejorar a Premium
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Logic for Visitors OR Premium Owner */}
                                            {soundKits.length === 0 ? (
                                                <div className="bg-slate-50/50 rounded-2xl p-12 text-center border border-dashed border-slate-200">
                                                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Aún no hay Sound Kits disponibles</h3>
                                                    {isOwner ? (
                                                        <Link href="/studio/services" className="text-blue-600 font-bold uppercase tracking-widest text-xs hover:underline mt-2 inline-block">
                                                            Subir mi primer Kit
                                                        </Link>
                                                    ) : (
                                                        <p className="text-slate-400 text-sm">Este productor no ha subido librerías aún.</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {soundKits.map(kit => (
                                                        <div key={kit.id} className={`p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition-all group ${profile.tema_perfil === 'dark' ? 'bg-slate-800 border-slate-700' :
                                                            profile.tema_perfil === 'neon' ? 'bg-black border-green-900 shadow-green-900/20' :
                                                                profile.tema_perfil === 'gold' ? 'bg-slate-800 border-amber-900/50' :
                                                                    'bg-white border-slate-100'
                                                            }`}>
                                                            <div className="aspect-square bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                                                                {kit.cover_url ? (
                                                                    <img src={kit.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={kit.title} />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                                        <Package size={48} />
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 backdrop-blur-[2px]">
                                                                    <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center gap-2">
                                                                        <DollarSign size={14} /> Comprar ${kit.price}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className={`font-bold text-lg mb-1 group-hover:text-amber-500 transition-colors line-clamp-1 ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>{kit.title}</h3>
                                                            </div>
                                                            <p className={`text-xs mb-4 line-clamp-2 ${profile.tema_perfil === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{kit.description}</p>
                                                            <div className={`flex items-center justify-between pt-4 border-t ${profile.tema_perfil === 'light' ? 'border-slate-50' : 'border-white/10'}`}>
                                                                <span className={`text-xl font-black ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>${kit.price} MXN</span>
                                                                <span className="text-[10px] font-bold uppercase text-slate-400">Digital Download</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {isOwner && profile && (
                    <PlaylistManagerModal
                        isOpen={isPlaylistModalOpen}
                        onClose={() => setIsPlaylistModalOpen(false)}
                        producerId={profile.id}
                        existingPlaylist={editingPlaylist}
                        allBeats={beats}
                        onSuccess={fetchAll}
                    />
                )}
            </main>

            <Footer />
        </div>
    );
}
