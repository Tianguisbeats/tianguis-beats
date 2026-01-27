/**
 * Página Principal: Punto de entrada de la aplicación.
 * Muestra el Hero y una sección de beats destacados.
 */
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import BeatCard, { Beat } from '@/components/BeatCard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { name: 'Todos', emoji: '📦' },
    { name: 'Corridos Tumbados', emoji: '🎸' },
    { name: 'Reggaeton', emoji: '🍑' },
    { name: 'Trap', emoji: '🔌' },
    { name: 'Cumbia 420', emoji: '🎺' },
    { name: 'Boombap', emoji: '🥁' },
  ];

  const beats: Beat[] = [
    { id: 1, title: "Cumbión Triste", producer: "DJ Neza", price_mxn: 299, bpm: 90, genre: "Cumbia 420", tag: "Recién Horneado", tagEmoji: "🔥", tagColor: "bg-orange-600", coverColor: "bg-slate-50" },
    { id: 2, title: "Corrido Belik", producer: "El Kompa", price_mxn: 349, bpm: 120, genre: "Corridos Tumbados", tag: "En Tendencia", tagEmoji: "📈", tagColor: "bg-red-600", coverColor: "bg-slate-100" },
    { id: 3, title: "Perreo Sucio", producer: "Flow Pesado", price_mxn: 299, bpm: 98, genre: "Reggaeton", tag: "Picante", tagEmoji: "🌶️", tagColor: "bg-green-600", coverColor: "bg-slate-50" },
    { id: 4, title: "Trap Hard", producer: "Lil Z", price_mxn: 399, bpm: 140, genre: "Trap", tag: "Gema Oculta", tagEmoji: "💎", tagColor: "bg-purple-600", coverColor: "bg-slate-100" },
    { id: 5, title: "Sad Boyz", producer: "Junior B", price_mxn: 250, bpm: 85, genre: "Trap", tag: "De Remate", tagEmoji: "🏷️", tagColor: "bg-blue-600", coverColor: "bg-slate-50" },
    { id: 6, title: "Sierreño Vibe", producer: "Rancho Humilde", price_mxn: 349, bpm: 115, genre: "Corridos Tumbados", tag: "Recién Horneado", tagEmoji: "🔥", tagColor: "bg-orange-600", coverColor: "bg-slate-100" },
    { id: 7, title: "Dembow Mexa", producer: "El Alfa (Fan)", price_mxn: 299, bpm: 105, genre: "Reggaeton", tag: "Sabroso", tagEmoji: "🌮", tagColor: "bg-yellow-600", coverColor: "bg-slate-50" },
    { id: 8, title: "Drill Oscuro", producer: "666 Beats", price_mxn: 499, bpm: 142, genre: "Trap", tag: "En Tendencia", tagEmoji: "📈", tagColor: "bg-red-600", coverColor: "bg-slate-100" },
    { id: 9, title: "Lo-Fi Tacos", producer: "Chill Vibes", price_mxn: 199, bpm: 75, genre: "Boombap", tag: "Sabroso", tagEmoji: "🌮", tagColor: "bg-yellow-600", coverColor: "bg-slate-50" },
    { id: 10, title: "Banda Synth", producer: "Sinaloa Tech", price_mxn: 399, bpm: 130, genre: "Experimental", tag: "Experimental", tagEmoji: "🧪", tagColor: "bg-cyan-600", coverColor: "bg-slate-100" },
  ];

  const filteredBeats = useMemo(() => {
    return beats.filter(beat =>
      (beat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (beat.producer?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  }, [searchQuery, beats]);

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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredBeats.map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>

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
