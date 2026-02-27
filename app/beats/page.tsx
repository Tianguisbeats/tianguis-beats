"use client";
/**
 * Beats Page (Explorar Tianguis) — Premium Redesign
 * Página principal para explorar el marketplace.
 */

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Music, TrendingUp, Users, Headphones, ArrowRight, Zap, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedBanner from "@/components/explore/FeaturedBanner";
import { Beat } from "@/lib/types";

export default function ExploreHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-[9px] font-black text-muted uppercase tracking-widest animate-pulse">Cargando...</p>
        </div>
      </div>
    }>
      <HubContent />
    </Suspense>
  );
}

function CategoryCard({ href, img, label, sub, count, accent }: { href: string; img: string; label: string; sub: string; count?: string; accent: string }) {
  return (
    <Link href={href} className="group relative rounded-[3rem] overflow-hidden cursor-pointer border border-border hover:border-foreground/20 transition-all duration-700 shadow-xl dark:shadow-none aspect-[3/4]">
      <Image src={img} alt={label} fill className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-100 group-hover:opacity-70" />
      {/* gradient overlay always present */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      {/* top accent shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-all duration-500"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${accent}, transparent)` }} />
      {/* count pill */}
      {count && (
        <div className="absolute top-5 right-5 px-3 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
          <span className="text-[8px] font-black text-white uppercase tracking-widest">{count}</span>
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-end p-10 text-center">
        <div className="mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/20 text-white/70 opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{ background: `${accent}18` }}>{sub}</span>
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

function MiniStatPill({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-full shadow-sm">
      <div className="text-accent">{icon}</div>
      <div>
        <p className="text-sm font-black text-foreground leading-none">{value}</p>
        <p className="text-[8px] font-black text-muted uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function HubContent() {
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [trendingProducers, setTrendingProducers] = useState<any[]>([]);
  const [isBannerLoading, setIsBannerLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadBillboard() {
      try {
        setIsBannerLoading(true);
        const { data: trendData } = await supabase
          .from('beats')
          .select(`
            id, productor_id, titulo, precio_basico_mxn, bpm, genero, portada_url, archivo_mp3_url, archivo_muestra_url, tono_escala, vibras, fecha_creacion, conteo_reproducciones,
            producer:productor_id ( nombre_artistico, nombre_usuario, esta_verificado, es_fundador, foto_perfil, nivel_suscripcion )
          `)
          .eq('es_publico', true)
          .order('conteo_reproducciones', { ascending: false, nullsFirst: false })
          .limit(10);

        if (trendData) setTrendingBeats(trendData as any);

        const { data: trendProd } = await supabase
          .from('perfiles')
          .select('id, nombre_artistico, nombre_usuario, foto_perfil, nivel_suscripcion, esta_verificado, es_fundador, biografia, fecha_creacion')
          .order('nivel_suscripcion', { ascending: false })
          .limit(5);

        if (trendProd) setTrendingProducers(trendProd);
      } catch (err) {
        console.error("Billboard Error:", err);
      } finally {
        setIsBannerLoading(false);
      }
    }
    loadBillboard();
  }, []);

  return (
    /* ── Contenedor principal de la página de explorar ── */
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300 selection:bg-accent selection:text-white">
      <Navbar />

      {/* ── Glows de fondo decorativos ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-accent/[0.04] dark:bg-accent/[0.06] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-purple-600/[0.03] dark:bg-purple-600/[0.06] blur-[150px] rounded-full" />
      </div>

      {/* pb-24 en móvil reserva espacio para bottom nav + reproductor de audio */}
      <main className="flex-1 pt-8 pb-24 md:pb-16">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-10">

          {/* ── Encabezado de la seçción con título y estadísticas ── */}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full mb-4 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">En vivo · Tianguis</span>
              </div>
              {/* Título más compacto en móvil */}
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-foreground uppercase tracking-tighter leading-[0.9] mb-2">
                Explora el<br />
                <span className="text-accent">Tianguis.</span>
              </h1>
              <p className="text-muted text-[10px] font-black uppercase tracking-widest">Todo lo que necesitas para triunfar está aquí.</p>
            </div>
            {/* Pastillas de estadísticas — ocultas en móvil */}
            <div className="hidden sm:flex flex-wrap gap-3">
              <MiniStatPill icon={<Music size={14} />} value="10K+" label="Beats" />
              <MiniStatPill icon={<Users size={14} />} value="2K+" label="Productores" />
              <MiniStatPill icon={<Headphones size={14} />} value="50K+" label="Plays" />
            </div>
          </div>


          {/* ── FEATURED BANNER ── */}
          <div className="mb-16">
            {!isBannerLoading ? (
              <FeaturedBanner
                trendingBeats={trendingBeats}
                trendingProducers={trendingProducers}
                featuredMoods={[]}
              />
            ) : (
              <div className="w-full h-[400px] bg-card border border-border rounded-[3rem] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Music className="text-accent/20 animate-bounce" size={48} />
                  <p className="text-[9px] font-black text-muted uppercase tracking-widest animate-pulse">Cargando tendencias...</p>
                </div>
              </div>
            )}
          </div>



          {/* ── CATEGORY CARDS ── */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tighter">Explora por Categoría</h2>
                <p className="text-muted text-[9px] font-black uppercase tracking-widest mt-1">Descubre el sonido que buscas.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CategoryCard href="/beats/catalog" img="/images/explore/zaytoven.jpg" label="Beats" sub="Catálogo Completo" count="10K+ Beats" accent="#00f2ff" />
              <CategoryCard href="/sound-kits" img="/images/explore/junior_h_singer.jpg" label="Sound Kits" sub="Packs & Samples" count="500+ Kits" accent="#f59e0b" />
              <CategoryCard href="/productores" img="/images/explore/drumma_boy_producer.jpg" label="Productores" sub="Encuentra tu favorito" count="2K+ Artistas" accent="#a855f7" />
            </div>
          </div>



        </div>
      </main>

      <Footer />
    </div>
  );
}
