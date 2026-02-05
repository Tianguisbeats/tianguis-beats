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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-black selection:text-white overflow-x-hidden">
      <Navbar />

      {/* 1. HERO SECTION: Minimalist Tech */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-[80vh] bg-white -z-20"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-green-500/5 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-emerald-500/5 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/50 backdrop-blur-sm mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse-slow">
              🇲🇽 El Movimiento #1 en México
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">
            La Casa de los <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Corridos Tumbados.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed tracking-tight">
            La plataforma definitiva para el sonido que conquistó el mundo. Únete a productores verificados, vende tus beats y lleva el movimiento al siguiente nivel.
          </p>

          {/* Omni-Search Bar */}
          <div className="max-w-2xl mx-auto relative group mb-12">
            <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center bg-white p-2 rounded-full shadow-2xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 focus-within:ring-4 focus-within:ring-green-400/20">
              <div className="pl-6 text-slate-400">
                <Search size={22} />
              </div>
              <input
                type="text"
                placeholder="Escribe corridos tumbados o pega un link..."
                className="flex-1 bg-transparent border-none px-4 py-4 outline-none font-medium text-slate-800 text-lg placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (window.location.href = `/beats?q=${searchQuery}`)}
              />
              <button
                onClick={() => window.location.href = `/beats?q=${searchQuery}`}
                className="bg-slate-900 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-slate-900/10"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Dedicated CT Button */}
          <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href={`/beats?genre=${encodeURIComponent("Corridos Tumbados 🇲🇽")}`}
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white border border-slate-100 text-slate-900 rounded-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-2 group-hover:text-green-700 transition-colors">
                <Music size={16} className="text-green-600" /> Explorar Corridos Tumbados
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS / SOCIAL PROOF (Minimal Stripe-like) */}
      <section className="bg-white border-y border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-10">Música Distribuida a través de</p>
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            {['Sony Music', 'Warner Chappell', 'Universal', 'Spotify', 'BMI', 'Apple Music'].map((brand) => (
              <span key={brand} className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-tighter hover:text-blue-600 transition-colors cursor-default">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. AI FEATURES (The "Vitaminada" Section) */}
      <section className="py-32 px-4 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">
              Poder <span className="text-blue-600">Ilimitado.</span>
            </h2>
            <p className="text-xl text-slate-500 max-w-xl font-medium">
              Herramientas de próxima generación integradas directamente en tu flujo de trabajo. No es solo un marketplace, es tu estudio inteligente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Cpu size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Smart Match Algorithm</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Nuestra IA analiza la estructura armónica de tus búsquedas para recomendarte beats que encajan matemáticamente con tu estilo.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900 p-10 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:opacity-100 transition-opacity opacity-50"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
                  <Waves size={28} />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">Auto-Mastering Preview</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Escucha cómo sonaría tu voz sobre el beat en tiempo real. Sube una demo y deja que nuestro motor la mezcle instantáneamente.
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                  Beta Access
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 hover:border-purple-100 hover:shadow-2xl hover:shadow-purple-900/5 transition-all group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Smart Contracts</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Olvídate de papeleo. Cada transacción genera un contrato legalmente vinculante en la Blockchain, protegiendo tus derechos para siempre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PLANS TEASER (Minimalist Comparison) */}
      <section className="py-32 px-4 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">
                Elige tu <span className="text-indigo-600">Nivel.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium tracking-tight">Escala desde bedroom producer hasta leyenda mundial.</p>
            </div>
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition-all">
              Ver todos los planes <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="p-12 rounded-[3rem] bg-slate-50 border border-slate-100 flex flex-col justify-between h-full">
              <div>
                <span className="inline-block px-4 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest mb-6">Start</span>
                <h3 className="text-4xl font-black text-slate-900 mb-4">Free</h3>
                <p className="text-slate-500 font-medium mb-8">Perfecto para empezar a explorar. Sin compromiso.</p>
                <ul className="space-y-4 mb-12">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Sube hasta 5 Beats
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Perfil Básico
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="w-full py-4 text-center rounded-xl font-bold bg-white border border-slate-200 text-slate-900 hover:border-slate-400 transition-all">
                Crear cuenta gratis
              </Link>
            </div>

            <div className="p-12 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="inline-block px-4 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest mb-6">Recomendado</span>
                  <h3 className="text-4xl font-black mb-4">Pro & Premium</h3>
                  <p className="text-slate-400 font-medium mb-8">Desbloquea el poder total de la IA y personalización.</p>
                  <ul className="space-y-4 mb-12">
                    <li className="flex items-center gap-3 text-sm font-bold text-indigo-200">
                      <Zap size={14} className="text-indigo-400" /> Uploads Ilimitados
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-indigo-200">
                      <BarChart3 size={14} className="text-indigo-400" /> Estadísticas Reales & CRM
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-indigo-200">
                      <Globe size={14} className="text-indigo-400" /> Tienda Personalizable
                    </li>
                  </ul>
                </div>
                <Link href="/pricing" className="w-full py-4 text-center rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25">
                  Ver Planes Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA FINAL */}
      <section className="py-32 text-center bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.85]">
            ¿Listo para <br />
            <span className="italic">romperla?</span>
          </h2>
          <div className="flex justify-center gap-4">
            <Link href="/beats" className="bg-slate-900 text-white px-10 py-5 rounded-full font-black uppercase text-[12px] tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
              Explorar Beats <Music size={16} />
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
