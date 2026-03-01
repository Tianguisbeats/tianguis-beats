"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Check, Instagram, Youtube, Twitter,
    Share2, MoreHorizontal, Calendar, MapPin,
    Music, Play, Users, Crown, Settings, Camera,
    Edit3, CheckCircle2, Copy, Trash2, Layout, PlayCircle,
    BarChart2, ShieldCheck, Globe, Zap, Loader2, UserPlus, UserCheck, LayoutGrid, ListMusic, Plus, MoveVertical, Save, ChevronUp, ChevronDown, List, Briefcase, Clock, DollarSign, Package, MessageSquare, Mail, ShoppingBag, Link2, UserMinus
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

                // 3. Get Playlists (owner sees private ones too)
                let plQuery = supabase
                    .from('listas_reproduccion')
                    .select('id, nombre, es_publica, fecha_creacion')
                    .eq('usuario_id', profileData.id)
                    .order('fecha_creacion', { ascending: true });

                if (currentUserId !== profileData.id) {
                    plQuery = plQuery.eq('es_publica', true);
                }

                const { data: playlistsRaw } = await plQuery;

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
                        let finalCoverUrl = kit.url_portada?.startsWith('http')
                            ? kit.url_portada
                            : kit.url_portada
                                ? supabase.storage.from('portadas_kits_sonido').getPublicUrl(kit.url_portada).data.publicUrl
                                : null;
                        return { ...kit, cover_url: finalCoverUrl };
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-lg shadow-accent/20" />
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent animate-pulse">Cargando Tianguis</p>
                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest mt-2">Sintonizando frecuencias...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                            className="w-full h-full object-cover pointer-events-none transition-opacity duration-700"
                            style={{ objectPosition: `center ${isAdjustingCover ? tempOffset : (profile.ajuste_portada ?? 50)}%` }}
                            alt="Cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-background to-slate-100 dark:to-slate-900 flex items-center justify-center text-muted/20">
                            <Camera size={64} strokeWidth={1} />
                        </div>
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
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-24 md:-mt-44 mb-10 md:mb-16">
                        {/* Avatar — más pequeño en móvil para no dominar la pantalla */}
                        <div className="relative group shrink-0">

                            {/* Glow Effect */}
                            <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700 bg-accent`} />

                            {/* Borde del avatar según nivel de suscripción */}
                            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-[5px] shadow-2xl overflow-hidden transition-all duration-700 bg-background relative z-10 ${profile.nivel_suscripcion?.toLowerCase()?.trim() === 'premium'
                                ? 'border-[#00f2ff] ring-4 ring-[#00f2ff]/20 shadow-[#00f2ff]/30'
                                : profile.es_fundador
                                    ? 'border-amber-500 ring-4 ring-amber-500/20 shadow-amber-500/30'
                                    : profile.nivel_suscripcion?.toLowerCase()?.trim() === 'pro'
                                        ? 'border-amber-500 ring-4 ring-amber-500/20 shadow-amber-500/30'
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
                        <div className="flex-1 w-full relative">
                            {/* Contenedor Flex Principal: Todo el Header */}
                            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 w-full mt-4 md:mt-0">

                                {/* Columna Izquierda: Nombre, Detalles y Bio (Desplazado hacia abajo y a la derecha en desktop) */}
                                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-4 md:mt-24 md:pl-8">
                                    <div className="space-y-6 w-full max-w-4xl mx-auto md:mx-0">
                                        {/* Nombre artístico y Badges */}
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-foreground drop-shadow-sm">
                                                {profile.nombre_artistico || profile.nombre_usuario}
                                            </h1>
                                            <div className="flex items-center gap-3">
                                                {profile.esta_verificado && (
                                                    <img src="/verified-badge.png" alt="Verificado" className="w-8 h-8 md:w-10 md:h-10 object-contain hover:scale-110 transition-transform cursor-help shadow-accent/20 shadow-2xl" title="Verificado" />
                                                )}
                                                {profile.es_fundador && (
                                                    <div className="flex items-center justify-center text-amber-500 hover:rotate-12 transition-transform cursor-help" title="Founder">
                                                        <Crown className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Detalles (Usuario, País, Fecha, Redes Sociales) */}
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted md:pl-2">
                                            <span className="text-accent underline decoration-2 underline-offset-4">@{profile.nombre_usuario}</span>
                                            <span className="opacity-20 hidden md:inline">|</span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-accent" />
                                                    <select
                                                        value={editCountry}
                                                        onChange={(e) => setEditCountry(e.target.value)}
                                                        className="bg-accent/5 rounded-lg px-2 py-1 text-accent outline-none border border-accent/20 transition-all focus:border-accent"
                                                    >
                                                        <option value="">Tu país</option>
                                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            ) : (
                                                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-accent" /> {profile.pais || (isOwner ? "Agrega tu país" : "México")}</span>
                                            )}
                                            <span className="opacity-20 hidden md:inline">|</span>
                                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {profile.fecha_creacion ? new Date(profile.fecha_creacion).getFullYear() : '2025'}</span>

                                            {/* SOCIAL ICONS ALONGSIDE YEAR */}
                                            <div className="flex items-center gap-4 md:ml-2 md:pl-4 md:border-l border-border/40">
                                                {SOCIAL_KEYS.map(key => {
                                                    const val = profile.enlaces_sociales?.[key as keyof typeof profile.enlaces_sociales];
                                                    if (!val) return null;
                                                    const SocialIcon = SOCIAL_ICONS[key].icon;
                                                    return (
                                                        <a key={key} href={val} target="_blank" rel="noopener noreferrer" className={`transition-all hover:scale-125 ${SOCIAL_ICONS[key].color}`}>
                                                            {SocialIcon ? <SocialIcon size={14} /> : (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d={SOCIAL_ICONS[key].path} />
                                                                </svg>
                                                            )}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* BIO ALIGNED */}
                                        {!isEditing && profile.biografia && (
                                            <div className="max-w-3xl md:ml-0 md:mr-auto py-2 md:pl-2">
                                                <p className="text-sm md:text-base font-medium text-muted leading-relaxed text-center md:text-left italic opacity-80">
                                                    &ldquo;{profile.biografia}&rdquo;
                                                </p>
                                            </div>
                                        )}
                                        {isEditing && (
                                            <div className="max-w-2xl md:ml-0 md:mr-auto space-y-4 md:pl-2">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Tu descripción</label>
                                                    <textarea
                                                        value={editBio}
                                                        maxLength={160}
                                                        onChange={(e) => setEditBio(e.target.value)}
                                                        className="w-full bg-foreground/5 border border-border focus:border-accent rounded-2xl p-4 text-sm font-medium outline-none resize-none text-center md:text-left"
                                                        placeholder="Tu biografía corta y poderosa..."
                                                    />
                                                    <p className="text-[8px] font-black text-muted uppercase mt-1 text-right">{editBio.length}/160</p>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {['instagram', 'youtube', 'tiktok'].map(key => (
                                                        <div key={key} className="space-y-1.5">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-muted block capitalize">{key}</label>
                                                            <input
                                                                type="text"
                                                                value={editSocials[key] || ''}
                                                                onChange={(e) => setEditSocials({ ...editSocials, [key]: e.target.value })}
                                                                placeholder={`URL de ${key}`}
                                                                className="w-full bg-foreground/5 border border-border focus:border-accent rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Columna Derecha: Botón de Acción Desktop AHORA AL FINAL DE LA FILA */}
                                <div className="hidden md:flex shrink-0 items-start justify-end ml-auto mt-4 md:mt-24">
                                    {isOwner ? (
                                        <button
                                            onClick={() => isEditing ? (hasChanges() ? handleUpdateProfile() : setIsEditing(false)) : setIsEditing(true)}
                                            className={`h-12 sm:h-14 px-8 sm:px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${isEditing ? 'bg-foreground dark:bg-white text-background dark:text-slate-900 border-2 border-accent' : 'bg-card text-foreground border border-border hover:shadow-2xl hover:-translate-y-1 hover:border-accent/50'}`}
                                        >
                                            {isEditing ? (hasChanges() ? <><Save size={16} /> Guardar</> : 'Cerrar') : <><Edit3 size={16} /> Editar Perfil</>}
                                        </button>
                                    ) : currentUserId ? (
                                        <button
                                            onClick={handleFollowToggle}
                                            className={`h-12 sm:h-14 px-8 sm:px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${isFollowing ? 'bg-foreground/5 text-foreground border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30' : 'bg-foreground text-background hover:-translate-y-1 hover:shadow-2xl'}`}
                                        >
                                            {isFollowing ? <><UserMinus size={16} /> Dejar de seguir</> : <><UserPlus size={16} /> Seguir</>}
                                        </button>
                                    ) : null}
                                </div>

                                {/* Acciones en Móvil (Ocultas en Desktop ya que se movieron arriba a la derecha) */}
                                <div className="flex md:hidden shrink-0 items-center justify-center w-full mt-6">
                                    {isOwner ? (
                                        <button
                                            onClick={() => isEditing ? (hasChanges() ? handleUpdateProfile() : setIsEditing(false)) : setIsEditing(true)}
                                            className={`h-12 sm:h-14 px-8 sm:px-10 w-full sm:w-auto rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${isEditing ? 'bg-foreground dark:bg-white text-background dark:text-slate-900 border-2 border-accent' : 'bg-card text-foreground border border-border hover:shadow-2xl hover:-translate-y-1 hover:border-accent/50'}`}
                                        >
                                            {isEditing ? (hasChanges() ? <><Save size={16} /> Guardar</> : 'Cerrar') : <><Edit3 size={16} /> Editar Perfil</>}
                                        </button>
                                    ) : currentUserId ? (
                                        <button
                                            onClick={handleFollowToggle}
                                            className={`h-12 sm:h-14 px-8 sm:px-10 w-full sm:w-auto rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${isFollowing ? 'bg-foreground/5 text-foreground border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30' : 'bg-foreground text-background hover:-translate-y-1 hover:shadow-2xl'}`}
                                        >
                                            {isFollowing ? <><UserMinus size={16} /> Dejar de seguir</> : <><UserPlus size={16} /> Seguir</>}
                                        </button>
                                    ) : null}
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
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="pb-6 border-b border-border mb-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent">Servicios</span>
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">Mis<br />Servicios</h2>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-[0.3em] mt-2">Colaboraciones y servicios profesionales</p>
                                    </div>

                                    {/* Mensaje de mejora para usuarios no premium (Servicios) */}
                                    {profile.nivel_suscripcion !== 'premium' ? (
                                        <div className="rounded-[3.5rem] p-12 text-center overflow-hidden relative group border border-border bg-card transition-all duration-700 hover:scale-[1.01]">
                                            <div className="absolute top-0 right-0 p-48 bg-accent/5 blur-[150px] rounded-full group-hover:bg-accent/10 transition-all pointer-events-none" />
                                            <div className="relative z-10">
                                                <div className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 bg-accent/10 border border-accent/20">
                                                    <Briefcase size={32} className="text-accent" />
                                                </div>
                                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-foreground">Servicios de Productor</h3>
                                                <p className="max-w-lg mx-auto mb-8 text-sm font-medium leading-relaxed text-muted">
                                                    {isOwner
                                                        ? "Ofrece servicios de mezcla, máster y producciones personalizadas directamente en tu perfil. Disponible para cuentas Premium."
                                                        : "Este productor no cuenta con Premium para ofrecer servicios adicionales."}
                                                </p>
                                                {isOwner ? (
                                                    <Link href="/pricing" className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-accent text-white hover:opacity-90 transition-all shadow-xl shadow-accent/20 active:scale-95">
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {services.length > 0 ? (
                                                services.map((service) => (
                                                    <div key={service.id} className="group bg-card border border-border rounded-[2.5rem] p-8 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 transition-all relative overflow-hidden flex flex-col h-full">
                                                        <div className="relative z-10">
                                                            <div className="flex items-center justify-between mb-8">
                                                                <div className="px-5 py-2 bg-foreground/5 rounded-full text-[9px] font-black uppercase tracking-widest text-muted border border-border line-clamp-1 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                                                    {service.tipo_servicio === 'mixing_mastering' ? 'Mezcla y Master' : service.tipo_servicio === 'custom_beat' ? 'Beat Personalizado' : service.tipo_servicio || 'Servicio'}
                                                                </div>
                                                                <div className="text-2xl font-black text-foreground tracking-tighter">
                                                                    ${service.precio} <span className="text-[10px] text-muted uppercase tracking-widest ml-1">MXN</span>
                                                                </div>
                                                            </div>
                                                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-4 leading-tight group-hover:text-accent transition-colors">
                                                                {service.titulo}
                                                            </h3>
                                                            <p className="text-sm font-medium text-muted mb-8 line-clamp-3 leading-relaxed">
                                                                {service.descripcion}
                                                            </p>
                                                        </div>
                                                        <div className="mt-auto flex items-center justify-between gap-4 pt-6 border-t border-border/50">
                                                            {isOwner ? (
                                                                <Link
                                                                    href={`/studio/services?edit=${service.id}`}
                                                                    className="w-full py-4 bg-foreground/5 text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center justify-center gap-3 active:scale-95"
                                                                >
                                                                    <Edit3 size={14} /> Editar Servicio
                                                                </Link>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAddToCart(service, 'service')}
                                                                    className="w-full py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-3 active:scale-95"
                                                                >
                                                                    <ShoppingBag size={14} /> Contratar Ahora
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-20 bg-foreground/[0.02] border border-border rounded-[3rem] text-center flex flex-col items-center justify-center">
                                                    <div className="w-20 h-20 bg-card rounded-[2rem] border border-border flex items-center justify-center mb-6 text-muted">
                                                        <Briefcase size={32} strokeWidth={1.5} />
                                                    </div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">Servicios no disponibles</h3>
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-8">El productor no ha publicado servicios aún</p>
                                                    {isOwner && (
                                                        <Link href="/studio/services" className="px-10 py-4 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-accent/20">
                                                            Crear mi primer servicio
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'playlists' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    {/* SECCIÓN DE PLAYLISTS */}
                                    {isOwner && (
                                        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 py-6 px-4 bg-foreground/[0.03] border border-border rounded-[2rem]">
                                            <button
                                                onClick={() => {
                                                    setEditingPlaylist(null);
                                                    setIsPlaylistModalOpen(true);
                                                }}
                                                className="px-8 py-4 bg-accent text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/10 active:scale-95"
                                            >
                                                <Plus size={16} /> Nueva Playlist
                                            </button>

                                            <button
                                                onClick={() => setIsReordering(!isReordering)}
                                                className={`px-8 py-4 border rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95 ${isReordering ? 'bg-foreground text-background border-foreground shadow-xl' : 'bg-card border-border text-muted hover:text-foreground hover:border-foreground/20'}`}
                                            >
                                                {isReordering ? <><Check size={16} /> Finalizar</> : <><MoveVertical size={16} /> Organizar</>}
                                            </button>
                                        </div>
                                    )}

                                    {isReordering && (
                                        <div className="mt-8 p-6 bg-accent/[0.03] rounded-[2rem] border border-accent/20 animate-in fade-in slide-in-from-top-4">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                                                    <MoveVertical size={14} /> Cambiar Orden
                                                </h3>
                                                <span className="text-[8px] font-bold text-muted uppercase">Manual</span>
                                            </div>
                                            <div className="space-y-3">
                                                {playlists.map((pl, idx) => (
                                                    <div key={pl.id} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-[10px] font-black text-muted shrink-0">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-foreground truncate">{pl.name}</span>
                                                        </div>
                                                        <div className="flex gap-2 shrink-0">
                                                            <button
                                                                disabled={idx === 0}
                                                                onClick={async () => {
                                                                    const newPlaylists = [...playlists];
                                                                    [newPlaylists[idx], newPlaylists[idx - 1]] = [newPlaylists[idx - 1], newPlaylists[idx]];
                                                                    setPlaylists(newPlaylists);
                                                                    setHasChangedOrder(true);
                                                                }}
                                                                className="p-2.5 bg-foreground/5 hover:bg-accent hover:text-white rounded-xl text-muted disabled:opacity-10 transition-all"
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
                                                                className="p-2.5 bg-foreground/5 hover:bg-accent hover:text-white rounded-xl text-muted disabled:opacity-10 transition-all"
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
                                        <div className="empty-state-card mt-12 bg-card text-center flex flex-col items-center justify-center pb-20 pt-20 border border-border rounded-[2.5rem]">
                                            <div className="w-20 h-20 bg-foreground/5 border border-border rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-muted">
                                                <ListMusic size={32} strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">
                                                {isOwner ? "Sube tu primera playlist" : "Sin playlists todavía"}
                                            </h3>
                                            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-8">
                                                Las mejores colecciones de beats
                                            </p>
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
                                            {soundKits.length === 0 ? (
                                                <div className="bg-foreground/[0.02] border border-border rounded-[3rem] p-20 text-center flex flex-col items-center justify-center">
                                                    <div className="w-20 h-20 bg-card border border-border rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-muted">
                                                        <Package size={32} strokeWidth={1.5} />
                                                    </div>
                                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">
                                                        {isOwner ? "Sube tu primera librería" : "Aún no hay Sound Kits"}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-8">Librerías de sonidos profesionales</p>
                                                    {isOwner && (
                                                        <Link href="/studio/services" className="bg-accent text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-accent/20">
                                                            Subir mi primer Kit
                                                        </Link>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {soundKits.map(kit => (
                                                        <div key={kit.id} className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.01] hover:shadow-xl group backdrop-blur-md 
                                                            ${profile.tema_perfil === 'dark' || profile.tema_perfil === 'neon' || profile.tema_perfil === 'gold' ?
                                                                'bg-slate-900/60 border-white/5 text-white' :
                                                                'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/5 text-slate-900 dark:text-white'
                                                            }`}>
                                                            <div className="aspect-square bg-foreground/5 rounded-2xl mb-4 overflow-hidden relative">
                                                                {kit.cover_url ? (
                                                                    <img src={kit.cover_url} className="w-full h-full object-cover transition-transform duration-500" alt={kit.title} />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-muted/20">
                                                                        <Package size={48} strokeWidth={1} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-bold text-lg mb-1 group-hover:text-accent transition-colors line-clamp-1 text-foreground">{kit.titulo}</h3>
                                                            </div>
                                                            <p className="text-xs mb-4 line-clamp-2 text-muted">{kit.descripcion}</p>
                                                            <div className={`flex items-center justify-between pt-4 border-t ${profile.tema_perfil === 'light' ? 'border-slate-50' : 'border-white/10'}`}>
                                                                {isOwner ? (
                                                                    <>
                                                                        <span className="text-lg font-black text-foreground">${kit.precio} MXN</span>
                                                                        <Link
                                                                            href={`/studio/services?edit_kit=${kit.id}`}
                                                                            className="bg-foreground/5 text-foreground px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-foreground hover:text-background transition-all flex items-center gap-2 border border-border active:scale-95"
                                                                        >
                                                                            <Edit3 size={12} /> Editar
                                                                        </Link>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleAddToCart(kit, 'sound_kit')}
                                                                        className="w-full bg-accent text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-95"
                                                                    >
                                                                        Comprar ${kit.precio}
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
                </div >
            </main >

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
