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
  Plus
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
            <div className="flex items-center gap-3 text-white/40 font-black uppercase tracking-[0.3em] text-[9px]">
              <ShieldCheck size={16} className="text-blue-500" /> Transacciones Seguras
            </div>
            <div className="flex items-center gap-3 text-white/40 font-black uppercase tracking-[0.3em] text-[9px]">
              <Cpu size={16} className="text-blue-500" /> Inteligencia Musical
            </div>
            <div className="flex items-center gap-3 text-white/40 font-black uppercase tracking-[0.3em] text-[9px]">
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

      {/* Main Content */}
      <section className="relative -mt-24 bg-white rounded-t-[6rem] pt-32 pb-40 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Features Grid / Technology Showcase */}
          <div className="grid md:grid-cols-2 gap-20 items-center mb-40">
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.4em] mb-8">
                Innovación Técnica
              </div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-slate-900 leading-[0.9] mb-10">
                Tecnología <br /> al servicio <br /> del <span className="text-blue-600">Hit.</span>
              </h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12 max-w-lg">
                No somos solo un marketplace. Somos un ecosistema diseñado para potenciar tu proceso creativo con herramientas de grado profesional.
              </p>

              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight mb-2">Multitrack Stems</h4>
                    <p className="text-slate-400 text-sm font-medium">Control total sobre tu mezcla con acceso a cada instrumento por separado.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight mb-2">Smart Dashboard</h4>
                    <p className="text-slate-400 text-sm font-medium">Gestiona tus licencias, ventas y proyectos desde una interfaz intuitiva.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-slate-900 rounded-[5rem] overflow-hidden shadow-2xl relative">
                <div className="absolute inset-x-8 top-12 bottom-12 rounded-[3.5rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center p-12">
                  <div className="text-center">
                    <Music size={100} className="text-blue-500 mx-auto mb-10 opacity-50" />
                    <div className="h-2 w-48 bg-blue-600/30 rounded-full mx-auto mb-4 overflow-hidden">
                      <div className="h-full w-2/3 bg-blue-500"></div>
                    </div>
                    <div className="h-2 w-32 bg-white/10 rounded-full mx-auto"></div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15),transparent_70%)]"></div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-10 -right-10 bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-50 animate-bounce">
                <Zap size={32} className="text-blue-600" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white flex items-center gap-4">
                <ShieldCheck size={20} className="text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Masterización AI Ready</span>
              </div>
            </div>
          </div>

          {/* New Simplified Value Props */}
          <div className="grid md:grid-cols-3 gap-8 mb-40">
            {[
              { icon: <Globe />, title: "Mercado Global", text: "Vende y compra ritmos en cualquier parte del mundo con tipos de cambio automáticos." },
              { icon: <ShieldCheck />, title: "Legalidad Total", text: "Contratos generados al instante para proteger tanto al artista como al productor." },
              { icon: <Zap />, title: "Pago al Instante", text: "Recibe tus ganancias o descarga tus beats sin intermediarios ni retrasos." }
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
              <span className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px] mb-10 block">Únete a la Revolución</span>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-12 leading-[0.85]">
                Es momento de <br /> <span className="italic">hacer historia.</span>
              </h2>
              <div className="flex flex-col sm:flex-row justify-center gap-8 items-center">
                <Link href="/signup" className="group flex items-center gap-6 px-12 py-6 bg-blue-600 text-white rounded-full font-black uppercase text-[12px] tracking-widest hover:bg-white hover:text-blue-600 transition-all shadow-xl shadow-blue-500/20">
                  Empezar ahora
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <div className="flex items-center gap-4 text-white/40 text-[10px] font-black uppercase tracking-widest">
                  <Plus size={16} /> 5,000 Productores ya están dentro
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
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
