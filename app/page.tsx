"use client";

import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { 
  Play, 
  ShoppingCart, 
  Menu, 
  X, 
  Music, 
  Zap, 
  Headphones, 
  Flame, 
  Tag, 
  Filter, 
  ChevronRight,
  Search 
} from 'lucide-react';

// Definimos la estructura de datos para que TypeScript no marque error
interface Beat {
  id: number;
  title: string;
  producer: string;
  price: string;
  bpm: number;
  tag: string | null;
  tagEmoji: string | null;
  tagColor: string;
  coverColor: string;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
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
    { id: 1, title: "Cumbión Triste", producer: "DJ Neza", price: "$299", bpm: 90, tag: "Recién Horneado", tagEmoji: "🔥", tagColor: "bg-orange-600", coverColor: "bg-slate-50" },
    { id: 2, title: "Corrido Belik", producer: "El Kompa", price: "$349", bpm: 120, tag: "En Tendencia", tagEmoji: "📈", tagColor: "bg-red-600", coverColor: "bg-slate-100" },
    { id: 3, title: "Perreo Sucio", producer: "Flow Pesado", price: "$299", bpm: 98, tag: "Picante", tagEmoji: "🌶️", tagColor: "bg-green-600", coverColor: "bg-slate-50" },
    { id: 4, title: "Trap Hard", producer: "Lil Z", price: "$399", bpm: 140, tag: "Gema Oculta", tagEmoji: "💎", tagColor: "bg-purple-600", coverColor: "bg-slate-100" },
    { id: 5, title: "Sad Boyz", producer: "Junior B", price: "$250", bpm: 85, tag: "De Remate", tagEmoji: "🏷️", tagColor: "bg-blue-600", coverColor: "bg-slate-50" },
    { id: 6, title: "Sierreño Vibe", producer: "Rancho Humilde", price: "$349", bpm: 115, tag: "Recién Horneado", tagEmoji: "🔥", tagColor: "bg-orange-600", coverColor: "bg-slate-100" },
    { id: 7, title: "Dembow Mexa", producer: "El Alfa (Fan)", price: "$299", bpm: 105, tag: "Sabroso", tagEmoji: "🌮", tagColor: "bg-yellow-600", coverColor: "bg-slate-50" },
    { id: 8, title: "Drill Oscuro", producer: "666 Beats", price: "$499", bpm: 142, tag: "En Tendencia", tagEmoji: "📈", tagColor: "bg-red-600", coverColor: "bg-slate-100" },
    { id: 9, title: "Lo-Fi Tacos", producer: "Chill Vibes", price: "$199", bpm: 75, tag: "Sabroso", tagEmoji: "🌮", tagColor: "bg-yellow-600", coverColor: "bg-slate-50" },
    { id: 10, title: "Banda Synth", producer: "Sinaloa Tech", price: "$399", bpm: 130, tag: "Experimental", tagEmoji: "🧪", tagColor: "bg-cyan-600", coverColor: "bg-slate-100" },
  ];

  // Lógica de filtrado por búsqueda
  const filteredBeats = useMemo(() => {
    return beats.filter(beat => 
      beat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      beat.producer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, beats]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center transform rotate-2 shadow-lg shadow-blue-600/20">
                <Music className="text-white w-5 h-5" />
              </div>
              <span className="font-black text-2xl tracking-tighter uppercase">
                Tianguis<span className="text-blue-600">Beats</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-baseline space-x-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <a href="#" className="hover:text-blue-600 transition-colors">Explorar</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Licencias</a>
                <a href="#planes" className="hover:text-blue-600 transition-colors">Planes</a>
              </div>
              <button className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg transform hover:-translate-y-0.5">
                Vender Beats
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section IMPACTANTE */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-40">
           <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-20 left-10 w-80 h-80 bg-cyan-100 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            La plataforma #1 de beats en México 🇲🇽
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.85]">
            Sube el nivel.<br />
            <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">Rompe la escena.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mb-12">
            "Donde el talento mexa se encuentra con los próximos éxitos mundiales. Trato directo, sin letras chiquitas."
          </p>

          {/* BUSCADOR INTEGRADO */}
          <div className="max-w-2xl mx-auto mb-12 relative group">
            <div className="absolute inset-0 bg-blue-600/10 rounded-[2rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-2 shadow-2xl focus-within:border-blue-600 focus-within:bg-white transition-all">
              <div className="pl-5 pr-3 text-slate-400">
                <Search size={22} />
              </div>
              <input 
                type="text" 
                placeholder="Busca trap, corridos, BPM, productor..." 
                className="flex-1 py-4 bg-transparent border-none focus:ring-0 text-lg font-bold placeholder:text-slate-300 outline-none text-slate-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="hidden sm:flex bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all active:scale-95 items-center gap-2 shadow-lg shadow-blue-600/20">
                <Zap size={14} fill="white" />
                Buscar
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <button className="px-10 py-5 rounded-2xl bg-blue-600 text-white text-lg font-black hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
              <Zap size={24} fill="white" />
              Abre tu tianguis digital
            </button>

            {/* ✅ ÚNICO CAMBIO: este botón ahora navega a /beats */}
            <Link
              href="/beats"
              className="px-10 py-5 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 text-lg font-black hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
            >
              <Headphones size={24} />
              Escuchar Beats
            </Link>
          </div>
        </div>
      </header>

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
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap border ${
                    activeTab === cat.name 
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
              <div key={beat.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all transform hover:-translate-y-2">
                <div className={`aspect-square ${beat.coverColor} relative flex items-center justify-center overflow-hidden`}>
                  {beat.tag && (
                    <div className={`absolute top-4 left-4 ${beat.tagColor} text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-1.5 uppercase tracking-tighter`}>
                      <span>{beat.tagEmoji}</span>
                      {beat.tag}
                    </div>
                  )}
                  
                  <Music className="text-slate-200 w-20 h-20 group-hover:scale-110 group-hover:text-blue-500/20 transition-all duration-700 ease-out" />
                  
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                    <button className="bg-white text-blue-600 p-5 rounded-full shadow-2xl transform hover:scale-110 transition-transform active:scale-90">
                      <Play fill="currentColor" size={28} className="ml-1" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-black text-slate-900 text-sm truncate mb-1 group-hover:text-blue-600 transition-colors leading-tight uppercase tracking-tight">
                    {beat.title}
                  </h3>
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">prod. {beat.producer}</p>
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{beat.bpm} BPM</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-blue-600 font-black text-xl leading-none">{beat.price}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">Licencia Digital</span>
                    </div>
                    <button className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
             <button className="inline-flex items-center gap-3 text-slate-400 hover:text-blue-600 font-black uppercase tracking-[0.3em] text-[10px] transition-all border-b-2 border-transparent hover:border-blue-600 pb-3 group">
                Ver todo el tianguis <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center transform -rotate-6 shadow-xl shadow-slate-200">
                  <Music className="text-white w-5 h-5" />
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-slate-900 uppercase tracking-tighter leading-none">TianguisBeats</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Plataforma Digital</span>
               </div>
            </div>

            <div className="flex gap-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               <a href="#" className="hover:text-blue-600 transition-colors">Términos</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Privacidad</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Ayuda</a>
            </div>

            <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Orgullosamente Hecho en Neza 🇲🇽
            </div>
        </div>
      </footer>
    </div>
  );
}
