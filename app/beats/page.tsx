"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Search,
  SlidersHorizontal,
  Music,
  X,
  Users,
  Star,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BeatCard from "@/components/BeatCard";
import { Beat } from "@/lib/types";
import Link from "next/link";

export default function BeatsPage() {
  return (
    <Suspense fallback={<div>Cargando el catálogo...</div>}>
      <BeatsPageContent />
    </Suspense>
  );
}

function BeatsPageContent() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [recientes, setRecientes] = useState<Beat[]>([]);
  const [tendencias, setTendencias] = useState<Beat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [featuredProducers, setFeaturedProducers] = useState<Array<{ id: string, username: string, artistic_name: string, avatar_url: string | null, is_verified: boolean, is_founder: boolean, subscription_tier: string }>>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [genreFilter, setGenreFilter] = useState<string>("Todos");
  const [moodFilter, setMoodFilter] = useState<string>("");
  const [bpmFilter, setBpmFilter] = useState<string>("");
  const [keyFilter, setKeyFilter] = useState<string>("");

  const searchParams = useSearchParams();
  const router = useRouter();

  const isSearching = useMemo(() => {
    return searchQuery.trim() !== "" ||
      genreFilter !== "Todos" ||
      moodFilter !== "" ||
      bpmFilter !== "" ||
      keyFilter !== "";
  }, [searchQuery, genreFilter, moodFilter, bpmFilter, keyFilter]);

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
      producer_avatar_url: b.producer?.avatar_url,
      producer_tier: b.producer?.subscription_tier,
      price_mxn: b.price_mxn,
      bpm: b.bpm,
      genre: b.genre,
      musical_key: b.musical_key,
      mood: b.mood,
      tag: "Nuevo",
      tagEmoji: "🔥",
      tagColor: "bg-orange-600",
      portadabeat_url: finalCoverUrl,
      coverColor: Math.random() > 0.5 ? 'bg-slate-50' : 'bg-slate-100',
      mp3_url: publicUrl,
      created_at: b.created_at
    };
  };

  useEffect(() => {
    let cancel = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // Grid principal (Resultados de búsqueda o "Todos")
        let query = supabase
          .from("beats")
          .select(`
            id, title, price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, mood, created_at,
            producer:producer_id ( artistic_name, username, is_verified, is_founder, avatar_url, subscription_tier )
          `)
          .eq("is_public", true);

        if (genreFilter && genreFilter !== "Todos") query = query.eq('genre', genreFilter);
        if (moodFilter) query = query.eq('mood', moodFilter);
        if (bpmFilter) query = query.eq('bpm', parseInt(bpmFilter));
        if (keyFilter) query = query.eq('musical_key', keyFilter);
        if (searchQuery.trim()) query = query.or(`title.ilike.%${searchQuery.trim()}%,genre.ilike.%${searchQuery.trim()}%`);

        const { data, error } = await query.order("created_at", { ascending: false }).limit(40);
        if (cancel) return;
        if (error) { setErrorMsg(error.message); return; }
        const transformed = await Promise.all((data || []).map(transformBeat));
        setBeats(transformed);

        // Fetch Playlists only if NOT searching
        if (!isSearching) {
          // Recién Horneado (los 6 más nuevos)
          const { data: rData } = await supabase.from("beats").select(`id, title, price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, mood, created_at, producer:producer_id ( artistic_name, username, is_verified, is_founder, avatar_url, subscription_tier )`).eq("is_public", true).order("created_at", { ascending: false }).limit(6);
          if (rData) setRecientes(await Promise.all(rData.map(transformBeat)));

          // Tendencias (Random limit 6 for now or based on some metric)
          const { data: tData } = await supabase.from("beats").select(`id, title, price_mxn, bpm, genre, portadabeat_url, mp3_url, mp3_tag_url, musical_key, mood, created_at, producer:producer_id ( artistic_name, username, is_verified, is_founder, avatar_url, subscription_tier )`).eq("is_public", true).limit(6);
          if (tData) setTendencias(await Promise.all(tData.map(transformBeat)));
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
  }, [genreFilter, moodFilter, bpmFilter, keyFilter, searchQuery, isSearching]);

  useEffect(() => {
    async function loadProducers() {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, artistic_name, avatar_url, is_verified, is_founder, subscription_tier')
        .or('is_verified.eq.true,role.eq.producer')
        .neq('avatar_url', null)
        .limit(10);

      if (data) {
        setFeaturedProducers(data as any);
      }
    }
    loadProducers();
  }, []);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const b of beats) {
      if (b.genre && b.genre.trim()) set.add(b.genre.trim());
    }
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [beats]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Featured Producers Section */}
          {featuredProducers.length > 0 && (
            <div className="mb-24 mt-12">
              <div className="flex items-center justify-between mb-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
                  <Users size={14} className="text-blue-600" />
                  Productores Destacados
                </h4>
                <div className="h-[1px] flex-1 bg-slate-100 ml-8 hidden md:block"></div>
              </div>

              <div className="flex items-center gap-8 overflow-x-scroll no-scrollbar pb-8 select-none">
                {featuredProducers.map((producer) => (
                  <Link
                    key={producer.id}
                    href={`/${producer.username}`}
                    className="group relative flex-shrink-0"
                  >
                    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[3rem] overflow-hidden border-2 transition-all duration-500 transform group-hover:-translate-y-3 shadow-sm ${producer.subscription_tier === 'premium' ? 'border-blue-600/30 group-hover:border-blue-600 shadow-blue-500/5' :
                      producer.subscription_tier === 'pro' ? 'border-amber-400/30 group-hover:border-amber-400 shadow-amber-400/5' : 'border-slate-100 group-hover:border-slate-300'
                      }`}>
                      <img src={producer.avatar_url || ''} alt={producer.artistic_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {(producer.is_verified || producer.is_founder) && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-xl z-10 scale-90 md:scale-100">
                        {producer.is_founder ? (
                          <div className="text-amber-500"><Star size={12} fill="currentColor" /></div>
                        ) : (
                          <Check size={10} className="text-blue-600" strokeWidth={4} />
                        )}
                      </div>
                    )}

                    <div className="mt-4 text-center transition-all duration-300">
                      <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 group-hover:text-blue-600">
                        {producer.artistic_name}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">@{producer.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center text-center mb-20">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.5em] mb-10 shadow-2xl shadow-slate-900/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Los mejores Beats, están aquí
            </div>
            <h1 className="text-6xl md:text-9xl font-black tracking-[-0.06em] uppercase leading-[0.8] mb-8 text-slate-900">
              Explora todo el <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-blue-800">Tianguis.</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-3 bg-slate-50 px-6 py-2 rounded-full border border-slate-100">
              <Music size={14} className="text-blue-500" />
              {loading ? "Sincronizando beats..." : `${beats.length} Ritmos disponibles ahora`}
            </p>
          </div>

          <div className="sticky top-24 z-30 mb-24">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 p-2 flex flex-col md:flex-row items-center gap-2">

                {/* Search Text */}
                <div className="relative flex-1 w-full group">
                  <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Search size={22} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    placeholder="Busca beats, géneros o productores..."
                    className="w-full bg-transparent border-none pl-20 pr-6 py-6 outline-none font-black text-lg text-slate-900 placeholder:text-slate-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="hidden md:block w-[2px] h-10 bg-slate-100"></div>

                {/* Filters Row */}
                <div className="flex items-center gap-2 px-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                  {/* Genre */}
                  <div className="relative group">
                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer min-w-[120px] pr-10"
                    >
                      {genres.map((g) => (
                        <option key={g} value={g}>{g === 'Todos' ? 'Género' : g}</option>
                      ))}
                    </select>
                    <SlidersHorizontal size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  {/* BPM */}
                  <select
                    value={bpmFilter}
                    onChange={(e) => setBpmFilter(e.target.value)}
                    className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer min-w-[100px]"
                  >
                    <option value="">BPM</option>
                    {[80, 90, 100, 110, 120, 130, 140, 150, 160, 170].map(val => (
                      <option key={val} value={val}>{val} BPM</option>
                    ))}
                  </select>

                  {/* Key / Escala */}
                  <select
                    value={keyFilter}
                    onChange={(e) => setKeyFilter(e.target.value)}
                    className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer min-w-[110px]"
                  >
                    <option value="">Escala / Key</option>
                    {['C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'D#', 'D#m', 'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'G', 'Gm', 'G#', 'G#m', 'A', 'Am', 'A#', 'A#m', 'B', 'Bm'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>

                  {(genreFilter !== "Todos" || moodFilter || bpmFilter || keyFilter || searchQuery) && (
                    <button
                      onClick={handleClearFilters}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                      title="Limpiar filtros"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>

                <button className="hidden md:flex bg-blue-600 text-white px-8 py-5 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-900 hover:scale-[1.02] transition-all shadow-xl shadow-blue-500/20 active:scale-95 ml-2">
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {!isSearching && recientes.length > 0 && (
            <div className="mb-24">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
                  <span className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-xl">🔥</span>
                  Recién Horneados
                </h2>
                <div className="h-[1px] flex-1 bg-slate-100 ml-8"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {recientes.map((beat) => (
                  <BeatCard key={beat.id} beat={beat} />
                ))}
              </div>
            </div>
          )}

          {!isSearching && tendencias.length > 0 && (
            <div className="mb-24">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
                  <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl">📈</span>
                  Tendencias
                </h2>
                <div className="h-[1px] flex-1 bg-slate-100 ml-8"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {tendencias.map((beat) => (
                  <BeatCard key={beat.id} beat={beat} />
                ))}
              </div>
            </div>
          )}

          <div className="mb-12">
            <h3 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-4">
              {isSearching ? "Resultados de Búsqueda" : "Explora todo el Catálogo"}
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </h3>

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
        </div>
      </main>

      <Footer />
    </div>
  );
}
