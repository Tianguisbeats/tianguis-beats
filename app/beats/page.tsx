"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Filter, Music, SlidersHorizontal, ArrowLeft, Crown, Clock, TrendingUp, Sparkles, Trophy, Gem, Zap, Star, Users, Award, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Beat } from "@/lib/types";
import { GENRES } from "@/lib/constants";

// New Components
import AdvancedFilterSidebar from "@/components/explore/AdvancedFilterSidebar";
import BeatCardPro from "@/components/explore/BeatCardPro";
import FeaturedBanner from "@/components/explore/FeaturedBanner";

export default function BeatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    }>
      <BeatsPageContent />
    </Suspense>
  );
}

type ViewMode = 'all' | 'new' | 'trending' | 'best_sellers' | 'hidden_gems' | 'recommended' | 'exclusives' | 'premium_spotlight' | 'sound_kits' | 'producers' | 'mood_of_the_week' | 'corridos_tumbados';

function BeatsPageContent() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [producers, setProducers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [trendingProducers, setTrendingProducers] = useState<any[]>([]);
  const [featuredMoods, setFeaturedMoods] = useState<any[]>([
    {
      label: 'Chill',
      emoji: '🌊',
      quote: 'Encuentra la paz en cada beat.',
      image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop'
    },
    {
      label: 'Bélico',
      emoji: '🦅',
      quote: 'Sonido con fuerza y actitud.',
      image: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=2070&auto=format&fit=crop'
    },
    {
      label: 'Trap',
      emoji: '💎',
      quote: 'El sonido de la calle.',
      image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070&auto=format&fit=crop'
    },
    {
      label: 'Romántico',
      emoji: '❤️',
      quote: 'Sentimiento en cada nota.',
      image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=2070&auto=format&fit=crop'
    },
    {
      label: 'Duro',
      emoji: '🔥',
      quote: 'Energía pura para tus proyectos.',
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2070&auto=format&fit=crop'
    },
  ]);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Filter State
  const [filterState, setFilterState] = useState({
    searchQuery: "",
    genre: "Todos",
    subgenre: "",
    bpmMin: "" as number | string,
    bpmMax: "" as number | string,
    key: "",
    scale: "",
    mood: "",
    priceRange: [0, 10000] as [number, number]
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load Filters from URL
  useEffect(() => {
    const q = searchParams.get('q');
    const g = searchParams.get('genre');
    const m = searchParams.get('mood');
    const k = searchParams.get('key');
    const s = searchParams.get('scale');
    const b = searchParams.get('bpm');

    setFilterState(prev => ({
      ...prev,
      searchQuery: q || prev.searchQuery,
      genre: g || prev.genre,
      mood: m || prev.mood,
      key: k || prev.key,
      scale: s || prev.scale,
      bpmMin: b ? parseInt(b) : prev.bpmMin,
      bpmMax: b ? parseInt(b) : prev.bpmMax,
      subgenre: searchParams.get('subgenre') || prev.subgenre,
    }));
  }, [searchParams]);

  const transformBeat = async (b: any) => {
    const path = b.mp3_tag_url || b.mp3_url || '';
    const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
    const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

    let finalCoverUrl = b.portadabeat_url;
    if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
      const { data: { publicUrl: cpUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(finalCoverUrl);
      finalCoverUrl = cpUrl;
    }

    return {
      id: b.id,
      title: b.title,
      producer: b.producer?.artistic_name || 'Productor Anónimo',
      producer_username: b.producer?.username || b.producer?.artistic_name,
      producer_is_verified: b.producer?.is_verified,
      producer_is_founder: b.producer?.is_founder,
      producer_foto_perfil: b.producer?.foto_perfil,
      producer_tier: b.producer?.subscription_tier,
      producer_artistic_name: b.producer?.artistic_name,
      price_mxn: b.price_mxn,
      bpm: b.bpm,
      genre: b.genre,
      musical_key: b.musical_key,
      musical_scale: b.musical_scale,
      mood: b.mood,
      portadabeat_url: finalCoverUrl,
      mp3_url: publicUrl,
      created_at: b.created_at,
      play_count: b.play_count,
      sale_count: b.sale_count,
      like_count: b.like_count,
      is_mp3_active: b.is_mp3_active,
      is_wav_active: b.is_wav_active,
      is_stems_active: b.is_stems_active,
      is_exclusive_active: b.is_exclusive_active
    };
  };

  // Re-defining internal component helpers deleted in previous step
  const BannerSkeleton = () => (
    <div className="w-full h-[450px] md:h-[520px] bg-card rounded-[3.5rem] animate-pulse mb-8 border border-border shadow-soft flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-accent-soft rounded-full animate-pulse"></div>
        <div className="h-4 w-40 bg-accent-soft rounded-full"></div>
      </div>
    </div>
  );

  const BeatSkeleton = () => (
    <div className="bg-card rounded-[3rem] p-6 border border-border shadow-soft animate-pulse flex flex-col h-full">
      <div className="aspect-square bg-accent-soft rounded-[2.5rem] mb-6"></div>
      <div className="h-6 bg-accent-soft rounded-full w-3/4 mb-4"></div>
      <div className="h-4 bg-accent-soft rounded-full w-1/2 mb-8"></div>
      <div className="mt-auto flex justify-between items-center bg-accent-soft/30 p-4 rounded-3xl">
        <div className="h-6 bg-accent-soft rounded-full w-16"></div>
        <div className="h-10 bg-accent-soft rounded-2xl w-24"></div>
      </div>
    </div>
  );

  const TabButton = ({ mode, label, icon: Icon }: { mode: string; label: string; icon: any; color?: string }) => {
    const isActive = viewMode === mode;
    return (
      <button
        onClick={() => setViewMode(mode as any)}
        className={`snap-center flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-t-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap min-h-[56px] relative ${isActive
          ? 'bg-background text-accent border-x border-t border-border -mb-[1px] z-10'
          : 'bg-card/50 text-muted hover:text-foreground border-transparent hover:bg-card'
          }`}
      >
        <Icon size={16} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-accent' : ''} />
        <span>{label}</span>
      </button>
    );
  };

  const genresFromData = useMemo(() => {
    return ["Todos", ...GENRES];
  }, []);

  useEffect(() => {
    let cancel = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        let query = supabase
          .from("beats")
          .select(`
            id, title, price_mxn, price_wav_mxn, price_stems_mxn, exclusive_price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, musical_scale, mood, created_at, play_count, sale_count, like_count,
            is_mp3_active, is_wav_active, is_stems_active, is_exclusive_active,
            producer:producer_id ( artistic_name, username, is_verified, is_founder, foto_perfil, subscription_tier )
          `)
          .eq("is_public", true);

        // Apply Common Filters
        if (filterState.genre !== 'Todos') query = query.eq('genre', filterState.genre);
        if (filterState.subgenre) query = query.eq('subgenre', filterState.subgenre);
        if (filterState.mood) query = query.ilike('mood', `%${filterState.mood}%`);
        if (filterState.bpmMin) query = query.gte('bpm', filterState.bpmMin);
        if (filterState.bpmMax) query = query.lte('bpm', filterState.bpmMax);
        if (filterState.key) query = query.eq('musical_key', filterState.key);
        if (filterState.scale) query = query.eq('musical_scale', filterState.scale);
        if (filterState.searchQuery.trim()) query = query.or(`title.ilike.%${filterState.searchQuery.trim()}%,genre.ilike.%${filterState.searchQuery.trim()}%,subgenre.ilike.%${filterState.searchQuery.trim()}%`);

        // Apply View Mode Specific Sorting/Filtering
        switch (viewMode) {
          case 'new':
            query = query.order("created_at", { ascending: false });
            break;
          case 'trending':
            query = query.order("play_count", { ascending: false, nullsFirst: false });
            break;
          case 'best_sellers':
            query = query.order("sale_count", { ascending: false, nullsFirst: false });
            break;
          case 'hidden_gems':
            // High likes, low plays (Joyas)
            query = query.order("like_count", { ascending: false }).lte('play_count', 2000);
            break;
          case 'exclusives': // This will be "Tianguis IA" / Exposición Premium
            query = query.not('producer_id', 'is', null);
            break;
          case 'recommended':
            // Simple personalization fallback
            query = query.order("play_count", { ascending: false });
            break;
          case 'corridos_tumbados':
            query = query.eq('genre', 'Corridos Tumbados 🇲🇽').order("created_at", { ascending: false });
            break;
          default: // 'all'
            query = query.order("created_at", { ascending: false });
            break;
        }

        if (viewMode === 'producers') {
          // Fetch more fields needed for the producer card
          const { data: prodData, error: prodError } = await supabase
            .from('profiles')
            .select(`id, username, artistic_name, foto_perfil, subscription_tier, is_verified, is_founder, bio, created_at, social_links`)
            .not('username', 'is', null)
            .limit(100);

          if (prodError) throw prodError;

          const sortedProd = (prodData || []).sort((a, b) => {
            const order: any = { premium: 0, pro: 1, free: 2 };
            const tierA = order[a.subscription_tier as any] ?? 3;
            const tierB = order[b.subscription_tier as any] ?? 3;
            if (tierA !== tierB) return tierA - tierB;
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          });
          setProducers(sortedProd);
          setBeats([]);
        } else if (viewMode === 'sound_kits') {
          const { data: skData, error: skError } = await supabase
            .from('services')
            .select(`
                    id, titulo, precio, descripcion, created_at,
                    producer:user_id ( artistic_name, username, foto_perfil, subscription_tier )
                `)
            .eq('tipo_servicio', 'sound_kit')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (skError) throw skError;

          const skTransformed = (skData || []).map(sk => {
            const prod = (sk.producer as any);
            return {
              id: sk.id,
              title: sk.titulo,
              producer_artistic_name: prod?.artistic_name || 'Productor',
              producer_username: prod?.username,
              producer_tier: prod?.subscription_tier,
              producer_foto_perfil: prod?.foto_perfil,
              price_mxn: sk.precio,
              portadabeat_url: null,
              is_sound_kit: true,
              created_at: sk.created_at
            };
          });

          setBeats(skTransformed as any);
          setProducers([]);
        } else {
          const { data, error } = await query.limit(50);

          if (cancel) return;
          if (error) { setErrorMsg(error.message); return; }

          let transformed = await Promise.all((data || []).map(transformBeat));

          if (viewMode === 'exclusives') {
            transformed = transformed.filter(b => b.producer_tier === 'premium' || b.producer_tier === 'pro');
          }

          // Algorithm: Tier-based sorting (Premium > Pro > Free)
          const tierOrder: any = { premium: 0, pro: 1, free: 2 };
          transformed.sort((a, b) => {
            const tierA = tierOrder[a.producer_tier as any] ?? 3;
            const tierB = tierOrder[b.producer_tier as any] ?? 3;
            if (tierA !== tierB) return tierA - tierB;
            // Secondary sort by date
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          setBeats(transformed);
          setProducers([]);
        }

        // Fetch Trending Data for Banner (ALWAYS FETCH for global banner persistence)
        const { data: trendData } = await supabase
          .from('beats')
          .select(`
                    id, title, price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, musical_scale, mood, created_at, play_count,
                    producer:producer_id ( artistic_name, username, is_verified, is_founder, foto_perfil, subscription_tier )
                `)
          .eq('is_public', true)
          .order('play_count', { ascending: false, nullsFirst: false })
          .limit(10);

        if (trendData) {
          const trendTransformed = await Promise.all(trendData.map(transformBeat));
          setTrendingBeats(trendTransformed);
        }

        // Fetch Trending Producers (Artists of the Week)
        const { data: playsData } = await supabase
          .from('beats')
          .select('producer_id, play_count')
          .not('producer_id', 'is', null)
          .order('play_count', { ascending: false })
          .limit(200);

        const playsMap: Record<string, number> = {};
        playsData?.forEach(b => {
          playsMap[b.producer_id] = (playsMap[b.producer_id] || 0) + (b.play_count || 0);
        });

        const { data: trendProd } = await supabase
          .from('profiles')
          .select('id, artistic_name, username, foto_perfil, subscription_tier, is_verified, is_founder, bio, country, created_at, social_links')
          .not('username', 'is', null)
          .limit(100);

        if (trendProd) {
          const sortedProd = trendProd.map(p => {
            const totalPlays = playsMap[p.id] || 0;
            const tierMultiplier = p.subscription_tier === 'premium' ? 2.0 : p.subscription_tier === 'pro' ? 1.5 : 1.0;
            return { ...p, score: totalPlays * tierMultiplier };
          })
            .sort((a, b) => {
              const order: any = { premium: 0, pro: 1, free: 2 };
              const tierA = order[a.subscription_tier as any] ?? 3;
              const tierB = order[b.subscription_tier as any] ?? 3;
              if (tierA !== tierB) return tierA - tierB;
              return b.score - a.score;
            })
            .slice(0, 10);

          setTrendingProducers(sortedProd);
        }

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

      <main className="flex-1 pt-8 pb-20 relative">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-10">

          {/* Featured Banner (Persistent) */}
          {loading ? (
            <BannerSkeleton />
          ) : !errorMsg && trendingBeats.length > 0 && (
            <FeaturedBanner
              trendingBeats={trendingBeats}
              trendingProducers={trendingProducers}
              featuredMoods={featuredMoods}
            />
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Sidebar (Desktop) */}
            <AdvancedFilterSidebar
              filterState={filterState}
              setFilterState={setFilterState}
              genres={genresFromData}
              totalBeats={beats.length}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 w-full min-w-0">

              {/* Toolbar & Tabs */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">

                {/* Mobile Sidebar Toggle */}
                <div className="flex items-center gap-3 lg:hidden w-full bg-card/50 backdrop-blur-md p-4 rounded-3xl border border-border shadow-soft mb-6">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-4 bg-accent text-white rounded-2xl shadow-xl shadow-accent/20 active:scale-95 transition-all min-h-[56px] min-w-[56px] flex items-center justify-center"
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight font-heading lowercase">
                      Catalogo
                    </h2>
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Tianguis Beats</p>
                  </div>
                </div>

                {/* Tabs with Horizontal Scroll & Arrows */}
                <div className="relative w-full max-w-full group/tabs mb-6">
                  {/* Left Arrow Button */}
                  <button
                    onClick={() => {
                      const container = document.getElementById('tabs-container');
                      if (container) {
                        if (container.scrollLeft <= 5) {
                          container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
                        } else {
                          container.scrollBy({ left: -300, behavior: 'smooth' });
                        }
                      }
                    }}
                    className="absolute -left-4 top-[calc(50%-8px)] -translate-y-1/2 z-20 p-2.5 bg-white border border-slate-200 rounded-full shadow-lg hover:bg-slate-50 transition-all hidden md:flex items-center justify-center hover:scale-110 active:scale-95"
                  >
                    <ChevronLeft size={18} className="text-slate-600" />
                  </button>

                  <div
                    id="tabs-container"
                    className="flex items-end gap-1 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 md:px-10 scroll-smooth justify-start border-b border-border"
                  >
                    <TabButton mode="all" label="Todos" icon={Music} />
                    <TabButton mode="corridos_tumbados" label="Corridos 🇲🇽" icon={Zap} />
                    <TabButton mode="new" label="Nuevos" icon={Clock} />
                    <TabButton mode="trending" label="Tendencias" icon={TrendingUp} />
                    <TabButton mode="best_sellers" label="Más comprados" icon={Trophy} />
                    <TabButton mode="hidden_gems" label="Joyas" icon={Gem} />
                    <TabButton mode="exclusives" label="Tianguis IA" icon={Sparkles} />
                    <TabButton mode="recommended" label="Recomendados IA" icon={Zap} />
                    <TabButton mode="sound_kits" label="Sound Kits" icon={Music} />
                    <TabButton mode="producers" label="Artistas" icon={Users} />
                  </div>

                  {/* Right Arrow Button */}
                  <button
                    onClick={() => {
                      const container = document.getElementById('tabs-container');
                      if (container) {
                        const isAtEnd = container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10;
                        if (isAtEnd) {
                          container.scrollTo({ left: 0, behavior: 'smooth' });
                        } else {
                          container.scrollBy({ left: 300, behavior: 'smooth' });
                        }
                      }
                    }}
                    className="absolute right-4 top-[calc(50%-8px)] -translate-y-1/2 z-20 p-3 bg-card border border-border rounded-full shadow-lg hover:bg-accent-soft transition-all hidden md:flex items-center justify-center hover:scale-110 active:scale-95 min-h-[48px] min-w-[48px]"
                  >
                    <ChevronRight size={18} className="text-foreground" />
                  </button>
                </div>


              </div>



              {viewMode === 'premium_spotlight' && (
                <div className="mb-8 p-8 bg-gradient-to-r from-amber-500/10 to-orange-500/5 rounded-[2.5rem] border border-amber-500/20 flex items-start gap-6 animate-fade-in-up">
                  <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/20">
                    <Crown size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-amber-500 uppercase tracking-tight mb-2 font-heading">Selección Tianguis</h3>
                    <p className="text-sm font-medium text-muted leading-relaxed font-body">
                      Descubre beats exclusivos de nuestros productores Premium y Pro. Calidad garantizada.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
                  {[...Array(8)].map((_, i) => <BeatSkeleton key={i} />)}
                </div>
              ) : viewMode === 'producers' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 animate-fade-in-up">
                  {producers.map(p => (
                    <div key={p.id} className="group bg-card rounded-[3rem] p-8 border border-border shadow-soft hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden h-full">
                      <div className={`absolute top-0 left-0 w-full h-2 ${p.subscription_tier === 'premium' ? 'bg-amber-400' : p.subscription_tier === 'pro' ? 'bg-accent' : 'bg-border'}`} />

                      {/* Avatar */}
                      <div className="relative mt-2 mb-4">
                        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full p-1 border-2 transition-all duration-700 group-hover:scale-110 ${p.subscription_tier === 'premium' ? 'border-amber-400 shadow-xl shadow-amber-500/20' : 'border-border hover:border-accent'}`}>
                          <img
                            src={p.foto_perfil || `https://ui-avatars.com/api/?name=${p.artistic_name || p.username}&background=random`}
                            className="w-full h-full object-cover rounded-full"
                            alt={p.artistic_name || p.username}
                          />
                        </div>
                        {p.subscription_tier === 'premium' && (
                          <div className="absolute -top-1 -right-1 p-2 bg-amber-500 text-white rounded-xl shadow-xl animate-bounce">
                            <Crown size={14} fill="currentColor" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 w-full">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                          <h3 className="text-xl font-black uppercase tracking-tighter text-foreground group-hover:text-accent transition-colors truncate max-w-[180px] font-heading lowercase">
                            {p.artistic_name || p.username}
                          </h3>
                          {p.is_verified && <img src="/verified-badge.png" alt="Verificado" className="w-4 h-4 object-contain" />}
                        </div>
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3">@{p.username}</p>

                        <p className="text-xs text-muted font-medium leading-relaxed italic mb-6 line-clamp-2 px-2 min-h-[40px] font-body">
                          "{p.bio || "Productor destacado en Tianguis Beats con estilo único."}"
                        </p>

                        {/* Social Links (Mini) */}
                        <div className="flex justify-center gap-2 mb-6">
                          {p.social_links && typeof p.social_links === 'object' && !Array.isArray(p.social_links) && Object.entries(p.social_links).slice(0, 4).map(([key, url]: [string, any]) => {
                            if (!url || typeof url !== 'string') return null;
                            return (
                              <div key={key} className="w-8 h-8 rounded-lg bg-accent-soft border border-border flex items-center justify-center text-muted hover:text-accent transition-colors min-h-[32px] min-w-[32px]">
                                <span className="text-[8px] font-black uppercase">{key.substring(0, 2)}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-center gap-1.5 mb-6">
                          <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${p.subscription_tier === 'premium' ? 'bg-amber-500/10 text-amber-500' :
                            p.subscription_tier === 'pro' ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted'
                            }`}>
                            {p.subscription_tier || 'Free'}
                          </span>
                          {p.is_founder && (
                            <span className="px-3 py-1.5 bg-foreground text-background rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-black/10">
                              <Crown size={10} fill="currentColor" className="text-amber-400" /> Founder
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/${p.username}`}
                        className="w-full py-5 bg-foreground text-background rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-accent hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-black/5 min-h-[56px]"
                      >
                        Ver Perfil Principal <ChevronRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : beats.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 animate-fade-in-up">
                  {beats.map((beat) => (
                    <div key={beat.id} className="h-full">
                      <BeatCardPro beat={beat} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-card rounded-[3rem] border border-dashed border-border shadow-soft">
                  <div className="w-24 h-24 bg-accent-soft rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Music className="text-accent w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 font-heading">Sin resultados</h3>
                  <p className="text-muted font-medium mb-10 max-w-sm mx-auto font-body">
                    {viewMode === 'premium_spotlight'
                      ? "No hay beats premium que coincidan con tus filtros."
                      : viewMode === 'sound_kits'
                        ? "No hay sound kits disponibles en este momento."
                        : "No encontramos beats con esos filtros."}
                  </p>
                  <button
                    onClick={() => {
                      setFilterState({ searchQuery: "", genre: "Todos", subgenre: "", bpmMin: "", bpmMax: "", key: "", scale: "", mood: "", priceRange: [0, 10000] });
                      setViewMode('all');
                    }}
                    className="px-12 py-5 bg-foreground text-background rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-accent hover:text-white transition-all active:scale-95 min-h-[56px]"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main >

      <Footer />
    </div >
  );
}
