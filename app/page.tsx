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
  const [followedBeats, setFollowedBeats] = useState<Beat[]>([]);

  const [loading, setLoading] = useState(true);

  /* 
   * Limpieza: Eliminamos categories y estados de búsqueda inline 
   * ya que ahora el Hero redirige a /beats
   */

  const transformBeatData = async (data: any[]) => {
    return data.map((b: any) => {
      const { data: { publicUrl } } = supabase.storage
        .from('beats-muestras')
        .getPublicUrl(b.mp3_url);

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
        mp3_url: publicUrl,
        musical_key: b.musical_key,
        mood: b.mood,
        tag: b.tier_visibility > 0 ? "Premium" : "Nuevo",
        tagEmoji: b.tier_visibility > 0 ? "⭐" : "🔥",
        tagColor: b.tier_visibility > 0 ? "bg-indigo-600" : "bg-orange-600",
        coverColor: Math.random() > 0.5 ? 'bg-slate-50' : 'bg-slate-100',
        tier_visibility: b.tier_visibility
      };
    });
  };

  useEffect(() => {
    setLoading(true);

    const executeFetch = async () => {
      // Columnas mínimas para BeatCard
      const columns = 'id,title,price_mxn,bpm,genre,mp3_url,musical_key,mood,tier_visibility,producer:producer_id(artistic_name,username,is_verified,is_founder,avatar_url,subscription_tier)';

      const fetchSection = async (orderByField: string, limit: number) => {
        try {
          const { data, error } = await supabase
            .from('beats')
            .select(columns)
            .eq('is_public', true)
            .order(orderByField, { ascending: false })
            .limit(limit);

          if (error) throw error;
          return data;
        } catch (err) {
          console.warn(`Error fetching by ${orderByField}, falling back to created_at`, err);
          const { data } = await supabase
            .from('beats')
            .select(columns)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(limit);
          return data;
        }
      };

      // Parallel fetches con Promise.all
      const [newData, trendData, salesData, recData] = await Promise.all([
        fetchSection('created_at', 10),
        fetchSection('play_count', 10),
        fetchSection('sale_count', 10),
        fetchSection('created_at', 20),
      ]);

      if (newData) setNewBeats(await transformBeatData(newData));
      if (trendData) setTrendingBeats(await transformBeatData(trendData));
      if (salesData) setTopSellers(await transformBeatData(salesData));

      if (recData) {
        const shuffled = recData.sort(() => 0.5 - Math.random()).slice(0, 10);
        setRecommendedBeats(await transformBeatData(shuffled));
      }

      setLoading(false);
    };

    executeFetch();

    // Check for user and fetch followed beats
    const checkUserFollows = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
        if (follows && follows.length > 0) {
          const followingIds = follows.map(f => f.following_id);
          const { data: followedData } = await supabase
            .from('beats')
            .select('id,title,price_mxn,bpm,genre,mp3_url,musical_key,mood,tier_visibility,producer:producer_id(artistic_name,username,is_verified,is_founder,avatar_url,subscription_tier)')
            .in('producer_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(10);

          if (followedData) setFollowedBeats(await transformBeatData(followedData));
        }
      }
    };
    checkUserFollows();

  }, []);

  // Efecto de búsqueda inline eliminado 

  const Section = ({ title, subtitle, beats }: { title: string, subtitle: string, beats: Beat[] }) => (
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
      {beats.length > 0 ? (
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
      ) : (
        <div className="w-full py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Sección en construcción</p>
          <p className="text-slate-300 text-[10px]">Pronto verás más beats aquí</p>
        </div>
      )}
    </div>
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
            <div className="flex flex-col gap-16">
              {followedBeats.length > 0 && (
                <Section title="👥 De tus Productores Seguidos" subtitle="Nuevos lanzamientos de tu comunidad" beats={followedBeats} />
              )}
              <Section title="✨ Recomendados para ti" subtitle="Seleccionamos lo mejor basado en tu estilo" beats={recommendedBeats} />
              <Section title="🔥 Recién Horneado" subtitle="Las últimas joyas directas del horno" beats={newBeats} />
              <Section title="📈 Lo más Escuchado" subtitle="Los ritmos que están rompiendo las bocinas" beats={trendingBeats} />
              <Section title="💰 Lo más Comprado" subtitle="Los beats más buscados por los artistas" beats={topSellers} />
            </div>
          )}

          <div className="mt-24 mb-20 flex justify-center">
            <Link
              href="/beats"
              className="inline-flex items-center gap-4 px-8 py-4 bg-white border border-slate-200 rounded-full text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm hover:shadow-xl hover:scale-105 active:scale-95 group"
            >
              <span>Explorar todo el Tianguis</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
