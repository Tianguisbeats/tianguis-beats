"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Music, SlidersHorizontal, ArrowLeft, Clock, TrendingUp, Sparkles, Trophy, Gem, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Beat } from "@/lib/types";
import { GENRES, MUSICAL_KEYS } from "@/lib/constants";
import AdvancedFilterSidebar from "@/components/explore/AdvancedFilterSidebar";
import BeatCardPro from "@/components/explore/BeatCardPro";

export default function BeatsCatalogPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        }>
            <CatalogContent />
        </Suspense>
    );
}

type ViewMode = 'all' | 'new' | 'trending' | 'best_sellers' | 'hidden_gems' | 'recommended' | 'exclusives' | 'corridos_tumbados' | 'reggaeton_mexa';

function CatalogContent() {
    const [beats, setBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('all');

    const [filterState, setFilterState] = useState({
        searchQuery: "",
        genre: "Todos",
        subgenre: "",
        bpmMin: "" as number | string,
        bpmMax: "" as number | string,
        tonoEscala: "",
        vibe: "",
        mood: "",
        refArtist: "",
        beatType: "",
        priceRange: [0, 10000] as [number, number]
    });

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const v = searchParams.get('view');
        const q = searchParams.get('q');
        const g = searchParams.get('genre');
        const m = searchParams.get('mood');
        const k = searchParams.get('key') || searchParams.get('tonoEscala');
        const b = searchParams.get('bpm');
        const ra = searchParams.get('artist') || searchParams.get('refArtist');
        const bt = searchParams.get('beat_type') || searchParams.get('beatType');

        if (v) setViewMode(v as ViewMode);

        setFilterState(prev => ({
            ...prev,
            searchQuery: q || prev.searchQuery,
            genre: g || prev.genre,
            mood: m || prev.mood,
            tonoEscala: k || prev.tonoEscala,
            refArtist: ra || prev.refArtist,
            beatType: bt || prev.beatType,
            bpmMin: b ? parseInt(b) : prev.bpmMin,
            bpmMax: b ? parseInt(b) : prev.bpmMax,
            subgenre: searchParams.get('subgenre') || prev.subgenre,
        }));
    }, [searchParams]);

    const transformBeat = async (b: any) => {
        // Priorizar archivo_muestra_url para ahorrar ancho de banda
        const path = b.archivo_muestra_url || b.archivo_mp3_url || '';
        const encodedPath = path;

        // Usar buckets unificados en español
        const bucket = path === b.archivo_muestra_url ? 'muestras_beats' : 'beats_mp3';
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

        let finalCoverUrl = b.portada_url;
        if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
            const { data: { publicUrl: cpUrl } } = supabase.storage.from('portadas_beats').getPublicUrl(finalCoverUrl);
            finalCoverUrl = cpUrl;
        }

        let finalProducerAvatar = b.productor_foto_perfil;
        if (finalProducerAvatar && !finalProducerAvatar.startsWith('http')) {
            const { data: { publicUrl: paUrl } } = supabase.storage.from('fotos_perfil').getPublicUrl(finalProducerAvatar);
            finalProducerAvatar = paUrl;
        }

        return {
            ...b,
            portada_url: finalCoverUrl,
            archivo_mp3_url: publicUrl,
            productor_foto_perfil: finalProducerAvatar
        };
    };

    const BeatSkeleton = () => (
        <div className="bg-card rounded-[2.5rem] p-6 border border-border shadow-soft animate-pulse flex flex-col h-full">
            <div className="aspect-square bg-accent-soft rounded-[2rem] mb-6"></div>
            <div className="h-5 bg-accent-soft rounded-full w-3/4 mb-4"></div>
            <div className="h-3 bg-accent-soft rounded-full w-1/2 mb-8"></div>
            <div className="mt-auto flex justify-between items-center bg-accent-soft/30 p-4 rounded-2xl">
                <div className="h-5 bg-accent-soft rounded-full w-12"></div>
                <div className="h-8 bg-accent-soft rounded-xl w-20"></div>
            </div>
        </div>
    );

    const TabButton = ({ mode, label, icon: Icon }: { mode: string; label: string; icon: any }) => {
        const isActive = viewMode === mode;
        return (
            <button
                onClick={() => setViewMode(mode as any)}
                className={`snap-center flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-t-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap min-h-[48px] relative ${isActive
                    ? `bg-background text-accent border-x border-t border-border -mb-[1px] z-10`
                    : 'bg-card/50 text-muted hover:text-foreground border-transparent hover:bg-card'
                    }`}
            >
                <Icon size={14} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-accent' : ''} />
                <span>{label}</span>
            </button>
        );
    };

    const genresFromData = useMemo(() => ["Todos", ...GENRES], []);

    useEffect(() => {
        let cancel = false;
        async function load() {
            try {
                setLoading(true);
                setErrorMsg(null);

                let query = supabase
                    .from("beats_busqueda")
                    .select("*")
                    .eq("es_publico", true);

                if (filterState.genre !== 'Todos') query = query.eq('genero', filterState.genre);
                if (filterState.subgenre) query = query.eq('subgenero', filterState.subgenre);
                if (filterState.mood) query = query.ilike('vibras', `%${filterState.mood}%`);
                if (filterState.bpmMin) query = query.gte('bpm', filterState.bpmMin);
                if (filterState.bpmMax) query = query.lte('bpm', filterState.bpmMax);
                if (filterState.tonoEscala) {
                    const selectedKey = MUSICAL_KEYS.find(k => k.value === filterState.tonoEscala);
                    if (selectedKey?.enharmonic) {
                        query = query.in('tono_escala', [selectedKey.value, selectedKey.enharmonic]);
                    } else {
                        query = query.eq('tono_escala', filterState.tonoEscala);
                    }
                }

                if (filterState.vibe) {
                    const keysForVibe = MUSICAL_KEYS.filter(k => k.vibe === filterState.vibe).map(k => k.value);
                    query = query.in('tono_escala', keysForVibe);
                }

                if (filterState.searchQuery.trim()) {
                    const q = filterState.searchQuery.trim();
                    if (q.startsWith('@')) {
                        const username = q.substring(1);
                        query = query.ilike('productor_nombre_usuario', `%${username}%`);
                    } else {
                        query = query.or(`titulo.ilike.%${q}%,productor_nombre_artistico.ilike.%${q}%,productor_nombre_usuario.ilike.%${q}%`);
                    }
                }

                if (filterState.refArtist.trim()) {
                    const ra = filterState.refArtist.trim();
                    // Búsqueda parcial "letra por letra"
                    query = query.ilike('artista_referencia', `%${ra}%`);
                }

                switch (viewMode) {
                    case 'new':
                        query = query.order("fecha_creacion", { ascending: false });
                        break;
                    case 'trending':
                        // Priorizar plays
                        query = query.order("conteo_reproducciones", { ascending: false, nullsFirst: false });
                        break;
                    case 'best_sellers':
                        // Priorizar ventas
                        query = query.order("conteo_ventas", { ascending: false, nullsFirst: false });
                        break;
                    case 'hidden_gems':
                        // "Joyas": Free users con pocas reproducciones totales pero buen engagement
                        query = query.eq('productor_nivel_suscripcion', 'free').lte('conteo_reproducciones', 1500).order("conteo_likes", { ascending: false });
                        break;
                    case 'recommended':
                        // "Recomendados IA": Priority to Premium Users
                        query = query.eq('productor_nivel_suscripcion', 'premium').order("conteo_reproducciones", { ascending: false });
                        break;
                    case 'corridos_tumbados':
                        query = query.eq('genero', 'Corridos Tumbados 🇲🇽').order("fecha_creacion", { ascending: false });
                        break;
                    case 'reggaeton_mexa':
                        query = query.eq('genero', 'Reggaetón Mexa 🇲🇽').order("fecha_creacion", { ascending: false });
                        break;
                    default:
                        query = query.order("fecha_creacion", { ascending: false });
                        break;
                }

                const { data, error } = await query.limit(50);
                if (cancel) return;
                if (error) { setErrorMsg(error.message); return; }

                let transformed = await Promise.all((data || []).map(async (b: any) => {
                    return transformBeat(b);
                }));

                // Multi-tier priority sorting for 'all' mode
                if (viewMode === 'all') {
                    const tierOrder: any = { premium: 0, pro: 1, free: 2 };
                    transformed.sort((a, b) => {
                        const tierA = tierOrder[a.productor_nivel_suscripcion as any] ?? 3;
                        const tierB = tierOrder[b.productor_nivel_suscripcion as any] ?? 3;
                        if (tierA !== tierB) return tierA - tierB;
                        return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
                    });
                }

                setBeats(transformed);
            } catch (err) {
                console.error(err);
                setErrorMsg("Error al cargar.");
            } finally {
                setLoading(false);
            }
        }
        load();
        return () => { cancel = true; };
    }, [filterState, viewMode]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white flex flex-col transition-colors duration-300">
            <Navbar />
            {/* pb-24 en móvil: reserva espacio para MobileBottomNav + AudioPlayer */}
            <main className="flex-1 pb-24 md:pb-20 relative">


                {/* ── Premium Hero Header ── */}
                <div className="border-b border-border bg-card relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-40%] left-[-5%] w-[40%] h-[200%] bg-accent/[0.03] blur-[100px] rounded-full" />
                        <div className="absolute top-[-40%] right-[-5%] w-[30%] h-[200%] bg-purple-500/[0.03] blur-[100px] rounded-full" />
                    </div>
                    <div className="max-w-[1700px] mx-auto px-4 sm:px-10 py-12 relative">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent">Catálogo en vivo</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground leading-none mb-2">
                                    Explorar<br /><span className="text-accent">Beats.</span>
                                </h1>
                                <p className="text-muted text-[10px] font-black uppercase tracking-widest">
                                    {loading ? 'Cargando...' : `${beats.length} beats · filtros activos`}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {[{ href: '/beats/catalog?view=corridos_tumbados', label: '🎺 Corridos Tumbados' },
                                { href: '/beats/catalog?view=reggaeton_mexa', label: '🍑 Reggaetón Mexa' },
                                { href: '/beats/catalog?view=trending', label: '🔥 Trending' }].map(l => (
                                    <Link key={l.href} href={l.href}
                                        className="px-4 py-2 bg-foreground/5 border border-border rounded-full text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground/20 transition-all">
                                        {l.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 px-4 sm:px-10 max-w-[1700px] mx-auto w-full">
                    <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
                        <AdvancedFilterSidebar
                            filterState={filterState}
                            setFilterState={setFilterState}
                            genres={genresFromData}
                            totalBeats={beats.length}
                            isOpen={isSidebarOpen}
                            onClose={() => setIsSidebarOpen(false)}
                        />

                        <div className="flex-1 w-full min-w-0">
                            <div className="flex items-center justify-between mb-8">
                                <Link href="/beats" className="flex items-center gap-2 text-muted hover:text-accent font-black uppercase text-[10px] tracking-widest transition-all">
                                    <ArrowLeft size={14} strokeWidth={3} />
                                    Regresar al Tianguis
                                </Link>
                                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-card border border-border text-foreground rounded-xl shadow-lg active:scale-95 transition-all hover:bg-accent-soft hover:text-accent hover:border-accent/20">
                                    <SlidersHorizontal size={16} />
                                </button>
                            </div>

                            <div className="relative w-full mb-12 group/tabs">
                                <button
                                    onClick={() => {
                                        const container = document.getElementById('tabs-container');
                                        if (container) {
                                            if (container.scrollLeft <= 0) {
                                                container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
                                            } else {
                                                container.scrollBy({ left: -300, behavior: 'smooth' });
                                            }
                                        }
                                    }}
                                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-card border border-border rounded-full shadow-lg hidden md:flex items-center justify-center hover:scale-110 active:scale-95"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                <div id="tabs-container" className="flex items-end gap-1 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth justify-start border-b border-border px-10">
                                    <TabButton mode="all" label="Todos" icon={Music} />
                                    <TabButton mode="corridos_tumbados" label="Corridos Tumbados 🇲🇽" icon={Zap} />
                                    <TabButton mode="reggaeton_mexa" label="Reggaetón Mexa 🇲🇽" icon={Zap} />
                                    <TabButton mode="new" label="Nuevos" icon={Clock} />
                                    <TabButton mode="trending" label="Tendencias" icon={TrendingUp} />
                                    <TabButton mode="best_sellers" label="Más comprados" icon={Trophy} />
                                    <TabButton mode="hidden_gems" label="Joyas" icon={Gem} />
                                    <TabButton mode="recommended" label="Recomendados IA" icon={Zap} />
                                </div>

                                <button
                                    onClick={() => {
                                        const container = document.getElementById('tabs-container');
                                        if (container) {
                                            const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
                                            if (isAtEnd) {
                                                container.scrollTo({ left: 0, behavior: 'smooth' });
                                            } else {
                                                container.scrollBy({ left: 300, behavior: 'smooth' });
                                            }
                                        }
                                    }}
                                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-card border border-border rounded-full shadow-lg hidden md:flex items-center justify-center hover:scale-110 active:scale-95"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                                    {[...Array(10)].map((_, i) => <BeatSkeleton key={i} />)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                                    {beats.length > 0 ? beats.map((beat) => (
                                        <div key={beat.id} className="h-full">
                                            <BeatCardPro beat={beat} />
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-32 text-center bg-foreground/[0.02] border-2 border-dashed border-border rounded-[3rem]">
                                            <div className="w-20 h-20 bg-foreground/5 border border-border rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-muted">
                                                <Music size={32} strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight mb-3 text-foreground">Sin Resultados</h3>
                                            <p className="text-xs font-bold text-muted uppercase tracking-[0.3em] mb-8">Ajusta tus filtros o busca otro término</p>
                                            <button onClick={() => setFilterState(prev => ({ ...prev, searchQuery: '', genre: 'Todos', mood: '', tonoEscala: '' }))}
                                                className="px-6 py-3 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-foreground/20 transition-all">
                                                Limpiar filtros
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
