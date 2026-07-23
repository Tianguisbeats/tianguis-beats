"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Play, Pause, Heart, Share2, Music, Crown,
    CheckCircle2, ShoppingCart, MessageCircle, Package,
    Layers, Calendar, Globe, Tag, Zap,
    ChevronLeft, ExternalLink, Headphones, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommentSection from '@/components/CommentSection';
import WaveformPlayer from '@/components/WaveformPlayer';
import Link from 'next/link';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

interface SoundKit {
    id: string;
    titulo: string;
    descripcion?: string;
    url_portada?: string;
    portada_url?: string;
    archivo_muestra_url?: string;
    precio: number;
    precio_original?: number;
    categoria?: string;
    genero?: string;
    etiquetas?: string[];
    samples_incluidos?: number;
    formato?: string;
    vistas?: number;
    conteo_likes?: number;
    productor_id: string;
    creado_en?: string;
    // Datos del productor
    productor?: any;
    productor_nombre_artistico?: string;
    productor_nombre_usuario?: string;
    productor_foto_perfil?: string;
    productor_esta_verificado?: boolean;
    productor_es_fundador?: boolean;
    productor_nivel_suscripcion?: string;
}

export default function SoundKitDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolved = use(params);
    const id = resolved.id;

    const [kit, setKit] = useState<SoundKit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedKits, setRelatedKits] = useState<SoundKit[]>([]);

    const { currentBeat, isPlaying, playBeat, togglePlay, likedKitIds, toggleLike, likesCounts } = usePlayer();
    const { currentUserId, addItem, setIsCartOpen } = useCart();
    const { showToast } = useToast();

    const isCurrentPlaying = currentBeat?.id === id && isPlaying;
    const isLiked = likedKitIds.has(id);
    const displayLikes = likesCounts[id] ?? kit?.conteo_likes ?? 0;
    const isOwner = !!(currentUserId && kit && kit.productor_id === currentUserId);

    // Cargar el Sound Kit
    useEffect(() => {
        const fetchKit = async () => {
            try {
                setLoading(true);
                // Consulta el kit desde kits_sonido
                const { data, error: fetchErr } = await supabase
                    .from('kits_sonido')
                    .select('*, producer:productor_id(nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion)')
                    .eq('id', id)
                    .single();

                if (fetchErr) throw fetchErr;
                if (!data) throw new Error('Sound Kit no encontrado');

                const raw = data as any;
                const prod = Array.isArray(raw.producer) ? raw.producer[0] : raw.producer;

                // Resolver URL de portada
                let portadaUrl = raw.url_portada || raw.portada_url || '';
                if (portadaUrl && !portadaUrl.startsWith('http')) {
                    const { data: { publicUrl } } = supabase.storage.from('portadas_kits_sonido').getPublicUrl(portadaUrl);
                    portadaUrl = publicUrl;
                }

                // Resolver URL de muestra
                let muestraUrl = raw.archivo_muestra_url || '';
                if (muestraUrl && !muestraUrl.startsWith('http')) {
                    const { data: { publicUrl } } = supabase.storage.from('muestra_soundkit').getPublicUrl(muestraUrl);
                    muestraUrl = publicUrl;
                }

                // Resolver foto del productor
                let fotoProd = prod?.foto_perfil || '';
                if (fotoProd && !fotoProd.startsWith('http')) {
                    const { data: { publicUrl } } = supabase.storage.from('fotos_perfil').getPublicUrl(fotoProd);
                    fotoProd = publicUrl;
                }

                const kitData: SoundKit = {
                    ...raw,
                    url_portada: portadaUrl,
                    portada_url: portadaUrl,
                    archivo_muestra_url: muestraUrl,
                    productor_nombre_artistico: prod?.nombre_artistico,
                    productor_nombre_usuario: prod?.nombre_usuario,
                    productor_foto_perfil: fotoProd,
                    productor_esta_verificado: prod?.esta_verificado,
                    productor_es_fundador: prod?.es_fundador,
                    productor_nivel_suscripcion: prod?.nivel_suscripcion,
                };
                setKit(kitData);

                // Kits relacionados
                const { data: related } = await supabase
                    .from('kits_sonido')
                    .select('*, producer:productor_id(nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador)')
                    .neq('id', id)
                    .limit(6);

                if (related) {
                    setRelatedKits(related.map((k: any) => {
                        const kprod = Array.isArray(k.producer) ? k.producer[0] : k.producer;
                        return { ...k, productor_nombre_artistico: kprod?.nombre_artistico, productor_nombre_usuario: kprod?.nombre_usuario };
                    }));
                }
            } catch (err: any) {
                console.error('Error al cargar Sound Kit:', err);
                setError(err.message || 'Error al cargar el Sound Kit');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchKit();
    }, [id]);

    const handlePlay = () => {
        if (!kit) return;
        if (currentBeat?.id === kit.id) {
            togglePlay();
        } else {
            playBeat({
                id: kit.id,
                titulo: kit.titulo,
                product_type: 'sound_kit',
                archivo_muestra_url: kit.archivo_muestra_url,
                archivo_mp3_url: kit.archivo_muestra_url,
                portada_url: kit.url_portada || kit.portada_url,
                productor_id: kit.productor_id,
                productor_nombre_artistico: kit.productor_nombre_artistico,
                productor_nombre_usuario: kit.productor_nombre_usuario,
                productor_foto_perfil: kit.productor_foto_perfil,
                productor_esta_verificado: kit.productor_esta_verificado,
                productor_es_fundador: kit.productor_es_fundador,
                precio_base: kit.precio,
                tipo: 'kit',
            } as any);
        }
    };

    const handleAddToCart = () => {
        if (!kit) return;
        const added = addItem({
            id: `kit-${kit.id}`,
            type: 'sound_kit',
            name: kit.titulo,
            price: kit.precio,
            image: kit.url_portada || undefined,
            subtitle: `Prod. by ${kit.productor_nombre_artistico || kit.productor_nombre_usuario}`,
            metadata: { kitId: kit.id, productor_id: kit.productor_id }
        });

        if (added) setIsCartOpen(true);
    };

    const handleLike = async () => {
        if (!currentUserId) {
            showToast('Inicia sesión para dar like', 'info');
            return;
        }
        await toggleLike(id, 'sound_kit');
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: kit?.titulo, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast('¡Enlace copiado!', 'success');
        }
    };

    // ── Estados de carga ──
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                    <div className="absolute inset-3 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Music size={24} className="text-orange-500" />
                    </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 animate-pulse">Cargando Sound Kit...</p>
            </div>
        );
    }

    if (error || !kit) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                        <Package className="text-orange-500" size={40} />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-3">Sound Kit no encontrado</h2>
                    <p className="text-muted text-sm mb-8">Este kit no existe o ha sido eliminado.</p>
                    <Link href="/sound-kits" className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
                        Ver todos los Kits
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const producerName = kit.productor_nombre_artistico || kit.productor_nombre_usuario || 'Productor';
    const descuento = kit.precio_original && kit.precio_original > kit.precio
        ? Math.round((1 - kit.precio / kit.precio_original) * 100)
        : null;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-orange-500 selection:text-white flex flex-col">
            <Navbar />

            {/* ── HERO CON FONDO DINÁMICO ── */}
            <div className="relative w-full overflow-hidden">
                {/* Background art blur */}
                {kit.url_portada && (
                    <div className="absolute inset-0 z-0">
                        <Image src={kit.url_portada} alt="" fill sizes="100vw" className="object-cover scale-110"
                            style={{ filter: 'blur(80px) saturate(1.8) brightness(0.3)' }} />
                        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
                    </div>
                )}
                {!kit.url_portada && (
                    <div className="absolute inset-0 z-0"
                        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, transparent 60%)' }} />
                )}

                <div className="relative z-10 max-w-7xl mx-auto px-4 pt-8 pb-0 md:pt-12">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-muted">
                        <Link href="/sound-kits" className="flex items-center gap-1.5 hover:text-orange-500 transition-colors">
                            <ChevronLeft size={14} /> Sound Kits
                        </Link>
                        <span className="opacity-30">/</span>
                        <span className="text-orange-500 truncate max-w-[200px]">{kit.titulo}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
                        {/* ── PORTADA ── */}
                        <div className="w-full lg:w-[380px] shrink-0">
                            <div className="relative group">
                                {/* Marco con glow naranja */}
                                <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border-2 border-orange-500/20 shadow-2xl shadow-orange-500/10"
                                    style={{ background: 'rgba(249,115,22,0.05)' }}>
                                    {kit.url_portada ? (
                                        <Image src={kit.url_portada} alt={kit.titulo} fill sizes="(max-width: 1024px) 100vw, 380px" priority
                                            className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))' }}>
                                            <div className="text-center">
                                                <Package size={80} className="text-orange-500/30 mx-auto mb-3" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/40">Sound Kit</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Overlay play button */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                                        <button onClick={handlePlay}
                                            className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all scale-90 hover:scale-100 active:scale-95"
                                            style={{ background: '#f97316', boxShadow: '0 8px 40px rgba(249,115,22,0.5)' }}>
                                            {isCurrentPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Etiquetas sobre la portada */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg"
                                        style={{ background: '#f97316' }}>
                                        Sound Kit
                                    </span>
                                    {descuento && (
                                        <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg bg-green-600">
                                            -{descuento}% OFF
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Waveform preview */}
                            {kit.archivo_muestra_url && (
                                <div className="mt-4 px-2">
                                    <div className="h-14 rounded-2xl overflow-hidden border border-orange-500/10 p-2"
                                        style={{ background: 'rgba(249,115,22,0.04)' }}>
                                        <WaveformPlayer
                                            url={kit.archivo_muestra_url}
                                            height={40}
                                            waveColor="rgba(249,115,22,0.4)"
                                            progressColor="#f97316"
                                            beatId={kit.id}
                                            hideControls
                                            isSync
                                            muted
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── INFO PRINCIPAL ── */}
                        <div className="flex-1 min-w-0 pb-10">

                            {/* Chips de categoría */}
                            <div className="flex flex-wrap gap-2 mb-5">
                                {kit.categoria && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-500/20 text-orange-500"
                                        style={{ background: 'rgba(249,115,22,0.08)' }}>
                                        <Layers size={11} /> {kit.categoria}
                                    </span>
                                )}
                                {kit.genero && (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-border text-muted">
                                        <Tag size={11} /> {kit.genero}
                                    </span>
                                )}
                            </div>

                            {/* Título */}
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none text-foreground mb-4">
                                {kit.titulo}
                            </h1>

                            {/* Productor card */}
                            <Link href={`/${kit.productor_nombre_usuario}`}
                                className="flex items-center gap-3 mb-6 group/prod w-fit">
                                <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-orange-500/20 shadow-lg shrink-0">
                                    {kit.productor_foto_perfil ? (
                                        <Image src={kit.productor_foto_perfil} alt={producerName} fill sizes="48px" className="object-cover group-hover/prod:scale-110 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                            <Music size={18} className="text-orange-500" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-sm uppercase tracking-tight text-foreground group-hover/prod:text-orange-500 transition-colors">
                                            {producerName}
                                        </span>
                                        {kit.productor_esta_verificado && (
                                            <Image src="/verified-badge.png" width={16} height={16} className="w-4 h-4" alt="Verificado" />
                                        )}
                                        {kit.productor_es_fundador && (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/20"
                                                style={{ background: 'rgba(245,158,11,0.08)' }}>
                                                <Crown size={9} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Ver perfil →</span>
                                </div>
                            </Link>

                            {/* Stats bar */}
                            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{ background: 'rgba(249,115,22,0.1)' }}>
                                        <Heart size={14} className={isLiked ? 'text-red-500 fill-red-500' : 'text-orange-500'} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-muted font-black uppercase tracking-widest">Likes</p>
                                        <p className="font-black text-sm text-foreground">{displayLikes.toLocaleString('es-MX')}</p>
                                    </div>
                                </div>
                                {kit.samples_incluidos && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                            style={{ background: 'rgba(249,115,22,0.1)' }}>
                                            <Headphones size={14} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-muted font-black uppercase tracking-widest">Samples</p>
                                            <p className="font-black text-sm text-foreground">{kit.samples_incluidos}</p>
                                        </div>
                                    </div>
                                )}
                                {kit.formato && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                            style={{ background: 'rgba(249,115,22,0.1)' }}>
                                            <Package size={14} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-muted font-black uppercase tracking-widest">Formato</p>
                                            <p className="font-black text-sm text-foreground">{kit.formato}</p>
                                        </div>
                                    </div>
                                )}
                                {kit.creado_en && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                            style={{ background: 'rgba(249,115,22,0.1)' }}>
                                            <Calendar size={14} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-muted font-black uppercase tracking-widest">Publicado</p>
                                            <p className="font-black text-sm text-foreground">
                                                {new Date(kit.creado_en).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Descripción */}
                            {kit.descripcion && (
                                <p className="text-sm text-muted leading-relaxed mb-8 max-w-xl">
                                    {kit.descripcion}
                                </p>
                            )}

                            {/* Etiquetas */}
                            {kit.etiquetas && kit.etiquetas.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {kit.etiquetas.map((tag, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-border text-muted hover:border-orange-500/40 hover:text-orange-500 transition-colors cursor-default">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* CTA Block */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Precio */}
                                <div className="flex flex-col">
                                    {kit.precio_original && kit.precio_original > kit.precio && (
                                        <span className="text-xs line-through text-muted font-bold">
                                            ${kit.precio_original.toLocaleString('es-MX')} MXN
                                        </span>
                                    )}
                                    <span className="text-4xl font-black text-foreground tracking-tighter">
                                        ${kit.precio.toLocaleString('es-MX')}
                                        <span className="text-sm text-muted ml-1 font-bold">MXN</span>
                                    </span>
                                </div>

                                {/* Botones */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    {/* Play */}
                                    <button onClick={handlePlay}
                                        className="h-14 px-7 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
                                        style={{ background: '#f97316', boxShadow: '0 8px 30px rgba(249,115,22,0.35)' }}>
                                        {isCurrentPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                        {isCurrentPlaying ? 'Pausar' : 'Previsualizar'}
                                    </button>

                                    {/* Comprar */}
                                    {!isOwner && (
                                        <button onClick={handleAddToCart}
                                            className="h-14 px-7 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest border-2 border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all hover:scale-105 active:scale-95">
                                            <ShoppingCart size={16} /> Comprar
                                        </button>
                                    )}

                                    {/* Like */}
                                    <button onClick={handleLike}
                                        className={`h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-90 ${isLiked
                                            ? 'text-red-500 bg-red-500/10 border-red-500/30'
                                            : 'text-muted hover:text-red-500 border-border hover:border-red-500/30 hover:bg-red-500/5'}`}>
                                        <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                                    </button>

                                    {/* Compartir */}
                                    <button onClick={handleShare}
                                        className="h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-border text-muted hover:text-foreground hover:border-border/60 transition-all hover:scale-110 active:scale-90">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Garantía */}
                            <div className="flex items-center gap-2 mt-5 text-[10px] font-bold uppercase tracking-widest text-muted">
                                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                Archivo de alta calidad · Descarga inmediata · Licencia incluida
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECCIÓN DE CONTENIDO INFERIOR ── */}
            <div className="max-w-7xl mx-auto px-4 w-full py-12 flex flex-col gap-16">

                {/* Comentarios */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(249,115,22,0.1)' }}>
                            <MessageCircle size={18} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Comentarios</h2>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Deja tu opinión sobre este kit</p>
                        </div>
                    </div>
                    <CommentSection beatId={kit.id} />
                </section>

                {/* Kits Relacionados */}
                {relatedKits.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'rgba(249,115,22,0.1)' }}>
                                    <Star size={18} className="text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Más Sound Kits</h2>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Explora otros kits del catálogo</p>
                                </div>
                            </div>
                            <Link href="/sound-kits"
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:gap-3 transition-all">
                                Ver todos <ExternalLink size={12} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {relatedKits.map(rk => (
                                <Link href={`/sound-kits/${rk.id}`} key={rk.id}
                                    className="group relative flex flex-col rounded-[1.5rem] overflow-hidden border border-border hover:border-orange-500/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5">
                                    <div className="aspect-square overflow-hidden relative">
                                        {rk.url_portada ? (
                                            <Image src={rk.url_portada} alt={rk.titulo} fill sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-orange-500/5">
                                                <Package size={32} className="text-orange-500/30" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <div className="p-3 bg-card">
                                        <p className="font-black text-[11px] uppercase tracking-tight text-foreground truncate">{rk.titulo}</p>
                                        <p className="text-[9px] text-muted font-bold uppercase truncate mt-0.5">{rk.productor_nombre_artistico || rk.productor_nombre_usuario}</p>
                                        <p className="font-black text-xs text-orange-500 mt-1">${rk.precio.toLocaleString('es-MX')}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <Footer />
        </div>
    );
}
