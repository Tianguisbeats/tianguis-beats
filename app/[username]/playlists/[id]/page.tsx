"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Music, ArrowLeft, Loader2, ListMusic, Edit3, Share2, Crown,
    CheckCircle2, Play
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCardPro from '@/components/explore/BeatCardPro';
import PlaylistManagerModal from '@/components/PlaylistManagerModal';
import { Beat, Profile } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';
import { useRouter } from 'next/navigation';

export default function PlaylistPage({ params }: { params: Promise<{ username: string, id: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const playlistId = resolvedParams.id;
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [playlist, setPlaylist] = useState<any>(null);
    const [beatsInPlaylist, setBeatsInPlaylist] = useState<Beat[]>([]);
    const [allProducerBeats, setAllProducerBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            const { data: profileData } = await supabase
                .from('perfiles').select('*').eq('nombre_usuario', username).single();

            if (profileData) {
                setProfile(profileData);
                if (user?.id === profileData.id) setIsOwner(true);

                const { data: listData } = await supabase
                    .from('listas_reproduccion')
                    .select('*')
                    .eq('id', playlistId)
                    .single();

                if (listData) {
                    const { data: itemsData } = await supabase
                        .from('listas_reproduccion_items')
                        .select('indice_orden, beats(*)')
                        .eq('playlist_id', playlistId)
                        .order('indice_orden', { ascending: true });

                    const firstRow = listData;
                    const playlistBeats = itemsData ? itemsData.map((pb: any) => pb.beats).filter(Boolean) : [];

                    const transformedBeats = await Promise.all(playlistBeats.map(async (b: any) => {
                        const path = b.archivo_muestra_url || b.archivo_mp3_url || '';
                        const bucket = path.includes('-hq-') ? 'beats_mp3' : 'muestras_beats';
                        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
                        const finalCover = b.portada_url?.startsWith('http')
                            ? b.portada_url
                            : b.portada_url ? supabase.storage.from('portadas_beats').getPublicUrl(b.portada_url).data.publicUrl : null;
                        return {
                            ...b, archivo_mp3_url: publicUrl, portada_url: finalCover,
                            productor_nombre_usuario: profileData.nombre_usuario,
                            productor_nombre_artistico: profileData.nombre_artistico,
                            productor_foto_perfil: profileData.foto_perfil,
                            productor_esta_verificado: profileData.esta_verificado,
                            productor_es_fundador: profileData.es_fundador,
                            productor_nivel_suscripcion: profileData.nivel_suscripcion,
                        };
                    }));

                    setPlaylist({ id: firstRow.id, name: firstRow.nombre, description: firstRow.descripcion, beats: transformedBeats });
                    setBeatsInPlaylist(transformedBeats);

                    if (user?.id === profileData.id) {
                        const { data: allBeatsData } = await supabase
                            .from('beats').select('*').eq('productor_id', profileData.id)
                            .eq('es_publico', true).order('fecha_creacion', { ascending: false });
                        if (allBeatsData) setAllProducerBeats(allBeatsData as any);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [username, playlistId]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <LoadingTianguis />;

    if (!profile || !playlist) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <div className="w-20 h-20 bg-card border border-border rounded-[2rem] flex items-center justify-center mb-6 text-muted">
                <ListMusic size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-3">Playlist no encontrada</h1>
            <p className="text-muted text-[10px] font-bold uppercase tracking-widest mb-8">El enlace puede haber expirado o la colección es privada.</p>
            <button onClick={() => router.back()}
                className="px-6 py-3 bg-card border border-border rounded-xl font-black text-[10px] uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground/20 transition-all">
                Volver Atrás
            </button>
        </div>
    );

    const tierColor = profile.nivel_suscripcion === 'premium' ? '#00f2ff'
        : profile.nivel_suscripcion === 'pro' ? '#f59e0b' : '#6366f1';

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-accent selection:text-white">
            <Navbar />

            {/* ── 1. CABECERA DE LA PLAYLIST (HERO) ── 
                Muestra la portada generada, el título de la colección y la información del productor.
                Adaptado para una visualización compacta en dispositivos móviles.
            */}
            <div className="relative border-b border-border bg-card overflow-hidden">
                {/* Efectos visuales de fondo */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-1/2 left-[-10%] w-[60%] h-[200%] rounded-full blur-[120px] opacity-[0.06]"
                        style={{ backgroundColor: tierColor }} />
                    <div className="absolute top-[-30%] right-[-5%] w-[40%] h-[180%] rounded-full blur-[150px] opacity-[0.04] bg-accent" />
                </div>

                <div className="relative max-w-[1700px] mx-auto px-4 sm:px-10 pt-8 pb-12">
                    {/* Regresar al catálogo del productor */}
                    <Link href={`/${username}/beats`}
                        className="inline-flex items-center gap-2 text-muted hover:text-accent font-black text-[9px] uppercase tracking-[0.3em] mb-8 group transition-all">
                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                        Catálogo de {profile.nombre_artistico || profile.nombre_usuario}
                    </Link>

                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                            {/* Portada de la Playlist */}
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 rounded-[2.5rem] blur-2xl scale-90 opacity-30"
                                    style={{ backgroundColor: tierColor }} />
                                <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-accent/20 via-foreground/5 to-foreground/10 border border-border shadow-2xl flex items-center justify-center">
                                    {beatsInPlaylist[0]?.portada_url ? (
                                        <div className="relative w-full h-full">
                                            <img src={beatsInPlaylist[0].portada_url} className="w-full h-full object-cover opacity-60" alt="" />
                                            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                                                <ListMusic size={40} className="text-foreground/80" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    ) : (
                                        <ListMusic size={48} className="text-foreground/30" strokeWidth={1} />
                                    )}
                                </div>
                            </div>

                            {/* Información Detallada */}
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted">Colección Curada</span>
                                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-tight my-2">
                                    {playlist.name}
                                </h1>
                                {playlist.description && (
                                    <p className="text-muted text-xs md:text-sm font-medium max-w-md mb-4 leading-relaxed mx-auto md:mx-0">
                                        {playlist.description}
                                    </p>
                                )}

                                {/* Perfil del Creador */}
                                <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
                                    <Link href={`/${username}`} className="inline-flex items-center gap-3 group">
                                        {profile.foto_perfil && (
                                            <img src={profile.foto_perfil} className="w-7 h-7 rounded-full object-cover border border-border" alt="" />
                                        )}
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-foreground transition-colors">
                                            {profile.nombre_artistico || profile.nombre_usuario}
                                        </span>
                                        {profile.esta_verificado && <CheckCircle2 size={12} className="text-accent" fill="currentColor" />}
                                    </Link>

                                    <span className="hidden md:block w-1 h-1 rounded-full bg-border" />

                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted">
                                        <Music size={11} /> {beatsInPlaylist.length} {beatsInPlaylist.length === 1 ? 'Beat' : 'Beats'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                            {isOwner && (
                                <button onClick={() => setIsPlaylistModalOpen(true)}
                                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all active:scale-95 shadow-lg">
                                    <Edit3 size={14} /> Editar
                                </button>
                            )}
                            <button onClick={handleShare}
                                className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest border transition-all active:scale-95 ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-card border-border text-muted hover:text-foreground hover:border-foreground/20'}`}>
                                <Share2 size={14} />
                                {copied ? 'Copiado' : 'Compartir'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2. REJILLA DE TRACKS ── 
                Lista de todos los beats incluidos en la playlist con diseño de tarjeta responsiva.
            */}
            <main className="flex-1 pt-8 pb-20">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-10">

                    {beatsInPlaylist.length > 0 ? (
                        <>
                            {/* Indicador de estado */}
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted">
                                    {beatsInPlaylist.length} Tracks en esta playlist
                                </span>
                            </div>

                            {/* Grid de Beats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                {beatsInPlaylist.map((beat, idx) => (
                                    <div key={beat.id}
                                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                                        style={{ animationDelay: `${idx * 40}ms` }}>
                                        <BeatCardPro beat={beat} />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        /* Estado sin contenido */
                        <div className="py-32 text-center bg-foreground/[0.02] border-2 border-dashed border-border rounded-[3rem]">
                            <div className="w-16 h-16 bg-foreground/5 border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 text-muted">
                                <ListMusic size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">Playlist Vacía</h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                                Esta colección aún no tiene tracks guardados
                            </p>
                            {isOwner && (
                                <button onClick={() => setIsPlaylistModalOpen(true)}
                                    className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-accent/20">
                                    <Edit3 size={14} /> Agregar Beats
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de gestión para el propietario */}
            {isOwner && (
                <PlaylistManagerModal
                    isOpen={isPlaylistModalOpen}
                    onClose={() => setIsPlaylistModalOpen(false)}
                    producerId={profile.id}
                    existingPlaylist={playlist}
                    allBeats={allProducerBeats}
                    onSuccess={fetchData}
                />
            )}

            <Footer />
        </div>
    );
}
