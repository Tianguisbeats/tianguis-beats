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
      try {
        setLoading(true);
        setErrorMsg(null);

        let query = supabase
          .from("beats")
          .select(`
            id,
            title,
            price_mxn,
            bpm,
            genre,
            portadabeat_url,
            mp3_url,
            mp3_tag_url,
            musical_key,
            mood,
            created_at,
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
          return;
        }

        const transformed = await Promise.all((data || []).map(async (b: any) => {
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
        }));

        setBeats(transformed);
      } catch (err) {
        console.error("Error loading beats:", err);
        setErrorMsg("Error al cargar los beats.");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      cancel = true;
    };
  }, [genreFilter, moodFilter, bpmFilter, keyFilter, searchQuery]);

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
            <div className="mb-20 mt-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
                <Users size={12} className="text-blue-500" />
                Productores en Ascenso
              </h4>
              <div className="flex items-center gap-6 overflow-x-scroll no-scrollbar pb-6 select-none">
                {featuredProducers.map((producer) => (
                  <Link
                    key={producer.id}
                    href={`/${producer.username}`}
                    className="group relative flex-shrink-0"
                  >
                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 transform group-hover:-translate-y-2 shadow-sm ${producer.subscription_tier === 'premium' ? 'border-blue-500 shadow-blue-500/10 group-hover:shadow-blue-500/30' :
                        producer.subscription_tier === 'pro' ? 'border-amber-400 shadow-amber-400/10 group-hover:shadow-amber-400/30' : 'border-slate-100 group-hover:border-slate-300'
                      }`}>
                      <img src={producer.avatar_url || ''} alt={producer.artistic_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {(producer.is_verified || producer.is_founder) && (
                      <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-lg z-10">
                        {producer.is_founder ? (
                          <div className="text-amber-500"><Star size={12} fill="currentColor" /></div>
                        ) : (
                          <Check size={10} className="text-blue-600" strokeWidth={4} />
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-center transition-all duration-300 transform group-hover:translate-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900 truncate max-w-[80px] md:max-w-[96px]">
                        {producer.artistic_name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/10 text-blue-600 text-[9px] font-black uppercase tracking-[0.4em] mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Laboratorio Creativo
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] uppercase leading-[0.85] mb-6">
                La nueva era del <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-700 to-blue-400">Beatmaking.</span>
              </h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-3">
                <Music size={14} className="text-blue-500" />
                {loading ? "Calibrando frecuencias..." : `${beats.length} Obras encontradas`}
              </p>
            </div>
          </div>

          <div className="sticky top-24 z-30 mb-20">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-3 rounded-[3rem] shadow-2xl shadow-slate-200/40 flex flex-col lg:flex-row items-center gap-4">

              <div className="relative group w-full lg:w-[400px]">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar productor, género o mood..."
                  className="w-full bg-slate-50/50 border-2 border-transparent focus:border-blue-600/10 rounded-full pl-16 pr-6 py-4 outline-none font-black text-sm text-slate-900 placeholder:text-slate-300 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="h-10 w-[1px] bg-slate-100 hidden lg:block"></div>

              <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto no-scrollbar px-2 py-1">
                <div className="relative group">
                  <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    className="appearance-none bg-slate-50/50 hover:bg-white border-2 border-transparent hover:border-slate-100 px-6 py-3 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all cursor-pointer min-w-[140px]"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>{g === 'Todos' ? 'Género' : g}</option>
                    ))}
                  </select>
                  <SlidersHorizontal size={12} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300" />
                </div>

                <select
                  value={moodFilter}
                  onChange={(e) => setMoodFilter(e.target.value)}
                  className="appearance-none bg-slate-50/50 hover:bg-white border-2 border-transparent hover:border-slate-100 px-6 py-3 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all cursor-pointer min-w-[120px]"
                >
                  <option value="">Mood</option>
                  <option value="Agresivo">Agresivo</option>
                  <option value="Chill">Chill</option>
                  <option value="Oscuro">Oscuro</option>
                  <option value="Triste">Triste</option>
                  <option value="Melódico">Melódico</option>
                </select>

                <select
                  value={bpmFilter}
                  onChange={(e) => setBpmFilter(e.target.value)}
                  className="appearance-none bg-slate-50/50 hover:bg-white border-2 border-transparent hover:border-slate-100 px-6 py-3 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all cursor-pointer min-w-[100px]"
                >
                  <option value="">BPM</option>
                  {[80, 100, 120, 140, 160].map(v => <option key={v} value={v}>{v}</option>)}
                </select>

                <select
                  value={keyFilter}
                  onChange={(e) => setKeyFilter(e.target.value)}
                  className="appearance-none bg-slate-50/50 hover:bg-white border-2 border-transparent hover:border-slate-100 px-6 py-3 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all cursor-pointer min-w-[100px]"
                >
                  <option value="">Key</option>
                  {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {(genreFilter !== "Todos" || moodFilter || bpmFilter || keyFilter || searchQuery) && (
                <button
                  onClick={handleClearFilters}
                  className="lg:ml-auto px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform active:scale-95"
                >
                  Reset
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
      </main>

      <Footer />
    </div>
  );
}
