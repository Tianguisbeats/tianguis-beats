"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
    Play, Pause, Heart, Share2, Music2, Instagram, Twitter, Youtube,
    Globe, MapPin, MessageCircle, CheckCircle2, Zap, Package, Edit3,
    Crown, ArrowRight, Layers, Sparkles, Flag, ShoppingBag, ExternalLink,
    Clock, Star, Search, Info, User, Camera, Save, Loader2, Facebook,
    Plus, ListMusic, Lock, Send, Trash2, SmilePlus
} from 'lucide-react';

function TikTokIcon({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 448 512" fill="currentColor">
            <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z"/>
        </svg>
    );
}
import { COUNTRIES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import {
    COLUMNAS_PERFIL_PUBLICO,
    COLUMNAS_PERFIL_MINIMO,
    COLUMNAS_BEAT_PUBLICO,
    COLUMNAS_KIT_PUBLICO,
    COLUMNAS_SERVICIO_PUBLICO,
} from '@/lib/db-columns';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import BeatCardPro from '@/components/explore/BeatCardPro';
import LikeSoundKitButton from '@/components/LikeSoundKitButton';
import SoundKitHorizontalCard from '@/components/SoundKitHorizontalCard';
import { AbstractPuzzleBack, NoiseOverlay } from '@/components/ui/BackgroundEffects';
import { motion, AnimatePresence } from 'framer-motion';
import PlaylistManagerModal from '@/components/PlaylistManagerModal';
import PlaylistCover from '@/components/PlaylistCover';

type TabId = 'beats' | 'kits' | 'playlists' | 'likes' | 'followers' | 'following' | 'comentarios' | 'info';

const PROFILE_LIMITS = {
    beats: 48,
    kits: 48,
    services: 24,
    playlists: 24,
    likes: 48,
    follows: 60,
    myFollows: 500,
    wallPosts: 80,
};

export default function ProducerProfilePage() {
    const { username } = useParams();
    const router = useRouter();
    const { currentBeat, isPlaying, playBeat, likedBeatIds } = usePlayer();
    const [user, setUser] = useState<any>(null);
    const { addItem } = useCart();
    const { showToast } = useToast();
    const prevLikedIds = useRef<Set<string>>(new Set());

    const [profile, setProfile] = useState<any>(null);
    const [beats, setBeats] = useState<any[]>([]);
    const [soundKits, setSoundKits] = useState<any[]>([]);
    const [servicios, setServicios] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [likedBeats, setLikedBeats] = useState<any[]>([]);
    const [likedKits, setLikedKits] = useState<any[]>([]);
    const [likedServicios, setLikedServicios] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('beats');
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followers, setFollowers] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [userFollowingSet, setUserFollowingSet] = useState<Set<string>>(new Set());
    const [isFollowing, setIsFollowing] = useState(false);

    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    const bannerInputRef = React.useRef<HTMLInputElement>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAdjustingBanner, setIsAdjustingBanner] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [bannerOffset, setBannerOffset] = useState(0);
    const [startY, setStartY] = useState(0);
    
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<any>(null);

    // Wall posts
    const [wallPosts, setWallPosts] = useState<any[]>([]);
    const [wallLoading, setWallLoading] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const isOwner = user?.id === profile?.id;

    const [formData, setFormData] = useState({
        nombre_artistico: '',
        biografia: '',
        pais: '',
        instagram_url: '',
        youtube_url: '',
        tiktok_url: '',
    });

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            setUser(data.user);
            if (data.user) {
                const { data: prof } = await supabase.from('perfiles').select('foto_perfil').eq('id', data.user.id).single();
                if (prof) setCurrentUserProfile(prof);
            }
        });
    }, []);

    const resolveStorageUrl = (path: string | null | undefined, bucket: string): string | null => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return publicUrl;
    };

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const { data: rawProfile, error } = await supabase
                .from('perfiles').select(COLUMNAS_PERFIL_PUBLICO).eq('nombre_usuario', username).single();
            if (error || !rawProfile) { router.push('/'); return; }
            const profileData: any = rawProfile;

            // Resolver URLs correctamente
            profileData.foto_perfil = resolveStorageUrl(profileData.foto_perfil, 'fotos_perfil');
            profileData.banner_url = resolveStorageUrl(profileData.portada_perfil, 'fotos_portada')
                || resolveStorageUrl(profileData.banner_url, 'fotos_portada');

            setProfile(profileData);
            
            const socialsJson = profileData.enlaces_sociales || {};
            setBannerOffset(profileData.ajuste_portada || 0);
            
            setFormData({
                nombre_artistico: profileData.nombre_artistico || '',
                biografia: profileData.biografia || '',
                pais: profileData.pais || '',
                instagram_url: socialsJson.instagram || profileData.verificacion_instagram || '',
                youtube_url: socialsJson.youtube || profileData.verificacion_youtube || '',
                tiktok_url: socialsJson.tiktok || profileData.verificacion_tiktok || '',
            });

            const isUserOwner = user?.id === profileData.id;

            const [beatsR, kitsR, serviciosR, plR, lbR, lkR, lsR, followsR, followingR, isFollowingR] = await Promise.all([
                supabase.from('beats').select(`${COLUMNAS_BEAT_PUBLICO}, productor:perfiles(${COLUMNAS_PERFIL_MINIMO})`).eq('productor_id', profileData.id).eq('es_publico', true).order('fecha_creacion', { ascending: false }).limit(PROFILE_LIMITS.beats),
                supabase.from('kits_sonido').select(`${COLUMNAS_KIT_PUBLICO}, productor:perfiles(${COLUMNAS_PERFIL_MINIMO})`).eq('productor_id', profileData.id).eq('es_publico', true).order('fecha_creacion', { ascending: false }).limit(PROFILE_LIMITS.kits),
                supabase.from('servicios').select(COLUMNAS_SERVICIO_PUBLICO).eq('productor_id', profileData.id).eq('es_activo', true).order('fecha_creacion', { ascending: false }).limit(PROFILE_LIMITS.services),
                supabase.from('listas_reproduccion').select('id, nombre, es_publica, fecha_creacion, items:listas_reproduccion_items(*, beat:beats(id, titulo, portada_url))').eq('usuario_id', profileData.id).order('fecha_creacion', { ascending: false }).limit(PROFILE_LIMITS.playlists),
                supabase.from('favoritos').select(`id, beat:beats(${COLUMNAS_BEAT_PUBLICO}, productor:perfiles(${COLUMNAS_PERFIL_MINIMO}))`).eq('usuario_id', profileData.id).not('beat_id', 'is', null).limit(PROFILE_LIMITS.likes),
                supabase.from('favoritos').select(`id, kit:kits_sonido(${COLUMNAS_KIT_PUBLICO}, productor:perfiles(${COLUMNAS_PERFIL_MINIMO}))`).eq('usuario_id', profileData.id).not('kit_id', 'is', null).limit(PROFILE_LIMITS.likes),
                supabase.from('favoritos').select(`id, servicio:servicios(${COLUMNAS_SERVICIO_PUBLICO})`).eq('usuario_id', profileData.id).not('servicio_id', 'is', null).limit(PROFILE_LIMITS.likes),
                supabase.from('seguidores').select('seguido_id', { count: 'exact', head: true }).eq('seguido_id', profileData.id),
                supabase.from('seguidores').select('seguidor_id', { count: 'exact', head: true }).eq('seguidor_id', profileData.id),
                user ? supabase.from('seguidores').select('seguidor_id, seguido_id').eq('seguidor_id', user.id).eq('seguido_id', profileData.id).maybeSingle() : Promise.resolve({ data: null })
            ]);

                setFollowersCount(followsR.count || 0);
            setFollowingCount(followingR.count || 0);
            setIsFollowing(!!isFollowingR?.data);
 
            const transformBeat = (b: any): any => ({
                ...b,
                productor_nombre_artistico: b.productor?.nombre_artistico || b.productor_nombre_artistico || b.nombre_artistico || profileData.nombre_artistico || profileData.nombre_usuario,
                productor_nombre_usuario: b.productor?.nombre_usuario || b.productor_nombre_usuario || b.nombre_usuario || profileData.nombre_usuario,
                productor_foto_perfil: resolveStorageUrl(b.productor?.foto_perfil || b.productor_foto_perfil || b.foto_perfil, 'fotos_perfil') || profileData.foto_perfil,
                productor_esta_verificado: b.productor?.esta_verificado ?? b.productor_esta_verificado ?? b.esta_verificado ?? profileData.esta_verificado,
                productor_es_fundador: b.productor?.es_fundador ?? b.productor_es_fundador ?? b.es_fundador ?? profileData.es_fundador,
                // Solo se expone la muestra al público; el master (mp3/wav/stems) se sirve únicamente vía /api/download tras validar compra.
                archivo_mp3_url: resolveStorageUrl(b.archivo_muestra_url, 'muestras_beats'),
                archivo_muestra_url: resolveStorageUrl(b.archivo_muestra_url, 'muestras_beats'),
                portada_url: resolveStorageUrl(b.portada_url, 'portadas_beats'),
            });

            if (beatsR.data) setBeats(beatsR.data.map(transformBeat));
            if (kitsR.data) setSoundKits(kitsR.data);
            if (serviciosR.data) setServicios(serviciosR.data);
            if (plR.data) setPlaylists(plR.data);
            if (lbR.data) setLikedBeats(lbR.data.map((f: any) => f.beat).filter(Boolean).map(transformBeat));
            if (lkR.data) setLikedKits(lkR.data.map((f: any) => f.kit).filter(Boolean));
            if (lsR.data) setLikedServicios(lsR.data.map((f: any) => f.servicio).filter(Boolean));

            // Fetch followers and following profiles
            const [fData, flData, myFl] = await Promise.all([
                supabase.from('seguidores').select('perfiles:seguidor_id (*)').eq('seguido_id', profileData.id).limit(PROFILE_LIMITS.follows),
                supabase.from('seguidores').select('perfiles:seguido_id (*)').eq('seguidor_id', profileData.id).limit(PROFILE_LIMITS.follows),
                user ? supabase.from('seguidores').select('seguido_id').eq('seguidor_id', user.id).limit(PROFILE_LIMITS.myFollows) : Promise.resolve({ data: null })
            ]);

            setFollowers(fData.data?.map(f => (f as any).perfiles).filter(Boolean) || []);
            setFollowing(flData.data?.map(fl => (fl as any).perfiles).filter(Boolean) || []);
            if (myFl?.data) setUserFollowingSet(new Set(myFl.data.map(f => f.seguido_id)));

        } catch (err) {
            console.error('Profile fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllLikes = async () => {
        if (!profile) return;
        const [lbR, lkR, lsR] = await Promise.all([
            supabase.from('favoritos').select(`id, beat:beats(${COLUMNAS_BEAT_PUBLICO}, productor:perfiles(${COLUMNAS_PERFIL_MINIMO}))`).eq('usuario_id', profile.id).not('beat_id', 'is', null).limit(PROFILE_LIMITS.likes),
            supabase.from('favoritos').select(`id, kit:kits_sonido(${COLUMNAS_KIT_PUBLICO}, productor:perfiles(${COLUMNAS_PERFIL_MINIMO}))`).eq('usuario_id', profile.id).not('kit_id', 'is', null).limit(PROFILE_LIMITS.likes),
            supabase.from('favoritos').select(`id, servicio:servicios(${COLUMNAS_SERVICIO_PUBLICO})`).eq('usuario_id', profile.id).not('servicio_id', 'is', null).limit(PROFILE_LIMITS.likes)
        ]);

        const transformBeatLocal = (b: any): any => ({
            ...b,
            productor_nombre_artistico: b.productor?.nombre_artistico || b.productor_nombre_artistico || b.nombre_artistico || profile?.nombre_artistico || profile?.nombre_usuario,
            productor_nombre_usuario: b.productor?.nombre_usuario || b.productor_nombre_usuario || b.nombre_usuario || profile?.nombre_usuario,
            productor_foto_perfil: resolveStorageUrl(b.productor?.foto_perfil || b.productor_foto_perfil || b.foto_perfil, 'fotos_perfil') || profile?.foto_perfil,
            productor_esta_verificado: b.productor?.esta_verificado ?? b.productor_esta_verificado ?? b.esta_verificado ?? profile?.esta_verificado,
            productor_es_fundador: b.productor?.es_fundador ?? b.productor_es_fundador ?? b.es_fundador ?? profile?.es_fundador,
            // Solo muestra al público; master vía /api/download.
            archivo_mp3_url: resolveStorageUrl(b.archivo_muestra_url, 'muestras_beats'),
            archivo_muestra_url: resolveStorageUrl(b.archivo_muestra_url, 'muestras_beats'),
            portada_url: resolveStorageUrl(b.portada_url, 'portadas_beats'),
        });

        if (lbR.data) setLikedBeats(lbR.data.map((f: any) => f.beat).filter(Boolean).map(transformBeatLocal));
        if (lkR.data) setLikedKits(lkR.data.map((f: any) => f.kit).filter(Boolean));
        if (lsR.data) setLikedServicios(lsR.data.map((f: any) => f.servicio).filter(Boolean));
    };

    useEffect(() => {
        if (!profile && username) {
            fetchAll();
        }
    }, [username]);

    // Optimistically update likes tab immediately when likedBeatIds changes from player / context
    useEffect(() => {
        if (profile && user?.id === profile.id) {
            if (prevLikedIds.current.size !== likedBeatIds.size) {
                if (likedBeatIds.size > prevLikedIds.current.size) {
                    fetchAllLikes();
                } else {
                    const removedIds = [...prevLikedIds.current].filter(id => !likedBeatIds.has(id));
                    setLikedBeats(prev => prev.filter(b => !removedIds.includes(b.id)));
                }
            }
            prevLikedIds.current = new Set(likedBeatIds);
        }
    }, [likedBeatIds, profile, user]);

    useEffect(() => {
        if (profile && activeTab === 'comentarios') fetchWallPosts(profile.id);
    }, [activeTab, profile?.id]);

    const handleShare = () => {
        if (navigator.share) navigator.share({ title: `${profile?.nombre_artistico} en Tianguis Beats`, url: window.location.href });
        else { navigator.clipboard.writeText(window.location.href); showToast('Enlace copiado', 'success'); }
    };

    // ── Wall Posts ──────────────────────────────────────────────────
    const fetchWallPosts = async (profileId: string) => {
        setWallLoading(true);
        try {
            const { data } = await supabase
                .from('comentarios')
                .select(`
                    id, contenido, fecha_creacion, likes_count, parent_id,
                    usuario:usuario_id (
                        id, nombre_artistico, nombre_usuario, foto_perfil
                    )
                `)
                .eq('perfil_id', profileId)
                .order('fecha_creacion', { ascending: false })
                .limit(PROFILE_LIMITS.wallPosts);
            if (data) setWallPosts(data);
        } catch {}
        setWallLoading(false);
    };

    const handlePost = async () => {
        if (!user) { showToast('Inicia sesión para comentar', 'info'); return; }
        const text = postContent.trim();
        if (!text || text.length > 1000) return;
        setIsPosting(true);
        try {
            const { data, error } = await supabase
                .from('comentarios')
                .insert({ perfil_id: profile.id, usuario_id: user.id, contenido: text })
                .select(`
                    id, contenido, fecha_creacion, likes_count, parent_id,
                    usuario:usuario_id (
                        id, nombre_artistico, nombre_usuario, foto_perfil
                    )
                `)
                .single();
            if (error) throw error;
            setWallPosts(prev => [data, ...prev]);
            setPostContent('');
        } catch {
            showToast('Error al publicar', 'error');
        }
        setIsPosting(false);
    };

    const handleReply = async (parentId: string) => {
        if (!user) { showToast('Inicia sesión para responder', 'info'); return; }
        const text = replyContent.trim();
        if (!text || text.length > 1000) return;
        setIsReplying(true);
        try {
            const { data, error } = await supabase
                .from('comentarios')
                .insert({ perfil_id: profile.id, usuario_id: user.id, contenido: text, parent_id: parentId })
                .select(`
                    id, contenido, fecha_creacion, likes_count, parent_id,
                    usuario:usuario_id (
                        id, nombre_artistico, nombre_usuario, foto_perfil
                    )
                `)
                .single();
            if (error) throw error;
            setWallPosts(prev => [...prev, data]);
            setReplyContent('');
            setReplyingTo(null);
        } catch {
            showToast('Error al publicar respuesta', 'error');
        }
        setIsReplying(false);
    };

    const handleDeletePost = async (postId: string) => {
        try {
            await supabase.from('comentarios').delete().eq('id', postId);
            setWallPosts(prev => prev.filter(p => p.id !== postId));
        } catch {
            showToast('Error al eliminar', 'error');
        }
    };

    const handleLikePost = async (postId: string, currentCount: number) => {
        if (!user) { showToast('Inicia sesión para dar like', 'info'); return; }
        const alreadyLiked = likedPostIds.has(postId);
        const newCount = alreadyLiked ? currentCount - 1 : currentCount + 1;
        setWallPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: newCount } : p));
        setLikedPostIds(prev => {
            const next = new Set(prev);
            alreadyLiked ? next.delete(postId) : next.add(postId);
            return next;
        });
        await supabase.from('comentarios').update({ likes_count: newCount }).eq('id', postId);
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'ahora';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d`;
        return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    };
    // ────────────────────────────────────────────────────────────────

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        const file = e.target.files[0];
        try {
            setIsUploadingAvatar(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${username}/${user.id}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('fotos_perfil').upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('fotos_perfil').getPublicUrl(fileName);
            const urlWithTime = `${publicUrl}?t=${new Date().getTime()}`;

            const { error: updateError } = await supabase.from('perfiles').update({ foto_perfil: urlWithTime }).eq('id', user.id);
            if (updateError) throw updateError;
            
            setProfile((prev: any) => ({ ...prev, foto_perfil: urlWithTime }));
            showToast('Foto de perfil actualizada', 'success');
        } catch (error: any) {
            showToast('Error al subir foto: ' + error.message, 'error');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        const file = e.target.files[0];
        try {
            setIsUploadingBanner(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${username}/${user.id}_banner.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('fotos_portada').upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('fotos_portada').getPublicUrl(fileName);
            const urlWithTime = `${publicUrl}?t=${new Date().getTime()}`;

            const { error: updateError } = await supabase.from('perfiles').update({ portada_perfil: urlWithTime }).eq('id', user.id);
            if (updateError) throw updateError;
            
            setProfile((prev: any) => ({ ...prev, banner_url: urlWithTime, portada_perfil: urlWithTime }));
            showToast('Portada actualizada', 'success');
        } catch (error: any) {
            showToast('Error al subir portada: ' + error.message, 'error');
        } finally {
            setIsUploadingBanner(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSaving(true);
        try {
            const cleanPais = formData.pais.split(' ')[0].trim();

            const updateData = {
                nombre_artistico: formData.nombre_artistico,
                biografia: formData.biografia,
                pais: cleanPais,
                enlaces_sociales: {
                    instagram: formData.instagram_url,
                    youtube: formData.youtube_url,
                    tiktok: formData.tiktok_url,
                },
                // Aseguramos que solo estas columnas se envíen
                verificacion_instagram: formData.instagram_url,
                verificacion_youtube: formData.youtube_url,
                verificacion_tiktok: formData.tiktok_url
            };

            const { error } = await supabase
                .from('perfiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;
            
            setProfile((prev: any) => ({ ...prev, ...updateData }));
            setIsEditModalOpen(false);
            showToast('Perfil actualizado correctamente', 'success');
        } catch (error: any) {
            showToast('Error al guardar: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBannerOffset = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('perfiles').update({ ajuste_portada: bannerOffset }).eq('id', user.id);
            if (error) throw error;
            setProfile((prev: any) => ({ ...prev, ajuste_portada: bannerOffset }));
            setIsAdjustingBanner(false);
            showToast('Posición guardada', 'success');
        } catch (error: any) {
            showToast('Error al guardar posición', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBannerMouseDown = (e: React.MouseEvent) => {
        if (!isAdjustingBanner) return;
        setIsDragging(true);
        setStartY(e.clientY - bannerOffset);
    };

    const handleBannerMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !isAdjustingBanner) return;
        const newOffset = e.clientY - startY;
        // Limitar el movimiento (ej: ±200px o según convenga)
        setBannerOffset(Math.max(-200, Math.min(200, newOffset)));
    };

    const handleBannerMouseUp = () => {
        setIsDragging(false);
    };

    const handleToggleFollow = async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (isOwner) return;

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('seguidores')
                    .delete()
                    .eq('seguidor_id', user.id)
                    .eq('seguido_id', profile.id);
                if (error) throw error;
                setFollowersCount(prev => Math.max(0, prev - 1));
                setIsFollowing(false);
                showToast('Ya no sigues a este productor', 'success');
            } else {
                // Follow
                const { error } = await supabase
                    .from('seguidores')
                    .insert({
                        seguidor_id: user.id,
                        seguido_id: profile.id
                    });
                if (error) throw error;
                setFollowersCount(prev => prev + 1);
                setIsFollowing(true);
                showToast('Siguiendo a productor', 'success');
            }
        } catch (error: any) {
            showToast('Error al procesar: ' + error.message, 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-[3px] border-accent/20 border-t-accent animate-spin" />
                    <div className="absolute inset-[5px] rounded-full bg-accent/10 flex items-center justify-center">
                        <Music2 size={20} className="text-accent" />
                    </div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent/60 animate-pulse">Cargando perfil</p>
            </div>
        );
    }
    if (!profile) return null;

    const displayName = profile.nombre_artistico || profile.nombre_usuario || 'Productor';

    const socials = [
        { href: profile.verificacion_instagram || profile.enlaces_sociales?.instagram, Icon: Instagram, label: 'Instagram', color: '#e1306c' },
        { href: profile.verificacion_youtube || profile.enlaces_sociales?.youtube, Icon: Youtube, label: 'YouTube', color: '#ff0000' },
        { href: profile.verificacion_tiktok || profile.enlaces_sociales?.tiktok, Icon: TikTokIcon, label: 'TikTok', color: '#00f2ea' },
    ].filter(s => s.href);

    const tabs: { id: TabId; label: string; count?: number | null }[] = [
        { id: 'beats', label: 'Beats', count: beats.length },
        { id: 'kits', label: 'Sound Kits', count: soundKits.length },
        { id: 'playlists', label: 'Playlists', count: playlists.length },
        { id: 'likes', label: 'Me Gusta', count: likedBeats.length + likedKits.length },
        { id: 'comentarios', label: 'Comentarios', count: null },
        { id: 'info', label: 'Info', count: null },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <div className="relative">
                {isOwner && (
                    <>
                        <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                    </>
                )}

                <div 
                    className={`relative w-full h-[28vh] md:h-[38vh] overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 group/banner ${isAdjustingBanner ? 'cursor-ns-resize ring-2 ring-blue-500 ring-inset ring-offset-4 ring-offset-background' : ''}`}
                    onMouseDown={handleBannerMouseDown}
                    onMouseMove={handleBannerMouseMove}
                    onMouseUp={handleBannerMouseUp}
                    onMouseLeave={handleBannerMouseUp}
                >
                    {profile.banner_url ? (
                        <>
                            <Image
                                src={profile.banner_url}
                                alt="Portada"
                                fill
                                priority
                                sizes="100vw"
                                className={`object-cover select-none ${isDragging ? 'cursor-grabbing' : isAdjustingBanner ? 'cursor-grab' : ''}`}
                                style={{ 
                                    filter: 'brightness(0.75) saturate(1.1)',
                                    objectPosition: `center ${50 + (bannerOffset / 4)}%`,
                                    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                                    transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                draggable={false}
                            />
                            {isAdjustingBanner && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center pointer-events-none"
                                >
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin-slow opacity-60" />
                                        <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">Arrastra para reubicar la imagen</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />
                        </>
                    ) : (
                        <div className="w-full h-full relative overflow-hidden pointer-events-none">
                            {profile.foto_perfil && (
                                <Image
                                    src={profile.foto_perfil}
                                    alt=""
                                    fill
                                    priority
                                    sizes="100vw"
                                    className="object-cover scale-150"
                                    style={{ filter: 'blur(60px) saturate(2) brightness(0.2)' }}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-purple-600/10" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        </div>
                    )}
                    
                    {isOwner && (
                        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
                            {isAdjustingBanner ? (
                                <>
                                    <button 
                                        onClick={handleSaveBannerOffset}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                                    >
                                        <Save size={14} /> Guardar Posición
                                    </button>
                                    <button 
                                        onClick={() => { setIsAdjustingBanner(false); setBannerOffset(profile.ajuste_portada || 0); }}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setIsAdjustingBanner(true)}
                                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all opacity-100 md:opacity-0 group-hover/banner:opacity-100 shadow-xl"
                                    >
                                        <Layers size={14} /> Reposicionar
                                    </button>
                                    <button 
                                        onClick={() => bannerInputRef.current?.click()}
                                        disabled={isUploadingBanner}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all opacity-100 md:opacity-0 group-hover/banner:opacity-100 disabled:opacity-50 shadow-xl"
                                    >
                                        <Camera size={14} /> Cambiar Foto
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="max-w-6xl mx-auto px-5">
                    <div className="-mt-16 md:-mt-20 relative z-10">
                        <div className="flex flex-col items-center md:items-end md:flex-row gap-5 md:gap-8">
                            {/* Avatar — sin caja de color, foto centrada en móvil */}
                            <div className="relative shrink-0 group/avatar">
                                <div className={`w-[130px] h-[130px] md:w-[180px] md:h-[180px] rounded-[2.2rem] overflow-hidden border-[3px] bg-background shadow-2xl transition-all duration-500 ${profile.nivel_suscripcion?.toLowerCase() === 'premium'
                                    ? 'border-blue-500 shadow-blue-500/20'
                                    : profile.nivel_suscripcion?.toLowerCase() === 'pro' || profile.es_fundador
                                        ? 'border-amber-400 shadow-amber-400/20'
                                        : 'border-background'
                                    }`}>
                                    {profile.foto_perfil ? (
                                        <Image
                                            src={profile.foto_perfil}
                                            alt={displayName}
                                            width={180}
                                            height={180}
                                            priority
                                            sizes="(min-width: 768px) 180px, 130px"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
                                            <Music2 size={60} className="text-zinc-600" />
                                        </div>
                                    )}
                                </div>
                                {isOwner && (
                                    <button 
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={isUploadingAvatar}
                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[2.2rem] bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity disabled:opacity-50"
                                    >
                                        <Camera size={24} />
                                        <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-center px-2">{isUploadingAvatar ? 'Subiendo...' : 'Cambiar Foto'}</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col md:flex-row gap-4 md:gap-6 md:items-end pb-2 text-center md:text-left">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row flex-wrap items-center md:items-start gap-2 md:gap-4 mb-2">
                                        <h1 className="font-black uppercase tracking-tighter leading-[0.85] text-foreground drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] w-full text-center md:text-left"
                                            style={{ 
                                                fontSize: displayName.length > 8 ? 'clamp(2.5rem, 7vw, 5.5rem)' : 'clamp(2.5rem, 9vw, 8rem)',
                                                wordBreak: 'break-word',
                                                hyphens: 'auto'
                                            }}>
                                            {displayName}
                                        </h1>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                                            {profile.es_fundador && (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/30 bg-amber-400/10 shadow-lg shadow-amber-400/5">
                                                    <Crown size={11} fill="currentColor" /> Fundador
                                                </span>
                                            )}
                                            {profile.esta_verificado && (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400 border border-blue-400/30 bg-blue-400/10 shadow-lg shadow-blue-400/5">
                                                    <Image src="/verified-badge.png" width={14} height={14} className="object-contain" alt="Verificado" /> Verificado
                                                </span>
                                            )}
                                            {profile.nivel_suscripcion?.toLowerCase() === 'premium' && (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-500 border border-blue-500/30 bg-blue-500/10 shadow-lg shadow-blue-500/5">
                                                    <Zap size={11} fill="currentColor" /> Premium
                                                </span>
                                            )}
                                            {profile.nivel_suscripcion?.toLowerCase() === 'pro' && (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/30 bg-amber-400/10 shadow-lg shadow-amber-400/5">
                                                    <Star size={11} fill="currentColor" /> Plan Pro
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-3 gap-y-2 text-[11px] font-bold text-foreground/60 uppercase tracking-widest mt-5">
                                        <span className="text-foreground/40">@{profile.nombre_usuario}</span>
                                        <span className="hidden md:block w-1 h-1 rounded-full bg-foreground/20" />
                                        <span className="flex items-center gap-1.5"><MapPin size={11} className="text-accent" /> {profile.pais || 'Mundo'}</span>
                                        <Link href={`/${profile.nombre_usuario}/connections?tab=followers`} className="group/stat flex items-center gap-2 hover:text-blue-500 transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center gap-1">
                                                <span className="text-foreground font-black text-sm md:text-base leading-none">{followersCount}</span>
                                                <span className="text-foreground/40 group-hover/stat:text-blue-500/60 lowercase font-medium transition-colors">Seguidores</span>
                                            </div>
                                        </Link>
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/10" />
                                        <Link href={`/${profile.nombre_usuario}/connections?tab=following`} className="group/stat flex items-center gap-2 hover:text-blue-500 transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center gap-1">
                                                <span className="text-foreground font-black text-sm md:text-base leading-none">{followingCount}</span>
                                                <span className="text-foreground/40 group-hover/stat:text-blue-500/60 lowercase font-medium transition-colors">Siguiendo</span>
                                            </div>
                                        </Link>
                                        {socials.length > 0 && (
                                            <div className="flex items-center gap-4 border-l border-foreground/10 pl-4">
                                                {socials.map(({ href, Icon, label }) => (
                                                    <a key={label} href={href!} target="_blank" rel="noopener noreferrer"
                                                        className="text-foreground/50 hover:text-foreground transition-colors hover:scale-110 active:scale-95 duration-200"
                                                        title={label}
                                                    >
                                                        <Icon size={24} />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {profile.biografia && (
                                        <div className="mt-6 max-w-2xl mx-auto md:mx-0">
                                            <p className="text-sm text-foreground/70 leading-relaxed font-medium line-clamp-2 md:line-clamp-3 italic">
                                                {profile.biografia}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 shrink-0 md:mb-2 mt-8 md:mt-0 text-foreground">
                                    {user?.id === profile?.id ? (
                                        <Link 
                                            href="/studio/cuenta"
                                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all outline-none"
                                        >
                                            <Edit3 size={14} /> Editar Perfil
                                        </Link>
                                    ) : (
                                        <button 
                                            onClick={handleToggleFollow}
                                            className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all outline-none ${
                                                isFollowing 
                                                    ? 'bg-foreground/[0.04] text-foreground/50 border border-foreground/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30' 
                                                    : 'bg-foreground text-background dark:bg-white dark:text-black hover:scale-[1.02] shadow-xl'
                                            }`}
                                        >
                                            {isFollowing ? 'Siguiendo' : 'Seguir'}
                                        </button>
                                    )}
                                    <button onClick={handleShare} className="w-11 h-11 rounded-2xl border border-foreground/10 bg-foreground/[0.03] flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-foreground/25 transition-all outline-none">
                                        <Share2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Tabs Section ─── */}
            <div className="relative mt-[-32px] md:mt-[-48px] overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <AbstractPuzzleBack theme="blue" />
                    <NoiseOverlay />
                </div>

                <div className="sticky top-[64px] md:top-[80px] z-[40] bg-background/80 backdrop-blur-xl border-t border-b border-foreground/[0.08]">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex overflow-x-auto gap-1 scrollbar-hide no-scrollbar py-2 snap-x snap-mandatory pr-20 md:pr-0">
                            {tabs.map((tab, idx) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative shrink-0 snap-center px-6 md:px-10 py-3 md:py-4 text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all group overflow-hidden ${activeTab === tab.id
                                        ? 'text-foreground'
                                        : 'text-foreground/40 hover:text-foreground/70'
                                    }`}
                                >
                                    {/* Abstract background shape for active tab */}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabBg"
                                            className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 z-0"
                                            initial={false}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            style={{
                                                clipPath: idx % 2 === 0 
                                                    ? 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)'
                                                    : 'polygon(0% 0%, 95% 0%, 100% 100%, 5% 100%)'
                                            }}
                                        />
                                    )}

                                    <div className="relative z-10 flex items-center gap-3">
                                        <span>{tab.label}</span>
                                        {tab.count !== null && tab.count !== undefined && tab.count > 0 && (
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black transition-all ${
                                                activeTab === tab.id 
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                                    : 'bg-foreground/[0.05] text-foreground/30'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {activeTab === tab.id && (
                                        <motion.div 
                                            layoutId="activeTabUnderline"
                                            className="absolute bottom-0 left-2 right-2 h-[3px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-5 pt-20 md:pt-32 pb-20 md:pb-32 min-h-[60vh]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {activeTab === 'beats' && (
                                beats.length === 0 ? (
                                    <EmptyState icon="🎵" title="Sin beats todavía" desc={isOwner ? 'Sube tu primer beat para empezar a vender.' : 'Este productor aún no ha subido beats.'}>
                                        {isOwner && (
                                            <Link 
                                                href="/upload" 
                                                className="mt-5 px-7 py-3.5 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-blue-500/20"
                                            >
                                                Subir tu próximo Hit
                                            </Link>
                                        )}
                                    </EmptyState>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                        {beats.map(beat => <BeatCardPro key={beat.id} beat={beat} />)}
                                    </div>
                                )
                            )}

                            {activeTab === 'kits' && (
                                soundKits.length === 0 ? (
                                    <EmptyState icon="📦" title="Sin Sound Kits" desc={isOwner ? 'Publica tus librerías de sonidos y presets.' : 'Sin kits disponibles todavía.'}>
                                        {isOwner && (
                                            <Link 
                                                href="/studio/soundkits" 
                                                className="mt-5 px-7 py-3.5 rounded-2xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-orange-500/20"
                                            >
                                                Gestionar Sound Kits
                                            </Link>
                                        )}
                                    </EmptyState>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                        {soundKits.map((kit: any) => (
                                            <SoundKitHorizontalCard key={kit.id} kit={kit} producerName={displayName} />
                                        ))}
                                    </div>
                                )
                            )}


                            {activeTab === 'playlists' && (
                                <div className="space-y-10">

                                    {/* ── Header ── */}
                                    <div className="flex items-end justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-1 h-7 rounded-full bg-blue-500" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.45em] text-blue-500">
                                                    {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                                                </span>
                                            </div>
                                            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-foreground">
                                                Playlists
                                            </h3>
                                        </div>

                                        {isOwner && (
                                            <button
                                                onClick={() => { setEditingPlaylist(null); setIsPlaylistModalOpen(true); }}
                                                className="group relative shrink-0 flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-blue-500/25 overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                <Plus size={15} />
                                                Nueva Playlist
                                            </button>
                                        )}
                                    </div>

                                    {playlists.length === 0 ? (
                                        <EmptyState icon="🎧" title="Sin playlists todavía" desc="Aún no hay playlists públicas." />
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {playlists.map((pl: any) => (
                                                <div
                                                    key={pl.id}
                                                    className="group relative rounded-[2rem] overflow-hidden cursor-pointer bg-card border border-border/60 hover:border-blue-500/40 transition-all duration-400 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
                                                    onClick={() => {
                                                        router.push(`/${username}/playlists/${pl.id}`);
                                                    }}
                                                >
                                                    {/* Cover art */}
                                                    <div className="relative aspect-square overflow-hidden">
                                                        <PlaylistCover
                                                            beats={pl.items || []}
                                                            size="lg"
                                                            className="w-full h-full rounded-none"
                                                        />

                                                        {/* Bottom gradient */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

                                                        {/* Play button — appears on hover */}
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                                            <div className="w-[60px] h-[60px] rounded-full bg-blue-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/60 scale-75 group-hover:scale-100 transition-transform duration-300">
                                                                <Play fill="currentColor" size={26} className="ml-1" />
                                                            </div>
                                                        </div>

                                                        {/* Private badge — top left */}
                                                        {!pl.es_publica && (
                                                            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15">
                                                                <Lock size={9} className="text-amber-400" />
                                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/90">Privada</span>
                                                            </div>
                                                        )}

                                                        {/* Edit button (owner) — top right, visible on hover */}
                                                        {isOwner && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingPlaylist(pl);
                                                                    setIsPlaylistModalOpen(true);
                                                                }}
                                                                className="absolute top-3.5 right-3.5 px-3 py-1.5 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest text-white/90 hover:text-white hover:bg-black/80 hover:border-white/40 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Edit3 size={11} /> Editar
                                                            </button>
                                                        )}

                                                        {/* Beat count — bottom right over gradient */}
                                                        <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                                                            <Music2 size={9} className="text-blue-400" />
                                                            <span className="text-[9px] font-black text-white/90">{pl.items?.length || 0}</span>
                                                        </div>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="px-5 py-4 flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-[15px] uppercase tracking-tight text-foreground truncate group-hover:text-blue-500 transition-colors leading-tight">
                                                                {pl.nombre}
                                                            </h4>
                                                            {pl.descripcion ? (
                                                                <p className="text-[10px] text-muted/50 truncate mt-0.5">{pl.descripcion}</p>
                                                            ) : (
                                                                <p className="text-[9px] font-bold text-muted/40 uppercase tracking-[0.2em] mt-0.5">
                                                                    {pl.items?.length || 0} beats · {pl.es_publica ? 'Pública' : 'Privada'}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 w-8 h-8 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center text-muted group-hover:bg-blue-500/10 group-hover:border-blue-500/30 group-hover:text-blue-500 transition-all">
                                                            <ListMusic size={14} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'likes' && (
                                likedBeats.length === 0 && likedKits.length === 0 && likedServicios.length === 0 ? (
                                    <EmptyState icon="❤️" title="Sin favoritos" desc="No hay beats, kits ni servicios guardados." />
                                ) : (
                                    <div className="space-y-16">
                                        {likedBeats.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-foreground/10" />
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Beats Favoritos</h3>
                                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-foreground/10" />
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                                    {likedBeats.map((beat: any) => <BeatCardPro key={beat.id} beat={beat} />)}
                                                </div>
                                            </div>
                                        )}
                                        {likedKits.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-foreground/10" />
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Sound Kits</h3>
                                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-foreground/10" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {likedKits.map((kit: any) => (
                                                        <SoundKitHorizontalCard key={kit.id} kit={kit} producerName={kit.productor?.nombre_artistico || displayName} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            {activeTab === 'followers' && (
                                followers.length === 0 ? (
                                    <EmptyState icon="👥" title="Sin seguidores" desc="Aún nadie sigue a este productor." />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {followers.map(f => (
                                            <Link key={f.id} href={`/${f.nombre_usuario}`} className="group flex items-center justify-between p-4 bg-white/5 dark:bg-slate-900/40 border border-white/5 hover:border-blue-500/30 rounded-3xl transition-all hover:scale-[1.02]">
                                                <div className="flex items-center gap-4">
                                                    <img src={f.foto_perfil || `https://ui-avatars.com/api/?name=${f.nombre_usuario}`} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black group-hover:text-blue-400 transition-colors">@{f.nombre_usuario}</span>
                                                        <span className="text-[10px] font-bold text-muted uppercase">{f.nombre_artistico || 'Productor'}</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight size={14} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )
                            )}

                            {activeTab === 'following' && (
                                following.length === 0 ? (
                                    <EmptyState icon="🔍" title="Sin seguidos" desc="Este productor aún no sigue a nadie." />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {following.map(fl => (
                                            <Link key={fl.id} href={`/${fl.nombre_usuario}`} className="group flex items-center justify-between p-4 bg-white/5 dark:bg-slate-900/40 border border-white/5 hover:border-blue-500/30 rounded-3xl transition-all hover:scale-[1.02]">
                                                <div className="flex items-center gap-4">
                                                    <img src={fl.foto_perfil || `https://ui-avatars.com/api/?name=${fl.nombre_usuario}`} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black group-hover:text-blue-400 transition-colors">@{fl.nombre_usuario}</span>
                                                        <span className="text-[10px] font-bold text-muted uppercase">{fl.nombre_artistico || 'Productor'}</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight size={14} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )
                            )}

                            {activeTab === 'comentarios' && (
                                <div className="max-w-2xl mx-auto space-y-4">

                                    {/* Composer */}
                                    <div className="bg-card border border-border rounded-[2rem] p-5 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            {/* Current user avatar */}
                                            <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border border-border bg-foreground/5 flex items-center justify-center">
                                                {user ? (
                                                    currentUserProfile?.foto_perfil ? (
                                                        <img
                                                            src={currentUserProfile.foto_perfil}
                                                            alt="Tú"
                                                            className="w-full h-full object-cover"
                                                            onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                                                        />
                                                    ) : (
                                                        <User size={16} className="text-muted" />
                                                    )
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User size={16} className="text-muted" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <textarea
                                                    value={postContent}
                                                    onChange={e => setPostContent(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(); }}
                                                    placeholder={user ? `Escríbele algo a ${displayName}...` : `Inicia sesión para comentar en el perfil de ${displayName}`}
                                                    disabled={!user || isPosting}
                                                    rows={2}
                                                    maxLength={1000}
                                                    className="w-full bg-foreground/[0.04] border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted/50 resize-none focus:outline-none focus:border-accent/40 transition-all disabled:opacity-50 leading-relaxed"
                                                />
                                                <div className="flex items-center justify-between mt-2 px-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${postContent.length > 900 ? 'text-red-500' : 'text-muted/40'}`}>
                                                        {postContent.length > 0 ? `${postContent.length}/1000` : 'Cero hate, puro arte ✌️'}
                                                    </span>
                                                    <button
                                                        onClick={handlePost}
                                                        disabled={!user || isPosting || !postContent.trim()}
                                                        className="flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        {isPosting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                                                        Publicar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feed */}
                                    {wallLoading ? (
                                        <div className="py-16 flex justify-center">
                                            <Loader2 size={28} className="animate-spin text-muted/30" />
                                        </div>
                                    ) : wallPosts.length === 0 ? (
                                        <div className="py-20 flex flex-col items-center gap-4 text-center">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-foreground/[0.04] border border-border flex items-center justify-center">
                                                <SmilePlus size={28} className="text-muted/30" />
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground/20 uppercase tracking-tight text-lg">Nadie ha dicho nada todavía.</p>
                                                <p className="text-[10px] font-bold text-muted/30 uppercase tracking-widest mt-1">Sé el primero en dejar algo.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            {wallPosts.filter(p => !p.parent_id).map((post: any) => {
                                                const autor = post.usuario as any;
                                                const isMyPost = user?.id === autor?.id;
                                                const isProfileOwner = isOwner;
                                                const canDelete = isMyPost || isProfileOwner;
                                                const liked = likedPostIds.has(post.id);
                                                const replies = wallPosts.filter(r => r.parent_id === post.id).sort((a,b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime());

                                                return (
                                                    <div key={post.id} className="space-y-3">
                                                        <div className="group bg-card border border-border rounded-[1.75rem] p-5 transition-all hover:border-border/80 hover:shadow-sm">
                                                            <div className="flex items-start gap-3">
                                                                {/* Author avatar */}
                                                                <Link href={`/${autor?.nombre_usuario}`} className="shrink-0">
                                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-foreground/5 hover:ring-2 hover:ring-accent/30 transition-all">
                                                                        {autor?.foto_perfil ? (
                                                                            <img src={autor.foto_perfil} alt={autor.nombre_artistico} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-gradient-to-br from-accent/60 to-blue-500/60 flex items-center justify-center text-white text-xs font-black">
                                                                                {(autor?.nombre_artistico || '?').charAt(0).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </Link>

                                                                <div className="flex-1 min-w-0">
                                                                    {/* Header */}
                                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <Link href={`/${autor?.nombre_usuario}`} className="font-black text-sm text-foreground hover:text-accent transition-colors truncate">
                                                                                {autor?.nombre_artistico || autor?.nombre_usuario || 'Usuario'}
                                                                            </Link>
                                                                            {autor?.id === profile?.id && (
                                                                                <span className="shrink-0 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[8px] font-black uppercase tracking-widest rounded-full">
                                                                                    Autor
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <span className="text-[10px] text-muted/50 font-medium">
                                                                                {timeAgo(post.fecha_creacion)}
                                                                            </span>
                                                                            {canDelete && (
                                                                                <button
                                                                                    onClick={() => handleDeletePost(post.id)}
                                                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-muted/30 transition-all"
                                                                                >
                                                                                    <Trash2 size={13} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Content */}
                                                                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
                                                                        {post.contenido}
                                                                    </p>

                                                                    {/* Like and Reply Actions */}
                                                                    <div className="flex items-center gap-4 mt-3">
                                                                        <button
                                                                            onClick={() => handleLikePost(post.id, post.likes_count)}
                                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                                                                liked
                                                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                                                    : 'text-muted/40 hover:text-red-500 hover:bg-red-500/10 border border-transparent'
                                                                            }`}
                                                                        >
                                                                            <Heart size={12} className={liked ? 'fill-current' : ''} />
                                                                            {post.likes_count > 0 && <span>{post.likes_count}</span>}
                                                                        </button>
                                                                        
                                                                        <button
                                                                            onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted/40 hover:text-accent hover:bg-accent/10 transition-all active:scale-95 border border-transparent"
                                                                        >
                                                                            <MessageCircle size={12} />
                                                                            Responder
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Replies Container */}
                                                        {replies.length > 0 && (
                                                            <div className="pl-12 pr-2 space-y-3">
                                                                {replies.map(reply => {
                                                                    const repAutor = reply.usuario as any;
                                                                    const repIsMyPost = user?.id === repAutor?.id;
                                                                    const repCanDelete = repIsMyPost || isProfileOwner;
                                                                    const repLiked = likedPostIds.has(reply.id);

                                                                    return (
                                                                        <div key={reply.id} className="group bg-card/50 border border-border/50 rounded-2xl p-4 transition-all hover:border-border/80">
                                                                            <div className="flex items-start gap-3">
                                                                                <Link href={`/${repAutor?.nombre_usuario}`} className="shrink-0">
                                                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-foreground/5 hover:ring-2 hover:ring-accent/30 transition-all">
                                                                                        {repAutor?.foto_perfil ? (
                                                                                            <img src={repAutor.foto_perfil} alt={repAutor.nombre_artistico} className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            <div className="w-full h-full bg-gradient-to-br from-accent/60 to-blue-500/60 flex items-center justify-center text-white text-[10px] font-black">
                                                                                                {(repAutor?.nombre_artistico || '?').charAt(0).toUpperCase()}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </Link>

                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                                            <Link href={`/${repAutor?.nombre_usuario}`} className="font-black text-xs text-foreground hover:text-accent transition-colors truncate">
                                                                                                {repAutor?.nombre_artistico || repAutor?.nombre_usuario || 'Usuario'}
                                                                                            </Link>
                                                                                            {repAutor?.id === profile?.id && (
                                                                                                <span className="shrink-0 px-1.5 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[7px] font-black uppercase tracking-widest rounded-full">Autor</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                                            <span className="text-[9px] text-muted/50 font-medium">{timeAgo(reply.fecha_creacion)}</span>
                                                                                            {repCanDelete && (
                                                                                                <button onClick={() => handleDeletePost(reply.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-muted/30 transition-all">
                                                                                                    <Trash2 size={12} />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">{reply.contenido}</p>
                                                                                    <div className="flex items-center gap-1 mt-2">
                                                                                        <button onClick={() => handleLikePost(reply.id, reply.likes_count)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${repLiked ? 'text-red-500 bg-red-500/10' : 'text-muted/40 hover:text-red-500'}`}>
                                                                                            <Heart size={10} className={repLiked ? 'fill-current' : ''} />
                                                                                            {reply.likes_count > 0 && <span>{reply.likes_count}</span>}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Reply Input */}
                                                        {replyingTo === post.id && (
                                                            <div className="pl-12 pr-2">
                                                                <div className="bg-card border border-border rounded-2xl p-3 shadow-sm flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                    <div className="flex-1 min-w-0">
                                                                        <textarea
                                                                            autoFocus
                                                                            value={replyContent}
                                                                            onChange={e => setReplyContent(e.target.value)}
                                                                            placeholder="Escribe tu respuesta..."
                                                                            disabled={isReplying}
                                                                            rows={2}
                                                                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted/50 resize-none focus:outline-none transition-all disabled:opacity-50"
                                                                        />
                                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                                                            <button onClick={() => setReplyingTo(null)} className="text-[10px] font-bold text-muted/60 hover:text-foreground transition-colors uppercase tracking-widest">Cancelar</button>
                                                                            <button onClick={() => handleReply(post.id)} disabled={isReplying || !replyContent.trim()} className="flex items-center gap-2 px-4 py-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30">
                                                                                {isReplying ? <Loader2 size={12} className="animate-spin" /> : 'Responder'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'info' && (
                                <div className="max-w-4xl mx-auto mb-20">
                                    <div className="grid md:grid-cols-5 gap-8">
                                        <div className="md:col-span-3 space-y-8">
                                            {profile.biografia ? (
                                                <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 md:p-14 relative overflow-hidden group/bio">
                                                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 transition-transform duration-700 group-hover/bio:scale-110">
                                                        <Info size={140} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 mb-8 ml-1">Sobre el Productor</p>
                                                    <p className="relative z-10 text-lg md:text-2xl text-foreground font-medium leading-relaxed tracking-tight italic">
                                                        "{profile.biografia}"
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-white/5 border border-dashed border-white/10 rounded-[3rem] p-14 flex items-center justify-center text-center">
                                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Este productor prefiere que su música hable por él.</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2 space-y-8">
                                            <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 space-y-8">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 ml-1">Estadísticas & Ubicación</h4>
                                                <div className="space-y-4">
                                                    <InfoRow icon={<MapPin size={16} />} label={profile.pais || 'Ubicación no especificada'} />
                                                    <InfoRow icon={<Music2 size={16} />} label={`${beats.length} Beats Publicados`} />
                                                    <InfoRow icon={<Package size={16} />} label={`${soundKits.length} Sound Kits`} />
                                                    <InfoRow icon={<User size={16} />} label={`Miembro desde ${new Date(profile.fecha_creacion).getFullYear()}`} />
                                                </div>
                                            </div>

                                            {socials.length > 0 && (
                                                <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 space-y-8">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 ml-1">Presencia Digital</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {socials.map(({ href, Icon, label, color }) => (
                                                            <a key={label} href={href!} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] border border-white/5 bg-black/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group/soc">
                                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-transparent transition-all shadow-xl" style={{ backgroundColor: `${color}15` }}>
                                                                    <Icon size={20} style={{ color }} />
                                                                </div>
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-foreground transition-colors">{label}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <Footer />

            {/* Modal de Edición de Perfil */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-background border border-foreground/10 rounded-[2.5rem] shadow-2xl flex flex-col"
                        >
                            {/* Header del Modal */}
                            <div className="p-8 pb-4 border-b border-foreground/5 flex items-center justify-between shrink-0">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Editar <span className="text-accent">Perfil.</span></h2>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40">Personaliza tu identidad en el Tianguis</p>
                                </div>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="w-10 h-10 rounded-full bg-foreground/[0.03] hover:bg-foreground/[0.06] flex items-center justify-center transition-colors"
                                >
                                    <span className="text-xl">×</span>
                                </button>
                            </div>

                            {/* Contenido del Modal */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                {/* Nombre Artístico */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40 ml-1">Nombre Artístico</label>
                                    <input 
                                        type="text"
                                        value={formData.nombre_artistico}
                                        onChange={e => setFormData({ ...formData, nombre_artistico: e.target.value })}
                                        placeholder="Tu nombre de escena"
                                        className="w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-2xl px-6 py-5 font-bold text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
                                    />
                                </div>

                                {/* País */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40 ml-1">País / Ubicación</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20" />
                                        <select 
                                            value={formData.pais}
                                            onChange={e => setFormData({ ...formData, pais: e.target.value })}
                                            className="w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-2xl pl-14 pr-6 py-5 font-bold text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all appearance-none"
                                        >
                                            <option value="">Selecciona tu país</option>
                                            {COUNTRIES.map(country => (
                                                <option key={country} value={country} className="bg-background text-foreground">
                                                    {country}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Biografía */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40 ml-1">Biografía</label>
                                    <textarea 
                                        value={formData.biografia}
                                        onChange={e => setFormData({ ...formData, biografia: e.target.value })}
                                        placeholder="Cuéntale tu historia al mundo..."
                                        rows={4}
                                        className="w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-[2rem] px-6 py-6 font-bold text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all resize-none"
                                    />
                                </div>

                                {/* Redes Sociales */}
                                <div className="pt-4 border-t border-foreground/5 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Globe size={18} className="text-accent" />
                                        <h3 className="text-[11px] font-black uppercase tracking-widest">Redes Sociales</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-foreground">
                                        {[
                                            { id: 'instagram_url', icon: <Instagram size={16} />, label: 'Instagram' },
                                            { id: 'youtube_url', icon: <Youtube size={16} />, label: 'YouTube' },
                                            { id: 'tiktok_url', icon: <TikTokIcon size={16} />, label: 'TikTok' },
                                        ].map((social) => (
                                            <div key={social.id} className="space-y-2">
                                                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/30 ml-4">{social.label}</label>
                                                <div className="relative">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/20">
                                                        {social.icon}
                                                    </div>
                                                    <input 
                                                        type="text"
                                                        value={(formData as any)[social.id]}
                                                        onChange={e => setFormData({ ...formData, [social.id]: e.target.value })}
                                                        placeholder="URL de tu perfil"
                                                        className="w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl pl-12 pr-4 py-3.5 font-bold text-foreground text-[11px] focus:outline-none focus:border-accent/50 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer del Modal */}
                            <div className="p-8 pt-4 border-t border-foreground/5 bg-foreground/[0.01] shrink-0">
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="w-full group relative overflow-hidden bg-foreground text-background py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Guardando Cambios...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            <span>Guardar Perfil</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modals */}
            {profile && (
                <PlaylistManagerModal 
                    isOpen={isPlaylistModalOpen}
                    onClose={() => { setIsPlaylistModalOpen(false); setEditingPlaylist(null); }}
                    producerId={profile.id}
                    existingPlaylist={editingPlaylist}
                    onSuccess={fetchAll}
                />
            )}
        </div>
    );
}

/* ─── Sub-components ─── */

function EmptyState({ icon, title, desc, children }: { icon: string; title: string; desc: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-6 bg-card/10 rounded-[3rem] border border-dashed border-foreground/10">
            <div className="text-6xl animate-bounce">{icon}</div>
            <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{title}</h3>
                <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.2em] mt-2 max-w-xs mx-auto px-4">{desc}</p>
            </div>
            {children}
        </div>
    );
}

function ServicioCard({ servicio, onAddToCart }: { servicio: any; onAddToCart: () => void }) {
    return (
        <div className="group flex flex-col rounded-[2.2rem] border border-foreground/[0.07] p-7 bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-accent/20 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0 border border-accent/10 shadow-inner">
                    <Zap size={24} className="text-accent" />
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black tracking-tighter text-foreground">${servicio.precio?.toLocaleString('es-MX')}</p>
                    <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em]">Pesos Mexicanos</p>
                </div>
            </div>
            <div className="flex-1">
                <h4 className="font-black text-base uppercase tracking-tight mb-3 group-hover:text-accent transition-colors">{servicio.titulo}</h4>
                {servicio.descripcion && <p className="text-xs text-foreground/40 leading-relaxed line-clamp-4 font-medium mb-6 uppercase tracking-tight">{servicio.descripcion}</p>}
            </div>
            <div className="space-y-4">
                {servicio.tiempo_entrega_dias && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/30">
                        <Clock size={12} className="text-foreground/20" /> Entrega estimada en {servicio.tiempo_entrega_dias} días
                    </div>
                )}
                <button onClick={onAddToCart} className="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl">
                    <ShoppingBag size={14} /> Adquirir Servicio
                </button>
            </div>
        </div>
    );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-[2rem] border border-foreground/[0.07] p-8 bg-card/30 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-6 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-accent/20" /> {title}
            </p>
            {children}
        </div>
    );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-4 text-xs md:text-sm text-foreground/60 font-medium py-1 transition-colors hover:text-foreground">
            <span className="text-accent shrink-0 bg-accent/10 p-2 rounded-lg">{icon}</span>
            {label}
        </div>
    );
}
