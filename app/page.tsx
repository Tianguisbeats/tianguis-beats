"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Zap, ShieldCheck, Cpu, Music, Waves, ArrowRight, Star,
  Play, TrendingUp, Users, Crown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeaturedBanner from '@/components/explore/FeaturedBanner';
import { GENRES, MOODS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

// ─── Smart Search Logic ────────────────────────────────────────────────────
function handleSmartSearch(query: string) {
  if (!query.trim()) { window.location.href = '/beats/catalog'; return; }
  const lowerQuery = query.toLowerCase();
  const params = new URLSearchParams();
  const bpmMatch = lowerQuery.match(/(\d{2,3})\s?(bpm)?/i);
  if (bpmMatch) { const v = parseInt(bpmMatch[1]); if (v >= 60 && v <= 220) params.set('bpm', v.toString()); }
  const keyLabels = ["C", "C#", "C-sharp", "Db", "D", "D#", "D-sharp", "Eb", "E", "F", "F#", "F-sharp", "Gb", "G", "G#", "G-sharp", "Ab", "A", "A#", "A-sharp", "Bb", "B"];
  const keyMap: Record<string, string> = { "c-sharp": "Csharp", "d-sharp": "Dsharp", "f-sharp": "Fsharp", "g-sharp": "Gsharp", "a-sharp": "Asharp", "db": "Csharp", "eb": "Eb", "gb": "Fsharp", "ab": "Ab", "bb": "Bb" };
  let detectedKey = "";
  for (const k of keyLabels) { const re = new RegExp(`\\b${k.replace('#', '\\#')}\\b`, 'i'); if (re.test(lowerQuery)) { detectedKey = k.toLowerCase(); break; } }
  let detectedScale = "";
  if (lowerQuery.includes('minor') || lowerQuery.includes('menor') || lowerQuery.includes(' min')) detectedScale = "min";
  else if (lowerQuery.includes('major') || lowerQuery.includes('mayor') || lowerQuery.includes(' maj')) detectedScale = "maj";
  if (detectedKey) { const nk = keyMap[detectedKey] || detectedKey.replace('#', 'sharp').toUpperCase(); const fk = nk.charAt(0).toUpperCase() + nk.slice(1); params.set('tonoEscala', `${fk}_${detectedScale || 'maj'}`); }
  MOODS.forEach(m => { const mp = m.label.toLowerCase().split(' / '); mp.forEach(p => { if (lowerQuery.includes(p.trim())) params.set('mood', m.label); }); });
  if (lowerQuery.includes('mexa')) params.set('genre', 'Reggaetón Mexa 🇲🇽');
  else if (lowerQuery.includes('corrido')) params.set('genre', 'Corridos Tumbados 🇲🇽');
  else GENRES.forEach(g => { const gl = g.toLowerCase().replace(/🇲🇽|🌵|🎺|🎻|🍑|🇩🇴|🇯🇲|🔥|🕯️|🇧🇷|🌍|🥁|🔪|☕|🔫|🏠|🍭|⛓️|🚗|🎸|🎹|💎|🎤|🤘|🌀/g, '').trim(); if (gl && lowerQuery.includes(gl)) params.set('genre', g); });
  params.set('q', query.trim());
  window.location.href = `/beats/catalog?${params.toString()}`;
}

// ─── Stat Counter ─────────────────────────────────────────────────────────
function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center group">
      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent mb-1 group-hover:bg-accent/10 group-hover:border-accent/20 transition-all">
        {icon}
      </div>
      <span className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none">{value}</span>
      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Explore Card ─────────────────────────────────────────────────────────
function ExploreCard({ href, img, label, sub, accent }: { href: string; img: string; label: string; sub: string; accent: string }) {
  return (
    <Link href={href} className="group relative rounded-[3rem] overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-700 shadow-2xl aspect-[3/4]">
      <Image src={img} alt={label} fill className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-50 group-hover:opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      {/* top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-all duration-500" style={{ backgroundImage: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-end p-10 text-center">
        <div className="mb-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/20 text-white/60 opacity-0 group-hover:opacity-100 transition-all duration-500" style={{ background: `${accent}18` }}>
            {sub}
          </span>
        </div>
        <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic">{label}</h3>
        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>Explorar</span>
          <ArrowRight size={12} style={{ color: accent }} />
        </div>
      </div>
    </Link>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────
function FeatureCard({ icon, hex, title, desc, badge }: { icon: React.ReactNode; hex: string; title: string; desc: string; badge?: string }) {
  return (
    <div className="relative rounded-[2.5rem] p-8 border border-white/8 bg-white/[0.03] group hover:border-white/15 transition-all duration-500 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-all duration-500"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${hex}60, transparent)` }} />
      <div className="absolute top-[-30%] right-[-10%] w-[200px] h-[200px] rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: `${hex}12` }} />
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300"
          style={{ background: `${hex}15`, color: hex }}>
          {icon}
        </div>
        <h3 className="text-xl font-black text-white tracking-tighter mb-3">{title}</h3>
        <p className="text-white/40 leading-relaxed text-sm font-medium">{desc}</p>
        {badge && (
          <div className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border"
            style={{ color: hex, borderColor: `${hex}30`, background: `${hex}10` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: hex }} />
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [trendingBeats, setTrendingBeats] = useState<any[]>([]);
  const [trendingProducers, setTrendingProducers] = useState<any[]>([]);
  const [bannerLoading, setBannerLoading] = useState(true);

  // Live search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); setShowResults(false); return; }
    const t = setTimeout(async () => {
      setIsSearching(true); setShowResults(true);
      try {
        let q = supabase.from('beats_busqueda')
          .select('id, titulo, portada_url, productor_nombre_artistico, productor_nombre_usuario, productor_foto_perfil')
          .eq('es_publico', true);
        if (searchQuery.startsWith('@')) q = q.ilike('productor_nombre_usuario', `%${searchQuery.substring(1)}%`);
        else q = q.or(`titulo.ilike.%${searchQuery.trim()}%,productor_nombre_artistico.ilike.%${searchQuery.trim()}%,productor_nombre_usuario.ilike.%${searchQuery.trim()}%`);
        const { data } = await q.limit(6);
        setSearchResults(data || []);
      } catch { /* noop */ } finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Featured banner data
  useEffect(() => {
    async function load() {
      try {
        const { data: beats } = await supabase.from('beats')
          .select('id, productor_id, titulo, precio_basico_mxn, bpm, genero, portada_url, archivo_mp3_url, archivo_muestra_url, tono_escala, vibras, fecha_creacion, conteo_reproducciones, producer:productor_id ( nombre_artistico, nombre_usuario, esta_verificado, es_fundador, foto_perfil, nivel_suscripcion )')
          .eq('es_publico', true).order('conteo_reproducciones', { ascending: false, nullsFirst: false }).limit(10);
        const { data: prods } = await supabase.from('perfiles')
          .select('id, nombre_artistico, nombre_usuario, foto_perfil, nivel_suscripcion, esta_verificado, es_fundador, biografia, fecha_creacion')
          .order('nivel_suscripcion', { ascending: false }).limit(5);
        if (beats) setTrendingBeats(beats as any);
        if (prods) setTrendingProducers(prods);
      } catch { /* noop */ } finally { setBannerLoading(false); }
    }
    load();
  }, []);

  const stats = [
    { value: '10K+', label: 'Beats', icon: <Music size={16} /> },
    { value: '2K+', label: 'Productores', icon: <Users size={16} /> },
    { value: '#1', label: 'En México', icon: <TrendingUp size={16} /> },
    { value: '100%', label: 'Legal', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#020205] text-white font-sans overflow-x-hidden">
      <Navbar />

      {/* ── Global BG glows ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/4 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-purple-700/4 blur-[150px] rounded-full" />
        <div className="absolute top-[35%] right-[5%] w-[35%] h-[35%] bg-amber-500/3 blur-[130px] rounded-full" />
      </div>

      <main>

        {/* ══ SECTION 1: HERO ══════════════════════════════════════════════════ */}
        <section className="relative pt-28 pb-20 px-4 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">

            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/60">🇲🇽 La Tienda de Beats #1 en México</span>
            </div>

            {/* Headline */}
            <h1 className="text-[3rem] leading-[1] md:text-8xl lg:text-[9rem] font-black tracking-tighter mb-6 px-2 select-none">
              La Casa de los<br />
              <span className="text-accent">Corridos Tumbados.</span>
            </h1>

            <p className="text-white/40 text-sm md:text-lg font-medium max-w-2xl mx-auto mb-10 leading-relaxed px-4">
              Beats, Sound Kits y servicios profesionales. Sin distracciones, sin anuncios. Al grano.
            </p>

            {/* ── Smart Search ── */}
            <div className="max-w-2xl mx-auto relative mb-10 px-4">
              <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-white/5 border border-white/10 backdrop-blur-md p-2 rounded-[2rem] md:rounded-full shadow-2xl transition-all focus-within:border-accent/40 focus-within:bg-white/8">
                <div className="flex flex-1 items-center min-h-[56px]">
                  <div className="pl-4 md:pl-5 text-white/30"><Search size={18} /></div>
                  <input
                    type="text"
                    placeholder="Ej: Corridos 140 bpm C# min..."
                    className="flex-1 bg-transparent border-none px-3 py-4 outline-none font-bold text-white text-base placeholder:text-white/20"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSmartSearch(searchQuery)}
                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  />
                </div>

                {/* Suggestions dropdown */}
                {showResults && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-[#0d0d12] border border-white/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Sugerencias</span>
                      {isSearching && <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {searchResults.length > 0 ? searchResults.map(r => (
                        <Link key={r.id} href={`/beats/${r.id}`} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all group">
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0">
                            <img src={r.portada_url || "/logo.png"} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{r.titulo}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <img src={r.productor_foto_perfil || "/logo.png"} className="w-3.5 h-3.5 rounded-full border border-white/10" alt="" />
                              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest truncate">{r.productor_nombre_artistico}</p>
                            </div>
                          </div>
                          <Zap size={12} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </Link>
                      )) : !isSearching ? (
                        <div className="p-8 text-center"><p className="text-xs font-bold text-white/30 uppercase tracking-widest">Sin resultados</p></div>
                      ) : null}
                    </div>
                    <button onClick={() => handleSmartSearch(searchQuery)}
                      className="w-full p-3 mt-1 bg-accent/5 hover:bg-accent/10 text-accent text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all">
                      Ver todos para &quot;{searchQuery}&quot;
                    </button>
                  </div>
                )}

                <button onClick={() => handleSmartSearch(searchQuery)}
                  className="group relative overflow-hidden bg-accent text-white px-7 py-4 mt-2 md:mt-0 rounded-2xl md:rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all min-h-[52px] flex items-center gap-2 justify-center">
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <Zap size={16} fill="white" className="relative z-10 shrink-0" />
                  <span className="relative z-10">Buscar</span>
                </button>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-3 px-4">
              <Link href="/beats/catalog?view=corridos_tumbados"
                className="group relative inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:border-white/25 hover:bg-white/8 transition-all">
                🎺 Corridos Tumbados 🇲🇽 <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/beats/catalog?view=reggaeton_mexa"
                className="group relative inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:border-white/25 hover:bg-white/8 transition-all">
                🍑 Reggaetón Mexa 🇲🇽 <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <div className="border-t border-b border-white/8 bg-white/[0.02] py-10 px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12 md:gap-20">
            {stats.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        </div>

        {/* ══ SECTION 2: FEATURED BANNER (same as Explorar) ══════════════════════ */}
        <section className="py-16 px-4">
          <div className="max-w-[1700px] mx-auto">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <TrendingUp size={16} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Trending Ahora</h2>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Los beats más escuchados del momento</p>
              </div>
              <Link href="/beats/catalog" className="ml-auto flex items-center gap-2 text-[9px] font-black text-accent uppercase tracking-widest hover:underline">
                Ver todo <ArrowRight size={12} />
              </Link>
            </div>
            {!bannerLoading ? (
              <FeaturedBanner trendingBeats={trendingBeats} trendingProducers={trendingProducers} featuredMoods={[]} />
            ) : (
              <div className="w-full h-[420px] bg-white/[0.03] rounded-[3rem] border border-white/8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Cargando tendencias...</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══ SECTION 3: EXPLORE CARDS (same style as beats/page.tsx) ══════════════ */}
        <section className="py-16 px-4">
          <div className="max-w-[1700px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-3">
                Explora el Tianguis
              </h2>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Todo lo que necesitas para triunfar está aquí.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ExploreCard href="/beats/catalog" img="/images/explore/zaytoven.jpg" label="Beats" sub="Catálogo Completo" accent="#00f2ff" />
              <ExploreCard href="/sound-kits" img="/images/explore/junior_h_singer.jpg" label="Sound Kits" sub="Packs & Samples" accent="#f59e0b" />
              <ExploreCard href="/productores" img="/images/explore/drumma_boy_producer.jpg" label="Productores" sub="Encuentra tu favorito" accent="#a855f7" />
            </div>
          </div>
        </section>

        {/* ══ SECTION 4: FEATURES ══════════════════════════════════════════════ */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-14">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
                Poder <span className="text-accent">Ilimitado.</span>
              </h2>
              <p className="text-white/40 text-lg font-medium max-w-xl">
                Herramientas de próxima generación integradas directamente en tu flujo de trabajo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FeatureCard hex="#3b82f6" icon={<Cpu size={22} />} title="Smart Match Algorithm"
                desc="Nuestra IA analiza la estructura armónica de tus búsquedas para recomendarte beats que encajan matemáticamente con tu estilo." />
              <FeatureCard hex="#00f2ff" icon={<Waves size={22} />} title="Auto-Mastering Preview"
                desc="Escucha cómo sonaría tu voz sobre el beat en tiempo real. Sube una demo y deja que nuestro motor la mezcle instantáneamente." badge="Beta Access" />
              <FeatureCard hex="#10b981" icon={<ShieldCheck size={22} />} title="Smart Contracts"
                desc="Olvídate del papeleo. Cada transacción genera un contrato legalmente vinculante, protegiendo tus derechos para siempre." />
            </div>
          </div>
        </section>

        {/* ══ SECTION 5: SOCIAL PROOF (Brands) ════════════════════════════════ */}
        <div className="border-t border-white/8 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-center mb-8">Música distribuida a través de</p>
            <div className="flex flex-wrap justify-center md:justify-between items-center gap-10 opacity-20 hover:opacity-50 transition-all duration-700 select-none">
              {['Sony Music', 'Warner Chappell', 'Universal', 'Spotify', 'BMI', 'Apple Music'].map(b => (
                <span key={b} className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter hover:text-accent transition-colors cursor-default">{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ══ SECTION 6: CTA FINAL ══════════════════════════════════════════════ */}
        <section className="py-32 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/3 to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Únete a miles de productores</span>
            </div>
            <h2 className="text-6xl md:text-9xl font-black text-white tracking-tighter mb-10 leading-[0.85]">
              ¿Listo para<br /><span className="text-accent italic">romperla?</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
              <Link href="/beats" className="group relative overflow-hidden bg-accent text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-accent/30 flex items-center gap-3">
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Music size={18} className="relative z-10" />
                <span className="relative z-10">Explorar Beats</span>
              </Link>
              <Link href="/pricing" className="group inline-flex items-center gap-2 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/8 transition-all">
                <Crown size={16} className="text-amber-400" />
                Ver Planes
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
