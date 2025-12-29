"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  Music,
  Search,
  SlidersHorizontal,
  Play,
  ShoppingCart,
} from "lucide-react";

type BeatRow = {
  id: string;
  title: string | null;
  producer: string | null;
  genre: string | null;
  bpm: number | null;
  price_mxn: number | null;
  musical_key: string | null;
  cover_url: string | null;
  mp3_url: string | null;
  wav_url: string | null;
  is_public: boolean | null;
  created_at: string | null;
};

function formatPriceMXN(value?: number | null) {
  if (value === null || value === undefined) return "$—";
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value}`;
  }
}

export default function BeatsPage() {
  const [beats, setBeats] = useState<BeatRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // error real de Supabase
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [genreFilter, setGenreFilter] = useState<string>("Todos");

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);
      setErrorDetails(null);
      setErrorHint(null);

      // ✅ importante: si el env no está cargado, esto lo detecta
      // (no rompe, solo te lo canta)
      // @ts-ignore
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // @ts-ignore
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        if (!cancel) {
          setErrorMsg("Faltan variables de entorno (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).");
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("beats")
        .select(
          "id,title,producer,genre,bpm,price_mxn,musical_key,cover_url,mp3_url,wav_url,is_public,created_at"
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (cancel) return;

      if (error) {
        // ✅ aquí verás la verdad: RLS, permisos, etc.
        setErrorMsg(error.message ?? "Error desconocido");
        // @ts-ignore
        setErrorDetails(error.details ?? null);
        // @ts-ignore
        setErrorHint(error.hint ?? null);
        setBeats([]);
        setLoading(false);
        return;
      }

      setBeats((data as BeatRow[]) ?? []);
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
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-blue-600 transition-colors"
            >
              ← Volver
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="font-black text-lg tracking-tighter uppercase">
                Tianguis<span className="text-blue-600">Beats</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            {loading ? "Cargando..." : `${filtered.length} Beats`}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pt-10 pb-16">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Catálogo
            </div>

            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.95]">
              Escucha beats <span className="text-blue-600">al instante.</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl mt-4">
              Aquí probamos Supabase: lectura real de la tabla <span className="font-black">beats</span>,
              búsqueda y filtro.
            </p>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 h-14 shadow-sm w-full sm:w-[420px]">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por título, productor o género..."
                className="flex-1 outline-none bg-transparent font-bold text-slate-900 placeholder:text-slate-300"
              />
            </div>

            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 h-14 shadow-sm w-full sm:w-[240px]">
              <SlidersHorizontal className="w-5 h-5 text-slate-400" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Género
                </span>
                <select
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="bg-transparent font-black outline-none"
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Error box (muestra el error REAL) */}
        {errorMsg && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="font-black text-red-700">
              Error: {errorMsg}
            </div>
            {(errorDetails || errorHint) && (
              <div className="mt-2 text-sm text-red-700/80 space-y-1">
                {errorDetails && <div><span className="font-black">Details:</span> {errorDetails}</div>}
                {errorHint && <div><span className="font-black">Hint:</span> {errorHint}</div>}
              </div>
            )}
            <div className="mt-3 text-sm text-red-700/80">
              Si esto sigue siendo <span className="font-black">“Failed to fetch”</span>, entonces no está llegando a Supabase (URL/Key/env/restart/red).
            </div>
          </div>
        )}

        {/* Grid */}
        <section className="mt-10">
          {loading ? (
            <div className="text-center py-24 text-slate-400 font-black uppercase tracking-[0.25em] text-[10px]">
              Cargando catálogo...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px]">
                NO HAY BEATS CON ESE FILTRO / BÚSQUEDA
              </div>
              <div className="text-slate-500 font-medium mt-3">
                Prueba cambiando el género a <span className="font-black">Todos</span> o borra la búsqueda.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filtered.map((beat) => (
                <div
                  key={beat.id}
                  className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all transform hover:-translate-y-2"
                >
                  <div className="aspect-square bg-slate-50 relative flex items-center justify-center overflow-hidden">
                    <Music className="text-slate-200 w-20 h-20 group-hover:scale-110 group-hover:text-blue-500/20 transition-all duration-700 ease-out" />

                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={() => console.log("Play preview:", beat.id, beat.mp3_url)}
                        className="bg-white text-blue-600 p-5 rounded-full shadow-2xl transform hover:scale-110 transition-transform active:scale-90"
                      >
                        <Play fill="currentColor" size={28} className="ml-1" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-black text-slate-900 text-sm truncate mb-1 group-hover:text-blue-600 transition-colors leading-tight uppercase tracking-tight">
                      {beat.title ?? "Sin título"}
                    </h3>

                    <div className="flex items-center justify-between mb-5">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">
                        prod. {beat.producer ?? "—"}
                      </p>
                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {beat.bpm ?? "—"} BPM
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-blue-600 font-black text-xl leading-none">
                          {formatPriceMXN(beat.price_mxn)}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">
                          {beat.musical_key ? `Key: ${beat.musical_key}` : "Licencia Digital"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => console.log("Add to cart:", beat.id)}
                        className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-slate-100 pt-10 flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">
          <span>TianguisBeats • Catálogo de prueba (Supabase)</span>
          <span>Orgullosamente hecho en Neza 🇲🇽</span>
        </footer>
      </main>
    </div>
  );
}
