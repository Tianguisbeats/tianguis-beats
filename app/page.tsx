"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, ChevronDown, Play, UserPlus, Upload, Banknote,
  BadgeCheck, Percent, DollarSign, Lock, MessageSquare, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import {
  FloatingParticles, useScrollProgress, NoiseOverlay, KineticSection,
  AbstractPuzzleBack, AbstractHomeBack, AnimacionDeInicio,
  AbstractCirclesBack, AbstractTrianglesBack
} from '@/components/ui/BackgroundEffects';
import BeatCardPro from '@/components/explore/BeatCardPro';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
interface Beat {
  id: string;
  titulo: string;
  bpm: number;
  tono_escala: string;
  precio: number;
  reproducciones: number;
  portada_url: string | null;
  genero: string;
  created_at: string;
  productor_id?: string;
  productor_nombre_usuario?: string;
  productor_nombre_artistico?: string;
  productor_foto_perfil?: string | null;
  productor_esta_verificado?: boolean;
  productor_es_fundador?: boolean;
}

interface Producer {
  id: string;
  nombre_artistico: string;
  nombre_usuario: string;
  foto_perfil: string | null;
  verified: boolean;
  beatCount: number;
  totalPlays: number;
}

// ═══════════════════════════════════════════════════════════════════
// MOUSE POSITION HOOK FOR PARALLAX
// ═══════════════════════════════════════════════════════════════════
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    // En dispositivos táctiles (puntero grueso) no aporta nada y gasta batería:
    // no escuchamos el mouse.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let frame = 0;
    let pendiente: { x: number; y: number } | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      pendiente = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
      // Limitar a un update por frame (~60fps) en vez de uno por cada pixel.
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (pendiente) setMousePosition(pendiente);
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return mousePosition;
}

// ═══════════════════════════════════════════════════════════════════
// HERO TITLE
// ═══════════════════════════════════════════════════════════════════
function HeroTitle({ scrollY }: { scrollY: number }) {
  const [currentGenreIndex, setCurrentGenreIndex] = useState(0);

  const genres = [
    { line1: "Corridos", line2: "Tumbados" },
    { line1: "Reggaetón", line2: "Mexa" },
    { line1: "Trap", line2: "Latino" },
    { line1: "Rhythm", line2: "And Blues" },
    { line1: "Hip", line2: "Hop" },
    { line1: "Drill", line2: "Global" },
    { line1: "Boom", line2: "Bap" },
    { line1: "Rap", line2: "Directo" },
    { line1: "Pop", line2: "Latino" },
    { line1: "Afro", line2: "Beat" },
    { line1: "Dance", line2: "Hall" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGenreIndex((prev) => (prev + 1) % genres.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center relative z-10 pt-20">
      <motion.div
        className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-blue-500/10 shadow-lg mb-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
        <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">La plataforma de Beats #1 en México 🇲🇽</span>
      </motion.div>

      <div className="flex flex-col items-center relative">
        <AnimacionDeInicio theme="blue" />

        <div className="relative min-h-[45vw] md:min-h-[35vw] w-full flex items-center justify-center mb-12 px-6 md:px-20 overflow-visible">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentGenreIndex}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 1.1 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="absolute w-full revolut-title text-[18vw] md:text-[14vw] text-center uppercase overflow-visible px-4 flex flex-col items-center justify-center leading-[0.9] pb-10"
            >
              <div className="text-blue-600 dark:text-blue-500">{genres[currentGenreIndex].line1}</div>
              <div className="opacity-30 dark:opacity-45 text-transparent bg-clip-text bg-gradient-to-r from-black to-slate-600 dark:from-white dark:to-slate-400 py-2">
                {genres[currentGenreIndex].line2}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          className="max-w-3xl text-center text-slate-500 dark:text-slate-400 text-sm md:text-lg font-medium leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          ¿Cansado de que el 30% de tu esfuerzo se pierda en comisiones y tipos de cambio? <br className="hidden md:block" />
          En otras plataformas, trabajas para ellos. <span className="text-blue-600 font-bold">Tianguis Beats</span> es la plataforma hecha por y para productores latinos. <br className="hidden md:block" />
          Sin letras chiquitas, en tu idioma y con precios que sí son reales.
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════
function RevolutStats({
  beats = '0',
  kits = '0',
  producers = '0',
  sales = '0'
}: {
  beats?: string;
  kits?: string;
  producers?: string;
  sales?: string;
}) {
  const stats = [
    { label: 'Beats Listos', value: beats, icon: '🎹' },
    { label: 'Sound Kits', value: kits, icon: '🥁' },
    { label: 'Productores', value: producers, icon: '👑' },
    { label: 'Ventas Totales', value: sales, icon: '💰' },
  ];

  return (
    <div className="relative py-16 md:py-48 overflow-hidden flex justify-center items-center min-h-[40vh] md:min-h-[60vh]">
      <AbstractCirclesBack theme="blue" opacity={1} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto px-6 relative z-10 w-full">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="text-center group"
            initial={{ opacity: 0, transform: 'translateY(20px)' }}
            whileInView={{ opacity: 1, transform: 'translateY(0)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <div className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">{stat.icon}</div>
            <div className="text-4xl md:text-7xl font-black text-blue-600 dark:text-blue-500 mb-2 tracking-tighter tabular-nums">
              {stat.value}
            </div>
            <div className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ¿POR QUÉ TIANGUIS BEATS? — BENTO GRID
// ═══════════════════════════════════════════════════════════════════
function BentoWhySection() {
  const bentoItems = [
    {
      id: 1,
      span: 'md:col-span-2 md:row-span-1',
      gradient: 'from-blue-600 to-cyan-500',
      icon: <Percent size={28} className="text-white" />,
      title: '0% Comisión',
      subtitle: 'Para usuarios Pro y Premium',
      desc: 'En Tianguis Beats, eres el dueño de tu trabajo. Cada peso que entra a tu cuenta es tuyo, sin descuentos sorpresa ni porcentajes ocultos.',
      accent: 'text-cyan-300',
      pill: 'vs BeatStars 30%',
      pillColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      big: true,
    },
    {
      id: 2,
      span: 'md:col-span-1 md:row-span-1',
      gradient: 'from-green-600 to-emerald-500',
      icon: <DollarSign size={28} className="text-white" />,
      title: 'Precios MXN',
      subtitle: 'Sin conversiones raras',
      desc: 'Tus beats en pesos reales. El tipo de cambio no te quita el sueño.',
      accent: 'text-emerald-300',
    },
    {
      id: 3,
      span: 'md:col-span-1 md:row-span-2',
      gradient: 'from-violet-600 to-purple-500',
      icon: <Lock size={28} className="text-white" />,
      title: 'Seguridad Nivel Pro',
      subtitle: 'Stems protegidos',
      desc: 'Cada descarga usa enlaces temporales encriptados que expiran en minutos. Nadie roba tus archivos WAV ni tus stems originales.',
      accent: 'text-violet-300',
      tall: true,
    },
    {
      id: 4,
      span: 'md:col-span-1 md:row-span-1',
      gradient: 'from-amber-500 to-orange-500',
      icon: <MessageSquare size={28} className="text-white" />,
      title: 'Soporte en tu Idioma',
      subtitle: 'De productor a productor',
      desc: 'Sin chatbots gringos. Soporte real en español 🇲🇽.',
      accent: 'text-amber-300',
    },
    {
      id: 5,
      span: 'md:col-span-1 md:row-span-1',
      gradient: 'from-pink-600 to-rose-500',
      icon: <BadgeCheck size={28} className="text-white" />,
      title: 'Hecho en México',
      subtitle: 'Pa\' la escena mexa',
      desc: 'Una plataforma que entiende la cumbia, el corrido y el trap nuestro.',
      accent: 'text-pink-300',
    },
  ];

  return (
    <section className="pt-0 pb-16 md:pb-40 relative overflow-hidden">
      <AbstractPuzzleBack theme="blue" opacity={0.12} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, transform: 'translateY(30px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
            🔥 La Diferencia
          </span>
          <h2 className="text-3xl md:text-8xl font-black uppercase tracking-tighter mb-4 revolut-title py-4 px-2">
            ¿Por qué{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
              Tianguis?
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
            No somos otra copia de BeatStars. Somos la plataforma que <strong className="text-foreground">los productores latinos</strong> necesitaban.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 md:gap-5 auto-rows-auto">
          {bentoItems.map((item, i) => (
            <motion.div
              key={item.id}
              className={`${item.span} relative rounded-[2rem] overflow-hidden group cursor-default border border-white/5`}
              initial={{ opacity: 0, scale: 0.93, transform: 'translateY(20px)' }}
              whileInView={{ opacity: 1, scale: 1, transform: 'translateY(0)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-700`} />
              <div className="absolute inset-0 bg-slate-950/60 dark:bg-black/40 backdrop-blur-sm" />
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient} opacity-60`} />
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] bg-gradient-to-br ${item.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />

              <div className={`relative z-10 p-7 flex flex-col ${item.tall ? 'gap-6 h-full' : 'gap-4'}`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter">{item.title}</h3>
                    {item.pill && (
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.pillColor}`}>
                        {item.pill}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${item.accent}`}>{item.subtitle}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                {item.big && (
                  <Link href="/pricing" className={`inline-flex self-start items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${item.gradient} text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg`}>
                    Ver Planes <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCTORES DESTACADOS — DATOS REALES
// ═══════════════════════════════════════════════════════════════════
function FeaturedProducers({ beats }: { beats: Beat[] }) {
  const producers = React.useMemo<Producer[]>(() => {
    const map = new Map<string, Producer>();
    beats.forEach(b => {
      if (!b.productor_id) return;
      if (!map.has(b.productor_id)) {
        map.set(b.productor_id, {
          id: b.productor_id,
          nombre_artistico: b.productor_nombre_artistico || b.productor_nombre_usuario || 'Productor',
          nombre_usuario: b.productor_nombre_usuario || '',
          foto_perfil: b.productor_foto_perfil || null,
          verified: b.productor_esta_verificado || false,
          beatCount: 0,
          totalPlays: 0,
        });
      }
      const p = map.get(b.productor_id)!;
      p.beatCount++;
      p.totalPlays += b.reproducciones || 0;
    });
    return Array.from(map.values())
      .sort((a, b) => b.totalPlays - a.totalPlays)
      .slice(0, 6);
  }, [beats]);

  if (producers.length === 0) return null;

  return (
    <section className="py-16 md:py-32 relative overflow-hidden">
      <AbstractPuzzleBack theme="purple" opacity={0.1} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, transform: 'translateY(20px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
            👑 Talento Real
          </span>
          <h2 className="text-3xl md:text-7xl font-black uppercase tracking-tighter revolut-title">
            Productores{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Destacados
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-base">
            Los artistas que mueven la plataforma
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {producers.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, transform: 'translateY(30px)' }}
              whileInView={{ opacity: 1, transform: 'translateY(0)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                href={`/${p.nombre_usuario}`}
                className="group flex flex-col items-center text-center p-5 rounded-[2rem] bg-white/60 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] hover:border-amber-500/30 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 overflow-hidden relative"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at 50% 0%, rgba(251,191,36,0.08), transparent 70%)' }} />

                <div className="relative w-20 h-20 rounded-2xl overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-amber-400/40 transition-all duration-300 shrink-0">
                  {p.foto_perfil ? (
                    <Image
                      src={p.foto_perfil}
                      alt={p.nombre_artistico}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-black">
                      {p.nombre_artistico.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {p.verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background shadow">
                      <BadgeCheck size={12} className="text-white" />
                    </div>
                  )}
                </div>

                <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-1 line-clamp-1 w-full">
                  {p.nombre_artistico}
                </h4>
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                  {p.beatCount} {p.beatCount === 1 ? 'beat' : 'beats'}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/productores" className="inline-flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all">
            Ver todos los productores <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BEATS FEED
// ═══════════════════════════════════════════════════════════════════
function CosmosFeed({ beats }: { beats: any[] }) {
  return (
    <section className="py-20 px-4 md:px-8 relative z-10 max-w-[1600px] mx-auto">
      <motion.div
        className="flex items-center justify-between mb-10 px-2"
        initial={{ opacity: 0, transform: 'translateY(20px)' }}
        whileInView={{ opacity: 1, transform: 'translateY(0)' }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500 mb-1 block">🎵 Catálogo</span>
          <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-foreground">
            Beats Populares
          </h2>
        </div>
        <Link href="/beats" className="hidden md:flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all">
          Ver todos <ArrowRight size={16} />
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {beats.map((beat) => (
          <BeatCardPro key={beat.id} beat={beat} />
        ))}
      </div>

      <div className="text-center mt-10 md:hidden">
        <Link href="/beats" className="inline-flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest">
          Ver todos los beats <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CÓMO FUNCIONA — 3 PASOS
// ═══════════════════════════════════════════════════════════════════
function HowItWorksSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session?.user);
    });
  }, []);

  const steps = [
    {
      step: '01',
      icon: <UserPlus size={28} />,
      title: 'Crea tu cuenta',
      desc: 'Regístrate gratis y verifica tu perfil de productor en minutos. Sin tarjeta de crédito.',
      gradient: 'from-blue-500 to-cyan-400',
      glow: 'rgba(59,130,246,0.3)',
    },
    {
      step: '02',
      icon: <Upload size={28} />,
      title: 'Sube tu arte',
      desc: 'Carga tus Beats, WAVs y Stems con licencias ya configuradas. Simple y rápido.',
      gradient: 'from-violet-500 to-purple-400',
      glow: 'rgba(139,92,246,0.3)',
    },
    {
      step: '03',
      icon: <Banknote size={28} />,
      title: 'Cobra en automático',
      desc: 'Stripe deposita tus ventas directo a tu banco. Tú solo crea. Nosotros hacemos el resto.',
      gradient: 'from-emerald-500 to-green-400',
      glow: 'rgba(16,185,129,0.3)',
    },
  ];

  return (
    <section className="py-16 md:py-32 relative overflow-hidden">
      <AbstractCirclesBack theme="blue" opacity={0.7} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, transform: 'translateY(30px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
            ⚡ Así de fácil
          </span>
          <h2 className="text-3xl md:text-8xl font-black uppercase tracking-tighter revolut-title">
            Cómo{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Funciona
            </span>
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="hidden md:block absolute top-[3.5rem] left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-emerald-500/40 z-0" />

          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="relative z-10"
              initial={{ opacity: 0, transform: 'translateY(40px)' }}
              whileInView={{ opacity: 1, transform: 'translateY(0)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.18 }}
            >
              <div className="group relative p-8 rounded-[2.5rem] bg-white/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.07] hover:border-blue-500/20 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${s.glow}, transparent 70%)` }} />

                <div className="flex items-center gap-5 mb-7">
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 flex-shrink-0`}>
                    {s.icon}
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${s.gradient} border-4 border-background flex items-center justify-center`}>
                      <span className="text-[6px] font-black text-white">{i + 1}</span>
                    </div>
                  </div>
                  <span className="text-[2.5rem] md:text-[3.5rem] font-black text-slate-900/10 dark:text-white/5 leading-none select-none">{s.step}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3">{s.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{s.desc}</p>

                <div className={`absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-500 rounded-full`} />
              </div>
            </motion.div>
          ))}
        </div>

        {!isLoggedIn && (
          <motion.div
            className="text-center mt-14"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Link href="/signup" className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black uppercase tracking-widest text-sm hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-300">
              Comenzar Gratis <ArrowRight size={18} />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CTA FINAL — SOLO PARA NO REGISTRADOS
// ═══════════════════════════════════════════════════════════════════
function ProducerCTASection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session?.user));
  }, []);

  if (isLoggedIn) return null;

  return (
    <section className="py-16 md:py-40 relative overflow-hidden">
      <AbstractTrianglesBack theme="pink" opacity={0.8} />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, transform: 'translateY(40px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6">
            🎤 ¿Eres Productor?
          </span>
          <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6 revolut-title">
            Tu música.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
              Sin límites.
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Sube tus beats, conecta Stripe y empieza a cobrar en pesos. Sin comisiones con plan Pro o Premium.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-10 py-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black uppercase tracking-widest text-sm hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-300 flex items-center justify-center gap-3"
            >
              Comenzar Gratis <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-10 py-5 rounded-full border border-slate-300 dark:border-white/10 text-foreground font-black uppercase tracking-widest text-sm hover:border-blue-500/30 transition-all text-center"
            >
              Ver Planes
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCROLL PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════
function ScrollProgress({ progress }: { progress: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[101]">
      <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${progress}%` }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HOME PAGE
// ═══════════════════════════════════════════════════════════════════
export default function Home() {
  const { progress, scrollY } = useScrollProgress();
  const mousePosition = useMousePosition();

  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ beats: '0', kits: '0', producers: '0', sales: '0' });

  useEffect(() => {
    async function fetchAllStats() {
      try {
        const [beatsRes, kitsRes, perfilesRes, transRes] = await Promise.all([
          supabase.from('beats').select('id', { count: 'exact', head: true }).eq('es_publico', true),
          supabase.from('kits_sonido').select('id', { count: 'exact', head: true }).eq('es_publico', true),
          supabase.from('perfiles').select('id', { count: 'exact', head: true }).not('nombre_artistico', 'is', null),
          supabase.from('transacciones').select('id', { count: 'exact', head: true })
        ]);

        const format = (count: number | null) => {
          if (!count) return '0';
          if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
          return count.toString();
        };

        setStats({
          beats: format(beatsRes.count),
          kits: format(kitsRes.count),
          producers: format(perfilesRes.count),
          sales: format(transRes.count)
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }
    fetchAllStats();
  }, []);

  useEffect(() => {
    async function fetchAllBeats() {
      try {
        const { data, error } = await supabase
          .from('beats')
          .select(`
            id, titulo, bpm, tono_escala, precio, reproducciones, portada_url, genero,
            created_at, productor_id, productor_nombre_usuario, productor_nombre_artistico,
            productor_foto_perfil, productor_esta_verificado, productor_es_fundador,
            esta_vendido, precio_basica_mxn
          `)
          .eq('es_publico', true)
          .order('reproducciones', { ascending: false })
          .limit(24);

        if (error) throw error;

        const processed = (data || []).map((beat: any) => {
          let coverUrl = beat.portada_url;
          if (coverUrl && !coverUrl.startsWith('http')) {
            const { data: storageData } = supabase.storage.from('portadas_beats').getPublicUrl(coverUrl);
            coverUrl = storageData?.publicUrl || '/logo.png';
          }
          let avatarUrl = beat.productor_foto_perfil;
          if (avatarUrl && !avatarUrl.startsWith('http')) {
            const { data: storageData } = supabase.storage.from('fotos_perfil').getPublicUrl(avatarUrl);
            avatarUrl = storageData?.publicUrl;
          }
          return {
            ...beat,
            portada_url: coverUrl || '/logo.png',
            productor_foto_perfil: avatarUrl,
            productor_nombre_artistico: beat.productor_nombre_artistico || beat.nombre_artistico,
            productor_nombre_usuario: beat.productor_nombre_usuario || beat.nombre_usuario,
            productor_esta_verificado: beat.productor_esta_verificado ?? beat.esta_verificado,
            productor_es_fundador: beat.productor_es_fundador ?? beat.es_fundador
          };
        });

        setBeats(processed);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAllBeats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white">
      <NoiseOverlay />
      <ScrollProgress progress={progress} />

      <Navbar minimal={false} />

      <main className="relative z-10 text-foreground">
        {/* HERO */}
        <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-32 pb-20">
          <AbstractHomeBack theme="blue" opacity={1} />
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <FloatingParticles />
          </div>
          <HeroTitle scrollY={scrollY} />
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 text-slate-400 dark:text-white/40"
            animate={{ transform: ['translateY(0px)', 'translateY(10px)', 'translateY(0px)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Explorar</span>
            <ChevronDown size={20} />
          </motion.div>
        </section>

        {/* STATS */}
        <KineticSection>
          <RevolutStats
            beats={stats.beats}
            kits={stats.kits}
            producers={stats.producers}
            sales={stats.sales}
          />
        </KineticSection>

        {/* ¿POR QUÉ TIANGUIS? */}
        <KineticSection>
          <BentoWhySection />
        </KineticSection>

        {/* PRODUCTORES DESTACADOS */}
        {!loading && beats.length > 0 && (
          <KineticSection>
            <FeaturedProducers beats={beats} />
          </KineticSection>
        )}

        {/* BEATS FEED */}
        <KineticSection>
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center opacity-40">
              <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white">Sincronizando Universo...</p>
            </div>
          ) : (
            <CosmosFeed beats={beats} />
          )}
        </KineticSection>

        {/* CÓMO FUNCIONA */}
        <KineticSection>
          <HowItWorksSection />
        </KineticSection>

        {/* CTA FINAL */}
        <KineticSection>
          <ProducerCTASection />
        </KineticSection>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-flow {
          background-size: 200% auto;
          animation: gradient-flow 3s linear infinite;
        }
        .revolut-title {
          font-family: var(--font-heading);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.06em;
          overflow: visible;
          padding-top: 0.05em;
          padding-bottom: 0.05em;
        }
      `}</style>
    </div>
  );
}
