"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Filter, Music, SlidersHorizontal, ArrowLeft } from "lucide-react";
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

function BeatsPageContent() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter State
  const [filterState, setFilterState] = useState({
    searchQuery: "",
    genre: "Todos",
    bpm: null as number | null,
    key: "",
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
    const b = searchParams.get('bpm');

    setFilterState(prev => ({
      ...prev,
      searchQuery: q || prev.searchQuery,
      genre: g || prev.genre,
      mood: m || prev.mood,
      key: k || prev.key,
      bpm: b ? parseInt(b) : prev.bpm
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
      producer_artistic_name: b.producer?.artistic_name, // Added for convenience
      price_mxn: b.price_mxn,
      bpm: b.bpm,
      genre: b.genre,
      musical_key: b.musical_key,
      mood: b.mood,
      portadabeat_url: finalCoverUrl,
      mp3_url: publicUrl,
      created_at: b.created_at,
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
            id, title, price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, mood, created_at,
            is_mp3_active, is_wav_active, is_stems_active, is_exclusive_active,
            producer:producer_id ( artistic_name, username, is_verified, is_founder, foto_perfil, subscription_tier )
          `)
          .eq("is_public", true);

        // Apply Filters
        if (filterState.genre && filterState.genre !== "Todos") query = query.eq('genre', filterState.genre);
        if (filterState.mood) query = query.ilike('mood', `%${filterState.mood}%`); // Partial match for comma separated
        if (filterState.bpm) query = query.gte('bpm', filterState.bpm - 5).lte('bpm', filterState.bpm + 5); // Range +/- 5
        if (filterState.key) query = query.eq('musical_key', filterState.key);
        if (filterState.searchQuery.trim()) query = query.or(`title.ilike.%${filterState.searchQuery.trim()}%,genre.ilike.%${filterState.searchQuery.trim()}%`);

        const { data, error } = await query.order("created_at", { ascending: false }).limit(50);

        if (cancel) return;
        if (error) { setErrorMsg(error.message); return; }

        const transformed = await Promise.all((data || []).map(transformBeat));
        setBeats(transformed);
      } catch (err) {
        console.error(err);
        setErrorMsg("Error al cargar los beats.");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => { cancel = true; };
  }, [filterState]);

  // Extract Genres for Sidebar
  const genres = useMemo(() => {
    // If we have beats, extract unique genres. Otherwise default list.
    const defaultGenres = ["Trap", "Reggaeton", "Hip Hop", "Corridos", "R&B", "Drill", "Pop", "Lo-fi", "Phonk", "Afrobeat"];
    return defaultGenres.sort();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

          {/* Header / Featured Banner */}
          {!loading && !errorMsg && beats.length > 0 && (
            <FeaturedBanner trendingBeat={beats[0]} />
          )}

          <div className="flex gap-8 items-start">

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

              {/* Toolbar (Mobile Toggle & Count) */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-600"
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    Catalogo <span className="text-slate-400 text-sm font-bold bg-slate-100 px-2 py-1 rounded-lg tracking-widest">{beats.length}</span>
                  </h2>
                </div>
              </div>

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
                    <Filter className="text-slate-300 w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Sin resultados</h3>
                  <p className="text-slate-500 font-medium mb-6">No encontramos beats con esos filtros.</p>
                  <button
                    onClick={() => setFilterState({ searchQuery: "", genre: "Todos", bpm: null, key: "", mood: "", priceRange: [0, 10000] })}
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
