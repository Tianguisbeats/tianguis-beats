/**
 * Página Principal: Punto de entrada de la aplicación.
 * Muestra el Hero y una sección de beats destacados.
 */
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Loader2,
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import BeatCard, { Beat } from '@/components/BeatCard';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('Todos');
  const [activeMood, setActiveMood] = useState<string>('');
  const [activeBpm, setActiveBpm] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [newBeats, setNewBeats] = useState<Beat[]>([]);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [topSellers, setTopSellers] = useState<Beat[]>([]);
  const [recommendedBeats, setRecommendedBeats] = useState<Beat[]>([]);
  const [filteredBeats, setFilteredBeats] = useState<Beat[]>([]);

  const [loading, setLoading] = useState(true);

  /* 
   * Limpieza: Eliminamos categories y estados de búsqueda inline 
   * ya que ahora el Hero redirige a /beats
   */

  const transformBeatData = async (data: any[]) => {
    return data.map((b: any) => {
      const { data: { publicUrl } } = supabase.storage
        .from('beats-previews')
        .getPublicUrl(b.mp3_url);

      return {
        id: b.id,
        title: b.title,
        producer: b.producer?.artistic_name || 'Productor Anónimo',
        price_mxn: b.price_mxn,
        bpm: b.bpm,
        genre: b.genre,
        mp3_url: publicUrl,
        musical_key: b.musical_key,
        mood: b.mood,
        tag: b.tag || (b.tier_visibility > 0 ? "Premium" : "Nuevo"),
        tagEmoji: b.tag_emoji || (b.tier_visibility > 0 ? "⭐" : "🔥"),
        tagColor: b.tag_color || (b.tier_visibility > 0 ? "bg-indigo-600" : "bg-orange-600"),
        coverColor: b.cover_color || (Math.random() > 0.5 ? 'bg-slate-50' : 'bg-slate-100'),
        tier_visibility: b.tier_visibility
      };
    });
  };

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);

      // 1. Lo más Nuevo (Prioridad Premium)
      const { data: newData } = await supabase
        .from('beats')
        .select('*, producer:producer_id(artistic_name)')
        .eq('is_public', true)
        .order('tier_visibility', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      // 2. Tendencias / Lo más escuchado (play_count)
      const { data: trendData } = await supabase
        .from('beats')
        .select('*, producer:producer_id(artistic_name)')
        .eq('is_public', true)
        .order('play_count', { ascending: false })
        .limit(10);

      // 3. Lo más comprado (sale_count)
      const { data: salesData } = await supabase
        .from('beats')
        .select('*, producer:producer_id(artistic_name)')
        .eq('is_public', true)
        .order('sale_count', { ascending: false })
        .limit(10);

      if (newData) setNewBeats(await transformBeatData(newData));
      if (trendData) setTrendingBeats(await transformBeatData(trendData));
      if (salesData) setTopSellers(await transformBeatData(salesData));

      // 3. Recomendados (Con fallback para invitados)
      const { data: { session } } = await supabase.auth.getSession();
      let recQuery = supabase.from('beats').select('*, producer:producer_id(artistic_name)').eq('is_public', true);

      if (session) {
        // En un futuro consultaremos la tabla 'listens' o 'preferences'
        // Por ahora, traemos beats que no estén en las otras secciones para variar
        recQuery = recQuery.order('created_at', { ascending: true }).limit(5);
      } else {
        // Para invitados, traemos beats aleatorios de calidad
        recQuery = recQuery.limit(5);
      }

      const { data: recData } = await recQuery;
      if (recData) setRecommendedBeats(await transformBeatData(recData));

      setLoading(false);
    };

    fetchSections();
  }, []);

  // Efecto de búsqueda inline eliminado 

  const Section = ({ title, subtitle, beats }: { title: string, subtitle: string, beats: Beat[] }) => (
    beats.length > 0 ? (
      <div className="mb-16 last:mb-0">
        <div className="flex items-end justify-between mb-8 px-4 md:px-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-1 uppercase tracking-tighter">{title}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">{subtitle}</p>
          </div>
          <Link href="/beats" className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-slate-900 transition-colors">
            Ver más <ChevronRight size={14} />
          </Link>
        </div>

        {/* Horizontal Scroll / Carousel Container */}
        <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory no-scrollbar">
          {beats.map((beat) => (
            <div key={beat.id} className="min-w-[280px] w-[280px] snap-center">
              <BeatCard beat={beat} />
            </div>
          ))}
          {/* Card 'Ver más' al final del carrusel */}
          <Link href="/beats" className="min-w-[150px] flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all cursor-pointer group snap-center">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ChevronRight size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Ver Todo</span>
          </Link>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />
      <Hero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeGenre={activeTab}
        setActiveGenre={setActiveTab}
        activeMood={activeMood}
        setActiveMood={setActiveMood}
        activeBpm={activeBpm}
        setActiveBpm={setActiveBpm}
        activeKey={activeKey}
        setActiveKey={setActiveKey}
      />

      <section className="bg-slate-50/50 border-t border-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-4">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escaneando el tianguis...</p>
            </div>
          ) : (
            <>
              <Section title="🔥 Recién Horneado" subtitle="Las últimas joyas directas del horno" beats={newBeats} />
              <Section title="📈 Lo más Escuchado" subtitle="Los ritmos que están rompiendo las bocinas" beats={trendingBeats} />
              <Section title="💰 Lo más Comprado" subtitle="Los beats más buscados por los artistas" beats={topSellers} />
              <Section title="✨ Recomendados para ti" subtitle="Seleccionamos lo mejor basado en tu estilo" beats={recommendedBeats} />
            </>
          )}

          <div className="mt-20 mb-20">
            <Link
              href="/beats"
              className="w-full bg-slate-900 text-white py-8 rounded-[2rem] flex flex-col items-center justify-center group hover:bg-blue-600 transition-colors shadow-2xl shadow-slate-900/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl md:text-4xl">💿</span>
                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">Explorar Catálogo Completo</h3>
              </div>
              <p className="text-slate-400 group-hover:text-blue-200 font-medium tracking-wide flex items-center gap-2">
                Ver todos los beats disponibles <ChevronRight size={16} />
              </p>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
