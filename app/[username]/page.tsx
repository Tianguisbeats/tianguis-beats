"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, Instagram, Youtube, Twitter,
    Share2, MoreHorizontal, Calendar, MapPin,
    Music, Play, Users, Crown, Settings, Camera,
    Edit3, CheckCircle2, Copy, Trash2, Layout, PlayCircle,
    BarChart2, ShieldCheck, Globe, Zap, Loader2, UserPlus, UserCheck, LayoutGrid, ListMusic, Plus, MoveVertical, Save, ChevronUp, ChevronDown, List, Briefcase, Clock, DollarSign, Package, MessageSquare, Mail, ShoppingBag
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCardPro from '@/components/explore/BeatCardPro';
import BeatRow from '@/components/BeatRow';
import PlaylistSection from '@/components/PlaylistSection';
import PlaylistManagerModal from '@/components/PlaylistManagerModal';
import { usePlayer } from '@/context/PlayerContext';
import { Profile, Beat } from '@/lib/types';
import { COUNTRIES } from '@/lib/constants';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// Social Media Icons Mapping
const SOCIAL_ICONS: Record<string, any> = {
    web: { icon: Globe, color: "hover:text-blue-500" },
    instagram: { icon: Instagram, color: "hover:text-pink-500" },
    youtube: { icon: Youtube, color: "hover:text-red-500" },
    twitter: { icon: Twitter, color: "hover:text-blue-400" },
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

    // Unified Session & Follow Listener
    useEffect(() => {
        // Initial session check
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUserId(session?.user?.id || null);

            // Handle tab from URL
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab && ['beats', 'services', 'playlists', 'sound_kits'].includes(tab)) {
                setActiveTab(tab as any);
            }
        };
        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Check follow status and ownership when user or profile is ready
    useEffect(() => {
        const checkStatus = async () => {
            if (currentUserId && profile?.id) {
                // Check Follow
                const { data, error } = await supabase
                    .from('follows')
                    .select('follower_id')
                    .eq('follower_id', currentUserId)
                    .eq('following_id', profile.id)
                    .maybeSingle();

                if (!error) setIsFollowing(!!data);

                // Check Owner
                setIsOwner(currentUserId === profile.id);
            } else {
                setIsFollowing(false);
                setIsOwner(false);
            }
        };
        checkStatus();
    }, [currentUserId, profile?.id]);

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
    const [editVerifyInstagram, setEditVerifyInstagram] = useState('');
    const [editVerifyYoutube, setEditVerifyYoutube] = useState('');
    const [editVerifyTiktok, setEditVerifyTiktok] = useState('');
    const [saving, setSaving] = useState(false);
    const [isAdjustingCover, setIsAdjustingCover] = useState(false);
    const [tempOffset, setTempOffset] = useState(50);
    const [isReordering, setIsReordering] = useState(false);
    const [hasChangedOrder, setHasChangedOrder] = useState(false);
    const [showFanCapture, setShowFanCapture] = useState(false);
    const [hasShownFanCapture, setHasShownFanCapture] = useState(false);

    const { playBeat, currentBeat, isPlaying } = usePlayer();
    const { addItem } = useCart();
    const { showToast } = useToast();

    const handleAddToCart = (item: any, type: 'service' | 'sound_kit') => {
        if (!item) return;

        addItem({
            id: type === 'service' ? `service_${item.id}` : `kit_${item.id}`,
            type: type,
            name: type === 'service' ? item.titulo : item.title,
            price: Number(item.precio || item.price || 0),
            image: type === 'sound_kit' ? (item.cover_url || profile?.foto_perfil) : profile?.foto_perfil,
            subtitle: type === 'service' ? 'Servicio Profesional' : 'Sound Kit',
            metadata: {
                originalId: item.id,
                producerId: profile?.id,
                producerName: profile?.artistic_name,
                isSoundKit: type === 'sound_kit',
                isService: type === 'service'
            }
        });
    };

    // Fan Capture Logic (30s playback trigger)
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && currentBeat && !hasShownFanCapture && profile?.newsletter_active) {
            timer = setTimeout(() => {
                setShowFanCapture(true);
                setHasShownFanCapture(true);
            }, 30000); // 30 seconds
        }
        return () => clearTimeout(timer);
    }, [isPlaying, currentBeat, hasShownFanCapture, profile?.newsletter_active]);

    // Fetch Data
    const fetchAll = async () => {
        try {
            setLoading(true);
            // We removed auth check here to use the dedicated listener above

            // 1. Get Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, username, artistic_name, foto_perfil, portada_perfil, ajuste_portada, bio, country, social_links, is_verified, is_founder, subscription_tier, fecha_de_creacion, tema_perfil, color_acento, video_destacado_url, cta_text, cta_url, newsletter_active, links_active, verify_instagram, verify_youtube, verify_tiktok')
                .eq('username', username)
                .single();

            if (profileData) {
                setProfile(profileData);
                setEditBio(profileData.bio || '');
                setEditArtisticName(profileData.artistic_name || '');
                setEditCountry(profileData.country || '');
                setEditSocials(profileData.social_links || {});
                setEditVideoUrl(profileData.video_destacado_url || '');
                setEditVerifyInstagram(profileData.verify_instagram || '');
                setEditVerifyYoutube(profileData.verify_youtube || '');
                setEditVerifyTiktok(profileData.verify_tiktok || '');
                setTempOffset(profileData.ajuste_portada ?? 50);

                setTempOffset(profileData.ajuste_portada ?? 50);

                // 2. Get Beats (Optimized Select)
                const { data: beatsData } = await supabase
                    .from('beats')
                    .select('id, producer_id, title, genre, bpm, price_mxn, portadabeat_url, mp3_url, mp3_tag_url, musical_key, mood, is_public, play_count, like_count, created_at')
                    .eq('producer_id', profileData.id)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });

                if (beatsData) {
                    // Transform internal storage paths to public URLs with encoding for spaces
                    const transformedBeats = await Promise.all(beatsData.map(async (b: any) => {
                        const path = b.mp3_tag_url || b.mp3_url || '';
                        let publicUrl = '';

                        if (path.startsWith('http')) {
                            publicUrl = path;
                        } else {
                            const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
                            const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';
                            const { data } = supabase.storage
                                .from(bucket)
                                .getPublicUrl(encodedPath);
                            publicUrl = data.publicUrl;
                        }

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
                            let publicUrl = '';

                            if (path.startsWith('http')) {
                                publicUrl = path;
                            } else {
                                const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
                                const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';
                                const { data } = supabase.storage.from(bucket).getPublicUrl(encodedPath);
                                publicUrl = data.publicUrl;
                            }

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

                // 5. Get Services
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('user_id', profileData.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                setServices(servicesData || []);

                // 6. Get Sound Kits
                const { data: kitsData } = await supabase
                    .from('sound_kits')
                    .select('*')
                    .eq('producer_id', profileData.id)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });

                if (kitsData) {
                    const transformedKits = await Promise.all(kitsData.map(async (kit: any) => {
                        let coverUrl = null;
                        if (kit.cover_url) {
                            coverUrl = kit.cover_url;
                        }
                        return { ...kit, cover_url: coverUrl };
                    }));
                    setSoundKits(transformedKits);
                } else {
                    setSoundKits([]);
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

    const hasChanges = () => {
        if (!profile) return false;
        const socialsChanged = JSON.stringify(editSocials) !== JSON.stringify(profile.social_links || {});
        return (
            editBio !== (profile.bio || '') ||
            editArtisticName !== (profile.artistic_name || '') ||
            editCountry !== (profile.country || '') ||
            editVideoUrl !== (profile.video_destacado_url || '') ||
            editVerifyInstagram !== (profile.verify_instagram || '') ||
            editVerifyYoutube !== (profile.verify_youtube || '') ||
            editVerifyTiktok !== (profile.verify_tiktok || '') ||
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
                video_destacado_url: editVideoUrl,
                verify_instagram: editVerifyInstagram,
                verify_youtube: editVerifyYoutube,
                verify_tiktok: editVerifyTiktok
            })
            .eq('id', profile.id);

        if (!error) {
            setProfile({
                ...profile,
                bio: editBio,
                country: editCountry,
                artistic_name: editArtisticName,
                social_links: editSocials,
                video_destacado_url: editVideoUrl,
                verify_instagram: editVerifyInstagram,
                verify_youtube: editVerifyYoutube,
                verify_tiktok: editVerifyTiktok
            });
            setIsEditing(false);
        } else {
            console.error("Error updating profile:", error);
            showToast("Error al actualizar perfil", "error");
        }
        setSaving(false);
    };

    const handleFollowToggle = async () => {
        if (!currentUserId || !profile) return router.push('/login');

        // Optimistic UI Update
        const previousState = isFollowing;
        const newState = !previousState;

        setIsFollowing(newState);
        setFollowersCount(prev => newState ? prev + 1 : prev - 1);

        try {
            if (previousState) {
                // Was following, now unfollow (delete)
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUserId)
                    .eq('following_id', profile.id);

                if (error) throw error;
            } else {
                // Was not following, now follow (insert)
                // Usamos upsert o ignoramos error de duplicado para ser robustos
                const { error } = await supabase
                    .from('follows')
                    .insert({ follower_id: currentUserId, following_id: profile.id });

                // Ignorar error de duplicado (código 23505 en Postgres)
                if (error && error.code !== '23505') throw error;
            }
        } catch (error: any) {
            console.error('Error toggling follow:', error);
            // Revert optimistic update only if it wasn't a "benign" error
            setIsFollowing(previousState);
            setFollowersCount(prev => newState ? prev - 1 : prev + 1);
            showToast(`Error: ${error.message || 'No se pudo actualizar el seguimiento'}`, "error");
        }
    };

    const handleUploadMedia = async (type: 'avatar' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        // Relaxed Validation
        if (file.size > 2048 * 1024 * 1024) {
            showToast("El archivo es demasiado grande (Máximo 2GB)", "error");
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast("Formato no soportado. Usa JPG, PNG o WebP.", "error");
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
                showToast("Error al actualizar base de datos: " + dbUpdateError.message, "error");
                return;
            }

            setProfile({ ...profile, ...updateField });

            if (type === 'cover') {
                setIsAdjustingCover(true);
            } else {
                showToast("¡Avatar actualizado con éxito!", "success");
                window.location.reload();
            }
        } else {
            console.error("Upload Error:", uploadError);
            showToast("Error al subir archivo: " + uploadError.message, "error");
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
            showToast("Posición guardada", "success");
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="animate-spin text-muted" size={32} />
        </div>
    );

    if (!profile && !loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background pt-32 p-4 text-center">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center text-muted mb-6">
                <Users size={40} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-2">Usuario no encontrado</h1>
            <p className="text-muted text-sm font-bold uppercase tracking-widest mb-8">Ese tianguis aún no se ha puesto</p>
            <Link href="/" className="px-8 py-3 bg-accent text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">
                Volver al Inicio
            </Link>
        </div>
    );

    if (!profile) return null;

    return (
        <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${profile.tema_perfil === 'dark' ? 'bg-[#020205] text-white selection:bg-white selection:text-slate-900' :
            profile.tema_perfil === 'neon' ? 'bg-[#09090b] text-white selection:bg-green-400 selection:text-black' :
                profile.tema_perfil === 'gold' ? 'bg-[#1a1610] text-amber-50 font-serif selection:bg-amber-400 selection:text-black' :
                    'bg-background text-foreground selection:bg-accent selection:text-white'
            }`} style={{
                '--accent': profile.color_acento || '#2563eb'
            } as React.CSSProperties}>

            <Navbar />

            <main className="flex-1 pb-40">
                {/* 1. Portada Refinada */}
                <div
                    className={`relative h-[40vh] md:h-[50vh] bg-slate-100 group overflow-hidden ${isAdjustingCover ? 'cursor-ns-resize ring-4 ring-accent ring-inset z-50' : ''}`}
                    onMouseDown={(e) => {
                        if (!isAdjustingCover) return;
                        (e.currentTarget as any)._isDragging = true;
                        (e.currentTarget as any)._startY = e.clientY;
                        (e.currentTarget as any)._startOffset = tempOffset;
                    }}
                    onMouseMove={(e) => {
                        if (!(e.currentTarget as any)._isDragging) return;
                        const delta = e.clientY - (e.currentTarget as any)._startY;
                        let newOffset = (e.currentTarget as any)._startOffset - (delta * 0.2);
                        newOffset = Math.max(0, Math.min(100, newOffset));
                        setTempOffset(newOffset);
                    }}
                    onMouseUp={(e) => { (e.currentTarget as any)._isDragging = false; }}
                    onMouseLeave={(e) => { (e.currentTarget as any)._isDragging = false; }}
                >
                    {profile.portada_perfil ? (
                        <img
                            src={profile.portada_perfil}
                            className="w-full h-full object-cover pointer-events-none select-none transition-opacity duration-700"
                            style={{ objectPosition: `center ${isAdjustingCover ? tempOffset : (profile.ajuste_portada ?? 50)}%` }}
                            alt="Cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-white" />
                    )}

                    {/* Overlay Gradiente para legibilidad */}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020205] via-[#020205]/40 to-transparent dark:block hidden" />
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/40 to-transparent dark:hidden" />

                    {isOwner && !isAdjustingCover && (
                        <div className="absolute top-6 right-6 flex gap-3 z-20">
                            <button
                                onClick={() => setIsAdjustingCover(true)}
                                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all flex items-center gap-2 border border-white/10"
                            >
                                <Edit3 size={14} /> Posición
                            </button>
                            <label className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 border border-blue-500">
                                <Camera size={14} className="text-white" /> Portada
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMedia('cover', e)} />
                            </label>
                        </div>
                    )}

                    {isAdjustingCover && (
                        <div className="absolute inset-x-0 bottom-12 flex justify-center z-50 animate-in slide-in-from-bottom-4 duration-500 px-4">
                            <div className="bg-slate-900/90 backdrop-blur-2xl px-3 py-3 rounded-3xl shadow-2xl border border-white/10 flex flex-wrap items-center gap-2">
                                <div className="px-6 py-3">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
                                            <Layout size={14} className="text-accent" />
                                        </div>
                                        Arrastra para ajustar posición
                                    </p>
                                </div>
                                <div className="hidden sm:block h-8 w-px bg-white/10 mx-2" />
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => {
                                            setIsAdjustingCover(false);
                                            setTempOffset(profile.ajuste_portada ?? 50);
                                        }}
                                        className="flex-1 sm:flex-none px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveAdjustment}
                                        disabled={saving}
                                        className="flex-1 sm:flex-none px-8 py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Header Info Vitaminado */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-24 md:-mt-32 mb-16">
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            {/* Glow Effect */}
                            <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700 ${profile.subscription_tier === 'premium'
                                ? 'bg-blue-600'
                                : profile.subscription_tier === 'pro'
                                    ? 'bg-amber-500'
                                    : 'bg-accent'
                                }`} />

                            <div className={`w-48 h-48 md:w-56 md:h-56 rounded-full border-[6px] shadow-2xl overflow-hidden transition-all duration-700 bg-background relative z-10 ${profile.subscription_tier === 'premium'
                                ? 'border-blue-600 ring-4 ring-blue-600/20'
                                : profile.subscription_tier === 'pro'
                                    ? 'border-amber-500 ring-4 ring-amber-500/20'
                                    : 'border-white/10'
                                }`}>
                                {profile.foto_perfil ? (
                                    <img src={profile.foto_perfil} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                        <Users size={64} />
                                    </div>
                                )}
                            </div>
                            {isOwner && (
                                <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-accent hover:text-white transition-all border-4 border-background shadow-xl hover:scale-110 active:scale-95 z-20">
                                    <Camera size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMedia('avatar', e)} />
                                </label>
                            )}
                        </div>

                        {/* Info Header */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.8] text-foreground drop-shadow-sm">
                                            {profile.artistic_name || profile.username}
                                        </h1>
                                        <div className="flex items-center gap-2 translate-y-3 md:translate-y-6">
                                            {profile.is_verified && (
                                                <img src="/verified-badge.png" alt="Verificado" className="w-6 h-6 md:w-8 md:h-8 object-contain hover:scale-110 transition-transform cursor-help shadow-blue-500/20 shadow-2xl" title="Verificado" />
                                            )}
                                            {profile.is_founder && (
                                                <div className="flex items-center justify-center text-amber-500 hover:rotate-12 transition-transform cursor-help" title="Founder">
                                                    <Crown className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted">
                                        <span className="text-accent underline decoration-2 underline-offset-4">@{profile.username}</span>
                                        <span className="opacity-30">•</span>
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={editCountry}
                                                    onChange={(e) => setEditCountry(e.target.value)}
                                                    className="bg-accent/5 rounded-lg px-2 py-1 text-accent outline-none border border-accent/20"
                                                >
                                                    <option value="">País</option>
                                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                {!COUNTRIES.includes(editCountry) && (
                                                    <input
                                                        type="text"
                                                        value={editCountry}
                                                        onChange={(e) => setEditCountry(e.target.value)}
                                                        placeholder="Escribe tu país..."
                                                        className="bg-accent/5 rounded-lg px-2 py-1 text-accent outline-none border border-accent/20 w-32"
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-accent" /> {profile.country || "Planeta Tierra"}</span>
                                        )}
                                        <span className="opacity-30">•</span>
                                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {profile.fecha_de_creacion ? new Date(profile.fecha_de_creacion).getFullYear() : '2025'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">



                                    {isOwner ? (
                                        <button
                                            onClick={() => isEditing ? (hasChanges() ? handleUpdateProfile() : setIsEditing(false)) : setIsEditing(true)}
                                            className={`h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center gap-3 ${isEditing ? 'bg-foreground dark:bg-white text-background dark:text-slate-900' : 'bg-white dark:bg-white/10 text-foreground dark:text-white border border-slate-100 dark:border-white/20 hover:shadow-2xl hover:-translate-y-1 backdrop-blur-md dark:hover:bg-white dark:hover:text-slate-900'}`}
                                        >
                                            {isEditing ? (hasChanges() ? <><Save size={16} /> Guardar</> : 'Cerrar') : <><Edit3 size={16} /> Editar Perfil</>}
                                        </button>
                                    ) : (
                                        <>
                                            {currentUserId !== profile?.id && (
                                                <button
                                                    onClick={handleFollowToggle}
                                                    className={`h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl active:scale-95 ${isFollowing ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-accent text-white shadow-accent/20 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900'}`}
                                                >
                                                    {isFollowing ? <><UserCheck size={16} /> Siguiendo</> : <><UserPlus size={16} /> Seguir</>}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* Sidebar Vitaminado */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Estadísticas Premium */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Seguidores', value: followersCount, icon: Users, color: 'text-blue-500', href: `/${username}/connections` },
                                    { label: 'Beats', value: beats.length, icon: Music, color: 'text-accent', href: `/${username}/beats` },
                                    { label: 'Siguiendo', value: followingCount, icon: UserPlus, color: 'text-emerald-500', href: `/${username}/connections` }
                                ].map((stat, i) => (
                                    <Link key={i} href={stat.href} className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 text-center shadow-soft dark:shadow-[0_20px_50px_rgba(8,112,184,0.08)] hover:shadow-xl hover:-translate-y-1 transition-all group">
                                        <stat.icon size={16} className={`${stat.color} mx-auto mb-2 opacity-60 group-hover:opacity-100 transition-opacity`} />
                                        <span className="block text-2xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.value}</span>
                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Estatus Tianguis Premium */}
                            <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/10 rounded-[3rem] p-10 text-slate-900 dark:text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[60px] rounded-full pointer-events-none" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 text-slate-400 dark:text-white/40 flex items-center gap-3">
                                    <ShieldCheck size={14} className="text-accent" /> Estatus Tianguis
                                </h3>
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between group">
                                        <span className="text-sm font-bold text-slate-400 dark:text-white/60">Suscripción</span>
                                        <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-2xl border transition-all ${profile.subscription_tier === 'premium' ? 'bg-blue-600/10 dark:bg-blue-600 border-blue-400/30 dark:border-blue-400 text-blue-600 dark:text-white shadow-lg dark:shadow-blue-500/20' : profile.subscription_tier === 'pro' ? 'bg-amber-400 border-amber-300 text-slate-900' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60'}`}>
                                            {profile.subscription_tier}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <span className="text-sm font-bold text-slate-400 dark:text-white/60">Identidad</span>
                                        <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-2xl border flex items-center gap-2 transition-all ${profile.is_verified ? 'bg-blue-600/10 border-blue-400/50 text-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-500/10 dark:bg-white/5 border-slate-400/20 text-slate-400'}`}>
                                            {profile.is_verified ? (
                                                <><img src="/verified-badge.png" className="w-4 h-4 object-contain shadow-blue-500/20 shadow-xl" alt="✓" /> Verificado</>
                                            ) : 'Sin verificar'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <span className="text-sm font-bold text-slate-400 dark:text-white/60">Rango</span>
                                        <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-2xl border flex items-center gap-2 transition-all ${profile.is_founder ? 'bg-amber-500/10 dark:bg-amber-400/20 border-amber-400/20 text-amber-600 dark:text-amber-400' : 'bg-slate-500/5 dark:bg-white/5 border-white/10 text-slate-400'}`}>
                                            {profile.is_founder ? <><Crown size={12} fill="currentColor" /> Founder</> : 'Sin rango'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Video Destacado (Minimalista) */}
                            {profile.subscription_tier === 'premium' && profile.video_destacado_url && getYouTubeEmbedUrl(profile.video_destacado_url) && (
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted ml-2">Video Destacado</h3>
                                    <div className="rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl aspect-video bg-slate-900 group relative">
                                        <iframe
                                            width="100%" height="100%"
                                            src={getYouTubeEmbedUrl(profile.video_destacado_url)}
                                            title="Video Destacado" frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                                        ></iframe>
                                    </div>
                                </div>
                            )}

                            {/* Trayectoria y Socials */}
                            <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/5 dark:bg-white/5 blur-[60px] rounded-full pointer-events-none" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 text-slate-400 dark:text-white/40 flex items-center gap-3">
                                    <ListMusic size={14} className="text-accent" /> Smart Bio
                                </h3>

                                {isEditing ? (
                                    <div className="space-y-6">
                                        <div>
                                            <textarea
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                                className="w-full h-40 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 text-sm font-medium border-transparent focus:border-accent outline-none resize-none text-slate-900 dark:text-white shadow-inner"
                                                placeholder="Tu historia comienza aquí..."
                                            />
                                        </div>
                                        {/* Redes sociales removidas de aquí según solicitud */}
                                        <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <ShieldCheck size={14} className="text-accent" />
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Redes para Verificación (Privado)</h4>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Link Instagram</label>
                                                    <input
                                                        value={editVerifyInstagram}
                                                        onChange={(e) => setEditVerifyInstagram(e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-[10px] font-bold border-transparent focus:border-accent dark:text-white outline-none transition-all"
                                                        placeholder="https://instagram.com/tu_perfil"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Link YouTube</label>
                                                    <input
                                                        value={editVerifyYoutube}
                                                        onChange={(e) => setEditVerifyYoutube(e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-[10px] font-bold border-transparent focus:border-accent dark:text-white outline-none transition-all"
                                                        placeholder="https://youtube.com/@tu_canal"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Link TikTok</label>
                                                    <input
                                                        value={editVerifyTiktok}
                                                        onChange={(e) => setEditVerifyTiktok(e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-[10px] font-bold border-transparent focus:border-accent dark:text-white outline-none transition-all"
                                                        placeholder="https://tiktok.com/@tu_perfil"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {profile.subscription_tier === 'premium' && (
                                            <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                                                <label className="text-[9px] font-black uppercase text-accent mb-2 block tracking-widest">Link YouTube Destacado (Banner)</label>
                                                <input
                                                    value={editVideoUrl}
                                                    onChange={(e) => setEditVideoUrl(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-[10px] font-bold border-transparent focus:border-accent dark:text-white outline-none transition-all"
                                                    placeholder="URL de Video..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 w-full">
                                        {isOwner || profile.links_active ? (
                                            <>
                                                {isOwner && profile.subscription_tier !== 'premium' ? (
                                                    <Link
                                                        href="/pricing"
                                                        className="w-full max-w-md h-20 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_20px_40px_rgba(37,99,235,0.25)] hover:scale-105 active:scale-95 border border-white/10 relative overflow-hidden group"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                                                        {/* Premium Badge - Top Right */}
                                                        <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-[7px] font-black tracking-widest uppercase border transition-all duration-300
                                                            bg-blue-500 text-white border-white/20 shadow-lg
                                                            group-hover:bg-white group-hover:text-blue-600 group-hover:scale-110
                                                            dark:bg-slate-950 dark:text-blue-400 dark:border-blue-500/30 dark:group-hover:bg-blue-600 dark:group-hover:text-white"
                                                        >
                                                            PREMIUM
                                                        </div>

                                                        Desbloquear Smart Bio
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href={`/${profile.username}/links`}
                                                        className="w-full max-w-sm h-20 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95 relative overflow-hidden group border border-white/5"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                                        <div className="w-11 h-11 bg-accent/20 dark:bg-slate-900/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                                            <Zap size={22} fill="currentColor" />
                                                        </div>
                                                        <span className="font-black">Ver Smart Bio</span>
                                                        <ChevronRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform ml-1" />
                                                    </Link>
                                                )}
                                            </>
                                        ) : null}

                                        {/* Bio Text (Optional/Reduced) */}
                                        {profile.bio && (
                                            <p className="mt-8 text-xs font-medium text-center text-slate-500 dark:text-slate-400 max-w-lg mx-auto line-clamp-3 italic">
                                                "{profile.bio}"
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Beats Feed */}
                        <div className="lg:col-span-8">
                            {/* 3. Navegación de Contenido (Tabs) */}
                            <div className="flex items-center justify-between gap-4 border-b border-border mb-12 overflow-x-auto pb-px scrollbar-hide">
                                <div className="flex gap-10">
                                    {[
                                        { id: 'beats', label: 'Beats', icon: Music },
                                        { id: 'playlists', label: 'Playlists', icon: LayoutGrid },
                                        { id: 'services', label: 'Servicios', icon: Briefcase }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as 'beats' | 'playlists' | 'services' | 'sound_kits')}
                                            className={`relative py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'text-foreground dark:text-blue-50 dark:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-muted hover:text-foreground dark:hover:text-white'}`}
                                        >
                                            <tab.icon size={16} />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full animate-in fade-in zoom-in duration-300" />
                                            )}
                                        </button>
                                    ))}
                                    {/* Link a Sound Kits (Solo si es Premium/Dueño) */}
                                    <button
                                        key="sound_kits"
                                        onClick={() => setActiveTab('sound_kits')}
                                        className={`relative py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === 'sound_kits' ? 'text-amber-500' : 'text-muted hover:text-amber-400'}`}
                                    >
                                        <Package size={16} /> Sound Kits
                                        {activeTab === 'sound_kits' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-full animate-in fade-in zoom-in duration-300" />
                                        )}
                                    </button>
                                </div>
                            </div>


                            {activeTab === 'beats' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                                                    <Music size={24} />
                                                </div>
                                                <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Recién Horneados🔥</h2>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] ml-1">Descubre lo último que ha salido del estudio</p>
                                        </div>
                                        <Link
                                            href={`/${username}/beats`}
                                            className="h-14 px-8 bg-foreground/5 dark:bg-white/5 hover:bg-foreground/10 dark:hover:bg-white/10 border border-foreground/5 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground dark:text-white transition-all flex items-center gap-3 active:scale-95 group"
                                        >
                                            Ver Catálogo Completo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>

                                    {beats.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                                            {beats.slice(0, 6).map((beat) => (
                                                <div key={beat.id} className="group relative">
                                                    <BeatCardPro beat={beat} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-[#020205] rounded-[3rem] p-24 text-center border border-white/5 shadow-2xl">
                                            <Music size={48} className="text-slate-800 mx-auto mb-6" />
                                            <h3 className="text-xl font-black uppercase text-white mb-2">Sin beats todavía</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Este productor aún no ha publicado sus obras</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'services' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white drop-shadow-sm">Servicios Profesionales</h2>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Contrata talento experto para tu próximo hit</p>
                                        </div>
                                    </div>

                                    {/* Owner Upsell for Non-Premium (Services) */}
                                    {profile.subscription_tier !== 'premium' ? (
                                        <div className={`rounded-[3rem] p-12 text-center overflow-hidden relative group border transition-all duration-700 ${profile.tema_perfil !== 'light' ? 'bg-[#050508] border-white/5 text-white shadow-[0_40px_100px_-20px_rgba(37,99,235,0.15)]' : 'bg-white border-slate-100 text-slate-900 shadow-2xl shadow-indigo-500/10'}`}>
                                            <div className="absolute top-0 right-0 p-48 bg-blue-600/10 blur-[150px] rounded-full group-hover:bg-blue-600/20 transition-all pointer-events-none" />
                                            <div className="relative z-10">
                                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 backdrop-blur-md border ${profile.tema_perfil !== 'light' ? 'bg-white/5 border-white/10 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'bg-indigo-50 border-indigo-100'}`}>
                                                    <Briefcase size={36} className="text-accent" />
                                                </div>
                                                <h3 className="text-4xl font-black uppercase tracking-tighter mb-6">Servicios Profesionales</h3>
                                                <p className={`max-w-xl mx-auto mb-10 text-sm font-medium leading-relaxed ${profile.tema_perfil !== 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {isOwner
                                                        ? "Ofrece servicios de Mezcla, Masterización, Composición o Clases. Los usuarios Premium pueden listar sus servicios y ser contactados directamente. ¡Desbloquea esta función ahora!"
                                                        : "Este usuario aún no ofrece servicios profesionales ya que no cuenta con una suscripción Premium activa. Los servicios se desbloquean al mejorar el plan."}
                                                </p>
                                                {isOwner ? (
                                                    <Link href="/pricing" className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all transform hover:scale-105 shadow-2xl shadow-accent/40 bg-accent text-white hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900">
                                                        <Crown size={18} fill="currentColor" /> Mejorar a Premium
                                                    </Link>
                                                ) : (
                                                    <div className="py-3 px-8 bg-slate-100 dark:bg-white/5 rounded-full inline-block text-[10px] font-black uppercase tracking-widest opacity-40 border border-white/5">
                                                        Servicios no disponibles
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                                            {services.map(service => (
                                                <div key={service.id} className={`p-10 rounded-[2.5rem] border shadow-sm transition-all group relative overflow-hidden backdrop-blur-md 
                                                    ${profile.tema_perfil === 'dark' || profile.tema_perfil === 'neon' || profile.tema_perfil === 'gold' ?
                                                        'bg-slate-900/60 border-white/5 hover:border-accent/40 shadow-2xl shadow-black/80 text-white' :
                                                        'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/5 hover:shadow-xl text-slate-900 dark:text-white'
                                                    }`}>
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex justify-between items-start mb-6">
                                                        <span className="bg-blue-500/20 text-blue-500 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/10">
                                                            {service.tipo_servicio === 'beat_custom' ? 'Beat a Medida' :
                                                                service.tipo_servicio === 'mentor' ? 'Mentoría / Clase' :
                                                                    service.tipo_servicio === 'mixing' ? 'Mezcla y Masterización' :
                                                                        service.tipo_servicio?.replace(/_/g, ' ') || service.tipo_servicio}
                                                        </span>
                                                        <span className="text-2xl font-black text-slate-900 dark:text-white">${service.precio}</span>
                                                    </div>
                                                    <h3 className="font-black text-xl mb-3 group-hover:text-blue-500 transition-colors text-slate-900 dark:text-white">{service.titulo}</h3>
                                                    <p className="text-xs mb-8 line-clamp-3 leading-relaxed font-medium text-slate-500 dark:text-slate-300">{service.descripcion}</p>

                                                    <div className={`flex items-center justify-between pt-6 border-t ${profile.tema_perfil === 'light' ? 'border-slate-100' : 'border-white/10'}`}>
                                                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest">
                                                            <Clock size={16} className="text-blue-500" />
                                                            {service.tiempo_entrega_dias} Días hábiles
                                                        </div>
                                                        {isOwner ? (
                                                            <Link
                                                                href={`/studio/services?edit_service=${service.id}`}
                                                                className="bg-blue-600/10 text-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-500/10 active:scale-95 flex items-center gap-2"
                                                            >
                                                                <Edit3 size={14} /> Editar
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAddToCart(service, 'service')}
                                                                className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/10 active:scale-95"
                                                            >
                                                                Contratar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                            }
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'playlists' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">


                                    {/* Acciones de Colecciones (Solo Dueño) */}
                                    {isOwner && (
                                        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 py-8 border-y border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5 rounded-[2.5rem]">
                                            <button
                                                onClick={() => {
                                                    setEditingPlaylist(null);
                                                    setIsPlaylistModalOpen(true);
                                                }}
                                                className="px-8 py-4 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-3 shadow-sm hover:shadow-xl hover:shadow-blue-600/10 active:scale-95"
                                            >
                                                <Plus size={18} /> Nueva Playlist
                                            </button>

                                            <button
                                                onClick={() => setIsReordering(!isReordering)}
                                                className={`px-8 py-4 border rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm active:scale-95 ${isReordering ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl' : 'bg-white dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
                                            >
                                                {isReordering ? <><MoveVertical size={18} className="animate-bounce" /> Reordenando...</> : <><MoveVertical size={18} /> Organizar Playlists</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* Reordering Controls (Only visible when isReordering is true) */}
                                    {isReordering && (
                                        <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-500/20 animate-in fade-in slide-in-from-top-4">
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
                                                    <div key={pl.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 w-4">#{idx + 1}</span>
                                                            <span className="text-xs font-bold text-slate-700 dark:text-white">{pl.name}</span>
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
                                    {playlists.length > 0 ? (
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
                                    ) : (
                                        <div className="empty-state-card mt-12 bg-card">
                                            {profile.tema_perfil !== 'light' && (
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                                            )}
                                            <div className="relative inline-block mb-10">
                                                <div className={`absolute inset-0 blur-[60px] rounded-full scale-[2.5] ${profile.tema_perfil !== 'light' ? 'bg-blue-500/10' : 'bg-indigo-500/5'}`} />
                                                <div className={`relative w-32 h-32 rounded-[3.5rem] flex items-center justify-center mx-auto border shadow-inner ${profile.tema_perfil !== 'light' ? 'bg-[#0a0a0f] border-white/10' : 'bg-white border-slate-200'}`}>
                                                    <ListMusic size={48} className="text-accent opacity-50" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-foreground">Este productor aún no ha creado playlist</h3>

                                            {isOwner && (
                                                <div className="mt-10">
                                                    <button
                                                        onClick={() => {
                                                            setEditingPlaylist(null);
                                                            setIsPlaylistModalOpen(true);
                                                        }}
                                                        className="px-12 py-5 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-accent/20"
                                                    >
                                                        Crear mi primera Playlist
                                                    </button>
                                                </div>
                                            )}
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
                                            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white drop-shadow-md">Sound Kits</h2>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Librerías de sonidos oficiales y presets</p>
                                        </div>
                                    </div>

                                    {/* Owner Upsell for Non-Premium */}
                                    {profile.subscription_tier !== 'premium' ? (
                                        <div className={`rounded-[3rem] p-12 text-center overflow-hidden relative group border-2 transition-all duration-700 ${profile.tema_perfil !== 'light' ? 'bg-black border-white/5 text-white shadow-[0_40px_100px_-15px_rgba(245,158,11,0.15)]' : 'bg-white border-slate-100 text-slate-900 shadow-2xl shadow-amber-500/10'}`}>
                                            <div className="absolute top-0 right-0 p-48 bg-amber-500/10 blur-[150px] rounded-full group-hover:bg-amber-500/20 transition-all pointer-events-none" />
                                            <div className="relative z-10">
                                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 backdrop-blur-md border ${profile.tema_perfil !== 'light' ? 'bg-amber-400/5 border-amber-400/10 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'bg-amber-50 border-amber-100'}`}>
                                                    <Package size={36} className="text-amber-400" />
                                                </div>
                                                <h3 className="text-4xl font-black uppercase tracking-tighter mb-6">Librerías de Sonido</h3>
                                                <p className={`max-w-xl mx-auto mb-10 text-sm font-medium leading-relaxed ${profile.tema_perfil !== 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {isOwner
                                                        ? "Vende tus propios Sample Packs, Drum Kits y Presets directamente desde tu perfil. Mejora tu cuenta para desbloquear esta sección y comenzar a generar ingresos pasivos."
                                                        : "Este productor no cuenta con una suscripción Premium para vender Sound Kits. Las librerías de sonido exclusivas solo están disponibles para miembros Premium."}
                                                </p>
                                                {isOwner ? (
                                                    <Link href="/pricing" className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all transform hover:scale-105 shadow-2xl shadow-amber-500/30 bg-amber-400 text-slate-900 hover:bg-amber-300">
                                                        <Zap size={18} fill="currentColor" /> Mejorar a Premium
                                                    </Link>
                                                ) : (
                                                    <div className="py-3 px-8 bg-slate-100 dark:bg-white/5 rounded-full inline-block text-[10px] font-black uppercase tracking-widest opacity-40 border border-white/5">
                                                        Sección no disponible
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Logic for Visitors OR Premium Owner */}
                                            {soundKits.length === 0 ? (
                                                <div className="empty-state-card bg-card">
                                                    <div className="w-24 h-24 bg-amber-400/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-amber-400">
                                                        <Package size={40} />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">Aún no hay Sound Kits disponibles</h3>
                                                    {isOwner ? (
                                                        <Link href="/studio/services" className="bg-amber-400 text-slate-900 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all inline-block shadow-xl shadow-amber-400/20">
                                                            Subir mi primer Kit
                                                        </Link>
                                                    ) : (
                                                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Este productor no ha subido librerías aún</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {soundKits.map(kit => (
                                                        <div key={kit.id} className={`p-6 rounded-[2rem] border transition-all group backdrop-blur-md 
                                                            ${profile.tema_perfil === 'dark' || profile.tema_perfil === 'neon' || profile.tema_perfil === 'gold' ?
                                                                'bg-slate-900/60 border-white/5 hover:border-amber-500/40 shadow-2xl shadow-black text-white' :
                                                                'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/5 hover:shadow-xl text-slate-900 dark:text-white'
                                                            }`}>
                                                            <div className="aspect-square bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                                                                {kit.cover_url ? (
                                                                    <img src={kit.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={kit.title} />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                                        <Package size={48} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-bold text-lg mb-1 group-hover:text-amber-500 transition-colors line-clamp-1 text-slate-900 dark:text-white">{kit.title}</h3>
                                                            </div>
                                                            <p className="text-xs mb-4 line-clamp-2 text-slate-500 dark:text-slate-400">{kit.description}</p>
                                                            <div className={`flex items-center justify-between pt-4 border-t ${profile.tema_perfil === 'light' ? 'border-slate-50' : 'border-white/10'}`}>
                                                                {isOwner ? (
                                                                    <>
                                                                        <span className="text-xl font-black text-slate-900 dark:text-white">${kit.price} MXN</span>
                                                                        <Link
                                                                            href={`/studio/services?edit_kit=${kit.id}`}
                                                                            className="bg-amber-500/10 text-amber-500 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2 shadow-sm border border-amber-500/20 active:scale-95"
                                                                        >
                                                                            <Edit3 size={12} /> Editar
                                                                        </Link>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleAddToCart(kit, 'sound_kit')}
                                                                        className="w-full bg-amber-400 text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:bg-amber-300 group/btn"
                                                                    >
                                                                        Comprar ${kit.price}
                                                                    </button>
                                                                )}
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

            {/* Fan Capture Popup */}
            {showFanCapture && profile?.newsletter_active && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-[#08080a] w-full max-w-lg rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl border border-white/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                        <button
                            onClick={() => setShowFanCapture(false)}
                            className="absolute top-0 right-0 p-6 z-50 text-muted hover:text-foreground transition-all flex items-center justify-center group"
                            aria-label="Cerrar modal"
                        >
                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </div>
                        </button>

                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent">
                                <Mail size={32} />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-4">Únete al <span className="text-accent">Círculo Exclusivo</span></h2>
                            <p className="text-sm text-muted font-medium mb-8 leading-relaxed">
                                Suscríbete para recibir beats exclusivos, cupones de descuento y noticias directas de <span className="text-foreground font-bold">{profile.artistic_name}</span>.
                            </p>

                            <form className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="w-full h-14 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 text-sm font-bold outline-none focus:border-accent transition-all"
                                    required
                                />
                                <button className="w-full h-14 bg-accent text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 active:scale-95">
                                    Suscribirme Ahora
                                </button>
                            </form>
                            <p className="mt-6 text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">Zero spam. Solo promociones.</p>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
