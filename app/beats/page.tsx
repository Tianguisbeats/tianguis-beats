"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Search,
  SlidersHorizontal,
  Music,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BeatCard, { Beat } from "@/components/BeatCard";

export default function BeatsPage() {
  return (
    <Suspense fallback={<div>Cargando el catálogo...</div>}>
      <BeatsPageContent />
    </Suspense>
  );
}

function BeatsPageContent() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [genreFilter, setGenreFilter] = useState<string>("Todos");
  const [moodFilter, setMoodFilter] = useState<string>("");
  const [bpmFilter, setBpmFilter] = useState<string>("");
  const [keyFilter, setKeyFilter] = useState<string>("");

  const searchParams = useSearchParams();
  const router = useRouter();

  const handleClearFilters = () => {
    setSearchQuery("");
    setGenreFilter("Todos");
    setMoodFilter("");
    setBpmFilter("");
    setKeyFilter("");
    router.push("/beats");
  };

  useEffect(() => {
    const q = searchParams.get('q');
    const g = searchParams.get('genre');
    const m = searchParams.get('mood');
    const k = searchParams.get('key');
    const b = searchParams.get('bpm');

    if (q) setSearchQuery(q);
    if (g) setGenreFilter(g);
    if (m) setMoodFilter(m);
    if (k) setKeyFilter(k);
    if (b) setBpmFilter(b);
  }, [searchParams]);

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      // Build query with server-side filters
      let query = supabase
        .from("beats")
        .select(`
          id,
          title,
          price_mxn,
          bpm,
          genre,
          mp3_url,
          musical_key,
          mood,
          tag,
          tag_emoji,
          tag_color,
          cover_color,
          producer:producer_id (
            artistic_name,
            username,
            is_verified,
            is_founder,
            avatar_url,
            subscription_tier
          )
        `)
        .eq("is_public", true);

      // Apply server-side filters
      if (genreFilter && genreFilter !== "Todos") {
        query = query.eq('genre', genreFilter);
      }
      if (moodFilter) {
        query = query.eq('mood', moodFilter);
      }
      if (bpmFilter) {
        query = query.eq('bpm', parseInt(bpmFilter));
      }
      if (keyFilter) {
        query = query.eq('musical_key', keyFilter);
      }
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery.trim()}%,genre.ilike.%${searchQuery.trim()}%`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancel) return;

      if (error) {
        setErrorMsg(error.message ?? "Error desconocido al cargar beats");
        setLoading(false);
        return;
      }

      const transformed = (data || []).map((b: any) => {
        const { data: { publicUrl } } = supabase.storage
          .from('beats-muestras')
          .getPublicUrl(b.mp3_tag_url);

        return {
          id: b.id,
          title: b.title,
          producer: b.producer?.artistic_name || 'Productor Anónimo',
          producer_username: b.producer?.username || b.producer?.artistic_name,
          producer_is_verified: b.producer?.is_verified,
          producer_is_founder: b.producer?.is_founder,
          producer_avatar_url: b.producer?.avatar_url,
          producer_tier: b.producer?.subscription_tier,
          price_mxn: b.price_mxn,
          bpm: b.bpm,
          genre: b.genre,
          mp3_url: publicUrl,
          musical_key: b.musical_key,
          mood: b.mood,
          tag: b.tag || "Nuevo",
          tagEmoji: b.tag_emoji || "🔥",
          tagColor: b.tag_color || "bg-orange-600",
          coverColor: b.cover_color || (Math.random() > 0.5 ? 'bg-slate-50' : 'bg-slate-100'),
          mp3_tag_url: b.mp3_tag_url
        };
      });

      setBeats(transformed);
      setLoading(false);
    }

    load();

    return () => {
      cancel = true;
    };
  }, [genreFilter, moodFilter, bpmFilter, keyFilter, searchQuery]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const b of beats) {
      if (b.genre && b.genre.trim()) set.add(b.genre.trim());
    }
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [beats]);

  // Note: Filtering is now done server-side in the Supabase query above
  // Keeping genres extraction for dynamic genre dropdown

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 text-slate-900 selection:bg-blue-600 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Explorar Catálogo
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.95] mb-2">
                Escucha el <span className="text-blue-600">Talento Mexa.</span>
              </h1>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                {loading ? "Sincronizando con el estudio..." : `${beats.length} Beats encontrados`}
              </p>
            </div>

            <div className="flex flex-col xl:flex-row items-center gap-4 w-full md:w-auto bg-slate-50 p-2 rounded-[2rem] border border-slate-100 shadow-sm">

              {/* Search Text */}
              <div className="relative group w-full xl:w-80">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full bg-transparent border-none pl-12 pr-4 py-3 outline-none focus:ring-0 font-bold text-slate-900 placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="h-8 w-[1px] bg-slate-200 hidden xl:block"></div>

              {/* Filters Container */}
              <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto no-scrollbar px-2">

                {/* Genre */}
                <div className="relative min-w-[120px]">
                  <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    className="w-full bg-transparent py-3 pl-2 pr-8 outline-none font-bold text-[11px] uppercase tracking-widest text-slate-500 cursor-pointer hover:text-blue-600 transition-colors appearance-none"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>{g === 'Todos' ? 'Género' : g}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none text-slate-300">
                    <SlidersHorizontal size={14} />
                  </div>
                </div>

                <div className="h-4 w-[1px] bg-slate-200"></div>

                {/* Mood */}
                <div className="relative min-w-[100px]">
                  <select
                    value={moodFilter}
                    onChange={(e) => setMoodFilter(e.target.value)}
                    className="w-full bg-transparent py-3 pl-2 pr-8 outline-none font-bold text-[11px] uppercase tracking-widest text-slate-500 cursor-pointer hover:text-blue-600 transition-colors appearance-none"
                  >
                    <option value="">Mood</option>
                    <option value="Agresivo">Agresivo</option>
                    <option value="Triste">Triste</option>
                    <option value="Feliz">Feliz</option>
                    <option value="Chill">Chill</option>
                    <option value="Oscuro">Oscuro</option>
                  </select>
                </div>

                <div className="h-4 w-[1px] bg-slate-200"></div>

                {/* BPM */}
                <div className="relative min-w-[90px]">
                  <select
                    className="w-full bg-transparent py-3 pl-2 pr-4 outline-none font-bold text-[11px] uppercase tracking-widest text-slate-500 cursor-pointer hover:text-blue-600 transition-colors appearance-none"
                    value={bpmFilter}
                    onChange={(e) => setBpmFilter(e.target.value)}
                  >
                    <option value="">BPM</option>
                    {[80, 90, 100, 110, 120, 130, 140, 150, 160, 170].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>

                <div className="h-4 w-[1px] bg-slate-200"></div>

                {/* Key */}
                <div className="relative min-w-[90px]">
                  <select
                    className="w-full bg-transparent py-3 pl-2 pr-4 outline-none font-bold text-[11px] uppercase tracking-widest text-slate-500 cursor-pointer hover:text-blue-600 transition-colors appearance-none"
                    value={keyFilter}
                    onChange={(e) => setKeyFilter(e.target.value)}
                  >
                    <option value="">Key</option>
                    {['C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'D#', 'D#m', 'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'G', 'Gm', 'G#', 'G#m', 'A', 'Am', 'A#', 'A#m', 'B', 'Bm'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(genreFilter !== "Todos" || moodFilter || bpmFilter || keyFilter || searchQuery) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-12 p-6 bg-red-50 border border-red-100 rounded-[2rem] text-red-600 font-bold text-center">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 animate-pulse">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-[2.5rem]"></div>
              ))}
            </div>
          ) : beats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {beats.map((beat) => (
                <BeatCard key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Music className="text-slate-300 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Sin resultados</h3>
              <p className="text-slate-500 font-medium">Intenta ajustando los filtros o la búsqueda.</p>
            </div>
          )}
        </div>
      </main >

      <Footer />
    </div >
  );
}
