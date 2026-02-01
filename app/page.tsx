"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Music,
  Zap,
  ShieldCheck,
  Globe,
  Monitor,
  Cpu,
  Layers,
  ArrowRight,
  Star,
  Plus,
  Sparkles,
  Search,
  BrainCircuit,
  Waves
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/home-hero.png"
            alt="Tianguis Beats Studio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/70 to-slate-900"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.6em] mb-12 animate-fade-in">
            <span className="text-lg">🇲🇽</span>
            La Plataforma #1 de México
          </div>

          <h1 className="text-7xl md:text-[11rem] font-black text-white leading-[0.75] tracking-[-0.07em] uppercase mb-12">
            Domina la <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-white">Escena.</span>
          </h1>

          <div className="max-w-3xl mx-auto mb-16 px-4">
            <p className="text-white/60 font-medium text-lg md:text-xl mb-10 tracking-tight leading-relaxed">
              Donde la herencia musical de México se encuentra con <br className="hidden md:block" />
              la tecnología de audio de última generación.
            </p>

            <div className="bg-white rounded-[3rem] p-2 flex shadow-2xl shadow-blue-900/40 transform hover:scale-[1.02] transition-all duration-500">
              <input
                type="text"
                placeholder="Encuentra el sonido que cambiará tu carrera..."
                className="flex-1 bg-transparent border-none pl-8 pr-4 outline-none font-bold text-slate-900 text-lg placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (window.location.href = `/beats?q=${searchQuery}`)}
              />
              <button
                onClick={() => window.location.href = `/beats?q=${searchQuery}`}
                className="bg-blue-600 text-white px-10 py-5 rounded-[3rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                Explorar Catálogo
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-10">
            <div className="flex items-center gap-3 text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
              <ShieldCheck size={16} className="text-blue-500" /> Transacciones Seguras
            </div>
            <div className="flex items-center gap-3 text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
              <BrainCircuit size={16} className="text-blue-500" /> Tianguis AI Core
            </div>
            <div className="flex items-center gap-3 text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
              <Star size={16} className="text-blue-500" /> Calidad Premium
            </div>
          </div>
        </div>

        {/* Floating element at bottom */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-white/20 animate-bounce">
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/20 to-transparent"></div>
        </div>
      </section>

      {/* AI Technology Showcase Section */}
      <section className="relative -mt-24 bg-white rounded-t-[6rem] pt-32 pb-40 z-20 overflow-hidden">
        {/* Abstract AI Background Element */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-50 shadow-[0_0_150px_rgba(37,99,235,0.05)] rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-2 gap-24 items-center mb-40">
            <div className="relative">
              <div className="aspect-square bg-slate-900 rounded-[5.5rem] overflow-hidden shadow-2xl relative group">
                {/* AI Visual - Brain & Waves */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.2),transparent_70%)] animate-pulse"></div>

                <div className="absolute inset-10 rounded-[4rem] border border-white/5 bg-slate-800/50 backdrop-blur-xl flex flex-col items-center justify-center p-12 overflow-hidden">
                  <div className="relative mb-8">
                    <BrainCircuit size={140} className="text-blue-500 opacity-80 group-hover:scale-110 transition-transform duration-700" strokeWidth={1} />
                    <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full"></div>
                    <Sparkles className="absolute -top-4 -right-4 text-blue-300 animate-spin-slow" size={24} />
                  </div>

                  <div className="w-full max-w-[200px] space-y-4">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-blue-600 to-blue-400"></div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-blue-400">
                      <span>AI MASTERING ENGINE</span>
                      <span>Ready</span>
                    </div>
                  </div>
                </div>

                {/* Floating Wave Icons */}
                <div className="absolute bottom-16 right-16 w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl animate-bounce-slow">
                  <Waves size={32} />
                </div>
              </div>

              {/* Context Label */}
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-[3rem] shadow-2xl border border-slate-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">100% Calidad Garantizada por IA</span>
              </div>
            </div>

            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.4em]">
                Tianguis AI CORE
              </div>
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tight text-slate-900 leading-[0.85]">
                Inteligencia <br /> Musical <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Sin Límites.</span>
              </h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg">
                Nuestro núcleo de IA procesa miles de datos para ofrecerte una experiencia de nivel profesional, facilitando tu flujo de trabajo desde el muestreo hasta la masterización.
              </p>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight">AI Mastering</h4>
                  <p className="text-slate-400 text-sm font-medium leading-snug">Eleva tus demos a calidad de radio automáticamente con nuestro motor de masterización inteligente.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Search size={24} />
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight">Smart Sampling</h4>
                  <p className="text-slate-400 text-sm font-medium leading-snug">Algoritmos avanzados que te recomiendan los mejores sonidos basados en tus gustos y el mercado.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Value Props Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-40">
            {[
              { icon: <Globe />, title: "Mercado Global", text: "Vende y compra ritmos en cualquier parte del mundo con tipos de cambio automáticos." },
              { icon: <ShieldCheck />, title: "Legalidad Total", text: "Contratos generados al instante por IA para proteger tanto al artista como al productor." },
              { icon: <Zap />, title: "Pago al Instante", text: "Recibe tus ganancias o descarga tus beats sin intermediarios ni retrasos humanos." }
            ].map((item, idx) => (
              <div key={idx} className="p-10 rounded-[3.5rem] bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all border border-transparent hover:border-slate-100 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <h4 className="text-2xl font-black uppercase tracking-tight mb-4">{item.title}</h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Final Elevated CTA */}
          <div className="relative rounded-[5.5rem] overflow-hidden bg-slate-900 py-32 px-10 text-center text-white">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-[50%] h-full bg-blue-600/10 blur-[150px] -rotate-45 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-[50%] h-full bg-blue-400/5 blur-[120px] rotate-12 -translate-x-1/2"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <span className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px] mb-10 block">Forma parte de la comunidad</span>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-12 leading-[0.85]">
                Únete al <br /> <span className="italic">Tianguis.</span>
              </h2>
              <div className="flex flex-col sm:flex-row justify-center gap-8 items-center">
                <Link href="/signup" className="group flex items-center gap-6 px-12 py-6 bg-blue-600 text-white rounded-full font-black uppercase text-[12px] tracking-widest hover:bg-white hover:text-blue-600 transition-all shadow-xl shadow-blue-500/20">
                  Empezar ahora
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <div className="flex items-center gap-4 text-white/40 text-[10px] font-black uppercase tracking-widest">
                  Cada día más productores se están uniendo 🇲🇽
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
