"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Pause, Heart, Share2, Clock, Music2, ShieldCheck, Download, MessageCircle, BarChart3, ShoppingCart, Info, Globe, ChevronRight, Speaker } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LicenseCard from '@/components/LicenseCard';
import CommentSection from '@/components/CommentSection';
import WaveformPlayer from '@/components/WaveformPlayer';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Beat } from '@/lib/types';
import { Crown, Youtube, Zap, Package, Tag, Layers, Activity, Calendar, Check } from 'lucide-react';
import BeatCardPro from '@/components/explore/BeatCardPro';
import { MUSICAL_KEYS } from '@/lib/constants';

// Extend Beat interface to include detail columns
interface BeatDetail extends Beat {
    // All properties are now in the global Beat interface in Spanish
}

/**
 * BeatDetailPage: Esta página representa la vista detallada de un beat individual.
 * Aquí los usuarios pueden escuchar el beat completo con un visualizador de forma de onda,
 * ver información técnica (BPM, Tono), elegir licencias para comprar y dejar comentarios.
 * 
 * Se ha optimizado para móviles ajustando tamaños de fuente, espaciados y el orden de los elementos.
 */
export default function BeatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [beat, setBeat] = useState<BeatDetail | null>(null);
    const [relatedBeats, setRelatedBeats] = useState<Beat[]>([]);
    const [producerBeats, setProducerBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLicense, setSelectedLicense] = useState<'Básica' | 'MP3' | 'Pro' | 'Premium' | 'Exclusiva' | 'Sound Kit' | null>(null);
    const [isLiked, setIsLiked] = useState(false);

    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { addItem, currentUserId } = useCart();

    // Determine if loading user
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (beat && currentUserId) {
            setIsOwner(beat.productor_id === currentUserId);
        }
    }, [beat, currentUserId]);

    // Determine initial selected license based on availability
    useEffect(() => {
        if (beat) {
            if (beat.esta_vendido) {
                setSelectedLicense(null);
                return;
            }
            if (beat.es_basica_activa !== false) setSelectedLicense('Básica');
            else if (beat.es_mp3_activa !== false) setSelectedLicense('MP3');
            else if (beat.es_pro_activa !== false) setSelectedLicense('Pro');
            else if (beat.es_premium_activa !== false) setSelectedLicense('Premium');
            else if (beat.es_exclusiva_activa !== false) setSelectedLicense('Exclusiva');
            else if (beat.es_soundkit_activa !== false) setSelectedLicense('Sound Kit');
            else setSelectedLicense(null); // No hay licencias disponibles
        }
    }, [beat]);

    const handleAddToCart = () => {
        if (!beat || !selectedLicense || beat.esta_vendido) return;

        const priceMap = {
            'Básica': beat.precio_basico_mxn || 199,
            'MP3': beat.precio_mp3_mxn || 349,
            'Pro': beat.precio_pro_mxn || 499,
            'Premium': beat.precio_premium_mxn || 999,
            'Exclusiva': beat.precio_exclusivo_mxn || 3500,
            'Sound Kit': beat.precio_soundkit_mxn || 499
        };

        const wasAdded = addItem({
            id: `${beat.id}-${selectedLicense}`,
            type: 'beat',
            name: `${beat.titulo} [${selectedLicense}]`,
            price: priceMap[selectedLicense as keyof typeof priceMap],
            image: beat.portada_url || undefined,
            subtitle: `Prod. by ${beat.productor_nombre_artistico || beat.productor_nombre_usuario}`,
            metadata: {
                license: selectedLicense,
                beatId: beat.id,
                producer_id: beat.productor_id // Sync with CartContext which might still use producer_id
            }
        });

        if (wasAdded) {
            router.push('/cart');
        }
    };

    useEffect(() => {
        const fetchBeat = async () => {
            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('beats')
                    .select('id, productor_id, titulo, genero, bpm, precio_basico_mxn, precio_mp3_mxn, precio_pro_mxn, precio_premium_mxn, precio_ilimitado_mxn, precio_exclusivo_mxn, precio_soundkit_mxn, es_basica_activa, es_mp3_activa, es_pro_activa, es_premium_activa, es_ilimitada_activa, es_exclusiva_activa, es_soundkit_activa, esta_vendido, portada_url, archivo_mp3_url, archivo_muestra_url, tono_escala, vibras, descripcion, conteo_reproducciones, conteo_likes, fecha_creacion, tipos_beat, productor:productor_id(nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion)')
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error("Beat not found");

                // Resolve high-quality preview (Prioritizing Samples)
                const path = data.archivo_muestra_url || data.archivo_mp3_url || '';
                const encodedPath = path;

                // Usar buckets unificados en español
                const bucket = path === data.archivo_muestra_url ? 'muestras_beats' : 'beats_mp3';
                const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

                // Resolve Cover Art URL
                let finalCoverUrl = data.portada_url;
                if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
                    const { data: { publicUrl: cpUrl } } = supabase.storage.from('portadas_beats').getPublicUrl(finalCoverUrl);
                    finalCoverUrl = cpUrl;
                }

                // Handle producer as object
                const rawData = data as any;
                const producerObj = Array.isArray(rawData.productor) ? rawData.productor[0] : rawData.productor;

                // Resolve Producer avatar if it's a storage path
                let finalProductorFoto = producerObj?.foto_perfil;
                if (finalProductorFoto && !finalProductorFoto.startsWith('http')) {
                    const { data: { publicUrl: paUrl } } = supabase.storage.from('fotos_perfil').getPublicUrl(finalProductorFoto);
                    finalProductorFoto = paUrl;
                }

                const beatData = {
                    ...data,
                    productor_nombre_artistico: producerObj?.nombre_artistico,
                    productor_nombre_usuario: producerObj?.nombre_usuario,
                    productor_foto_perfil: finalProductorFoto,
                    productor_esta_verificado: producerObj?.esta_verificado,
                    productor_es_fundador: producerObj?.es_fundador,
                    productor_nivel_suscripcion: producerObj?.nivel_suscripcion,
                    archivo_mp3_url: publicUrl,
                    portada_url: finalCoverUrl
                } as any;

                setBeat(beatData as BeatDetail);

                // Fetch Related Beats
                const fetchRelated = async (beatForRelated: any) => {
                    let query = supabase
                        .from('beats')
                        .select('id, titulo, genero, bpm, precio_basico_mxn, portada_url, productor_id, tono_escala, vibras, tipos_beat, conteo_reproducciones, conteo_likes, productor:productor_id(nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion)')
                        .neq('id', beatForRelated.id)
                        .limit(10);

                    // Priority 1: Overlap in beat_types
                    if (beatForRelated.tipos_beat && beatForRelated.tipos_beat.length > 0) {
                        query = query.filter('tipos_beat', 'ov', beatForRelated.tipos_beat);
                    } else if (beatForRelated.genero) {
                        query = query.eq('genero', beatForRelated.genero);
                    }

                    let { data: related } = await query;

                    // Priority 2: Genre fallback
                    if ((!related || related.length < 4) && beatForRelated.genero) {
                        const { data: byGenre } = await supabase
                            .from('beats')
                            .select('id, titulo, genero, bpm, precio_basico_mxn, portada_url, productor_id, tono_escala, vibras, tipos_beat, conteo_reproducciones, conteo_likes, productor:productor_id(nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion)')
                            .neq('id', beatForRelated.id)
                            .eq('genero', beatForRelated.genero)
                            .limit(10);

                        if (byGenre) {
                            related = [...(related || []), ...byGenre.filter(b => !related?.some(r => r.id === b.id))];
                        }
                    }

                    // Priority 3: Moods
                    if ((!related || related.length < 4) && beatForRelated.vibras) {
                        const firstMood = beatForRelated.vibras.split(',')[0].trim();
                        const { data: byMood } = await supabase
                            .from('beats')
                            .select('id, titulo, genero, bpm, precio_basico_mxn, portada_url, productor_id, tono_escala, vibras, tipos_beat, conteo_reproducciones, conteo_likes, productor:productor_id(nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion)')
                            .neq('id', beatForRelated.id)
                            .ilike('vibras', `%${firstMood}%`)
                            .limit(10);

                        if (byMood) {
                            related = [...(related || []), ...byMood.filter(b => !related?.some(r => r.id === b.id))];
                        }
                    }

                    const mappedRelated = (related || []).map((r: any) => ({
                        ...r,
                        productor_nombre_artistico: (r.productor as any)?.nombre_artistico,
                        productor_nombre_usuario: (r.productor as any)?.nombre_usuario,
                        productor_foto_perfil: (r.productor as any)?.foto_perfil,
                        productor_esta_verificado: (r.productor as any)?.esta_verificado,
                        productor_es_fundador: (r.productor as any)?.es_fundador,
                        productor_nivel_suscripcion: (r.productor as any)?.nivel_suscripcion
                    }));

                    setRelatedBeats(mappedRelated as any);
                };

                fetchRelated(data);

                // Fetch more beats from same producer
                const { data: moreFromProducer } = await supabase
                    .from('beats')
                    .select('id, titulo, genero, bpm, precio_basico_mxn, portada_url, productor_id, tono_escala, vibras, tipos_beat, conteo_reproducciones, conteo_likes, productor:productor_id(nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion)')
                    .eq('productor_id', (data as any).productor_id)
                    .neq('id', id)
                    .limit(8);

                if (moreFromProducer) {
                    const mappedProducerBeats = (moreFromProducer || []).map((r: any) => ({
                        ...r,
                        productor_nombre_artistico: (r.productor as any)?.nombre_artistico,
                        productor_nombre_usuario: (r.productor as any)?.nombre_usuario,
                        productor_foto_perfil: (r.productor as any)?.foto_perfil,
                        productor_esta_verificado: (r.productor as any)?.esta_verificado,
                        productor_es_fundador: (r.productor as any)?.es_fundador,
                        productor_nivel_suscripcion: (r.productor as any)?.nivel_suscripcion
                    }));
                    setProducerBeats(mappedProducerBeats as any);
                }

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { count } = await supabase
                        .from('favoritos')
                        .select('id', { count: 'exact', head: true })
                        .eq('beat_id', data.id)
                        .eq('usuario_id', user.id);
                    setIsLiked(!!count);
                }
            } catch (err: any) {
                console.error("Fetch Beat Error:", err);
                setError(err.message || "Error al cargar el beat");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBeat();
    }, [id]);

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            if (confirm("Necesitas iniciar sesión para dar Like. ¿Ir al login?")) router.push('/login');
            return;
        }

        if (isLiked) {
            await supabase.from('favoritos').delete().eq('beat_id', id).eq('usuario_id', user.id);
            setIsLiked(false);
            if (beat) setBeat({ ...beat, conteo_likes: (beat.conteo_likes || 1) - 1 });
        } else {
            await supabase.from('favoritos').insert({ beat_id: id, usuario_id: user.id });
            setIsLiked(true);
            if (beat) setBeat({ ...beat, conteo_likes: (beat.conteo_likes || 0) + 1 });
        }
    };

    // 🛑 SECCIÓN DE MANEJO DE ESTADOS DE CARGA Y ERRORES
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-black text-muted uppercase tracking-widest text-xs">Cargando beat...</p>
            </div>
        );
    }

    if (error || !beat) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-10 animate-fade-in text-center">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <Music2 className="text-red-500" size={40} />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tight mb-4 font-heading">Beat no encontrado</h2>
                    <p className="text-muted font-bold uppercase tracking-widest text-[10px] mb-8">El beat que buscas no existe o ha sido eliminado.</p>
                    <Link href="/beats/catalog" className="px-10 py-5 bg-card border-2 border-border rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-accent transition-all active:scale-95">
                        Explorar otros beats
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white flex flex-col transition-colors duration-300">
            <Navbar />

            <main className="flex-1 pb-32">
                {/* ── 1. CABECERA PRINCIPAL (HERO SECTION) ── 
                    Se ha reducido el padding superior en móviles para que el contenido sea más accesible.
                */}
                <div className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-4 shadow-sm bg-background overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-accent/5 to-transparent -z-10" />

                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
                        {/* Portada del Beat */}
                        <div className="relative group shrink-0">
                            <div className="w-64 h-64 md:w-96 md:h-96 rounded-[2.5rem] md:rounded-[3.5rem] bg-card shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-border/50 relative z-10 transition-all duration-700 group-hover:scale-[1.03] group-hover:-rotate-1">
                                {beat.portada_url ? (
                                    <img src={beat.portada_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={beat.titulo} />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Music2 size={100} /></div>
                                )}

                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <button
                                        onClick={() => playBeat(beat as any)}
                                        className="w-24 h-24 bg-white/90 text-accent rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
                                    >
                                        {isPlaying && currentBeat?.id === beat.id ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-8">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                                    <span className="px-5 py-2 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20">
                                        Nuevo lanzamiento
                                    </span>
                                    <div className="flex items-center gap-4 text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span className="flex items-center gap-2"><Speaker size={16} className="text-accent" /> {beat.conteo_reproducciones?.toLocaleString() || 0}</span>
                                        <span className="flex items-center gap-2"><Heart size={16} className="text-red-500" /> {beat.conteo_likes?.toLocaleString() || 0}</span>
                                    </div>
                                </div>

                                <h1 className="text-4xl md:text-8xl lg:text-9xl font-black text-foreground leading-[1] uppercase tracking-tighter mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                                    {beat.titulo}
                                </h1>

                                {/* Información del Productor */}
                                <Link href={`/${beat.productor_nombre_usuario || ''}`} className="inline-flex items-center gap-4 group">
                                    <div className={`p-1 rounded-2xl border-2 transition-all group-hover:scale-110 ${beat.productor_nivel_suscripcion === 'premium'
                                        ? 'border-[#00f2ff] shadow-sm shadow-[#00f2ff]/30'
                                        : beat.productor_es_fundador
                                            ? 'border-amber-500 shadow-sm shadow-amber-500/20'
                                            : beat.productor_nivel_suscripcion === 'pro'
                                                ? 'border-accent shadow-sm shadow-accent/20'
                                                : 'border-border'
                                        }`}>
                                        <img src={beat.productor_foto_perfil || "/logo.png"} className="w-12 h-12 rounded-xl object-cover" alt="Prod" />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-foreground uppercase tracking-tighter group-hover:text-accent transition-colors">{beat.productor_nombre_artistico || beat.productor_nombre_usuario}</span>
                                            {beat.productor_esta_verificado && <img src="/verified-badge.png" className="w-5 h-5" alt="V" />}
                                            {beat.productor_es_fundador && <Crown size={18} className="text-amber-500" fill="currentColor" />}
                                        </div>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Tianguis Producer</p>
                                    </div>
                                </Link>
                            </div>

                            {/* Tags: Genre, Tempo, Key/Scale */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Género', val: beat.genero, icon: Tag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'Tempo', val: `${beat.bpm} BPM`, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'Tono / Escala', val: MUSICAL_KEYS.find(k => k.value === beat.tono_escala)?.label || beat.tono_escala || 'N/A', icon: Music2, color: 'text-blue-500', bg: 'bg-blue-500/10' }
                                ].map((stat, i) => (
                                    <div key={i} className="flex-1 p-4 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col items-center justify-center gap-2 transition-all hover:border-accent/30">
                                        <span className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                            <stat.icon size={20} />
                                        </span>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase text-muted tracking-widest mb-0.5">{stat.label}</p>
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{stat.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button onClick={handleLike} className={`h-16 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isLiked ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-xl shadow-red-500/5'}`}>
                                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                    {isLiked ? 'En tus favoritos' : 'Me gusta'}
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                    }}
                                    className="h-16 px-10 rounded-2xl bg-card text-foreground border border-border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-accent hover:text-white hover:border-accent transition-all group"
                                >
                                    <Share2 size={20} className="group-hover:rotate-12 transition-transform" /> Compartir
                                </button>
                            </div>

                            {beat.vibras && (
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
                                    <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mr-2">Vibras:</span>
                                    {beat.vibras.split(',').map((m: string) => (
                                        <Link
                                            key={m}
                                            href={`/beats/catalog?mood=${m.trim()}`}
                                            className="px-5 py-2 rounded-full border border-blue-500/30 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:border-blue-500 hover:bg-blue-500/10 transition-all"
                                        >
                                            {m.trim()}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {beat.tipos_beat && beat.tipos_beat.length > 0 && (
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                                    <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mr-2">Beat Type:</span>
                                    {beat.tipos_beat.slice(0, 5).map((t: string) => (
                                        <Link
                                            key={t}
                                            href={`/beats/catalog?beat_type=${t.trim()}`}
                                            className="px-5 py-2 rounded-full border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 shadow-sm hover:border-emerald-500 hover:bg-emerald-500/10 transition-all"
                                        >
                                            {t.trim()}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 2. VISUALIZADOR DE ONDA (WAVEFORM) ── 
                    Situado para solaparse con la cabecera, creando un efecto de profundidad.
                */}
                <div className="max-w-7xl mx-auto px-4 -mt-16 md:-mt-10 relative z-20 mb-16">
                    <div className="dark:bg-slate-950 bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] dark:ring-1 dark:ring-white/10 ring-1 ring-slate-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] -mr-32 -mt-32 transition-all duration-700 group-hover:bg-accent/30" />
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between dark:text-white text-slate-900 text-[10px] font-black uppercase tracking-[0.3em]">
                                <span>Preview Audio (HQ)</span>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-2 text-blue-500 font-bold"><Activity size={12} /> Live Waveform</span>
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                                </div>
                            </div>
                            <div className="w-full">
                                <WaveformPlayer
                                    url={beat.archivo_mp3_url || ''}
                                    height={140}
                                    waveColor="rgba(59, 130, 246, 0.25)"
                                    progressColor="#3b82f6"
                                    isSync={true}
                                    beatId={beat.id}
                                    muted={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 3. CONTENIDO PRINCIPAL: LICENCIAS Y COMENTARIOS ── 
                    En móviles, las licencias se apilan verticalmente para facilitar la selección táctil.
                */}
                <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-12 gap-10 md:gap-16">
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-8 md:mb-10">
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                                <ShieldCheck size={28} className="md:w-8 md:h-8 text-accent" /> Licencias <span className="text-muted">Disponibles</span>
                            </h2>
                        </div>

                        {!selectedLicense ? (
                            <div className="p-16 bg-card rounded-[3rem] text-center border-2 border-dashed border-border/50">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                                    <Package size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Beat No Disponible</h3>
                                <p className="text-muted text-sm mt-2 max-w-sm mx-auto">Este beat no tiene licencias activas en este momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {beat.es_basica_activa !== false && (
                                        <LicenseCard
                                            type="Básica"
                                            price={beat.precio_basico_mxn || 199}
                                            features={['MP3 con Tag (Muestra)', 'Límite: 5k streams', 'Uso no comercial']}
                                            selected={selectedLicense === 'Básica'}
                                            onSelect={() => setSelectedLicense('Básica')}
                                            active={true}
                                            isSold={beat.esta_vendido}
                                        />
                                    )}
                                    {beat.es_mp3_activa !== false && (
                                        <LicenseCard
                                            type="MP3"
                                            price={beat.precio_mp3_mxn || 349}
                                            features={['MP3 High Quality', 'Límite: 25k streams', 'Distribución digital']}
                                            selected={selectedLicense === 'MP3'}
                                            onSelect={() => setSelectedLicense('MP3')}
                                            active={true}
                                            isSold={beat.esta_vendido}
                                        />
                                    )}
                                    {beat.es_pro_activa !== false && (
                                        <LicenseCard
                                            type="Pro"
                                            price={beat.precio_pro_mxn || 499}
                                            features={['MP3 Master (HQ)', 'Mayores límites de streams', 'Distribución extendida']}
                                            selected={selectedLicense === 'Pro'}
                                            onSelect={() => setSelectedLicense('Pro')}
                                            active={true}
                                            isSold={beat.esta_vendido}
                                        />
                                    )}
                                    {beat.es_premium_activa !== false && (
                                        <LicenseCard
                                            type="Premium"
                                            price={beat.precio_premium_mxn || 999}
                                            features={['WAV de Alta Fidelidad', 'Calidad de Estudio', 'Sin tags de voz']}
                                            selected={selectedLicense === 'Premium'}
                                            onSelect={() => setSelectedLicense('Premium')}
                                            active={true}
                                            isSold={beat.esta_vendido}
                                        />
                                    )}
                                    {beat.es_exclusiva_activa !== false && !beat.esta_vendido && (
                                        <LicenseCard
                                            type="Exclusiva"
                                            price={beat.precio_exclusivo_mxn || 3500}
                                            features={['Propiedad Exclusiva', 'Eliminación del mercado', 'Cesión total de derechos']}
                                            selected={selectedLicense === 'Exclusiva'}
                                            onSelect={() => setSelectedLicense('Exclusiva')}
                                            active={true}
                                            isSold={beat.esta_vendido}
                                        />
                                    )}
                                    {beat.es_soundkit_activa !== false && (
                                        <LicenseCard
                                            type="Sound Kit"
                                            price={beat.precio_soundkit_mxn || 499}
                                            features={['Sons del Instrumental', 'Royalty-Free', 'Archivos WAV']}
                                            selected={selectedLicense === 'Sound Kit'}
                                            onSelect={() => setSelectedLicense('Sound Kit')}
                                            active={true}
                                            isSold={beat.esta_vendido}
                                        />
                                    )}
                                </div>
                                {isOwner ? (
                                    <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-500/20 text-center">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-blue-600 dark:text-blue-400 mb-2">Eres el propietario</h3>
                                        <p className="text-muted text-sm max-w-md mx-auto">Estas son las licencias que tus clientes verán. No puedes comprar tu propio beat.</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={beat.esta_vendido}
                                        className={`w-full h-20 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-4 group ${beat.esta_vendido
                                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                                            : 'bg-accent text-white hover:bg-accent/90 shadow-[0_20px_50px_-10px_rgba(37,99,235,0.3)]'
                                            }`}
                                    >
                                        {beat.esta_vendido ? (
                                            <>
                                                <ShieldCheck size={22} />
                                                Este beat ya ha sido vendido
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart size={22} className="group-hover:-translate-y-1 transition-transform" />
                                                Añadir {selectedLicense} al Carrito
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {beat.descripcion && (
                            <div className="mt-16 md:mt-20 pt-16 md:pt-20 border-t border-border/50">
                                <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-6 md:mb-8 flex items-center gap-3">
                                    <Info size={24} className="text-accent" />
                                    Notas del <span className="text-muted">Productor</span>
                                </h3>
                                <div className="p-6 md:p-10 bg-card/30 rounded-[2rem] md:rounded-[2.5rem] border border-border/50">
                                    <p className="text-muted leading-relaxed font-medium whitespace-pre-wrap text-base md:text-lg italic">"{beat.descripcion}"</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Barra Lateral: Comentarios y Contacto */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32 space-y-12">
                            <section>
                                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-sm min-h-[500px]">
                                    <CommentSection beatId={id} />
                                </div>
                            </section>

                            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-accent to-blue-700 text-white space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest opacity-80">¿Necesitas algo a medida?</p>
                                <h4 className="text-xl font-black leading-tight">Trabaja directamente con el productor</h4>
                                <Link
                                    href={`/${beat.productor_nombre_usuario || ''}?tab=services`}
                                    className="block w-full py-4 bg-white text-accent rounded-xl text-center font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:scale-[1.02] hover:shadow-lg transition-all active:scale-95"
                                >
                                    Ver Servicios
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 4. SECCIÓN DE BEATS RELACIONADOS ── 
                    Presentado en un carrusel deslizable horizontalmente en dispositivos táctiles.
                */}
                {relatedBeats.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 mt-32 mb-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <div className="space-y-4">
                                <span className="px-5 py-2 rounded-2xl bg-accent/10 text-accent text-[10px] font-black uppercase tracking-[0.2em] inline-block">
                                    Explora más
                                </span>
                                <h2 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter leading-none">
                                    Beats <span className="text-muted">relacionados</span>
                                </h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link href="/beats/catalog" className="group flex items-center gap-3 text-muted hover:text-accent transition-colors mr-6">
                                    <span className="text-xs font-black uppercase tracking-widest">Ver todo el catálogo</span>
                                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </Link>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            const container = document.getElementById('related-carousel');
                                            if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                                        }}
                                        className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent hover:text-white hover:border-accent transition-all shadow-sm active:scale-90"
                                    >
                                        <ChevronRight size={20} className="rotate-180" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const container = document.getElementById('related-carousel');
                                            if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                                        }}
                                        className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent hover:text-white hover:border-accent transition-all shadow-sm active:scale-90"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="relative group/carousel">
                            <div
                                id="related-carousel"
                                className="flex overflow-x-auto gap-6 pb-12 snap-x scrollbar-hide scroll-smooth no-scrollbar"
                            >
                                {relatedBeats.map((relatedBeat) => (
                                    <div key={relatedBeat.id} className="w-[220px] md:w-[250px] shrink-0 snap-start h-auto">
                                        <BeatCardPro beat={relatedBeat} />
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                            <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-background to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                        </div>
                    </div>
                )}

                {/* ── 5. MÁS DEL MISMO PRODUCTOR ── */}
                {producerBeats.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 mt-16 mb-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <div className="space-y-4">
                                <span className="px-5 py-2 rounded-2xl bg-accent/10 text-accent text-[10px] font-black uppercase tracking-[0.2em] inline-block">
                                    Del mismo productor
                                </span>
                                <h2 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter leading-none">
                                    Más de <span className="text-muted">{beat.productor_nombre_artistico || beat.productor_nombre_usuario}</span>
                                </h2>
                            </div>
                            <Link href={`/${beat.productor_nombre_usuario}`} className="group flex items-center gap-3 text-muted hover:text-accent transition-colors">
                                <span className="text-xs font-black uppercase tracking-widest">Ver perfil completo</span>
                                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                                    <ChevronRight size={20} />
                                </div>
                            </Link>
                        </div>
                        <div className="relative group/pcarousel">
                            <div className="flex overflow-x-auto gap-6 pb-12 snap-x scrollbar-hide scroll-smooth no-scrollbar">
                                {producerBeats.map((pb) => (
                                    <div key={pb.id} className="w-[220px] md:w-[250px] shrink-0 snap-start h-auto">
                                        <BeatCardPro beat={pb} />
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 group-hover/pcarousel:opacity-100 transition-opacity" />
                            <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-background to-transparent pointer-events-none opacity-0 group-hover/pcarousel:opacity-100 transition-opacity" />
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
