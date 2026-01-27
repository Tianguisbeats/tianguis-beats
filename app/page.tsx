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

  const categories = [
    { name: 'Todos', emoji: '🎵' },
    { name: 'Corridos Tumbados', emoji: '🎸' },
    { name: 'Reggaeton', emoji: '🍑' },
    { name: 'Trap', emoji: '🔌' },
    { name: 'Boombap', emoji: '🥁' },
    { name: 'R&B', emoji: '✨' },
  ];

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

      // 3. Recomendados (Fallback por ahora si no hay login)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // En un futuro consultaremos la tabla 'listens'
        // Por ahora recomendamos Aleatorio de géneros populares
        const { data: recData } = await supabase
          .from('beats')
          .select('*, producer:producer_id(artistic_name)')
          .eq('is_public', true)
          .limit(5);
        if (recData) setRecommendedBeats(await transformBeatData(recData));
      }

      setLoading(false);
    };

    fetchSections();
  }, []);

  // Fetch para el buscador y filtros
  useEffect(() => {
    const searchBeats = async () => {
      if (!searchQuery && activeTab === 'Todos') {
        setFilteredBeats([]);
        return;
      }

      let query = supabase.from('beats').select('*, producer:producer_id(artistic_name)').eq('is_public', true);

      if (activeTab !== 'Todos') {
        query = query.eq('genre', activeTab);
      }

      if (activeMood) {
        query = query.eq('mood', activeMood);
      }

      if (activeKey) {
        query = query.eq('musical_key', activeKey);
      }

      if (activeBpm) {
        query = query.eq('bpm', parseInt(activeBpm));
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data } = await query.limit(20);
      if (data) setFilteredBeats(await transformBeatData(data));
    };

    searchBeats();
  }, [searchQuery, activeTab, activeMood, activeBpm, activeKey]);

  const Section = ({ title, subtitle, beats }: { title: string, subtitle: string, beats: Beat[] }) => (
    beats.length > 0 ? (
      <div className="mb-20">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">{title}</h2>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">{subtitle}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {beats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
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

          {/* Barra de Filtros */}
          <div className="flex items-center gap-2 overflow-x-auto pb-10 no-scrollbar w-full mb-12 border-b border-slate-100">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveTab(cat.name)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap border ${activeTab === cat.name
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/30'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600 shadow-sm'
                  }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span className="uppercase tracking-widest">{cat.name}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escaneando el tianguis...</p>
            </div>
          ) : (
            <>
              {/* Resultados de Búsqueda */}
              {(searchQuery || activeTab !== 'Todos') ? (
                <Section
                  title={`Resultados para "${searchQuery || activeTab}"`}
                  subtitle="Lo que encontramos para tu búsqueda"
                  beats={filteredBeats}
                />
              ) : (
                <>
                  <Section title="🔥 Recién Horneado" subtitle="Prioridad para nuestros fundadores y nuevas joyas" beats={newBeats} />
                  <Section title="📈 Lo más Escuchado" subtitle="Lo que más está sonando en el barrio" beats={trendingBeats} />
                  <Section title="💰 Lo más Comprado" subtitle="Los hits que están rompiendo las ventas" beats={topSellers} />
                  {recommendedBeats.length > 0 && (
                    <Section title="✨ Recomendados para ti" subtitle="Basado en tu estilo y lo último que escuchaste" beats={recommendedBeats} />
                  )}
                </>
              )}
            </>
          )}

          <div className="mt-20 text-center">
            <Link
              href="/beats"
              className="inline-flex items-center gap-3 text-slate-400 hover:text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] transition-all border-b-2 border-transparent hover:border-blue-600 pb-3 group"
            >
              Ver todo el tianguis <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
