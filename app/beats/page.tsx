"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Filter, Music, SlidersHorizontal, ArrowLeft, Crown, Clock, TrendingUp, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Beat } from "@/lib/types";

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

type ViewMode = 'all' | 'new' | 'trending' | 'top_producers' | 'premium_spotlight' | 'sound_kits';

function BeatsPageContent() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Filter State
  const [filterState, setFilterState] = useState({
    searchQuery: "",
    genre: "Todos",
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
      mood: b.mood,
      portadabeat_url: finalCoverUrl,
      mp3_url: publicUrl,
      created_at: b.created_at,
      play_count: b.play_count,
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
            id, title, price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, mood, created_at, play_count,
            is_mp3_active, is_wav_active, is_stems_active, is_exclusive_active,
            producer:producer_id ( artistic_name, username, is_verified, is_founder, foto_perfil, subscription_tier )
          `)
          .eq("is_public", true);

        // Apply Common Filters
        if (filterState.genre && filterState.genre !== "Todos") query = query.eq('genre', filterState.genre);
        if (filterState.mood) query = query.ilike('mood', `%${filterState.mood}%`);
        if (filterState.bpmMin) query = query.gte('bpm', filterState.bpmMin);
        if (filterState.bpmMax) query = query.lte('bpm', filterState.bpmMax);
        if (filterState.key) query = query.eq('musical_key', filterState.key);
        if (filterState.scale) query = query.eq('musical_scale', filterState.scale);
        if (filterState.searchQuery.trim()) query = query.or(`title.ilike.%${filterState.searchQuery.trim()}%,genre.ilike.%${filterState.searchQuery.trim()}%`);

        // Apply View Mode Specific Sorting/Filtering
        switch (viewMode) {
          case 'new':
            query = query.order("created_at", { ascending: false });
            break;
          case 'trending':
            query = query.order("play_count", { ascending: false, nullsFirst: false });
            break;
          case 'premium_spotlight':
            query = query.not('producer', 'is', null);
            break;
          case 'sound_kits':
            // Overridden below
            break;
          default: // 'all'
            query = query.order("created_at", { ascending: false });
            break;
        }

        if (viewMode === 'sound_kits') {
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
        } else {
          const { data, error } = await query.limit(50);

          if (cancel) return;
          if (error) { setErrorMsg(error.message); return; }

          let transformed = await Promise.all((data || []).map(transformBeat));

          if (viewMode === 'premium_spotlight') {
            transformed = transformed.filter(b => b.producer_tier === 'premium' || b.producer_tier === 'pro');
          }

          setBeats(transformed);

          // For Banner (Top 5 Reproducidos)
          if (viewMode === 'all') {
            const { data: trendData } = await supabase
              .from('beats')
              .select(`
                        id, title, price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, mood, created_at, play_count,
                        producer:producer_id ( artistic_name, username, is_verified, is_founder, foto_perfil, subscription_tier )
                    `)
              .eq('is_public', true)
              .order('play_count', { ascending: false, nullsFirst: false })
              .limit(5);

            if (trendData) {
              const trendTransformed = await Promise.all(trendData.map(transformBeat));
              setTrendingBeats(trendTransformed);
            }
          }
        }

      } catch (err) {
        console.error(err);
        setErrorMsg("Error al cargar los beats.");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => { cancel = true; };
  }, [filterState, viewMode]);

  // Extract Genres for Sidebar
  const genres = useMemo(() => {
    const defaultGenres = ["Trap", "Reggaeton", "Hip Hop", "Corridos", "R&B", "Drill", "Pop", "Lo-fi", "Phonk", "Afrobeat"];
    return defaultGenres.sort();
  }, []);

  const TabButton = ({ mode, label, icon: Icon, color }: { mode: ViewMode, label: string, icon: any, color: string }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`
              relative flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap group
              ${viewMode === mode
          ? `${color} text-white shadow-xl scale-105 z-10`
          : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 hover:translate-y-[-2px]'
        }
          `}
    >
      <Icon size={16} className={`${viewMode === mode ? 'animate-bounce' : 'group-hover:text-slate-900 transition-colors'}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

          {/* Featured Banner */}
          {!loading && !errorMsg && trendingBeats.length > 0 && viewMode === 'all' && (
            <FeaturedBanner trendingBeats={trendingBeats} />
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Sidebar (Desktop) */}
            <AdvancedFilterSidebar
              filterState={filterState}
              setFilterState={setFilterState}
              genres={genres}
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

                {/* Tabs with Horizontal Scroll */}
                <div className="relative w-full md:w-auto">
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0 scroll-smooth">
                    <TabButton mode="all" label="Todos" icon={Music} color="bg-slate-900" />
                    <TabButton mode="new" label="Recién Horneados" icon={Clock} color="bg-emerald-500 shadow-emerald-500/20" />
                    <TabButton mode="trending" label="Tendencias" icon={TrendingUp} color="bg-rose-500 shadow-rose-500/20" />
                    <TabButton mode="premium_spotlight" label="Selección Tianguis" icon={Crown} color="bg-amber-500 shadow-amber-500/20" />
                    <TabButton mode="sound_kits" label="Sound Kits" icon={Sparkles} color="bg-purple-600 shadow-purple-500/20" />
                  </div>
                </div>

                <div className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  {beats.length} Resultados
                </div>
              </div>

              {/* View Title/Description */}
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
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-slate-200 rounded-3xl animate-pulse"></div>
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
                      setFilterState({ searchQuery: "", genre: "Todos", bpmMin: "", bpmMax: "", key: "", scale: "", mood: "", priceRange: [0, 10000] });
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
