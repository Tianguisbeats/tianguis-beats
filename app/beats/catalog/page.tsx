"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Music, Clock, TrendingUp, Sparkles, Trophy, Gem, Zap,
    ChevronLeft, ChevronRight, Search, X, Check,
    Activity, DollarSign, Disc, SlidersHorizontal
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Beat } from "@/lib/types";
import { GENRES, MUSICAL_KEYS, MOODS, INSTRUMENTS } from "@/lib/constants";
import BeatCardPro from "@/components/explore/BeatCardPro";
import { motion, AnimatePresence } from "framer-motion";
import {
    FloatingParticles, AbstractTrianglesBack, ParallaxBackground
} from "@/components/ui/BackgroundEffects";

/* ─────────────────────────────────────────────── */
/* Types                                          */
/* ─────────────────────────────────────────────── */

type ViewMode = "all" | "new" | "trending" | "best_sellers" | "hidden_gems" | "corridos_tumbados" | "reggaeton_mexa";

interface ActiveFilters {
    genres: string[];
    moods: string[];
    instruments: string[];
    bpmMin: string;
    bpmMax: string;
    key: string;
    priceMax: string;
    freeOnly: boolean;
}

const EMPTY_FILTERS: ActiveFilters = {
    genres: [],
    moods: [],
    instruments: [],
    bpmMin: "",
    bpmMax: "",
    key: "",
    priceMax: "",
    freeOnly: false,
};

/* ─────────────────────────────────────────────── */
/* Page Root                                      */
/* ─────────────────────────────────────────────── */

export default function BeatsCatalogPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#080808]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <Zap size={24} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" />
                </div>
            </div>
        }>
            <CatalogContent />
        </Suspense>
    );
}

/* ─────────────────────────────────────────────── */
/* Main Content                                   */
/* ─────────────────────────────────────────────── */

function CatalogContent() {
    const searchParams = useSearchParams();

    // Search — input value debounces into searchQuery
    const [inputValue, setInputValue] = useState(searchParams.get("q") || "");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

    // Debounce 350 ms
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(inputValue), 350);
        return () => clearTimeout(t);
    }, [inputValue]);

    const [viewMode, setViewMode] = useState<ViewMode>("all");
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

    const [beats, setBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 24;

    // Sync URL params
    useEffect(() => {
        const v = searchParams.get("view");
        if (v) setViewMode(v as ViewMode);
        const q = searchParams.get("q");
        if (q !== null) { setInputValue(q); setSearchQuery(q); }
    }, [searchParams]);

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1);
        setBeats([]);
    }, [searchQuery, viewMode, filters]);

    // Active filter count (for badge)
    const activeFilterCount =
        filters.genres.length +
        filters.moods.length +
        filters.instruments.length +
        (filters.bpmMin ? 1 : 0) +
        (filters.bpmMax ? 1 : 0) +
        (filters.key ? 1 : 0) +
        (filters.priceMax ? 1 : 0) +
        (filters.freeOnly ? 1 : 0);

    const toggleArrayFilter = (field: "genres" | "moods" | "instruments", value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(v => v !== value)
                : [...prev[field], value],
        }));
    };

    const clearFilters = () => { setFilters(EMPTY_FILTERS); setInputValue(""); setSearchQuery(""); };

    // Transform raw beat data
    const transformBeat = (b: any): Beat => {
        const path = b.archivo_muestra_url || b.archivo_mp3_url || "";
        let audio = path;
        if (path && !path.startsWith("http")) {
            const bucket = b.archivo_muestra_url ? "muestras_beats" : "beats";
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
            audio = publicUrl;
        }
        let cover = b.portada_url;
        if (cover && !cover.startsWith("http")) {
            const { data: { publicUrl } } = supabase.storage.from("portadas_beats").getPublicUrl(cover);
            cover = publicUrl;
        }
        let avatar = b.productor_foto_perfil;
        if (avatar && !avatar.startsWith("http")) {
            const { data: { publicUrl } } = supabase.storage.from("fotos_perfil").getPublicUrl(avatar);
            avatar = publicUrl;
        }
        return { ...b, portada_url: cover, archivo_mp3_url: audio, productor_foto_perfil: avatar };
    };

    // Data fetching
    useEffect(() => {
        let cancel = false;
        async function load() {
            try {
                const isInitial = page === 1;
                if (isInitial) setLoading(true);
                else setLoadingMore(true);
                let query = supabase.from("beats_busqueda").select("*").eq("es_publico", true);

                // ── Text search ──
                const q = searchQuery.trim().toLowerCase();
                if (q) {
                    if (q.startsWith("@")) {
                        query = query.ilike("productor_nombre_usuario", `%${q.substring(1)}%`);
                    } else {
                        const bpmMatch = q.match(/(\d+)\s*bpm/);
                        const priceMatch = q.match(/\$(\d+)/);
                        const isFree = q.includes("gratis") || q.includes("free");
                        const justNumber = q.match(/^\d+$/);

                        if (justNumber) {
                            const n = parseInt(justNumber[0]);
                            if (n > 50 && n < 250) query = query.eq("bpm", n);
                        }
                        if (bpmMatch) query = query.eq("bpm", parseInt(bpmMatch[1]));
                        if (priceMatch) query = query.lte("precio_basica_mxn", parseInt(priceMatch[1]));
                        if (isFree) query = query.eq("es_gratis_activa", true);

                        const cleanQ = q.replace(/(\d+)\s*bpm|\$(\d+)|gratis|free/g, "").trim();
                        if (cleanQ) {
                            query = query.or(
                                `titulo.ilike.%${cleanQ}%,genero.ilike.%${cleanQ}%,vibras.ilike.%${cleanQ}%,productor_nombre_artistico.ilike.%${cleanQ}%,productor_nombre_usuario.ilike.%${cleanQ}%,artista_referencia.ilike.%${cleanQ}%`
                            );
                        }

                        // Tonal scale auto-detect
                        const scaleKws = MUSICAL_KEYS.map(k => k.value.toLowerCase());
                        const foundScale = scaleKws.find(sk => q.includes(sk));
                        if (foundScale) {
                            const kd = MUSICAL_KEYS.find(k => k.value.toLowerCase() === foundScale);
                            if (kd?.enharmonic) query = query.in("tono_escala", [kd.value, kd.enharmonic]);
                            else if (kd) query = query.eq("tono_escala", kd.value);
                        }
                    }
                }

                // ── Panel Filters ──
                if (filters.genres.length > 0) query = query.in("genero", filters.genres);
                if (filters.moods.length > 0) query = (query as any).overlaps("moods", filters.moods);
                if (filters.instruments.length > 0) query = (query as any).overlaps("instrumentos", filters.instruments);
                if (filters.bpmMin) query = query.gte("bpm", parseInt(filters.bpmMin));
                if (filters.bpmMax) query = query.lte("bpm", parseInt(filters.bpmMax));
                if (filters.key) {
                    const kd = MUSICAL_KEYS.find(k => k.value === filters.key);
                    if (kd?.enharmonic) query = query.in("tono_escala", [kd.value, kd.enharmonic]);
                    else query = query.eq("tono_escala", filters.key);
                }
                if (filters.priceMax) query = query.lte("precio_basica_mxn", parseInt(filters.priceMax));
                if (filters.freeOnly) query = query.eq("es_gratis_activa", true);

                // ── View mode ordering ──
                switch (viewMode) {
                    case "new": query = query.order("fecha_creacion", { ascending: false }); break;
                    case "trending": query = query.order("conteo_reproducciones", { ascending: false, nullsFirst: false }); break;
                    case "best_sellers": query = query.order("conteo_ventas", { ascending: false, nullsFirst: false }); break;
                    case "corridos_tumbados": query = query.eq("genero", "Corridos Tumbados 🇲🇽").order("fecha_creacion", { ascending: false }); break;
                    case "reggaeton_mexa": query = query.eq("genero", "Reggaetón Mexa 🇲🇽").order("fecha_creacion", { ascending: false }); break;
                    default: query = query.order("fecha_creacion", { ascending: false }); break;
                }

                const from = (page - 1) * PAGE_SIZE;
                const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
                if (cancel) return;
                if (error) { console.error(error.message); return; }
                const transformed = (data || []).map(transformBeat);
                if (isInitial) setBeats(transformed);
                else setBeats(prev => [...prev, ...transformed]);
                setHasMore(transformed.length === PAGE_SIZE);
            } catch (err) {
                console.error(err);
                console.error("Error al cargar los beats.");
            } finally {
                if (!cancel) { setLoading(false); setLoadingMore(false); }
            }
        }
        load();
        return () => { cancel = true; };
    }, [searchQuery, viewMode, filters, page]);

    const TABS: { mode: ViewMode; label: string; icon: any }[] = [
        { mode: "all", label: "Todos", icon: Music },
        { mode: "new", label: "Nuevos", icon: Clock },
        { mode: "trending", label: "Tendencia", icon: TrendingUp },
        { mode: "best_sellers", label: "Más vendidos", icon: Trophy },
        { mode: "hidden_gems", label: "Joyas", icon: Gem },
        { mode: "corridos_tumbados", label: "Corridos Tumbados", icon: Zap },
        { mode: "reggaeton_mexa", label: "Reggaetón Mexa", icon: Zap },
    ];

    return (
        <div className="min-h-[100dvh] bg-white dark:bg-[#080808] text-black dark:text-white font-sans selection:bg-emerald-500 selection:text-white flex flex-col overflow-x-hidden">
            <Navbar minimal={true} />
            {/* Heavy background effects — desktop only for mobile performance */}
            <div className="hidden md:block">
                <ParallaxBackground scrollY={0} />
                <FloatingParticles theme="green" />
            </div>

            <main className="flex-1 pb-24 relative">

                {/* ══ Hero + Search ══════════════════════════════════════ */}
                <div className="relative pt-20 pb-8 md:pt-28 md:pb-14 overflow-hidden border-b border-black/5 dark:border-white/5">
                    <div className="hidden md:block"><AbstractTrianglesBack theme="green" opacity={0.65} /></div>
                    <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white dark:from-[#080808] to-transparent pointer-events-none" />

                    <div className="max-w-4xl mx-auto px-6 relative z-10">
                            {/* Badge */}
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Disc size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.7em] text-emerald-500">Marketplace</span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl sm:text-6xl md:text-[clamp(3rem,10vw,7rem)] font-black uppercase tracking-tighter leading-none mb-6 md:mb-8">
                                TIANGUIS
                                <span className="text-emerald-500"> BEATS</span>
                            </h1>

                            {/* Search row */}
                            <div className="flex gap-3">
                                <div className="relative flex-1 group">
                                    <div className="absolute -inset-px bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-0 group-focus-within:opacity-15 transition-opacity duration-500" />
                                    <div className="relative flex items-center bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden focus-within:border-emerald-500/50 transition-colors duration-300">
                                        <Search
                                            className="ml-5 shrink-0 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                                            size={20}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Título, productor, @usuario, BPM, género…"
                                            className="flex-1 h-14 px-4 bg-transparent text-base font-medium outline-none text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20"
                                            value={inputValue}
                                            onChange={e => setInputValue(e.target.value)}
                                        />
                                        {inputValue && (
                                            <button
                                                onClick={() => { setInputValue(""); setSearchQuery(""); }}
                                                className="mr-4 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Filter toggle */}
                                <button
                                    onClick={() => setFilterOpen(true)}
                                    className={`relative flex items-center gap-2.5 px-6 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border ${
                                        activeFilterCount > 0
                                            ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30"
                                            : "bg-white dark:bg-white/[0.04] text-slate-600 dark:text-white/50 border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:text-emerald-500 dark:hover:text-emerald-400"
                                    }`}
                                >
                                    <SlidersHorizontal size={16} />
                                    <span className="hidden sm:inline">Filtros</span>
                                    {activeFilterCount > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-black">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Active filter chips */}
                            <AnimatePresence>
                                {activeFilterCount > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="flex flex-wrap gap-2 mt-4"
                                    >
                                        {filters.freeOnly && (
                                            <FilterChip label="⚡ Gratis" onRemove={() => setFilters(p => ({ ...p, freeOnly: false }))} />
                                        )}
                                        {filters.genres.map(g => (
                                            <FilterChip key={g} label={g} onRemove={() => toggleArrayFilter("genres", g)} />
                                        ))}
                                        {filters.moods.map(m => {
                                            const mood = MOODS.find(x => x.value === m);
                                            return <FilterChip key={m} label={`${mood?.emoji || ""} ${mood?.label || m}`} onRemove={() => toggleArrayFilter("moods", m)} />;
                                        })}
                                        {filters.instruments.map(i => {
                                            const inst = INSTRUMENTS.find(x => x.value === i);
                                            return <FilterChip key={i} label={`${inst?.emoji || ""} ${inst?.label || i}`} onRemove={() => toggleArrayFilter("instruments", i)} />;
                                        })}
                                        {(filters.bpmMin || filters.bpmMax) && (
                                            <FilterChip
                                                label={`BPM ${filters.bpmMin || "0"}–${filters.bpmMax || "∞"}`}
                                                onRemove={() => setFilters(p => ({ ...p, bpmMin: "", bpmMax: "" }))}
                                            />
                                        )}
                                        {filters.key && (
                                            <FilterChip
                                                label={MUSICAL_KEYS.find(k => k.value === filters.key)?.label || filters.key}
                                                onRemove={() => setFilters(p => ({ ...p, key: "" }))}
                                            />
                                        )}
                                        {filters.priceMax && (
                                            <FilterChip
                                                label={`Máx $${filters.priceMax}`}
                                                onRemove={() => setFilters(p => ({ ...p, priceMax: "" }))}
                                            />
                                        )}
                                        <button
                                            onClick={clearFilters}
                                            className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                                        >
                                            Limpiar todo
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                    </div>
                </div>

                {/* ══ Tabs + Grid ════════════════════════════════════════ */}
                <div className="max-w-[1900px] mx-auto px-4 sm:px-8 mt-8">

                    {/* Tabs */}
                    <div className="relative group/tabs mb-8">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-[#080808] to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-[#080808] to-transparent z-10 pointer-events-none" />

                        <button
                            onClick={() => document.getElementById("tabs-scroll")?.scrollBy({ left: -260, behavior: "smooth" })}
                            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 flex items-center justify-center opacity-0 group-hover/tabs:opacity-100 transition-opacity shadow"
                        >
                            <ChevronLeft size={14} className="text-slate-500 dark:text-slate-400" />
                        </button>

                        <div id="tabs-scroll" className="flex items-center gap-2 overflow-x-auto no-scrollbar px-6 py-1">
                            {TABS.map(({ mode, label, icon: Icon }) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`snap-center shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.12em] transition-all duration-300 ${
                                        viewMode === mode
                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                            : "text-slate-500 dark:text-white/30 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10"
                                    }`}
                                >
                                    <Icon size={12} strokeWidth={viewMode === mode ? 3 : 2} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => document.getElementById("tabs-scroll")?.scrollBy({ left: 260, behavior: "smooth" })}
                            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 flex items-center justify-center opacity-0 group-hover/tabs:opacity-100 transition-opacity shadow"
                        >
                            <ChevronRight size={14} className="text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>

                    {/* Results info */}
                    {!loading && (
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20 mb-5">
                            {beats.length} {beats.length === 1 ? "beat encontrado" : "beats encontrados"}
                            {(searchQuery || activeFilterCount > 0) && " · con filtros activos"}
                        </p>
                    )}

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
                            {[...Array(12)].map((_, i) => <BeatSkeleton key={i} />)}
                        </div>
                    ) : beats.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
                            {beats.map(beat => (
                                <BeatCardPro key={beat.id} beat={beat} />
                            ))}

                            {hasMore && (
                                <div className="col-span-full py-14 flex justify-center">
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={loadingMore}
                                        className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loadingMore
                                            ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                            : <Sparkles size={14} className="text-emerald-500" />
                                        }
                                        {loadingMore ? "Cargando..." : "Ver más Beats"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-28 flex flex-col items-center gap-6 text-center bg-black/[0.02] dark:bg-white/[0.015] rounded-3xl border border-black/5 dark:border-white/5">
                            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-500">
                                <Disc size={36} strokeWidth={1} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tight mb-2">Sin Resultados</h3>
                                <p className="text-[10px] font-black text-slate-400 dark:text-white/25 uppercase tracking-[0.4em]">
                                    Intenta con términos menos específicos
                                </p>
                            </div>
                            <button
                                onClick={clearFilters}
                                className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer minimal={true} />

            {/* ══ Filter Drawer ══════════════════════════════════════════ */}
            <AnimatePresence>
                {filterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setFilterOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140]"
                        />
                        <motion.aside
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 320, damping: 32 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-[360px] bg-white dark:bg-[#0F0F0F] border-l border-black/10 dark:border-white/[0.06] z-[150] flex flex-col shadow-2xl"
                        >
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-black/5 dark:border-white/5 shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <SlidersHorizontal size={18} className="text-emerald-500" />
                                    <span className="text-sm font-black uppercase tracking-widest">Filtros</span>
                                    {activeFilterCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={() => setFilters(EMPTY_FILTERS)}
                                            className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setFilterOpen(false)}
                                        className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable filter body */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 overscroll-contain" data-lenis-prevent>

                                {/* Toggle: solo gratis */}
                                <div>
                                    <button
                                        onClick={() => setFilters(p => ({ ...p, freeOnly: !p.freeOnly }))}
                                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 font-black text-sm transition-all ${
                                            filters.freeOnly
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                                                : "border-black/10 dark:border-white/10 text-slate-600 dark:text-white/50 hover:border-emerald-500/40"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Zap size={16} />
                                            <span className="uppercase tracking-widest text-[11px]">Solo Beats Gratis</span>
                                        </div>
                                        {filters.freeOnly && <Check size={18} />}
                                    </button>
                                </div>

                                {/* Precio máximo */}
                                <FilterSection icon={<DollarSign size={13} />} label="Precio Máximo">
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">$</span>
                                        <input
                                            type="number"
                                            min={0}
                                            placeholder="Ej. 500"
                                            value={filters.priceMax}
                                            onChange={e => setFilters(p => ({ ...p, priceMax: e.target.value }))}
                                            className="w-full h-11 pl-8 pr-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm font-bold outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                    </div>
                                </FilterSection>

                                {/* BPM range */}
                                <FilterSection icon={<Activity size={13} />} label="Rango de BPM">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            min={0}
                                            placeholder="Mín (ej. 80)"
                                            value={filters.bpmMin}
                                            onChange={e => setFilters(p => ({ ...p, bpmMin: e.target.value }))}
                                            className="h-11 px-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm font-bold outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            placeholder="Máx (ej. 160)"
                                            value={filters.bpmMax}
                                            onChange={e => setFilters(p => ({ ...p, bpmMax: e.target.value }))}
                                            className="h-11 px-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm font-bold outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                    </div>
                                </FilterSection>

                                {/* Tonalidad */}
                                <FilterSection icon={<Music size={13} />} label="Tonalidad / Escala">
                                    <select
                                        value={filters.key}
                                        onChange={e => setFilters(p => ({ ...p, key: e.target.value }))}
                                        className="w-full h-11 px-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm font-bold outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer dark:bg-[#0F0F0F]"
                                    >
                                        <option value="">Cualquier tonalidad</option>
                                        <optgroup label="── Mayores">
                                            {MUSICAL_KEYS.filter(k => k.value.includes("_maj")).map(k => (
                                                <option key={k.value} value={k.value}>{k.label}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="── Menores">
                                            {MUSICAL_KEYS.filter(k => k.value.includes("_min")).map(k => (
                                                <option key={k.value} value={k.value}>{k.label}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </FilterSection>

                                {/* Género */}
                                <FilterSection icon={<Disc size={13} />} label={`Género${filters.genres.length > 0 ? ` · ${filters.genres.length}` : ""}`}>
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                        {GENRES.map(genre => (
                                            <ChipButton
                                                key={genre}
                                                label={genre}
                                                active={filters.genres.includes(genre)}
                                                onClick={() => toggleArrayFilter("genres", genre)}
                                            />
                                        ))}
                                    </div>
                                </FilterSection>

                                {/* Moods */}
                                <FilterSection icon={<Sparkles size={13} />} label={`Mood${filters.moods.length > 0 ? ` · ${filters.moods.length}` : ""}`}>
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                        {MOODS.slice(0, 32).map(mood => (
                                            <ChipButton
                                                key={mood.value}
                                                label={`${mood.emoji} ${mood.label}`}
                                                active={filters.moods.includes(mood.value)}
                                                onClick={() => toggleArrayFilter("moods", mood.value)}
                                            />
                                        ))}
                                    </div>
                                </FilterSection>

                                {/* Instrumentos */}
                                <FilterSection icon={<Music size={13} />} label={`Instrumentos${filters.instruments.length > 0 ? ` · ${filters.instruments.length}` : ""}`}>
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                        {INSTRUMENTS.slice(0, 24).map(inst => (
                                            <ChipButton
                                                key={inst.value}
                                                label={`${inst.emoji} ${inst.label}`}
                                                active={filters.instruments.includes(inst.value)}
                                                onClick={() => toggleArrayFilter("instruments", inst.value)}
                                            />
                                        ))}
                                    </div>
                                </FilterSection>
                            </div>

                            {/* Apply CTA */}
                            <div className="px-6 py-5 border-t border-black/5 dark:border-white/5 shrink-0">
                                <button
                                    onClick={() => setFilterOpen(false)}
                                    className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.98] transition-all"
                                >
                                    {loading ? "Buscando…" : `Ver ${beats.length} Beats`}
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

/* ─────────────────────────────────────────────── */
/* Utility sub-components                        */
/* ─────────────────────────────────────────────── */

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider"
        >
            <span>{label}</span>
            <button
                onClick={onRemove}
                className="hover:bg-emerald-500/20 p-0.5 rounded-md transition-colors"
            >
                <X size={10} strokeWidth={3} />
            </button>
        </motion.div>
    );
}

function FilterSection({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-emerald-500">{icon}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-white/35">{label}</span>
            </div>
            {children}
        </div>
    );
}

function ChipButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                active
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                    : "bg-black/[0.04] dark:bg-white/[0.04] text-slate-600 dark:text-white/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
        >
            {active && <Check size={9} className="inline mr-1 mb-0.5" strokeWidth={3} />}
            {label}
        </button>
    );
}

function BeatSkeleton() {
    return (
        <div className="bg-white dark:bg-white/[0.025] rounded-[2rem] border border-black/5 dark:border-white/5 p-2 flex flex-col animate-pulse">
            <div className="aspect-square bg-emerald-500/5 rounded-[1.5rem] mb-3" />
            <div className="px-3 pb-3 space-y-2.5">
                <div className="h-2 bg-emerald-500/5 rounded-full w-1/3" />
                <div className="h-4 bg-emerald-500/5 rounded-full w-4/5" />
                <div className="h-3 bg-emerald-500/5 rounded-full w-1/2" />
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
                    <div className="h-5 bg-emerald-500/5 rounded-full w-14" />
                    <div className="h-9 bg-emerald-500/5 rounded-xl w-24" />
                </div>
            </div>
        </div>
    );
}
