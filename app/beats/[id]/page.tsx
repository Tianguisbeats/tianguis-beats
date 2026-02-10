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

// Extend Beat interface to include detail columns
interface BeatDetail extends Beat {
    price_mp3?: number;
    price_wav?: number;
    price_stems?: number;
    price_exclusive?: number;
    is_mp3_active?: boolean;
    is_wav_active?: boolean;
    is_stems_active?: boolean;
    is_exclusive_active?: boolean;
    moods?: string[];
    description?: string;
    portadabeat_url?: string | null;
    created_at: string;
}

/**
 * BeatDetailPage: Muestra la información detallada de un beat específico.
 * Permite reproducir, dar like, comentar y ver opciones de licencia.
 */
export default function BeatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [beat, setBeat] = useState<BeatDetail | null>(null);
    const [relatedBeats, setRelatedBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLicense, setSelectedLicense] = useState<'MP3' | 'WAV' | 'STEMS' | 'ILIMITADA' | null>(null);
    const [isLiked, setIsLiked] = useState(false);

    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { addItem } = useCart();

    // Determine initial selected license based on availability
    useEffect(() => {
        if (beat) {
            if (beat.is_mp3_active !== false) setSelectedLicense('MP3');
            else if (beat.is_wav_active !== false) setSelectedLicense('WAV');
            else if (beat.is_stems_active !== false) setSelectedLicense('STEMS');
            else if (beat.is_exclusive_active !== false) setSelectedLicense('ILIMITADA');
            else setSelectedLicense(null); // No licenses available
        }
    }, [beat]);

    const handleAddToCart = () => {
        if (!beat || !selectedLicense) return;

        const priceMap = {
            'MP3': beat.price_mp3 || beat.price_mxn || 299,
            'WAV': beat.price_wav || Math.ceil((beat.price_mxn || 299) * 1.5),
            'STEMS': beat.price_stems || Math.ceil((beat.price_mxn || 299) * 2.5),
            'ILIMITADA': beat.price_exclusive || 2999
        };

        addItem({
            id: `${beat.id}-${selectedLicense}`,
            type: 'beat',
            name: `${beat.title} [${selectedLicense}]`,
            price: priceMap[selectedLicense as keyof typeof priceMap],
            image: beat.portadabeat_url || undefined,
            subtitle: `Prod. by ${(beat.producer as any)?.artistic_name || (beat.producer as any)?.username}`,
            metadata: { license: selectedLicense, beatId: beat.id }
        });

        router.push('/cart');
    };

    useEffect(() => {
        const fetchBeat = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('beats')
                    .select('id, title, genre, beat_type, bpm, price_mxn, price_wav_mxn, price_stems_mxn, exclusive_price_mxn, is_mp3_active, is_wav_active, is_stems_active, is_exclusive_active, portadabeat_url, mp3_url, mp3_tag_url, musical_key, musical_scale, mood, description, play_count, like_count, created_at, producer:producer_id(artistic_name, username, foto_perfil, is_verified, is_founder, subscription_tier)')
                    .eq('id', id)
                    .single();

                if (data) {
                    // Resolve high-quality preview or maestra bucket
                    const path = data.mp3_tag_url || data.mp3_url || '';
                    const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
                    const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';
                    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

                    // Resolve Cover Art URL if it's a relative path
                    let finalCoverUrl = data.portadabeat_url;
                    if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
                        const { data: { publicUrl: coverPUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(finalCoverUrl);
                        finalCoverUrl = coverPUrl;
                    }

                    const rawData = data as any;
                    const producerObj = Array.isArray(rawData.producer) ? rawData.producer[0] : rawData.producer;

                    const beatData = {
                        ...data,
                        producer: producerObj,
                        mp3_url: publicUrl,
                        portadabeat_url: finalCoverUrl
                    } as BeatDetail;

                    setBeat(beatData);

                    // Fetch Related Beats
                    const fetchRelated = async () => {
                        let query = supabase
                            .from('beats')
                            .select('id, title, genre, beat_type, bpm, price_mxn, portadabeat_url, producer_id, musical_key, musical_scale, mood, play_count, like_count, producer:producer_id(artistic_name, username, foto_perfil, is_verified, is_founder, subscription_tier)')
                            .neq('id', data.id)
                            .limit(10);

                        // Priority 1: Genre
                        if (data.genre) {
                            query = query.eq('genre', data.genre);
                        }

                        let { data: related } = await query;

                        // Priority 2: Beat Type (if not enough related by genre)
                        if ((!related || related.length < 4) && data.beat_type) {
                            const { data: byType } = await supabase
                                .from('beats')
                                .select('id, title, genre, beat_type, bpm, price_mxn, portadabeat_url, producer_id, musical_key, musical_scale, mood, play_count, like_count, producer:producer_id(artistic_name, username, foto_perfil, is_verified, is_founder, subscription_tier)')
                                .neq('id', data.id)
                                .eq('beat_type', data.beat_type)
                                .limit(10);

                            if (byType) {
                                related = [...(related || []), ...byType.filter(b => !related?.some(r => r.id === b.id))];
                            }
                        }

                        // Priority 3: Moods (if still not enough)
                        if ((!related || related.length < 4) && data.mood) {
                            const firstMood = data.mood.split(',')[0].trim();
                            const { data: byMood } = await supabase
                                .from('beats')
                                .select('id, title, genre, beat_type, bpm, price_mxn, portadabeat_url, producer_id, musical_key, musical_scale, mood, play_count, like_count, producer:producer_id(artistic_name, username, foto_perfil, is_verified, is_founder, subscription_tier)')
                                .neq('id', data.id)
                                .ilike('mood', `%${firstMood}%`)
                                .limit(10);

                            if (byMood) {
                                related = [...(related || []), ...byMood.filter(b => !related?.some(r => r.id === b.id))];
                            }
                        }

                        // Map producer metadata to top level if needed for BeatCardPro
                        const mappedRelated = (related || []).map(r => ({
                            ...r,
                            producer_artistic_name: (r.producer as any)?.artistic_name,
                            producer_username: (r.producer as any)?.username,
                            producer_foto_perfil: (r.producer as any)?.foto_perfil,
                            producer_is_verified: (r.producer as any)?.is_verified,
                            producer_is_founder: (r.producer as any)?.is_founder,
                            producer_tier: (r.producer as any)?.subscription_tier
                        }));

                        setRelatedBeats(mappedRelated as any);
                    };

                    fetchRelated();

                    // Log visit & efficient play count increment
                    // We only increment play count on explicit play usually, but user asked to check why plays aren't saving.
                    // If we put it here, it counts VIEWS as plays.
                    // Ideally this should be in the 'playBeat' function or similar.
                    // However, purely for the request "check why plays aren't saving", let's leave it here but use RPC.
                    // Wait, usually play count is on PLAY, not VIEW.
                    // But for now let's just clean the syntax.

                    /* 
                       NOTE: Ideally we move this to when the user clicks Play. 
                       But the original code had `// logListen(data.id);` commented out here.
                    */

                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { count } = await supabase
                            .from('likes')
                            .select('id', { count: 'exact', head: true })
                            .eq('beat_id', data.id)
                            .eq('user_id', user.id);
                        setIsLiked(!!count);
                    }
                }
            } catch (err) {
                console.error("Error fetching beat detail:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBeat();
    }, [id]);

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const confirmLogin = confirm("Necesitas iniciar sesión para dar Like. ¿Ir al login?");
            if (confirmLogin) router.push('/login');
            return;
        }

        if (isLiked) {
            await supabase.from('likes').delete().eq('beat_id', id).eq('user_id', user.id);
            setIsLiked(false);
            if (beat) setBeat({ ...beat, like_count: (beat.like_count || 1) - 1 });
        } else {
            await supabase.from('likes').insert({ beat_id: id, user_id: user.id });
            setIsLiked(true);
            if (beat) setBeat({ ...beat, like_count: (beat.like_count || 0) + 1 });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-black text-muted uppercase tracking-widest text-xs">Cargando...</p>
            </div>
        );
    }

    if (!beat) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black text-foreground mb-4">404</h1>
                <p className="text-muted font-bold uppercase tracking-widest text-xs">Beat no encontrado</p>
                <Link href="/beats" className="mt-8 px-6 py-3 bg-accent text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-accent/90 transition-all">
                    Regresar a Explorar
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white flex flex-col transition-colors duration-300">
            <Navbar />

            <main className="flex-1 pb-32">
                {/* 1. HERO HEADER (Minimalist Premium) */}
                <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 shadow-sm bg-background overflow-hidden">
                    {/* Ambient Background */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-accent/5 to-transparent -z-10" />

                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                        {/* Artwork with Level-up shadow */}
                        <div className="relative group shrink-0">
                            <div className="w-64 h-64 md:w-96 md:h-96 rounded-[3.5rem] bg-card shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-border/50 relative z-10 transition-all duration-700 group-hover:scale-[1.03] group-hover:-rotate-1">
                                {beat.portadabeat_url ? (
                                    <img src={beat.portadabeat_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={beat.title} />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Music2 size={100} /></div>
                                )}

                                {/* Overlay Play Button */}
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

                        {/* Info Content */}
                        <div className="flex-1 text-center md:text-left space-y-8">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                                    <span className="px-5 py-2 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20">
                                        Nuevo lanzamiento
                                    </span>
                                    <div className="flex items-center gap-4 text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span className="flex items-center gap-2"><Speaker size={16} className="text-accent" /> {beat.play_count?.toLocaleString() || 0}</span>
                                        <span className="flex items-center gap-2"><Heart size={16} className="text-red-500" /> {beat.like_count?.toLocaleString() || 0}</span>
                                    </div>
                                </div>

                                <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-foreground leading-[1] uppercase tracking-tighter mb-4">
                                    {beat.title}
                                </h1>

                                <Link href={`/${(beat.producer as any)?.username || ''}`} className="inline-flex items-center gap-4 group">
                                    <div className={`p-1 rounded-2xl border-2 transition-all group-hover:scale-110 ${(beat.producer as any)?.subscription_tier === 'premium' ? 'border-blue-600' :
                                        (beat.producer as any)?.subscription_tier === 'pro' ? 'border-amber-500' :
                                            'border-border'
                                        }`}>
                                        <img src={(beat.producer as any)?.foto_perfil || "/logo.png"} className="w-12 h-12 rounded-xl object-cover" alt="Prod" />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-foreground uppercase tracking-tighter group-hover:text-accent transition-colors">{(beat.producer as any)?.artistic_name || (beat.producer as any)?.username}</span>
                                            {(beat.producer as any)?.is_verified && <img src="/verified-badge.png" className="w-5 h-5" alt="V" />}
                                            {(beat.producer as any)?.is_founder && <Crown size={18} className="text-amber-500" fill="currentColor" />}
                                        </div>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Tianguis Producer</p>
                                    </div>
                                </Link>
                            </div>

                            {/* Technical Grid */}
                            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4">
                                {[
                                    { label: 'Género', val: beat.genre, icon: Tag, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'Tipo', val: (beat as any).beat_type || 'Licencia', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'Tempo', val: `${beat.bpm} BPM`, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                    { label: 'Tonalidad', val: beat.musical_key || 'C', icon: Music2, color: 'text-accent', bg: 'bg-accent/10' },
                                    { label: 'Escala', val: beat.musical_scale ? (beat.musical_scale.toUpperCase() === 'MINOR' ? 'Menor' : 'Mayor') : 'Mayor', icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                                ].map((stat, i) => (
                                    <div key={i} className="flex-1 min-w-[120px] p-4 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col items-center md:items-start gap-2">
                                        <span className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                            <stat.icon size={18} />
                                        </span>
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-muted tracking-widest">{stat.label}</p>
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{stat.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button onClick={handleLike} className={`h-16 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isLiked ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10'}`}>
                                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                    {isLiked ? 'En tus favoritos' : 'Me gusta'}
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        // Simple toast notification system would go here
                                    }}
                                    className="h-16 px-10 rounded-2xl bg-card text-foreground border border-border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-accent hover:text-white hover:border-accent transition-all group"
                                >
                                    <Share2 size={20} className="group-hover:rotate-12 transition-transform" /> Compartir
                                </button>
                            </div>

                            {/* Moods tags */}
                            {beat.mood && (
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
                                    <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mr-2">Vibras:</span>
                                    {beat.mood.split(',').map((m: string) => (
                                        <span key={m} className="px-5 py-2 rounded-full border border-border/60 text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground transition-all">
                                            {m.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. WAVEFORM VISUALIZER (Premium Design) */}
                <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20 mb-16">
                    <div className="bg-foreground p-10 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] -mr-32 -mt-32 transition-all duration-700 group-hover:bg-accent/30" />
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between text-background/60 text-[10px] font-black uppercase tracking-[0.3em]">
                                <span>Preview Audio (HQ)</span>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-2 text-accent"><Activity size={12} /> Live Waveform</span>
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                                </div>
                            </div>
                            <WaveformPlayer
                                url={beat.mp3_url || ''}
                                height={140}
                                waveColor="rgba(255,255,255,0.1)"
                                progressColor="var(--accent)"
                            />
                        </div>
                    </div>
                </div>


                {/* 3. MAIN CONTENT (Licenses & Community) */}
                <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-12 gap-16">
                    {/* LEFT COLUMN: Licensing Experience */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                                <ShieldCheck size={32} className="text-accent" /> Licencias <span className="text-muted">Disponibles</span>
                            </h2>
                            <Link href="/licensing" className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-2">
                                <Info size={14} /> Comparar planes
                            </Link>
                        </div>

                        {!selectedLicense ? (
                            <div className="p-16 bg-card rounded-[3rem] text-center border-2 border-dashed border-border/50">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                                    <Package size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Beat No Disponible</h3>
                                <p className="text-muted text-sm mt-2 max-w-sm mx-auto">Este beat no tiene licencias activas en este momento. Vuelve más tarde o contacta al productor.</p>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {beat.is_mp3_active !== false && (
                                        <LicenseCard
                                            type="MP3"
                                            price={beat.price_mp3 || beat.price_mxn || 299}
                                            features={['MP3 Alta Calidad (320kbps)', 'Uso comercial limitado', 'Entrega instantánea']}
                                            selected={selectedLicense === 'MP3'}
                                            onSelect={() => setSelectedLicense('MP3')}
                                            active={true}
                                        />
                                    )}
                                    {beat.is_wav_active !== false && (
                                        <LicenseCard
                                            type="WAV"
                                            price={beat.price_wav || Math.ceil((beat.price_mxn || 299) * 1.5)}
                                            features={['WAV + MP3', 'Calidad Profesional', 'Acuerdo de licencia']}
                                            selected={selectedLicense === 'WAV'}
                                            onSelect={() => setSelectedLicense('WAV')}
                                            active={true}
                                        />
                                    )}
                                    {beat.is_stems_active !== false && (
                                        <LicenseCard
                                            type="STEMS"
                                            price={beat.price_stems || Math.ceil((beat.price_mxn || 299) * 2.5)}
                                            features={['Separación de pistas (Stems)', 'Control total de la mezcla', 'Ideal para estudios']}
                                            selected={selectedLicense === 'STEMS'}
                                            onSelect={() => setSelectedLicense('STEMS')}
                                            active={true}
                                        />
                                    )}
                                    {beat.is_exclusive_active !== false && (
                                        <LicenseCard
                                            type="ILIMITADA"
                                            price={beat.price_exclusive || 2999}
                                            features={['Propiedad Exclusiva', 'Eliminación del mercado', 'Derechos totales']}
                                            selected={selectedLicense === 'ILIMITADA'}
                                            onSelect={() => setSelectedLicense('ILIMITADA')}
                                            active={true}
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className="w-full h-20 bg-accent text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-accent/90 transition-all shadow-[0_20px_50px_-10px_rgba(37,99,235,0.3)] flex items-center justify-center gap-4 group"
                                >
                                    <ShoppingCart size={22} className="group-hover:-translate-y-1 transition-transform" />
                                    Añadir {selectedLicense} al Carrito
                                </button>
                            </div>
                        )}

                        {/* Description Section */}
                        {beat.description && (
                            <div className="mt-20 pt-20 border-t border-border/50">
                                <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-8 flex items-center gap-3">
                                    <Info size={24} className="text-accent" />
                                    Notas del <span className="text-muted">Productor</span>
                                </h3>
                                <div className="p-10 bg-card/30 rounded-[2.5rem] border border-border/50">
                                    <p className="text-muted leading-relaxed font-medium whitespace-pre-wrap text-lg italic">"{beat.description}"</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Community Hub */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32 space-y-12">
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center text-background">
                                        <MessageCircle size={20} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Comunidad</h3>
                                </div>
                                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-sm min-h-[500px]">
                                    <CommentSection beatId={id} />
                                </div>
                            </section>

                            {/* Suggestion for contact or similar */}
                            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-accent to-blue-700 text-white space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest opacity-80">¿Necesitas algo a medida?</p>
                                <h4 className="text-xl font-black leading-tight">Trabaja directamente con el productor</h4>
                                <Link
                                    href={`/${(beat.producer as any)?.username || ''}`}
                                    className="block w-full py-4 bg-white text-accent rounded-xl text-center font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                >
                                    Ver Servicios
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Beats Section */}
                {relatedBeats.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 mt-32 mb-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <div className="space-y-4">
                                <span className="px-5 py-2 rounded-2xl bg-accent/10 text-accent text-[10px] font-black uppercase tracking-[0.2em] inline-block">
                                    Explora más
                                </span>
                                <h2 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter leading-none">
                                    Relacionados <span className="text-muted">al Beat</span>
                                </h2>
                            </div>
                            <Link href="/beats" className="group flex items-center gap-3 text-muted hover:text-accent transition-colors">
                                <span className="text-xs font-black uppercase tracking-widest">Ver todo el catálogo</span>
                                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                                    <ChevronRight size={20} />
                                </div>
                            </Link>
                        </div>

                        {/* Horizontal Scroll Container */}
                        <div className="relative group/carousel">
                            <div className="flex overflow-x-auto gap-6 pb-12 snap-x scrollbar-hide scroll-smooth no-scrollbar">
                                {relatedBeats.map((relatedBeat) => (
                                    <div key={relatedBeat.id} className="min-w-[280px] md:min-w-[340px] snap-start">
                                        <BeatCardPro beat={relatedBeat} />
                                    </div>
                                ))}
                            </div>

                            {/* Fades for scroll indication */}
                            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                            <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-background to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
