"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Zap,
  ShieldCheck,
  Cpu,
  Music,
  Waves
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GENRES, MOODS } from '@/lib/constants';

/**
 * Página Principal (Home)
 * Renderiza la interfaz de inicio (Hero section, estadísticas, características destacadas).
 * Incluye un buscador inteligente que redirige al catálogo.
 */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSmartSearch = (query: string) => {
    if (!query.trim()) {
      window.location.href = '/beats/catalog';
      return;
    }

    const lowerQuery = query.toLowerCase();
    const params = new URLSearchParams();

    // 1. Detectar BPM (ej: "140 bpm" o solo un número entre 60 y 200)
    const bpmMatch = lowerQuery.match(/(\d{2,3})\s?(bpm)?/i);
    if (bpmMatch) {
      const bpmValue = parseInt(bpmMatch[1]);
      if (bpmValue >= 60 && bpmValue <= 220) {
        params.set('bpm', bpmValue.toString());
      }
    }

    // 2. Detectar Tonalidad (Key) y Escala
    const keys = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
    const scales = ["major", "minor", "mayor", "menor"];

    keys.forEach(k => {
      // Usar regex para buscar la nota como palabra independiente o al inicio
      const keyRegex = new RegExp(`\\b${k === 'c#' ? 'c#' : k}\\b`, 'i');
      if (keyRegex.test(lowerQuery)) {
        params.set('key', k.toUpperCase().replace('B', '#')); // Normalizar b -> # si fuera necesario, aunque aquí usamos #
      }
    });

    scales.forEach(s => {
      if (lowerQuery.includes(s)) {
        const scaleValue = (s === 'minor' || s === 'menor') ? 'Menor' : 'Mayor';
        params.set('scale', scaleValue);
      }
    });

    // 3. Detectar Moods de la lista oficial
    MOODS.forEach(m => {
      const moodLabel = m.label.toLowerCase();
      // Dividir por slash si existe (ej: "Triste / Depresivo")
      const moodParts = moodLabel.split(' / ');
      moodParts.forEach(part => {
        if (lowerQuery.includes(part.trim())) {
          params.set('mood', m.label);
        }
      });
    });

    // 4. Detectar Géneros de la lista oficial
    if (lowerQuery.includes('mexa')) {
      params.set('genre', 'Reggaetón Mexa 🇲🇽');
    } else if (lowerQuery.includes('corrido')) {
      params.set('genre', 'Corridos Tumbados 🇲🇽');
    } else {
      GENRES.forEach(g => {
        const genreLabel = g.toLowerCase().replace(/🇲🇽|🌵|🎺|🎻|🍑|🇩🇴|🇯🇲|🔥|🕯️|🇧🇷|🌍|🥁|🔪|☕|🔫|🏠|🍭|⛓️|🚗|🎸|🎹|💎|🎤|🤘|🌀/g, '').trim();
        if (genreLabel && lowerQuery.includes(genreLabel)) {
          params.set('genre', g);
        }
      });
    }

    // 5. Siempre enviar el query original como 'q' para permitir búsqueda parcial (tipo artista, título, etc)
    // Esto asegura que si el usuario escribe "Tai", se busque parcialmente en el catálogo.
    params.set('q', query.trim());

    window.location.href = `/beats/catalog?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body transition-colors duration-300 selection:bg-accent selection:text-white overflow-x-hidden">
      <Navbar />

      {/* 1. SECCIÓN PRINCIPAL (Hero) */}
      <section className="relative pt-24 pb-16 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        {/* Gradientes de fondo */}
        <div className="absolute top-0 left-0 w-full h-[80vh] bg-background -z-20"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-6 md:mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted animate-pulse-slow">
              🇲🇽 La Tienda de Beats #1 en México
            </span>
          </div>

          <h1 className="text-[2.5rem] leading-[1.1] md:text-7xl lg:text-9xl font-black text-foreground tracking-tighter mb-6 md:mb-8 font-heading px-2">
            La Casa de los <br />
            <span className="text-accent block sm:inline mt-1 sm:mt-0">Corridos Tumbados.</span>
          </h1>

          <p className="text-sm md:text-xl text-muted font-medium max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed tracking-tight px-6 font-body">
            Olvídate de interfaces lentas y llenas de anuncios. Mientras otros te saturan de opciones que no usas, aquí tienes Beats, Sound Kits y servicios profesionales en un solo lugar: sin distracciones y al grano.
          </p>

          {/* Buscador Integrado (Omni-Search) */}
          <div className="max-w-2xl mx-auto relative group mb-8 md:mb-12 px-4">
            <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-card p-2 rounded-[1.5rem] md:rounded-full shadow-2xl border border-border transition-all duration-300">
              <div className="flex flex-1 items-center min-h-[56px]">
                <div className="pl-4 md:pl-6 text-muted">
                  <Search size={20} className="md:w-5 md:h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Ej: Corridos 140 bpm C# min..."
                  className="flex-1 bg-transparent border-none px-3 md:px-4 py-4 outline-none font-bold text-foreground text-base md:text-lg placeholder:text-muted/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSmartSearch(searchQuery);
                    }
                  }}
                />
              </div>
              <button
                onClick={() => handleSmartSearch(searchQuery)}
                className="btn-standard bg-accent text-white border-none px-8 py-4 md:py-3 min-h-[56px] mt-2 md:mt-0 shadow-lg hover:bg-accent/90"
              >
                <div className="flex items-center gap-3">
                  <Zap size={18} fill="white" className="hidden md:block" />
                  <span className="text-[10px] tracking-[0.2em] font-black">BUSCAR AHORA</span>
                </div>
              </button>
            </div>
          </div>

          {/* Botones de llamada a la acción */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 px-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href={`/beats/catalog?view=corridos_tumbados`}
              className="group relative inline-flex items-center justify-center gap-3 px-6 py-5 card-modern text-foreground rounded-[1.25rem] md:rounded-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/20 min-h-[56px] w-full md:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 group-hover:text-accent transition-colors font-heading text-center">
                🎺 Explorar Corridos Tumbados 🇲🇽
              </span>
            </Link>

            <Link
              href={`/beats/catalog?view=reggaeton_mexa`}
              className="group relative inline-flex items-center justify-center gap-3 px-6 py-5 bg-card border border-border text-foreground rounded-[1.25rem] md:rounded-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/20 min-h-[56px] w-full md:w-auto mt-2 md:mt-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 group-hover:text-pink-500 transition-colors font-heading text-center">
                🍑 Explorar Reggaetón Mexa 🇲🇽
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. ESTADÍSTICAS / PRUEBA SOCIAL */}
      <section className="bg-card border-y border-border py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] text-center mb-10">Música Distribuida a través de</p>
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            {['Sony Music', 'Warner Chappell', 'Universal', 'Spotify', 'BMI', 'Apple Music'].map((brand) => (
              <span key={brand} className="text-xl md:text-2xl font-black text-muted uppercase tracking-tighter hover:text-accent transition-colors cursor-default">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CARACTERÍSTICAS DE IA (Sección "Vitaminada") */}
      <section className="py-20 px-4 bg-background overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 md:mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-6 font-heading">
              Poder <span className="text-accent">Ilimitado.</span>
            </h2>
            <p className="text-lg md:text-xl text-muted max-w-xl font-medium font-body">
              Herramientas de próxima generación integradas directamente en tu flujo de trabajo. No es solo un marketplace, es tu estudio inteligente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Característica 1 - Algoritmo (Smart Match) */}
            <div className="card-modern p-10 group">
              <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Cpu size={28} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight font-heading">Smart Match Algorithm</h3>
              <p className="text-muted leading-relaxed font-medium font-body">
                Nuestra IA analiza la estructura armónica de tus búsquedas para recomendarte beats que encajan matemáticamente con tu estilo.
              </p>
            </div>

            {/* Característica 2 - Vista previa de Masterización Inteligente */}
            <div className="card-modern bg-slate-900 border-none p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:opacity-100 transition-opacity opacity-50"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
                  <Waves size={28} />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight font-heading text-white">Auto-Mastering Preview</h3>
                <p className="text-slate-400 leading-relaxed font-medium font-body">
                  Escucha cómo sonaría tu voz sobre el beat en tiempo real. Sube una demo y deja que nuestro motor la mezcle instantáneamente.
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                  Beta Access
                </div>
              </div>
            </div>

            {/* Característica 3 - Contratos Inteligentes */}
            <div className="card-modern p-10 group">
              <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight font-heading">Smart Contracts</h3>
              <p className="text-muted leading-relaxed font-medium font-body">
                Olvídate de papeleo. Cada transacción genera un contrato legalmente vinculante en la Blockchain, protegiendo tus derechos para siempre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCTORES DESTACADOS (Comunidad) */}
      <section className="py-32 px-4 bg-card border-t border-border transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-4 font-heading">
              Productores <span className="text-accent">Destacados.</span>
            </h2>
            <p className="text-lg text-muted font-medium tracking-tight font-body">La comunidad creativa más grande de México ya está aquí.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex 'The Beat' Mora",
                role: "Platinum Producer",
                image: "/images/featured/producer1.png",
                quote: "Tianguis Beats cambió las reglas. Por fin una plataforma que entiende el mercado mexicano y nos da las herramientas que realmente necesitamos."
              },
              {
                name: "Sofía Méndez",
                role: "Urban Artist & Producer",
                image: "/images/featured/producer2.png",
                quote: "La calidad de los beats y la facilidad con la que puedo vender mis servicios es increíble. Es mi base de operaciones diaria."
              },
              {
                name: "Gabo Reyes",
                role: "Top Billboard Charting",
                image: "/images/featured/producer3.png",
                quote: "No pierdo el tiempo con procesos lentos. Aquí todo es al grano: subo, vendo y cobro. La interfaz es de otro nivel."
              }
            ].map((producer, i) => (
              <div key={i} className="card-modern bg-background border-border p-0 group">
                <div className="aspect-[4/5] overflow-hidden relative">
                  <img src={producer.image} alt={producer.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                </div>
                <div className="p-8 relative">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(s => <Zap key={s} size={12} className="text-amber-500" fill="currentColor" />)}
                  </div>
                  <p className="text-foreground font-medium mb-6 italic leading-relaxed font-body">&quot;{producer.quote}&quot;</p>
                  <div>
                    <h4 className="text-xl font-black text-accent font-heading">{producer.name}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">{producer.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA FINAL */}
      <section className="py-32 text-center bg-background transition-colors">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter mb-8 leading-[0.85] font-heading">
            ¿Listo para <br />
            <span className="italic">romperla?</span>
          </h2>
          <div className="flex justify-center gap-4">
            <Link href="/beats" className="btn-standard px-12 py-5 text-[12px] min-h-[64px] shadow-2xl flex items-center justify-center gap-2">
              Explorar Beats <Music size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
