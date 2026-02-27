"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, Instagram, Youtube, Twitter,
    Share2, MoreHorizontal, Calendar, MapPin,
    Music, Play, Users, Crown, Settings, Camera,
    Edit3, CheckCircle2, Copy, Trash2, Layout, PlayCircle,
    BarChart2, ShieldCheck, Globe, Zap, Loader2, UserPlus, UserCheck, LayoutGrid, ListMusic, Plus, MoveVertical, Save, ChevronUp, ChevronDown, List, Briefcase, Clock, DollarSign, Package, MessageSquare, Mail, ShoppingBag, Link2
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
    web: { icon: Globe, color: "hover:text-accent" },
    instagram: { icon: Instagram, color: "hover:text-accent" },
    youtube: { icon: Youtube, color: "hover:text-accent" },
    twitter: { icon: Twitter, color: "hover:text-accent" },
    tiktok: {
        path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77-1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
        color: "hover:text-accent"
    },
    spotify: {
        path: "M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8m3.93 11c-.3.06-.62 0-.85-.14-2.34-1.42-5.3-1.74-8.77-1.74-.29 0-.58.07-.82.2a.57.57 0 0 1-.78-.23c-.16-.28-.06-.63.22-.79 3.86.06 7.18.42 9.9 2a1 1 0 0 1 .4.15c.29.17.38.54.21.83-.11.19-.3.29-.51.29zM12 9.04c-3.15 0-5.83.33-8.08 1.05-.38.12-.58.53-.46.9.11.33.45.52.8.52.1 0 .21-.03.31-.06 2.02-.65 4.49-.95 7.43-.95 2.81 0 5.2.28 7.15.86.1.03.2.05.3.05.28 0 .55-.13.7-.37.21-.34.11-.78-.23-.99-2.22-.69-5.11-1.01-7.92-1.01zm-7.6 2.87c2.68-.8 6.09-1.12 9.06-1.12 2.62 0 5.64.26 8.27 1.05.47.14.73.65.59 1.12-.13.43-.53.7-1.02.7-.1 0-.21-.02-.3-.05-2.29-.68-4.99-.91-7.54-.91-2.6 0-5.63.29-8.04 1.01-.1.03-.2.04-.3.04-.4 0-.8-.25-.94-.64-.2-.47.05-1 .52-1.2z",
        color: "hover:text-accent"
    },
    applemusic: {
        icon: Music,
        color: "hover:text-accent"
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
    const [showCoverMenu, setShowCoverMenu] = useState(false);
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
            name: type === 'service' ? item.titulo : item.titulo || item.title,
            price: Number(item.precio || item.precio_mxn || item.price || 0),
            image: type === 'sound_kit' ? (item.portada_url || item.cover_url || profile?.foto_perfil) : profile?.foto_perfil,
            subtitle: type === 'service' ? 'Servicio Profesional' : 'Sound Kit',
            metadata: {
                originalId: item.id,
                productor_id: profile?.id,
                producer_id: profile?.id, // Keep for compat
                producerName: profile?.nombre_artistico,
                isSoundKit: type === 'sound_kit',
                isService: type === 'service'
            }
        });
    };

    // Fan Capture Logic (30s playback trigger)
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && currentBeat && !hasShownFanCapture && profile?.boletin_activo) {
            timer = setTimeout(() => {
                setShowFanCapture(true);
                setHasShownFanCapture(true);
            }, 30000); // 30 seconds
        }
        return () => clearTimeout(timer);
    }, [isPlaying, currentBeat, hasShownFanCapture, profile?.boletin_activo]);

    // Fetch Data
    const fetchAll = async () => {
        try {
            setLoading(true);
            // We removed auth check here to use the dedicated listener above

            // 1. Get Profile
            const { data: profileData } = await supabase
                .from('perfiles')
                .select('id, nombre_usuario, nombre_artistico, foto_perfil, portada_perfil, ajuste_portada, biografia, pais, enlaces_sociales, esta_verificado, es_fundador, nivel_suscripcion, fecha_creacion, tema_perfil, color_acento, video_destacado_url, texto_cta, url_cta, boletin_activo, enlaces_activos, verificacion_instagram, verificacion_youtube, verificacion_tiktok')
                .eq('nombre_usuario', username)
                .single();

            if (profileData) {
                setProfile(profileData as any);
                setEditBio(profileData.biografia || '');
                setEditArtisticName(profileData.nombre_artistico || '');
                setEditCountry(profileData.pais || '');
                setEditSocials(profileData.enlaces_sociales || {});
                setEditVideoUrl(profileData.video_destacado_url || '');
                setEditVerifyInstagram(profileData.verificacion_instagram || '');
                setEditVerifyYoutube(profileData.verificacion_youtube || '');
                setEditVerifyTiktok(profileData.verificacion_tiktok || '');
                setTempOffset(profileData.ajuste_portada ?? 50);

                // 2. Get Beats (Optimized Select)
                const { data: beatsData } = await supabase
                    .from('beats')
                    .select('id, productor_id, titulo, genero, bpm, precio_basico_mxn, portada_url, archivo_mp3_url, archivo_muestra_url, tono_escala, vibras, es_publico, conteo_reproducciones, conteo_likes, fecha_creacion')
                    .eq('productor_id', profileData.id)
                    .eq('es_publico', true)
                    .order('fecha_creacion', { ascending: false });

                if (beatsData) {
                    // Transform internal storage paths to public URLs with encoding for spaces
                    const transformedBeats = await Promise.all(beatsData.map(async (b: any) => {
                        const path = b.archivo_muestra_url || b.archivo_mp3_url || '';
                        let publicUrl = '';

                        if (path.startsWith('http')) {
                            publicUrl = path;
                        } else {
                            const encodedPath = path;
                            const bucket = path.includes('-hq-') ? 'beats_mp3' : 'muestras_beats';
                            const { data } = supabase.storage
                                .from(bucket)
                                .getPublicUrl(encodedPath);
                            publicUrl = data.publicUrl;
                        }

                        // Resolve Cover URL
                        const finalCoverUrl = b.portada_url?.startsWith('http')
                            ? b.portada_url
                            : b.portada_url
                                ? supabase.storage.from('portadas_beats').getPublicUrl(b.portada_url).data.publicUrl
                                : null;

                        // Resolve Producer Photo URL if it's a storage path
                        let finalProductorFoto = profileData.foto_perfil;
                        if (finalProductorFoto && !finalProductorFoto.startsWith('http')) {
                            const { data: { publicUrl: pUrl } } = supabase.storage
                                .from('fotos_perfil')
                                .getPublicUrl(finalProductorFoto);
                            finalProductorFoto = pUrl;
                        }

                        return {
                            ...b,
                            archivo_mp3_url: publicUrl,
                            portada_url: finalCoverUrl,
                            productor_nombre_artistico: profileData.nombre_artistico,
                            productor_nombre_usuario: profileData.nombre_usuario,
                            productor_foto_perfil: finalProductorFoto,
                            productor_esta_verificado: profileData.esta_verificado,
                            productor_es_fundador: profileData.es_fundador,
                            productor_nivel_suscripcion: profileData.nivel_suscripcion
                        };
                    }));
                    setBeats(transformedBeats);
                }

                // 3. Get Playlists (new schema: id, usuario_id, nombre, es_publica, fecha_creacion)
                const { data: playlistsRaw } = await supabase
                    .from('listas_reproduccion')
                    .select('id, nombre, es_publica, fecha_creacion')
                    .eq('usuario_id', profileData.id)
                    .eq('es_publica', true)
                    .order('fecha_creacion', { ascending: true });

                if (playlistsRaw) {
                    const formattedPlaylists = playlistsRaw.map((pl: any) => ({
                        id: pl.id,
                        name: pl.nombre,
                        es_publica: pl.es_publica,
                        fecha_creacion: pl.fecha_creacion,
                        beats: [] // Beat associations managed separately
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
                    .from('servicios')
                    .select('*')
                    .eq('productor_id', profileData.id)
                    .eq('es_activo', true)
                    .order('fecha_creacion', { ascending: false });

                setServices(servicesData || []);

                // 6. Get Sound Kits
                const { data: kitsData } = await supabase
                    .from('kits_sonido')
                    .select('*')
                    .eq('productor_id', profileData.id)
                    .eq('es_publico', true)
                    .order('fecha_creacion', { ascending: false });

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
        const socialsChanged = JSON.stringify(editSocials) !== JSON.stringify(profile.enlaces_sociales || {});
        return (
            editBio !== (profile.biografia || '') ||
            editArtisticName !== (profile.nombre_artistico || '') ||
            editCountry !== (profile.pais || '') ||
            editVideoUrl !== (profile.video_destacado_url || '') ||
            editVerifyInstagram !== (profile.verificacion_instagram || '') ||
            editVerifyYoutube !== (profile.verificacion_youtube || '') ||
            editVerifyTiktok !== (profile.verificacion_tiktok || '') ||
            socialsChanged
        );
    };

    const handleUpdateProfile = async () => {
        if (!profile) return;
        setSaving(true);
        const { error } = await supabase
            .from('perfiles')
            .update({
                biografia: editBio,
                pais: editCountry,
                nombre_artistico: editArtisticName,
                enlaces_sociales: editSocials,
                video_destacado_url: editVideoUrl,
                verificacion_instagram: editVerifyInstagram,
                verificacion_youtube: editVerifyYoutube,
                verificacion_tiktok: editVerifyTiktok
            })
            .eq('id', profile.id);

        if (!error) {
            setProfile({
                ...profile,
                biografia: editBio,
                pais: editCountry,
                nombre_artistico: editArtisticName,
                enlaces_sociales: editSocials,
                video_destacado_url: editVideoUrl,
                verificacion_instagram: editVerifyInstagram,
                verificacion_youtube: editVerifyYoutube,
                verificacion_tiktok: editVerifyTiktok
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

    const handleDeleteCover = async () => {
        if (!profile) return;
        setSaving(true);
        const { error } = await supabase.from('perfiles').update({ portada_perfil: null, ajuste_portada: 50 }).eq('id', profile.id);
        if (!error) {
            setProfile({ ...profile, portada_perfil: null, ajuste_portada: 50 });
            showToast("Portada eliminada", "success");
        }
        setSaving(false);
        setShowCoverMenu(false);
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
        const filePath = `${profile.nombre_usuario}/${type}.${fileExt}`;
        const bucket = type === 'avatar' ? 'fotos_perfil' : 'fotos_portada';

        // Use upsert to avoid duplicate errors and replace old files
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
            upsert: true,
            cacheControl: '3600'
        });

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            const updateField = type === 'avatar' ? { foto_perfil: publicUrl } : { portada_perfil: publicUrl };

            const { error: dbUpdateError } = await supabase.from('perfiles').update(updateField).eq('id', profile.id);
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
            .from('perfiles')
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
            }`}>

            <Navbar />

            {/* pb-24 en móvil: reserva espacio para MobileBottomNav + AudioPlayer */}
            <main className="flex-1 pb-24 md:pb-0">

                {/* 1. Portada Refinada */}
                <div
                    className={`relative h-[40vh] md:h-[50vh] bg-foreground/5 group overflow-hidden ${isAdjustingCover ? 'cursor-ns-resize ring-4 ring-accent ring-inset z-50' : ''}`}
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
                        <div className="w-full h-full bg-gradient-to-br from-foreground/[0.06] via-foreground/[0.03] to-background" />
                    )}

                    {/* Overlay Gradiente para legibilidad */}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020205] via-[#020205]/40 to-transparent dark:block hidden" />
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/40 to-transparent dark:hidden" />

                    {isOwner && !isAdjustingCover && (
                        <div className="absolute top-6 right-6 flex gap-3 z-40">
                            <div className="relative">
                                <button
                                    onClick={() => setShowCoverMenu(!showCoverMenu)}
                                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all flex items-center gap-3 border border-white/10 shadow-2xl"
                                >
                                    <Camera size={16} /> {profile.portada_perfil ? 'Gestionar Portada' : 'Subir Portada'}
                                </button>

                                {showCoverMenu && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#0a0a0f] rounded-[2rem] shadow-3xl border border-slate-100 dark:border-white/10 p-3 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="px-5 py-3 mb-2 border-b border-slate-50 dark:border-white/5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opciones de Portada</p>
                                        </div>
                                        <label className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors text-foreground">
                                            <Camera size={14} className="text-accent" />
                                            {profile.portada_perfil ? 'Cambiar Imagen' : 'Subir Imagen'}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMedia('cover', e)} />
                                        </label>
                                        {profile.portada_perfil && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setIsAdjustingCover(true);
                                                        setShowCoverMenu(false);
                                                    }}
                                                    className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors"
                                                >
                                                    <MoveVertical size={14} className="text-amber-500" />
                                                    Mover Portada
                                                </button>
                                                <button
                                                    onClick={handleDeleteCover}
                                                    className="flex items-center gap-3 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                    Eliminar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
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
                    {/* ── Header de perfil: Avatar + nombre + acción ── */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-16 md:-mt-32 mb-10 md:mb-16">
                        {/* Avatar — más pequeño en móvil para no dominar la pantalla */}
                        <div className="relative group shrink-0">

                            {/* Glow Effect */}
                            <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700 bg-accent`} />

                            {/* Borde del avatar según nivel de suscripción */}
                            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-[5px] shadow-2xl overflow-hidden transition-all duration-700 bg-background relative z-10 ${profile.nivel_suscripcion === 'premium'
                                ? 'border-[#00f2ff] ring-4 ring-[#00f2ff]/20 shadow-[#00f2ff]/30'
                                : profile.es_fundador
                                    ? 'border-amber-500 ring-4 ring-amber-500/20 shadow-amber-500/30'
                                    : profile.nivel_suscripcion === 'pro'
                                        ? 'border-accent ring-4 ring-accent/20'
                                        : 'border-white/10'
                                }`}>

                                {profile.foto_perfil ? (
                                    <img src={profile.foto_perfil} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-muted">
                                        <Users size={64} />
                                    </div>
                                )}
                            </div>
                            {isOwner && (
                                <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-card border border-border text-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-accent hover:text-white hover:border-accent transition-all border-4 border-background shadow-xl hover:scale-110 active:scale-95 z-20">
                                    <Camera size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadMedia('avatar', e)} />
                                </label>
                            )}
                        </div>

                        {/* Info Header */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
                                <div className="space-y-4">
                                    {/* Nombre artístico: compacto en móvil */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-foreground drop-shadow-sm">

                                            {profile.nombre_artistico || profile.nombre_usuario}
                                        </h1>
                                        <div className="flex items-center gap-2 translate-y-3 md:translate-y-6">
                                            {profile.esta_verificado && (
                                                <img src="/verified-badge.png" alt="Verificado" className="w-6 h-6 md:w-8 md:h-8 object-contain hover:scale-110 transition-transform cursor-help shadow-accent/20 shadow-2xl" title="Verificado" />
                                            )}
                                            {profile.es_fundador && (
                                                <div className="flex items-center justify-center text-amber-500 hover:rotate-12 transition-transform cursor-help" title="Founder">
                                                    <Crown className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted">
                                        <span className="text-accent underline decoration-2 underline-offset-4">@{profile.nombre_usuario}</span>
                                        <span className="opacity-30">•</span>
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={editCountry}
                                                    onChange={(e) => setEditCountry(e.target.value)}
                                                    className="bg-accent/5 rounded-lg px-2 py-1 text-accent outline-none border border-accent/20"
                                                >
                                                    <option value="">Escribe tu país</option>
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
                                            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-accent" /> {profile.pais || (isOwner ? "Agrega tu país" : "Planeta Tierra")}</span>
                                        )}
                                        <span className="opacity-30">•</span>
                                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {profile.fecha_creacion ? new Date(profile.fecha_creacion).getFullYear() : '2025'}</span>
                                    </div>
                                </div>

                                {/* ── Botones de acción (Editar / Seguir): full-width en móvil ── */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">



                                    {isOwner ? (
                                        <button
                                            onClick={() => isEditing ? (hasChanges() ? handleUpdateProfile() : setIsEditing(false)) : setIsEditing(true)}
                                            className={`h-12 sm:h-14 px-8 sm:px-10 w-full sm:w-auto rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${isEditing ? 'bg-foreground dark:bg-white text-background dark:text-slate-900' : 'bg-white dark:bg-white/10 text-foreground dark:text-white border border-slate-100 dark:border-white/20 hover:shadow-2xl hover:-translate-y-1 backdrop-blur-md dark:hover:bg-white dark:hover:text-slate-900'}`}
                                        >
                                            {isEditing ? (hasChanges() ? <><Save size={16} /> Guardar</> : 'Cerrar') : <><Edit3 size={16} /> Editar Perfil</>}
                                        </button>
                                    ) : (
                                        <>
                                            {currentUserId !== profile?.id && (
                                                <button
                                                    onClick={handleFollowToggle}
                                                    className={`h-12 sm:h-14 px-8 sm:px-10 w-full sm:w-auto rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${isFollowing ? 'bg-success text-white shadow-success/20' : 'bg-accent text-white shadow-accent/20 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900'}`}
                                                >
                                                    {isFollowing ? <><Check size={16} /> Siguiendo</> : <><UserPlus size={16} /> Seguir</>}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* ── Layout principal: sidebar (bio) + feed de beats ──
                         En móvil el feed de beats aparece PRIMERO (order-last en desktop) */}
                    <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* Sidebar: va debajo en móvil */}
                        <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
                            {/* ── Estadísticas: seguidores, beats, siguiendo ── */}
                            <div className="grid grid-cols-3 gap-3">

                                {[
                                    { label: 'Seguidores', value: followersCount, icon: Users, color: 'text-accent', href: `/${username}/connections` },
                                    { label: 'Beats', value: beats.length, icon: Music, color: 'text-accent', href: `/${username}/beats` },
                                    { label: 'Siguiendo', value: followingCount, icon: UserPlus, color: 'text-accent', href: `/${username}/connections` }
                                ].map((stat, i) => (
                                    <Link key={i} href={stat.href} className="bg-card border border-border rounded-[2rem] p-5 text-center hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <stat.icon size={16} className={`${stat.color} mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity`} />
                                        <span className="block text-2xl font-black tracking-tighter text-foreground">{stat.value}</span>
                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">{stat.label}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Estatus Tianguis Premium */}
                            <div className="bg-card border border-border rounded-[3rem] p-10 relative overflow-hidden group hover:border-accent/20 transition-all duration-500">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full pointer-events-none" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 text-muted flex items-center gap-3">
                                    <ShieldCheck size={14} className="text-accent" /> Estatus Tianguis
                                </h3>
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-muted">Suscripción</span>
                                        <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-2xl border transition-all ${profile.nivel_suscripcion === 'premium' || profile.nivel_suscripcion === 'pro' ? 'bg-accent/10 border-accent/30 text-accent shadow-lg shadow-accent/10' : 'bg-foreground/5 border-border text-muted'}`}>
                                            {profile.nivel_suscripcion}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-muted">Identidad</span>
                                        <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-2xl border flex items-center gap-2 transition-all ${profile.esta_verificado ? 'bg-accent/10 border-accent/50 text-accent shadow-lg shadow-accent/10' : 'bg-foreground/5 border-border text-muted'}`}>
                                            {profile.esta_verificado ? (
                                                <><img src="/verified-badge.png" className="w-4 h-4 object-contain" alt="✓" /> Verificado</>
                                            ) : 'Sin verificar'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-muted">Rango</span>
                                        <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-2xl border flex items-center gap-2 transition-all ${profile.es_fundador ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-foreground/5 border-border text-muted'}`}>
                                            {profile.es_fundador ? <><Crown size={12} fill="currentColor" /> Founder</> : 'Sin rango'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Video Destacado (Minimalista) */}
                            {profile.nivel_suscripcion === 'premium' && profile.video_destacado_url && getYouTubeEmbedUrl(profile.video_destacado_url) && (
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted ml-2">Video Destacado</h3>
                                    <div className="rounded-[3rem] overflow-hidden border border-border shadow-2xl aspect-video bg-foreground/5 group relative">
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
                                    <ListMusic size={14} className="text-accent" /> Acerca de mí
                                </h3>

                                {isEditing ? (
                                    <div className="space-y-6">
                                        <div>
                                            <textarea
                                                value={editBio}
                                                maxLength={500}
                                                onChange={(e) => setEditBio(e.target.value.slice(0, 500))}
                                                className="w-full h-40 bg-foreground/5 border border-border focus:border-accent rounded-[2rem] p-6 text-sm font-medium outline-none resize-none text-foreground transition-all"
                                                placeholder="Tu historia comienza aquí..."
                                            />
                                            <div className="flex justify-end mt-2 px-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${editBio.length >= 500 ? 'text-red-500' : 'text-slate-400'}`}>
                                                    {editBio.length}/500 Caracteres
                                                </span>
                                            </div>
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
                                                        className="w-full bg-foreground/5 border border-border focus:border-accent rounded-xl px-4 py-3 text-[10px] font-bold text-foreground outline-none transition-all"
                                                        placeholder="https://instagram.com/tu_perfil"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Link YouTube</label>
                                                    <input
                                                        value={editVerifyYoutube}
                                                        onChange={(e) => setEditVerifyYoutube(e.target.value)}
                                                        className="w-full bg-foreground/5 border border-border focus:border-accent rounded-xl px-4 py-3 text-[10px] font-bold text-foreground outline-none transition-all"
                                                        placeholder="https://youtube.com/@tu_canal"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Link TikTok</label>
                                                    <input
                                                        value={editVerifyTiktok}
                                                        onChange={(e) => setEditVerifyTiktok(e.target.value)}
                                                        className="w-full bg-foreground/5 border border-border focus:border-accent rounded-xl px-4 py-3 text-[10px] font-bold text-foreground outline-none transition-all"
                                                        placeholder="https://tiktok.com/@tu_perfil"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {profile.nivel_suscripcion === 'premium' && (
                                            <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                                                <label className="text-[9px] font-black uppercase text-accent mb-2 block tracking-widest">Link YouTube Destacado (Banner)</label>
                                                <input
                                                    value={editVideoUrl}
                                                    onChange={(e) => setEditVideoUrl(e.target.value)}
                                                    className="w-full bg-foreground/5 border border-border focus:border-accent rounded-xl px-4 py-3 text-[10px] font-bold text-foreground outline-none transition-all"
                                                    placeholder="URL de Video..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 w-full">
                                        {/* Bio Text (Optional/Reduced) */}
                                        {profile.biografia && (
                                            <p className="mb-10 text-xs font-medium text-center text-muted max-w-lg mx-auto line-clamp-3 italic leading-relaxed">
                                                &ldquo;{profile.biografia}&rdquo;
                                            </p>
                                        )}

                                        {/* Social Icons inside About Me Section (below bio) */}
                                        {(profile.enlaces_sociales?.instagram || profile.enlaces_sociales?.youtube || profile.enlaces_sociales?.tiktok) && (
                                            <div className="flex justify-center gap-4 mt-10">
                                                {profile.enlaces_sociales.instagram && (
                                                    <a href={profile.enlaces_sociales.instagram} target="_blank" rel="noopener noreferrer" className="p-4 bg-foreground/5 border border-border rounded-full text-muted hover:text-accent hover:border-accent/30 hover:scale-110 transition-all">
                                                        <Instagram size={20} />
                                                    </a>
                                                )}
                                                {profile.enlaces_sociales.youtube && (
                                                    <a href={profile.enlaces_sociales.youtube} target="_blank" rel="noopener noreferrer" className="p-4 bg-foreground/5 border border-border rounded-full text-muted hover:text-accent hover:border-accent/30 hover:scale-110 transition-all">
                                                        <Youtube size={20} />
                                                    </a>
                                                )}
                                                {profile.enlaces_sociales.tiktok && (
                                                    <a href={profile.enlaces_sociales.tiktok} target="_blank" rel="noopener noreferrer" className="p-4 bg-foreground/5 border border-border rounded-full text-muted hover:text-accent hover:border-accent/30 hover:scale-110 transition-all">
                                                        <Music size={20} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Acerca de mí Card (Independent) */}
                            {(isOwner || profile.enlaces_activos) && (
                                <div className="p-10 rounded-[3rem] border border-border bg-card transition-all duration-500 hover:border-accent/20 hover:scale-[1.01] relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-center gap-3 mb-8">
                                        <Zap size={14} className="text-accent" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Acerca de mí</h4>
                                    </div>

                                    {profile.nivel_suscripcion !== 'premium' && profile.nivel_suscripcion !== 'pro' ? (
                                        <div className="relative group overflow-hidden rounded-[2.5rem] border border-accent/10 bg-gradient-to-br from-accent/5 to-accent/10 dark:from-accent/5 dark:to-accent/10 p-8 transition-all hover:scale-[1.01]">

                                            <div className="relative z-10 flex flex-col items-center text-center gap-6">
                                                <div className="w-16 h-16 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center text-accent shadow-xl border border-slate-100 dark:border-white/5">
                                                    <Link2 size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-foreground text-lg mb-2 tracking-tight">Multi-Link Profesional</h5>
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed">Conecta todas tus redes en una sola tarjeta inteligente</p>
                                                </div>

                                                {isOwner ? (
                                                    <Link
                                                        href="/pricing"
                                                        className="w-full py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-accent/25 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3"
                                                    >
                                                        <Crown size={14} fill="currentColor" /> Desbloquear con Premium
                                                    </Link>
                                                ) : (
                                                    <div className="w-full py-4 bg-foreground/5 border border-border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-muted text-center">
                                                        Exclusivo Premium
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            href={`/${profile.nombre_usuario}/links`}
                                            className="w-full h-24 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-between px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(255,255,255,0.05)] hover:scale-[1.03] active:scale-95 relative overflow-hidden group border border-white/5"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-white/10 dark:bg-slate-900/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                                    <Zap size={24} fill="currentColor" />
                                                </div>
                                                <span className="font-black text-sm">Mi Acerca de mí</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 dark:bg-slate-900/5 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                                <ChevronRight size={20} />
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Feed de Beats (aparece PRIMERO en móvil) ── */}
                        <div className="lg:col-span-8 order-1 lg:order-2">
                            {/* ── Navegación de pestaNas con scroll horizontal en móvil ── */}
                            <div className="flex items-center gap-4 border-b border-border mb-10 overflow-x-auto pb-px no-scrollbar">
                                <div className="flex gap-6 md:gap-10 shrink-0">

                                    {[
                                        { id: 'beats', label: 'Beats', icon: Music },
                                        { id: 'playlists', label: 'Playlists', icon: LayoutGrid },
                                        { id: 'services', label: 'Servicios', icon: Briefcase }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as 'beats' | 'playlists' | 'services' | 'sound_kits')}
                                            className={`relative py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'text-accent' : 'text-muted hover:text-foreground'}`}
                                        >
                                            <tab.icon size={16} />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full animate-in fade-in zoom-in duration-300 shadow-lg shadow-accent/20`} />
                                            )}
                                        </button>
                                    ))}
                                    {/* Link a Sound Kits (Solo si es Premium/Dueño) */}
                                    <button
                                        key="sound_kits"
                                        onClick={() => setActiveTab('sound_kits')}
                                        className={`relative py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === 'sound_kits' ? 'text-accent' : 'text-muted hover:text-accent'}`}
                                    >
                                        <Package size={16} /> Sound Kits
                                        {activeTab === 'sound_kits' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full animate-in fade-in zoom-in duration-300 shadow-lg shadow-accent/20" />
                                        )}
                                    </button>
                                </div>
                            </div>


                            {activeTab === 'beats' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    {/* Section header */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent">Catálogo</span>
                                            </div>
                                            {/* Título de sección de beats compacto en móvil */}
                                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                                                Recién<br />Horneados 🔥
                                            </h2>

                                            <p className="text-[9px] font-bold text-muted uppercase tracking-[0.3em] mt-2">
                                                {beats.length} beats · Más recientes primero
                                            </p>
                                        </div>
                                        <Link href={`/${username}/beats`}
                                            className="group inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-2xl text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground/20 transition-all">
                                            Ver Catálogo Completo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>

                                    {beats.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                            {beats.slice(0, 10).map((beat, idx) => (
                                                <div key={beat.id} className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: `${idx * 40}ms` }}>
                                                    <BeatCardPro beat={beat} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-32 text-center bg-foreground/[0.02] border-2 border-dashed border-border rounded-[3rem]">
                                            <div className="w-20 h-20 bg-foreground/5 border border-border rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-muted">
                                                <Music size={32} strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">Sin beats todavía</h3>
                                            <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] max-w-[220px] mx-auto leading-relaxed">
                                                Este productor aún no ha publicado sus obras maestras
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'services' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <div className="pb-6 border-b border-border mb-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted">Oferta</span>
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">Servicios<br />Profesionales</h2>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-[0.3em] mt-2">Contrata talento experto para tu próximo hit</p>
                                    </div>

                                    {/* Owner Upsell for Non-Premium (Services) */}
                                    {profile.nivel_suscripcion !== 'premium' ? (
                                        <div className="rounded-[3rem] p-12 text-center overflow-hidden relative group border border-border bg-card transition-all duration-700 hover:scale-[1.01]">
                                            <div className="absolute top-0 right-0 p-48 bg-purple-600/5 blur-[150px] rounded-full group-hover:bg-purple-600/10 transition-all pointer-events-none" />
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 bg-accent/10 border border-accent/20">
                                                    <Briefcase size={32} className="text-accent" />
                                                </div>
                                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-foreground">Servicios Profesionales</h3>
                                                <p className="max-w-lg mx-auto mb-8 text-sm font-medium leading-relaxed text-muted">
                                                    {isOwner
                                                        ? "Ofrece servicios de Mezcla, Masterización, Composición o Clases. Disponible para cuentas Premium."
                                                        : "Este usuario aún no ofrece servicios profesionales. Los servicios se desbloquean al mejorar el plan."}
                                                </p>
                                                {isOwner ? (
                                                    <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] bg-accent text-white hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95">
                                                        <Crown size={14} fill="currentColor" /> Mejorar a Premium
                                                    </Link>
                                                ) : (
                                                    <div className="py-2.5 px-6 bg-foreground/5 border border-border rounded-full inline-block text-[9px] font-black uppercase tracking-widest text-muted">
                                                        Servicios no disponibles
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                                            {services.length > 0 ? (
                                                services.map(service => (
                                                    <div key={service.id} className={`p-10 rounded-[2.5rem] border shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl group relative overflow-hidden backdrop-blur-md 
                                                        ${profile.tema_perfil === 'dark' || profile.tema_perfil === 'neon' || profile.tema_perfil === 'gold' ?
                                                            'bg-slate-900/60 border-white/5 text-white' :
                                                            'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/5 text-slate-900 dark:text-white'
                                                        }`}>
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="flex justify-between items-start mb-6">
                                                            <span className="bg-accent/10 text-accent px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-accent/20">
                                                                {service.tipo_servicio === 'beat_custom' ? 'Beat a Medida' :
                                                                    service.tipo_servicio === 'mentor' ? 'Mentoría / Clase' :
                                                                        service.tipo_servicio === 'mixing' ? 'Mezcla y Masterización' :
                                                                            service.tipo_servicio?.replace(/_/g, ' ') || service.tipo_servicio}
                                                            </span>
                                                            <span className="text-2xl font-black text-slate-900 dark:text-white">${service.precio}</span>
                                                        </div>
                                                        <h3 className="font-black text-xl mb-3 group-hover:text-purple-500 transition-colors text-slate-900 dark:text-white">{service.titulo}</h3>
                                                        <p className="text-xs mb-8 line-clamp-3 leading-relaxed font-medium text-slate-500 dark:text-slate-300">{service.descripcion}</p>

                                                        <div className={`flex items-center justify-between pt-6 border-t ${profile.tema_perfil === 'light' ? 'border-slate-100' : 'border-white/10'}`}>
                                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest">
                                                                <Clock size={16} className="text-accent" />
                                                                {service.tiempo_entrega_dias} Días hábiles
                                                            </div>
                                                            {isOwner ? (
                                                                <Link
                                                                    href={`/studio/services?edit_service=${service.id}`}
                                                                    className="bg-accent/10 text-accent px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-accent/20 hover:bg-accent hover:text-white transition-all shadow-xl shadow-accent/10 active:scale-95 flex items-center gap-2"
                                                                >
                                                                    <Edit3 size={14} /> Editar
                                                                </Link>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAddToCart(service, 'service')}
                                                                    className="bg-accent text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border border-accent/20 hover:bg-accent/90 transition-all shadow-xl shadow-accent/10 active:scale-95"
                                                                >
                                                                    Contratar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-24 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-[#0a0a0f] dark:to-[#050508] rounded-[3rem] border border-slate-100 dark:border-white/5 text-center flex flex-col items-center justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                                    <div className="relative z-10">
                                                        <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-soft border border-slate-50 dark:border-white/5">
                                                            <Briefcase size={40} className="text-accent opacity-60" />
                                                        </div>
                                                        <h3 className="text-2xl font-black uppercase text-slate-900 dark:text-white mb-3 tracking-tighter">Aún no hay servicios</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed mb-8">Este productor aún no ha publicado servicios profesionales</p>
                                                        {isOwner && (
                                                            <Link
                                                                href="/studio/services"
                                                                className="px-12 py-5 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-accent/20"
                                                            >
                                                                Crea tu primer servicio
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
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
                                                className="px-8 py-4 bg-accent/5 dark:bg-accent/10 text-accent dark:text-accent border border-accent/10 dark:border-accent/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-3 shadow-sm hover:shadow-xl hover:shadow-accent/10 active:scale-95"
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
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Cambiar orden de aparición</h3>
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
                                                username={username}
                                                onEdit={(id) => {
                                                    const pl = playlists.find(p => p.id === id);
                                                    setEditingPlaylist(pl);
                                                    setIsPlaylistModalOpen(true);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="empty-state-card mt-12 bg-card text-center flex flex-col items-center justify-center">
                                            {profile.tema_perfil !== 'light' && (
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                                            )}
                                            <div className="relative inline-block mb-10">
                                                <div className={`absolute inset-0 blur-[60px] rounded-full scale-[2.5] ${profile.tema_perfil !== 'light' ? 'bg-accent/10' : 'bg-accent/5'}`} />
                                                <div className={`relative w-32 h-32 rounded-[3.5rem] flex items-center justify-center mx-auto border shadow-inner ${profile.tema_perfil !== 'light' ? 'bg-[#0a0a0f] border-white/10' : 'bg-white border-slate-200'}`}>
                                                    <ListMusic size={48} className="text-accent opacity-60" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-foreground text-center">
                                                {isOwner ? "Sube tu primera playlist" : "Este productor aún no ha creado playlists"}
                                            </h3>
                                        </div>
                                    )}

                                </div>
                            )}

                            {activeTab === 'sound_kits' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <div className="pb-6 border-b border-border mb-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted">Librería</span>
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">Sound<br />Kits</h2>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-[0.3em] mt-2">Librerías de sonidos oficiales y presets</p>
                                    </div>

                                    {/* Owner Upsell for Non-Premium */}
                                    {profile.nivel_suscripcion !== 'premium' ? (
                                        <div className="rounded-[3rem] p-12 text-center overflow-hidden relative group border border-border bg-card transition-all duration-700 hover:scale-[1.01]">
                                            <div className="absolute top-0 right-0 p-48 bg-amber-500/5 blur-[150px] rounded-full group-hover:bg-amber-500/10 transition-all pointer-events-none" />
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 bg-amber-500/10 border border-amber-500/20">
                                                    <Package size={32} className="text-amber-500" />
                                                </div>
                                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-foreground">Librerías de Sonido</h3>
                                                <p className="max-w-lg mx-auto mb-8 text-sm font-medium leading-relaxed text-muted">
                                                    {isOwner
                                                        ? "Vende tus Sample Packs, Drum Kits y Presets directamente desde tu perfil. Disponible para cuentas Premium."
                                                        : "Este productor no cuenta con Premium para vender Sound Kits."}
                                                </p>
                                                {isOwner ? (
                                                    <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] bg-amber-500 text-white hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 active:scale-95">
                                                        <Zap size={14} fill="currentColor" /> Mejorar a Premium
                                                    </Link>
                                                ) : (
                                                    <div className="py-2.5 px-6 bg-foreground/5 border border-border rounded-full inline-block text-[9px] font-black uppercase tracking-widest text-muted">
                                                        Sound Kits no disponibles
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Logic for Visitors OR Premium Owner */}
                                            {soundKits.length === 0 ? (
                                                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-[#0a0a0f] dark:to-[#050508] rounded-[3rem] p-24 text-center border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -mr-32 -mt-32 group-hover:bg-amber-500/10 transition-all duration-700" />
                                                    <div className="relative z-10">
                                                        <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-soft border border-slate-50 dark:border-white/5">
                                                            <Package size={40} className="text-accent opacity-60" />
                                                        </div>
                                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3">
                                                            {isOwner ? "Sube tu primera librería" : "Aún no hay Sound Kits"}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed mb-8">Este productor aún no ha publicado librerías de sonidos</p>
                                                        {isOwner && (
                                                            <Link href="/studio/services" className="bg-accent text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all inline-block shadow-xl shadow-accent/20 mx-auto">
                                                                Subir mi primer Kit
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {soundKits.map(kit => (
                                                        <div key={kit.id} className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] hover:shadow-xl group backdrop-blur-md 
                                                            ${profile.tema_perfil === 'dark' || profile.tema_perfil === 'neon' || profile.tema_perfil === 'gold' ?
                                                                'bg-slate-900/60 border-white/5 text-white' :
                                                                'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/5 text-slate-900 dark:text-white'
                                                            }`}>
                                                            <div className="aspect-square bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                                                                {kit.cover_url ? (
                                                                    <img src={kit.cover_url} className="w-full h-full object-cover transition-transform duration-500" alt={kit.title} />
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
                                                                            className="bg-accent/10 text-accent px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-accent hover:text-white transition-all flex items-center gap-2 shadow-sm border border-accent/20 active:scale-95"
                                                                        >
                                                                            <Edit3 size={12} /> Editar
                                                                        </Link>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleAddToCart(kit, 'sound_kit')}
                                                                        className="w-full bg-accent text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:bg-accent/90 group/btn"
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
                    </div >
                </div >

                {isOwner && profile && (
                    <PlaylistManagerModal
                        isOpen={isPlaylistModalOpen}
                        onClose={() => setIsPlaylistModalOpen(false)}
                        producerId={profile.id}
                        existingPlaylist={editingPlaylist}
                        allBeats={beats}
                        onSuccess={fetchAll}
                    />
                )
                }
            </main >

            {/* Fan Capture Popup */}
            {
                showFanCapture && profile?.boletin_activo && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
                        <div className="bg-white dark:bg-[#08080a] w-full max-w-lg rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl border border-white/5">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                            <button
                                onClick={() => setShowFanCapture(false)}
                                className="absolute top-0 right-0 p-6 z-50 text-muted hover:text-accent transition-all flex items-center justify-center group"
                                aria-label="Cerrar modal"
                            >
                                <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                    <Plus size={24} className="rotate-45" />
                                </div>
                            </button>

                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent">
                                    <Mail size={32} />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-4">Únete al <span className="text-accent">Círculo Exclusivo</span></h2>
                                <p className="text-sm text-muted font-medium mb-8 leading-relaxed">
                                    Suscríbete para recibir beats exclusivos, cupones de descuento y noticias directas de <span className="text-foreground font-bold">{profile.nombre_artistico}</span>.
                                </p>

                                <form className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="tu@email.com"
                                        className="w-full h-14 bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 text-sm font-bold outline-none focus:border-accent transition-all"
                                        required
                                    />
                                    <button className="w-full h-14 bg-accent text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-accent/20">
                                        Suscribirme Ahora
                                    </button>
                                </form>
                                <p className="mt-6 text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">Zero spam. Solo promociones.</p>
                            </div>
                        </div>
                    </div>
                )
            }

            <Footer />
        </div >
    );
}
