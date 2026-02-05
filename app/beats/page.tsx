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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
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
            .select(`id, username, artistic_name, foto_perfil, subscription_tier, is_verified, is_founder, bio, created_at`)
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

          // Fetch Trending Data for Banner (Run once or on filter change)
          const { data: trendData } = await supabase
            .from('beats')
            .select(`
                      id, title, price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, musical_scale, mood, created_at, play_count,
                      producer:producer_id ( artistic_name, username, is_verified, is_founder, foto_perfil, subscription_tier )
                  `)
            .eq('is_public', true)
            .order('play_count', { ascending: false, nullsFirst: false })
            .limit(10); // More items for rotation

          if (trendData) {
            const trendTransformed = await Promise.all(trendData.map(transformBeat));
            setTrendingBeats(trendTransformed);
          }

          const { data: trendProd } = await supabase
            .from('profiles')
            .select('id, artistic_name, username, foto_perfil, subscription_tier, is_verified, is_founder, bio, country, created_at, social_links')
            .not('artistic_name', 'is', null)
            .order('subscription_tier', { ascending: true }) // Premium first
            .limit(10);

          if (trendProd) {
            setTrendingProducers(trendProd);
          }
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

  // Extract Genres for Sidebar
  const genresFromData = useMemo(() => {
    return ["Todos", ...GENRES];
  }, []);

  const BannerSkeleton = () => (
    <div className="w-full h-[350px] md:h-[380px] bg-slate-200 rounded-[2.5rem] animate-pulse mb-8"></div>
  );

  const BeatSkeleton = () => (
    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm animate-pulse">
      <div className="aspect-square bg-slate-100 rounded-3xl mb-4"></div>
      <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-3"></div>
      <div className="h-3 bg-slate-100 rounded-full w-1/2 mb-6"></div>
      <div className="flex justify-between items-center px-1">
        <div className="h-8 bg-slate-100 rounded-2xl w-20"></div>
        <div className="h-10 bg-slate-100 rounded-2xl w-24"></div>
      </div>
    </div>
  );

  const TabButton = ({ mode, label, icon: Icon, color }: { mode: string; label: string; icon: any; color: string }) => (
    <button
      onClick={() => setViewMode(mode as any)}
      className={`snap-center flex-shrink-0 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-300 ${viewMode === mode
        ? `${color} text-white shadow-xl scale-105 ring-4 ring-white`
        : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
        }`}
    >
      <Icon size={16} strokeWidth={viewMode === mode ? 3 : 2} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-8 pb-20 relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

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
                <div className="flex items-center gap-3 lg:hidden w-full">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-600"
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight ml-auto">
                    Catalogo
                  </h2>
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
                    className="flex items-center gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 px-4 md:px-20 scroll-smooth justify-start"
                  >
                    <TabButton mode="all" label="Todos" icon={Music} color="bg-blue-600 shadow-blue-500/20" />
                    <TabButton mode="corridos_tumbados" label="Corridos 🇲🇽" icon={Zap} color="bg-orange-600 shadow-orange-500/20" />
                    <TabButton mode="new" label="Nuevos" icon={Clock} color="bg-emerald-500 shadow-emerald-500/20" />
                    <TabButton mode="trending" label="Tendencias" icon={TrendingUp} color="bg-rose-500 shadow-rose-500/20" />
                    <TabButton mode="best_sellers" label="Más comprados" icon={Trophy} color="bg-amber-600 shadow-amber-600/20" />
                    <TabButton mode="hidden_gems" label="Joyas" icon={Gem} color="bg-cyan-500 shadow-cyan-500/20" />
                    <TabButton mode="exclusives" label="Tianguis IA" icon={Sparkles} color="bg-indigo-600 shadow-indigo-600/20" />
                    <TabButton mode="recommended" label="Recomendados IA" icon={Zap} color="bg-blue-600 shadow-blue-500/20" />
                    <TabButton mode="sound_kits" label="Sound Kits" icon={Music} color="bg-purple-600 shadow-purple-500/20" />
                    <TabButton mode="producers" label="Artistas" icon={Users} color="bg-blue-600 shadow-blue-500/20" />
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
                    className="absolute right-4 top-[calc(50%-8px)] -translate-y-1/2 z-20 p-2.5 bg-white border border-slate-200 rounded-full shadow-lg hover:bg-slate-50 transition-all hidden md:flex items-center justify-center hover:scale-110 active:scale-95"
                  >
                    <ChevronRight size={18} className="text-slate-600" />
                  </button>
                </div>


              </div>



              {viewMode === 'premium_spotlight' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-100 to-orange-50 rounded-3xl border border-amber-200 flex items-start gap-4 animate-fade-in-up">
                  <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                    <Crown size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight mb-1">Selección Tianguis</h3>
                    <p className="text-sm font-medium text-amber-800/80 leading-relaxed">
                      Descubre beats exclusivos de nuestros productores Premium y Pro. Calidad garantizada.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => <BeatSkeleton key={i} />)}
                </div>
              ) : viewMode === 'producers' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                  {producers.map(p => (
                    <div key={p.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-50">
                            <img src={p.foto_perfil || `https://ui-avatars.com/api/?name=${p.artistic_name}&background=random`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          {p.subscription_tier === 'premium' && (
                            <div className="absolute -top-2 -right-2 p-1.5 bg-amber-500 rounded-lg text-white shadow-lg shadow-amber-500/40">
                              <Crown size={12} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{p.artistic_name}</h3>
                            {p.is_verified && <div className="p-1 bg-blue-500 text-white rounded-full"><Award size={10} /></div>}
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">@{p.username}</p>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.subscription_tier === 'premium' ? 'bg-amber-100 text-amber-700' :
                              p.subscription_tier === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                              {p.subscription_tier || 'Free'}
                            </span>
                            {p.is_founder && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[8px] font-black uppercase tracking-widest">Founder</span>}
                          </div>
                        </div>
                        <Link href={`/${p.username}`} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all active:scale-95">
                          <ArrowLeft className="rotate-180" size={20} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : beats.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
                  {beats.map((beat) => (
                    <BeatCardPro key={beat.id} beat={beat} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Music className="text-slate-300 w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Sin resultados</h3>
                  <p className="text-slate-500 font-medium mb-6">
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
                    className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline"
                  >
                    Limpiar Filtros
                  </button>
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
