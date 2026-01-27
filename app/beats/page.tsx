"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [genreFilter, setGenreFilter] = useState<string>("Todos");

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("beats")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (cancel) return;

      if (error) {
        setErrorMsg(error.message ?? "Error desconocido al cargar beats");
        setLoading(false);
        return;
      }

      setBeats((data as Beat[]) ?? []);
      setLoading(false);
    }

    load();

    return () => {
      cancel = true;
    };
  }, []);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const b of beats) {
      if (b.genre && b.genre.trim()) set.add(b.genre.trim());
    }
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [beats]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return beats.filter((b) => {
      const matchesGenre =
        genreFilter === "Todos" ? true : (b.genre ?? "") === genreFilter;

      const matchesSearch =
        !q
          ? true
          : `${b.title ?? ""} ${b.producer ?? ""} ${b.genre ?? ""}`
            .toLowerCase()
            .includes(q);

      return matchesGenre && matchesSearch;
    });
  }, [beats, genreFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-32 pb-20">
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
                {loading ? "Sincronizando con el estudio..." : `${filtered.length} Beats encontrados`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative group flex-1 md:w-80 w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Título, productor, género..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative w-full sm:w-[200px]">
                <select
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-900 appearance-none"
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <SlidersHorizontal size={16} />
                </div>
              </div>
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
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {filtered.map((beat) => (
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
