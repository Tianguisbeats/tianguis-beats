"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  Zap,
  ShieldCheck,
  Cpu,
  Globe,
  Music,
  BarChart3,
  Waves
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GENRES, MOODS } from '@/lib/constants';

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
        const scaleValue = (s === 'minor' || s === 'menor') ? 'Minor' : 'Major';
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
    } else {
      GENRES.forEach(g => {
        const genreLabel = g.toLowerCase().replace(/🇲🇽|🌵|🎺|🎻|🍑|🇩🇴|🇯🇲|🔥|🕯️|🇧🇷|🌍|🥁|🔪|☕|🔫|🏠|🍭|⛓️|🚗|🎸|🎹|💎|🎤|🤘|🌀/g, '').trim();
        if (genreLabel && lowerQuery.includes(genreLabel)) {
          params.set('genre', g);
        }
      });
    }

    // 5. Si no detectó parámetros específicos pesados, dejar el query como búsqueda global
    if (params.toString() === "") {
      params.set('q', query.trim());
    } else {
      // Limpiar el query para que no duplique información si detectamos cosas específicas
      // Pero opcionalmente podemos dejarlo como 'q' también para mayor alcance
      params.set('q', query.trim());
    }

    window.location.href = `/beats/catalog?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body transition-colors duration-300 selection:bg-accent selection:text-white overflow-x-hidden">
      <Navbar />

      {/* 1. HERO SECTION: Minimalist Tech */}
      <section className="relative pt-24 pb-16 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-[80vh] bg-background -z-20"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-accent/5 rounded-full blur-[120px] -z-10 dark:opacity-20"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[100px] -z-10 dark:opacity-20"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted animate-pulse-slow">
              🇲🇽 La Tienda de Beats #1 en México
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-9xl font-black text-foreground tracking-tighter mb-8 leading-[0.9] font-heading">
            La Casa de los <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Corridos Tumbados.</span>
          </h1>

          <p className="text-base md:text-xl text-muted font-medium max-w-3xl mx-auto mb-12 leading-relaxed tracking-tight px-4 font-body">
            Olvídate de interfaces lentas y llenas de anuncios. Mientras otros te saturan de opciones que no usas, aquí tienes Beats, Sound Kits y servicios profesionales en un solo lugar: sin distracciones y al grano.
          </p>

          {/* Omni-Search Bar */}
          <div className="max-w-2xl mx-auto relative group mb-12 px-2">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-card p-2 rounded-[2rem] md:rounded-full shadow-2xl border border-border transition-all duration-300 focus-within:ring-4 focus-within:ring-accent/20">
              <div className="flex flex-1 items-center min-h-[56px]">
                <div className="pl-6 text-muted">
                  <Search size={22} />
                </div>
                <input
                  type="text"
                  placeholder="Ej: Corridos 140 bpm C# minor..."
                  className="flex-1 bg-transparent border-none px-4 py-4 outline-none font-bold text-foreground text-lg placeholder:text-muted/30"
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
                className="bg-accent text-white px-8 py-4 md:py-3 rounded-[1.5rem] md:rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-accent/90 transition-all shadow-lg min-h-[56px] flex items-center justify-center"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Dedicated CT Button */}
          <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href={`/beats?view=corridos_tumbados`}
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-card border border-border text-foreground rounded-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/20 min-h-[56px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-2 group-hover:text-accent transition-colors font-heading">
                <Music size={16} className="text-accent" /> Explorar Corridos Tumbados
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS / SOCIAL PROOF (Minimal Stripe-like) */}
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

      {/* 3. AI FEATURES (The "Vitaminada" Section) */}
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
            {/* Feature 1 */}
            <div className="bg-card p-10 rounded-[2.5rem] border border-border hover:border-accent/30 hover:shadow-2xl transition-all group">
              <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Cpu size={28} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight font-heading">Smart Match Algorithm</h3>
              <p className="text-muted leading-relaxed font-medium font-body">
                Nuestra IA analiza la estructura armónica de tus búsquedas para recomendarte beats que encajan matemáticamente con tu estilo.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900 dark:bg-slate-800 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-slate-800 dark:border-slate-700">
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

            {/* Feature 3 */}
            <div className="bg-card p-10 rounded-[2.5rem] border border-border hover:border-accent/30 hover:shadow-2xl transition-all group">
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

      {/* 4. PLANS TEASER (Minimalist Comparison) */}
      <section className="py-32 px-4 bg-card border-t border-border transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-4 font-heading">
                Elige tu <span className="text-accent">Nivel.</span>
              </h2>
              <p className="text-lg text-muted font-medium tracking-tight font-body">Escala desde bedroom producer hasta leyenda mundial.</p>
            </div>
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-1 hover:text-accent hover:border-accent transition-all min-h-[48px]">
              Ver todos los planes <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-10 md:p-12 rounded-[2.5rem] md:rounded-[3rem] bg-background border border-border flex flex-col justify-between h-full">
              <div>
                <span className="inline-block px-4 py-1 rounded-full bg-accent-soft text-accent text-[10px] font-black uppercase tracking-widest mb-6">Start</span>
                <h3 className="text-4xl font-black text-foreground mb-4 font-heading">Free</h3>
                <p className="text-muted font-medium mb-8 font-body">Perfecto para empezar a explorar. Sin compromiso.</p>
                <ul className="space-y-4 mb-12">
                  <li className="flex items-center gap-3 text-sm font-bold text-foreground font-body">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/30"></div> Sube hasta 5 Beats
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-foreground font-body">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/30"></div> Perfil Básico
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="w-full py-5 text-center rounded-2xl font-bold bg-card border-2 border-border text-foreground hover:bg-accent hover:text-white hover:border-accent transition-all min-h-[56px] flex items-center justify-center">
                Crear cuenta gratis
              </Link>
            </div>

            <div className="p-10 md:p-12 rounded-[2.5rem] md:rounded-[3rem] bg-foreground text-background relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="inline-block px-4 py-1 rounded-full bg-accent text-white text-[10px] font-black uppercase tracking-widest mb-6">Recomendado</span>
                  <h3 className="text-4xl font-black mb-4 font-heading">Pro & Premium</h3>
                  <p className="text-background/70 font-medium mb-8 font-body">Desbloquea el poder total de la IA y personalización.</p>
                  <ul className="space-y-4 mb-12">
                    <li className="flex items-center gap-3 text-sm font-bold text-background/90 font-body">
                      <Zap size={14} className="text-accent" /> Uploads Ilimitados
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-background/90 font-body">
                      <BarChart3 size={14} className="text-accent" /> Estadísticas Reales & CRM
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-background/90 font-body">
                      <Globe size={14} className="text-accent" /> Tienda Personalizable
                    </li>
                  </ul>
                </div>
                <Link href="/pricing" className="w-full py-5 text-center rounded-2xl font-black uppercase text-[12px] tracking-widest bg-accent text-white hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 min-h-[56px] flex items-center justify-center">
                  Ver Planes Pro
                </Link>
              </div>
            </div>
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
            <Link href="/beats" className="bg-accent text-white px-12 py-5 rounded-full font-black uppercase text-[12px] tracking-widest hover:scale-105 transition-transform flex items-center gap-2 min-h-[64px] shadow-2xl">
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
