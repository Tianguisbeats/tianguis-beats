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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { name: 'Todos', emoji: '📦' },
    { name: 'Corridos Tumbados', emoji: '🎸' },
    { name: 'Reggaeton', emoji: '🍑' },
    { name: 'Trap', emoji: '🔌' },
    { name: 'Cumbia 420', emoji: '🎺' },
    { name: 'Boombap', emoji: '🥁' },
    { name: 'Experimental', emoji: '🧪' },
  ];

  useEffect(() => {
    const fetchBeats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          producer:producer_id (
            artistic_name
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching beats:', error);
      } else if (data) {
        const transformedBeats = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          producer: b.producer?.artistic_name || 'Productor Anónimo',
          price_mxn: b.price_mxn,
          bpm: b.bpm,
          genre: b.genre,
          tag: b.tag || "Nuevo",
          tagEmoji: b.tag_emoji || "🔥",
          tagColor: b.tag_color || "bg-orange-600",
          coverColor: b.cover_color || (Math.random() > 0.5 ? 'bg-slate-50' : 'bg-slate-100')
        }));
        setBeats(transformedBeats);
      }
      setLoading(false);
    };

    fetchBeats();
  }, []);

  const filteredBeats = useMemo(() => {
    return beats.filter(beat => {
      const matchesSearch = (beat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (beat.producer?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesTab = activeTab === 'Todos' || beat.genre === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab, beats]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />
      <Hero searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Sección "Recién Horneado" con Filtros */}
      <section className="bg-slate-50/50 border-t border-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 flex items-center gap-3 mb-2 uppercase tracking-tighter">
                🔥 {searchQuery ? 'Resultados' : 'Recién Horneado'}
              </h2>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Joyas frescas directo del estudio mexa</p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar w-full md:w-auto">
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
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando el tianguis...</p>
            </div>
          ) : filteredBeats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredBeats.map((beat) => (
                <BeatCard key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <p className="text-slate-400 font-bold italic">No se encontraron beats en esta sección todavía.</p>
            </div>
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
