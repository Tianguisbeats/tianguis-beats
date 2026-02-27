"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Music, ArrowLeft, Search, Loader2, Play, Heart, Crown,
    Share2, CheckCircle2, Flame, Zap, BarChart2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCardPro from '@/components/explore/BeatCardPro';
import { Beat, Profile } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';

export default function ProducerBeatsPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [beats, setBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeGenre, setActiveGenre] = useState('Todos');
    const { showToast } = useToast();

    const fetchAll = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            const { data: profileData } = await supabase
                .from('perfiles').select('*').eq('nombre_usuario', username).single();

            if (profileData) {
                setProfile(profileData);
                if (user?.id === profileData.id) setIsOwner(true);

                const { data: beatsData } = await supabase
                    .from('beats').select('*')
                    .eq('productor_id', profileData.id)
                    .eq('es_publico', true)
                    .order('fecha_creacion', { ascending: false });

                if (beatsData) {
                    const transformed = await Promise.all(beatsData.map(async (b: any) => {
                        const path = b.archivo_muestra_url || b.archivo_mp3_url || '';
                        const bucket = path === b.archivo_muestra_url ? 'muestras_beats' : 'beats_mp3';
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
                    setBeats(transformed);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [username]);

    const totalLikes = beats.reduce((a, b) => a + (b.conteo_likes || 0), 0);
    const totalPlays = beats.reduce((a, b) => a + (b.conteo_reproducciones || 0), 0);
    const genres = ['Todos', ...new Set(beats.map(b => b.genero).filter(Boolean) as string[])];

    const filteredBeats = beats.filter(b => {
        const matchSearch = b.titulo.toLowerCase().includes(searchQuery.toLowerCase());
        const matchGenre = activeGenre === 'Todos' || b.genero === activeGenre;
        return matchSearch && matchGenre;
    });

    if (loading) return <LoadingTianguis />;
    if (!profile) return null;

    const tierColor = profile.nivel_suscripcion === 'premium' ? '#00f2ff'
        : profile.nivel_suscripcion === 'pro' ? '#f59e0b' : '#64748b';

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-accent selection:text-white">
            <Navbar />

            {/* ── 1. CABECERA DEL PRODUCTOR (HERO) ── 
                Muestra la identidad del productor y sus estadísticas globales. 
                Optimizado para apilarse en móviles y expandirse en escritorio.
            */}
            <div className="relative border-b border-border bg-card overflow-hidden">
                {/* Efectos de luz ambiental */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-1/2 -left-1/4 w-[80%] h-[200%] rounded-full blur-[120px] opacity-[0.07]"
                        style={{ backgroundColor: tierColor }} />
                    <div className="absolute -top-1/2 right-0 w-[40%] h-[200%] rounded-full blur-[150px] opacity-[0.04] bg-accent" />
                </div>

                <div className="relative max-w-[1700px] mx-auto px-4 sm:px-10 pt-8 pb-12">
                    {/* Enlace de retroceso */}
                    <Link href={`/${username}`}
                        className="inline-flex items-center gap-2 text-muted hover:text-accent font-black text-[9px] uppercase tracking-[0.3em] mb-8 group transition-all">
                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Volver al Perfil
                    </Link>

                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-10 text-center md:text-left">

                        {/* Foto de Perfil / Avatar */}
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 rounded-[3rem] blur-2xl scale-90 opacity-30"
                                style={{ backgroundColor: tierColor }} />
                            <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-[3rem] overflow-hidden border-2 shadow-2xl"
                                style={{ borderColor: `${tierColor}60` }}>
                                {profile.foto_perfil
                                    ? <img src={profile.foto_perfil} className="w-full h-full object-cover" alt="Avatar" />
                                    : <div className="w-full h-full bg-foreground/5 flex items-center justify-center text-muted"><Music size={52} strokeWidth={1} /></div>}
                            </div>
                            {profile.esta_verificado && (
                                <div className="absolute -bottom-2 -right-2 w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center border-2 border-background shadow-xl"
                                    style={{ backgroundColor: tierColor }}>
                                    <CheckCircle2 size={16} className="text-white" fill="white" />
                                </div>
                            )}
                        </div>

                        {/* Información y Títulos */}
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
                                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted px-3 py-1 bg-foreground/5 border border-border rounded-full">
                                    Catálogo Completo
                                </span>
                                {profile.es_fundador && (
                                    <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                                        <Crown size={11} fill="currentColor" /> Founder
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground leading-none mb-6">
                                {profile.nombre_artistico || profile.nombre_usuario}
                            </h1>

                            {/* Fila de Estadísticas */}
                            <div className="flex items-center justify-center md:justify-start gap-6 md:gap-8 flex-wrap">
                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <Music size={14} className="text-accent" />
                                        <span className="text-2xl font-black tabular-nums text-foreground">{beats.length}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest">Beats</span>
                                </div>
                                <div className="hidden md:block w-px h-5 bg-border" />
                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <Heart size={14} className="text-rose-400" />
                                        <span className="text-2xl font-black tabular-nums text-foreground">{totalLikes.toLocaleString('es-MX')}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest">Likes</span>
                                </div>
                                <div className="hidden md:block w-px h-5 bg-border" />
                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <BarChart2 size={14} className="text-accent" />
                                        <span className="text-2xl font-black tabular-nums text-accent">{totalPlays.toLocaleString('es-MX')}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest">Plays</span>
                                </div>
                                <div className="hidden md:block w-px h-5 bg-border" />
                                <button
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('¡Enlace copiado!', 'success'); }}
                                    className="px-4 py-2 bg-foreground/5 border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground/20 transition-all flex items-center gap-2">
                                    <Share2 size={12} /> Compartir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2. CONTENIDO PRINCIPAL (LISTADO) ── 
                Incluye la barra de búsqueda, filtros por género y la rejilla de beats.
            */}
            <main className="flex-1 pt-8 pb-20">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-10">

                    {/* Barra de Búsqueda y Filtros */}
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="relative group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar beat..."
                                className="w-full h-12 bg-card border border-border rounded-2xl pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-accent/50 transition-all text-foreground placeholder:text-muted"
                            />
                        </div>
                        {/* Selector de Géneros */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {genres.map(g => (
                                <button key={g} onClick={() => setActiveGenre(g)}
                                    className={`whitespace-nowrap px-4 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeGenre === g
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'bg-card border border-border text-muted hover:text-foreground hover:border-foreground/20'}`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contador de Resultados */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted">
                            {filteredBeats.length} {filteredBeats.length === 1 ? 'beat' : 'beats'} en catálogo
                        </span>
                    </div>

                    {/* Rejilla de Beats - Optimizada para dispositivos móviles */}
                    {filteredBeats.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {filteredBeats.map((beat, idx) => (
                                <div key={beat.id}
                                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                                    style={{ animationDelay: `${idx * 40}ms` }}>
                                    <BeatCardPro beat={beat} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Estado Vacío / Sin Resultados */
                        <div className="py-24 text-center bg-foreground/[0.02] border-2 border-dashed border-border rounded-[3rem]">
                            <div className="w-16 h-16 bg-foreground/5 border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 text-muted">
                                <Music size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">Sin Resultados</h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">
                                Intenta con otros filtros o términos de búsqueda
                            </p>
                            {(searchQuery || activeGenre !== 'Todos') && (
                                <button onClick={() => { setSearchQuery(''); setActiveGenre('Todos'); }}
                                    className="px-5 py-2.5 bg-card border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
