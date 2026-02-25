"use client";
/**
 * Beats Page (Explorar)
 * Página principal para explorar y buscar beats en el marketplace.
 * Incluye filtros, búsqueda y visualización de beats destacados.
 */

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedBanner from "@/components/explore/FeaturedBanner";
import Image from "next/image";
import { Beat } from "@/lib/types";

export default function ExploreHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    }>
      <HubContent />
    </Suspense>
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
            id, titulo, precio_basico_mxn, bpm, genero, portada_url, archivo_mp3_url, archivo_muestra_url, nota_musical, escala_musical, vibras, created_at, conteo_reproducciones,
            producer:productor_id ( nombre_artistico, nombre_usuario, esta_verificado, es_fundador, foto_perfil, nivel_suscripcion )
          `)
          .eq('es_publico', true)
          .order('conteo_reproducciones', { ascending: false, nullsFirst: false })
          .limit(10);

        if (trendData) setTrendingBeats(trendData as any);

        const { data: trendProd } = await supabase
          .from('perfiles')
          .select('id, nombre_artistico, nombre_usuario, foto_perfil, nivel_suscripcion, esta_verificado, es_fundador, biografia, created_at')
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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 pt-8 pb-32">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-10">

          {/* Banner Principal */}
          <div className="mb-16">
            {!isBannerLoading ? (
              <FeaturedBanner
                trendingBeats={trendingBeats}
                trendingProducers={trendingProducers}
                featuredMoods={[]} // Keep it simple for the Hub
              />
            ) : (
              <div className="w-full h-[400px] bg-card rounded-[3rem] animate-pulse border border-border flex items-center justify-center">
                <Music className="text-accent/20 animate-bounce" size={48} />
              </div>
            )}
          </div>

          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black text-foreground uppercase tracking-tighter mb-6 font-heading">
              Explora el Tianguis
            </h1>
            <p className="text-muted text-xl font-medium max-w-2xl mx-auto uppercase tracking-widest text-[10px]">
              Todo lo que necesitas para triunfar está aquí.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 px-4 md:px-0">
            {/* Beats Card */}
            <Link href="/beats/catalog" className="group relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer border border-border hover:border-emerald-500/40 transition-all duration-700 shadow-2xl hover:shadow-emerald-500/10">
              <Image
                src="/images/explore/zaytoven.jpg"
                alt="Beats Background"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col items-center justify-end p-12 text-center">
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">Beats</h3>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">EXPLORA TODO EL CATÁLOGO</p>
              </div>
            </Link>

            {/* Sound Kits Card */}
            <Link href="/sound-kits" className="group relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer border border-border hover:border-amber-500/40 transition-all duration-700 shadow-2xl hover:shadow-amber-500/10">
              <Image
                src="/images/explore/junior_h_singer.jpg"
                alt="Sound Kits Background"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col items-center justify-end p-12 text-center">
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">Sound Kits</h3>
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">Explorar Sonidos</p>
              </div>
            </Link>

            {/* Artists Card */}
            <Link href="/productores" className="group relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer border border-border hover:border-blue-500/40 transition-all duration-700 shadow-2xl hover:shadow-blue-500/10">
              <Image
                src="/images/explore/drumma_boy_producer.jpg"
                alt="Producers Background"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col items-center justify-end p-12 text-center">
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">Productores</h3>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">Encuentra a tu favorito</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
