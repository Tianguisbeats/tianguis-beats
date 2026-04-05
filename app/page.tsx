"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Music, Headphones, Mic2, Disc3, ChevronDown, Play, Users, Star, CheckCircle, TrendingUp, Calendar, Award, Zap, Layers3, Box, Hexagon, Sparkle, Wifi, Server, Activity, Radio, Target, ThumbsUp, MessageCircle, Quote, UserPlus, Upload, Banknote, ShieldCheck, MessageSquare, Globe2, BadgeCheck, Percent, Lock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { MotionDiv, useInView } from '@/components/ui/MotionDiv';
import { ParallaxBackground, FloatingParticles, useScrollProgress, NoiseOverlay, KineticSection, AbstractPuzzleBack, AbstractHomeBack, AnimacionDeInicio, AbstractRaysBack, AbstractCirclesBack, AbstractTrianglesBack } from '@/components/ui/BackgroundEffects';
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
  producer?: {
    nombre_artistico: string;
    foto_perfil: string | null;
  };
}

// ═══════════════════════════════════════════════════════════════════
// MOUSE POSITION HOOK FOR PARALLAX
// ═══════════════════════════════════════════════════════════════════
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mousePosition;
}

// ═══════════════════════════════════════════════════════════════════
// COSMOS-STYLE BEAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
function CosmosBeatCard({
  beat,
  index,
  mousePosition
}: {
  beat: Beat;
  index: number;
  mousePosition: { x: number; y: number };
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Calculate 3D tilt based on mouse position relative to card
  useEffect(() => {
    if (!cardRef.current || !isHovered) {
      setRotation({ x: 0, y: 0 });
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const cardX = rect.left + rect.width / 2;
    const cardY = rect.top + rect.height / 2;

    const deltaX = (mousePosition.x * 2 - 1) * 20;
    const deltaY = (mousePosition.y * 2 - 1) * 20;

    setRotation({ x: -deltaY, y: deltaX });
  }, [mousePosition, isHovered]);

  // Get cover URL
  const coverUrl = beat.portada_url || '/logo.png';

  return (
    <MotionDiv
      ref={cardRef}
      initial={{ opacity: 0, transform: 'translateY(50px)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/beats/${beat.id}`} className="group block perspective-1000">
        <div
          className="relative aspect-square rounded-3xl overflow-hidden transition-all duration-300"
          style={{
            transform: isHovered
              ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.05)`
              : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Cover Image with Parallax */}
          <div
            className="absolute inset-0 w-full h-full transition-transform duration-700"
            style={{
              transform: isHovered ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            <img
              src={coverUrl}
              alt={beat.titulo}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          />

          {/* Glow Effect on Hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
            }}
          />

          {/* Play Button */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
          >
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>

          {/* Beat Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-500/80 backdrop-blur-sm rounded-md text-xs font-bold text-white">
                {beat.bpm} BPM
              </span>
              {beat.tono_escala && (
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-xs font-bold text-white">
                  {beat.tono_escala}
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-lg truncate drop-shadow-lg">{beat.titulo}</h3>
            <p className="text-sm text-white/70">by {beat.producer?.nombre_artistico || 'Unknown'}</p>
          </div>

          {/* Corner Accents */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Music size={14} className="text-white" />
            </div>
          </div>
        </div>
      </Link>
    </MotionDiv>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COSMOS-STYLE FLOATING COVER MASONRY (Featured)
// ═══════════════════════════════════════════════════════════════════
function CosmosFeaturedBeats({ beats, mousePosition }: { beats: Beat[]; mousePosition: { x: number; y: number } }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef as React.RefObject<HTMLElement | null>);

  // Different sizes for masonry effect
  const getGridSpan = (index: number) => {
    const patterns = [
      'row-span-2', // Large
      '',           // Normal
      '',           // Normal
      'row-span-2', // Large
      '',           // Normal
      '',           // Normal
    ];
    return patterns[index % patterns.length];
  };

  return (
    <section ref={sectionRef} className="py-20 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <MotionDiv
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, transform: 'translateY(20px)' }}
          animate={isInView ? { opacity: 1, transform: 'translateY(0)' } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-blue-500" />
              <span className="text-xs font-black uppercase tracking-widest text-blue-500">🔥 Destacados</span>
            </div>
            <h2 className="text-2xl md:text-5xl font-black text-foreground uppercase tracking-tighter">
              Beats Populares
            </h2>
            <p className="text-muted-foreground mt-2">Los favoritos de la comunidad</p>
          </div>
          <Link href="/beats/catalog?sort=popular" className="hidden md:flex items-center gap-2 text-blue-500 font-semibold hover:gap-3 transition-all">
            Ver todos <ArrowRight size={18} />
          </Link>
        </MotionDiv>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
          {beats.slice(0, 6).map((beat, i) => (
            <MotionDiv
              key={beat.id}
              className={`relative rounded-3xl overflow-hidden cursor-pointer group ${getGridSpan(i)}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link href={`/beats/${beat.id}`} className="block w-full h-full">
                <div
                  className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-110"
                >
                  <img
                    src={beat.portada_url || '/logo.png'}
                    alt={beat.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                {/* Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                  background: 'radial-gradient(circle at 50% 120%, rgba(59, 130, 246, 0.4) 0%, transparent 60%)',
                }} />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-500/80 backdrop-blur-sm rounded-md text-xs font-bold text-white">
                      {beat.bpm} BPM
                    </span>
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-xs font-bold text-white">
                      {beat.tono_escala || 'N/A'}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg truncate">{beat.titulo}</h3>
                  <p className="text-sm text-white/70">by {beat.producer?.nombre_artistico || 'Unknown'}</p>
                </div>

                {/* Play Button */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>
              </Link>
            </MotionDiv>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/beats/catalog?sort=popular" className="inline-flex items-center gap-2 text-blue-500 font-semibold">
            Ver todos los beats <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COSMOS-STYLE NEW RELEASES
// ═══════════════════════════════════════════════════════════════════
function CosmosNewReleases({ beats, mousePosition }: { beats: Beat[]; mousePosition: { x: number; y: number } }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef as React.RefObject<HTMLElement | null>);

  return (
    <section ref={sectionRef} className="py-20 px-4 relative z-10 bg-gradient-to-b from-transparent to-blue-500/5">
      <div className="max-w-7xl mx-auto">
        <MotionDiv
          className="flex items-center justify-between mb-12"
          initial={{ opacity: 0, transform: 'translateY(20px)' }}
          animate={isInView ? { opacity: 1, transform: 'translateY(0)' } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-cyan-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-500">🆕 NUEVO</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tighter">
              Lanzamientos Recientes
            </h2>
            <p className="text-muted-foreground mt-2">Beats recién subidos esta semana</p>
          </div>
          <Link href="/beats/catalog?sort=new" className="hidden md:flex items-center gap-2 text-cyan-500 font-semibold hover:gap-3 transition-all">
            Ver nuevos <ArrowRight size={18} />
          </Link>
        </MotionDiv>

        {/* Horizontal Scroll Cards */}
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {beats.slice(0, 8).map((beat, i) => (
            <MotionDiv
              key={beat.id}
              className="flex-none w-64 snap-center"
              initial={{ opacity: 0, transform: 'translateX(50px)' }}
              whileInView={{ opacity: 1, transform: 'translateX(0)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link href={`/beats/${beat.id}`} className="group block">
                <div className="relative aspect-square rounded-3xl overflow-hidden mb-3">
                  <img
                    src={beat.portada_url || '/logo.png'}
                    alt={beat.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* New Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">NUEVO</span>
                  </div>

                  {/* Play Button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    <Play className="w-5 h-5 text-white fill-white ml-1" />
                  </div>
                </div>
                <h3 className="font-bold text-foreground truncate group-hover:text-cyan-500 transition-colors">{beat.titulo}</h3>
                <p className="text-sm text-muted-foreground">by {beat.producer?.nombre_artistico || 'Unknown'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-cyan-500">{beat.bpm} BPM</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{beat.genero}</span>
                </div>
              </Link>
            </MotionDiv>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REVOLUT-STYLE HERO TITLE
// ═══════════════════════════════════════════════════════════════════
function HeroTitle({ scrollY }: { scrollY: number }) {
  const titleRef = useRef<HTMLDivElement>(null);
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
    <div
      ref={titleRef}
      className="text-center relative z-10 pt-20"
    >
      {/* Animated Badge - Clean White/Blue Theme */}
      <MotionDiv
        className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-blue-500/10 shadow-lg mb-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">La plataforma de Beats #1 en México 🇲🇽</span>
      </MotionDiv>

      {/* Main Title - Revolut Bold Aesthetic */}
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
              <div className="opacity-10 dark:opacity-20 text-transparent bg-clip-text bg-gradient-to-r from-black to-slate-500 dark:from-white dark:to-slate-500 py-2">
                {genres[currentGenreIndex].line2}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <MotionDiv
          className="max-w-3xl text-center text-slate-500 dark:text-slate-400 text-sm md:text-lg font-medium leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          ¿Cansado de que el 30% de tu esfuerzo se pierda en comisiones y tipos de cambio? <br className="hidden md:block" />
          En otras plataformas, trabajas para ellos. <span className="text-blue-600 font-bold">Tianguis Beats</span> es la plataforma hecha por y para productores latinos. <br className="hidden md:block" />
          Sin letras chiquitas, en tu idioma y con precios que sí son reales.
        </MotionDiv>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TESTIMONIALS SECTION - 5 Stars Reviews
// ═══════════════════════════════════════════════════════════════════
function TestimonialsSection() {
  const testimonials = [
    { 
      name: 'KrizzBeatz', 
      handle: '@KrizzBeatz',
      text: 'La mejor plataforma para comprar beats de CT en México. 100% recomendada.',
      stars: 5,
      avatar: '/avatar_producer_1.png'
    },
    { 
      name: 'Pavel Orozco', 
      handle: '@PavelOrozco',
      text: 'Increíble calidad en los soundkits. Elevó mi producción al siguiente nivel.',
      stars: 5,
      avatar: '/avatar_producer_2.png'
    },
    { 
      name: 'Junior H Fan', 
      handle: '@JuniorH_Fan',
      text: 'Los beats suenan pasados de lanza, justo lo que buscaba para mi próximo EP.',
      stars: 5,
      avatar: '/avatar_producer_3.png'
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <AbstractPuzzleBack theme="green" opacity={0.2} />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4 revolut-title">
            <span className="tracking-normal mr-4">🏆</span>Testimonios de Éxito
          </h2>
          <p className="text-blue-500 uppercase tracking-widest text-[11px] font-black">Voces de nuestra comunidad de productores 🇲🇽</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <MotionDiv 
              key={i}
              initial={{ opacity: 0, scale: 0.9, transform: 'translateY(20px)' }}
              whileInView={{ opacity: 1, scale: 1, transform: 'translateY(0)' }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
              className="p-8 rounded-[2rem] bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-500"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/50 shadow-lg mb-2">
                  <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900" />
              </div>

              <div className="flex gap-0.5 mb-4">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} size={12} className="fill-blue-500 text-blue-500" />
                ))}
              </div>

              <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 mb-6 font-bold leading-relaxed overflow-hidden text-ellipsis line-clamp-3 tracking-tight">
                "{t.text}"
              </p>
              
              <div className="mt-auto">
                <div className="font-black text-slate-900 dark:text-white text-sm uppercase">{t.name}</div>
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider font-heading">{t.handle}</div>
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════
// GENRE BUTTONS - Removed as requested
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// AI STUDIO SECTION - Revolut Style with Neural Networks
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// THE BEATS SECTION - Like Sound Kits
// ═══════════════════════════════════════════════════════════════════
function TheBeatsSection() {
  const categories = [
    { name: 'Trap', count: '2.5K+', color: 'from-orange-500 to-red-500', icon: Music },
    { name: 'Reggaeton', count: '1.8K+', color: 'from-green-500 to-emerald-500', icon: Disc3 },
    { name: 'Hip Hop', count: '1.2K+', color: 'from-purple-500 to-pink-500', icon: Headphones },
    { name: ' drill', count: '800+', color: 'from-slate-500 to-zinc-500', icon: Mic2 },
  ];

  return (
    <section className="py-16 md:py-32 relative overflow-hidden">
      <AbstractPuzzleBack theme="green" opacity={0.1} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <MotionDiv
          className="text-center mb-16"
          initial={{ opacity: 0, transform: 'translateY(30px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
            The <span className="text-blue-600 dark:text-blue-400">Beats</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Explora todos los géneros disponibles
          </p>
        </MotionDiv>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <MotionDiv
              key={i}
              initial={{ opacity: 0, transform: 'scale(0.9)' }}
              whileInView={{ opacity: 1, transform: 'scale(1)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link href={`/beats?genero=${cat.name}`} className="group relative block p-6 md:p-8 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:border-transparent overflow-hidden transition-all duration-500 hover:-translate-y-2">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />

                <div className="relative">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{cat.name}</h3>
                  <p className="text-sm font-bold text-slate-400">{cat.count} beats</p>
                </div>
              </Link>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SOUND KITS SECTION - Like Revolut
// ═══════════════════════════════════════════════════════════════════
function SoundKitsSection() {
  const kits = [
    { name: 'Drum Kit Vol. 1', producer: 'Tianguis Originals', price: '$299', gradient: 'from-amber-500 to-orange-500', icon: Box },
    { name: 'Trap Essentials', producer: 'Mexican Made', price: '$399', gradient: 'from-purple-500 to-pink-500', icon: Hexagon },
    { name: 'Reggaeton Vocs', producer: 'Urban LATAM', price: '$249', gradient: 'from-green-500 to-emerald-500', icon: Layers3 },
    { name: 'Drill Bundle', producer: 'Street Beatz', price: '$349', gradient: 'from-slate-500 to-zinc-500', icon: Disc3 },
  ];

  return (
    <section className="py-16 md:py-32 relative overflow-hidden">
      <AbstractPuzzleBack theme="purple" opacity={0.15} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <MotionDiv
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
          initial={{ opacity: 0, transform: 'translateY(30px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
              Sound <span className="text-purple-600 dark:text-purple-400">Kits</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Packs de sonidos exclusivos para tu producción
            </p>
          </div>
          <Link href="/sound-kits" className="hidden md:inline-flex items-center gap-2 text-purple-500 font-semibold hover:gap-3 transition-all mt-4 md:mt-0">
            Ver todos <ArrowRight size={18} />
          </Link>
        </MotionDiv>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kits.map((kit, i) => (
            <MotionDiv
              key={i}
              initial={{ opacity: 0, transform: 'translateY(40px)' }}
              whileInView={{ opacity: 1, transform: 'translateY(0)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Link href={`/sound-kits/${i + 1}`} className="group block">
                <div className="relative aspect-square rounded-3xl overflow-hidden mb-4">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${kit.gradient}`} />

                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <kit.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                    <span className="text-sm font-black text-slate-900">{kit.price}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {kit.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">by {kit.producer}</p>
              </Link>
            </MotionDiv>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/sound-kits" className="inline-flex items-center gap-2 text-purple-500 font-semibold">
            Ver todos los Sound Kits <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FEATURE CARDS - Scroll Reveal - Blue Theme
// ═══════════════════════════════════════════════════════════════════
function FeatureCards() {
  const features = [
    {
      title: 'Sound Kits',
      desc: 'Packs de sonidos exclusivos',
      icon: Disc3,
      href: '/sound-kits',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Productores',
      desc: 'Los mejores beats mexas',
      icon: Mic2,
      href: '/productores',
      gradient: 'from-cyan-500 to-teal-500',
    },
    {
      title: 'VIP',
      desc: 'Membresía premium',
      icon: Zap,
      href: '/vip',
      gradient: 'from-blue-600 to-indigo-500',
    },
  ];

  return (
    <section className="py-24 px-4 relative z-10">
      <AbstractPuzzleBack theme="blue" opacity={0.1} />
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <MotionDiv
              key={i}
              className=""
              initial={{ opacity: 0, transform: 'translateY(50px) scale(0.9)' }}
              whileInView={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <Link
                href={feature.href}
                className="group block p-8 rounded-3xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:border-transparent shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center mb-5
                  bg-gradient-to-br ${feature.gradient} text-white
                  group-hover:scale-110 group-hover:rotate-3 transition-all duration-500
                `}>
                  <feature.icon size={26} />
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>

                {/* Arrow */}
                <ArrowRight
                  size={20}
                  className="absolute bottom-8 right-8 text-muted-foreground/30 group-hover:text-blue-500 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300"
                />
              </Link>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COSMOS-STYLE MASONRY GRID (Unified Feed)
// ═══════════════════════════════════════════════════════════════════
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
        <MotionDiv
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
        </MotionDiv>
      ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP SHOWCASE - Glassmorphism UI
// ═══════════════════════════════════════════════════════════════════
function AppShowcase() {
  return (
    <div className="relative py-16 md:py-40 overflow-hidden">
      <AbstractTrianglesBack theme="pink" opacity={1} />
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
        <MotionDiv
          initial={{ opacity: 0, transform: 'translateX(-50px)' }}
          whileInView={{ opacity: 1, transform: 'translateX(0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-7xl font-black tracking-tighter leading-tight mb-6 md:mb-8 text-slate-900 dark:text-white">
            Tu música, <br />
            <span className="text-blue-600 dark:text-blue-500">sin límites.</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
            Nuestra plataforma está diseñada para la velocidad. Gestiona tus licencias,
            descarga archivos de alta calidad y colabora con productores en tiempo real desde
            cualquier dispositivo.
          </p>
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-sm">Próximamente App</div>
          </div>
        </MotionDiv>

        <MotionDiv
          className="relative"
          initial={{ opacity: 0, transform: 'translateX(50px) rotate(5deg)' }}
          whileInView={{ opacity: 1, transform: 'translateX(0) rotate(0deg)' }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {/* Mockup Interface Floating */}
          <div className="relative aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 p-1 shadow-2xl">
            <div className="w-full h-full bg-slate-50 dark:bg-zinc-900 rounded-[2.3rem] overflow-hidden p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Music className="text-blue-600" size={24} />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5" />
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-slate-200 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-32 w-full bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center justify-center">
                  <Play className="text-blue-500 fill-blue-500" size={32} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-slate-100 dark:bg-white/5 rounded-xl" />
                  <div className="h-20 bg-slate-100 dark:bg-white/5 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating UI Badges */}
          <MotionDiv
            className="absolute -top-10 -right-10 p-6 bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-blue-500/20 backdrop-blur-xl"
            animate={{ transform: ['translateY(0)', 'translateY(-20px)', 'translateY(0)'] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="text-white" size={20} />
              </div>
              <div>
                <div className="text-xs font-black uppercase text-slate-400">Licencia</div>
                <div className="text-sm font-bold">Activada</div>
              </div>
            </div>
          </MotionDiv>
        </MotionDiv>
      </div>
    </div>
  );
}

function CosmosFeed({
  beats,
  mousePosition
}: {
  beats: any[];
  mousePosition: { x: number; y: number }
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef as React.RefObject<HTMLElement | null>);

  return (
    <section ref={sectionRef} className="py-20 px-4 md:px-8 relative z-10 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {beats.map((beat, i) => (
          <BeatCardPro key={beat.id} beat={beat} />
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ¿POR QUÉ TIANGUIS BEATS? — BENTO GRID COMPARATIVA
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
        <MotionDiv
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
        </MotionDiv>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 md:gap-5 auto-rows-auto">
          {bentoItems.map((item, i) => (
            <MotionDiv
              key={item.id}
              className={`${item.span} relative rounded-[2rem] overflow-hidden group cursor-default border border-white/5`}
              initial={{ opacity: 0, scale: 0.93, transform: 'translateY(20px)' }}
              whileInView={{ opacity: 1, scale: 1, transform: 'translateY(0)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-700`} />
              <div className="absolute inset-0 bg-slate-950/60 dark:bg-black/40 backdrop-blur-sm" />

              {/* Top stripe */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient} opacity-60`} />

              {/* Glowing orb */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] bg-gradient-to-br ${item.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />

              <div className={`relative z-10 p-7 flex flex-col ${item.tall ? 'gap-6 h-full' : 'gap-4'}`}>
                {/* Icon */}
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
            </MotionDiv>
          ))}
        </div>
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
        <MotionDiv
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
        </MotionDiv>

        {/* Steps Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-[3.5rem] left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-emerald-500/40 z-0" />

          {steps.map((s, i) => (
            <MotionDiv
              key={i}
              className="relative z-10"
              initial={{ opacity: 0, transform: 'translateY(40px)' }}
              whileInView={{ opacity: 1, transform: 'translateY(0)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.18 }}
            >
              <div className="group relative p-8 rounded-[2.5rem] bg-white/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.07] hover:border-blue-500/20 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full">
                {/* Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(circle at 30% 30%, ${s.glow}, transparent 70%)` }} />

                {/* Step number */}
                <div className="flex items-center gap-5 mb-7">
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 flex-shrink-0`}>
                    {s.icon}
                    {/* Connector dot (desktop) */}
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${s.gradient} border-4 border-background flex items-center justify-center`}>
                      <span className="text-[6px] font-black text-white">{i + 1}</span>
                    </div>
                  </div>
                  <span className="text-[2.5rem] md:text-[3.5rem] font-black text-slate-900/10 dark:text-white/5 leading-none select-none">{s.step}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3">{s.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{s.desc}</p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-500 rounded-full`} />
              </div>
            </MotionDiv>
          ))}
        </div>

        {!isLoggedIn && (
          <MotionDiv
            className="text-center mt-14"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Link href="/signup" className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black uppercase tracking-widest text-sm hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-300">
              Comenzar Gratis <ArrowRight size={18} />
            </Link>
          </MotionDiv>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCTORES VERIFICADOS — SOCIAL PROOF + SELLO DE CALIDAD
// ═══════════════════════════════════════════════════════════════════
function ProducersProofSection() {
  const reviews = [
    {
      name: 'KrizzBeatz',
      handle: '@KrizzBeatz',
      text: 'Tianguis Beats me salvó de las comisiones gringas. Por fin cobro lo que valgo y en pesos. La plataforma que el movimiento mexa necesitaba.',
      genre: 'Corridos Tumbados',
      stars: 5,
    },
    {
      name: 'Pavel Orozco',
      handle: '@PavelOrozco',
      text: 'Incredible calidad en los soundkits. Mis stems llegan encriptados y seguros. Jamás había tenido esa tranquilidad subiendo archivos.',
      genre: 'Trap • Drill',
      stars: 5,
    },
    {
      name: 'JR Beats MX',
      handle: '@JRBeatsMX',
      text: 'Setup en 10 minutos, beats en línea y Stripe conectado. La competencia gringa tarda días. Aquí es rápido, MXN y sin rollos.',
      genre: 'Reggaetón • Mexa',
      stars: 5,
    },
  ];

  return (
    <section className="py-16 md:py-32 relative overflow-hidden">
      <AbstractPuzzleBack theme="purple" opacity={0.1} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Sello de Calidad */}
        <MotionDiv
          className="flex flex-col items-center mb-12 md:mb-24"
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'backOut' }}
        >
          <div className="relative mb-6">
            {/* Anillos orbitales */}
            <div className="absolute inset-0 m-auto w-40 h-40 rounded-full border border-amber-400/20 animate-[spin_12s_linear_infinite]" />
            <div className="absolute inset-0 m-auto w-52 h-52 rounded-full border border-amber-400/10 animate-[spin_20s_linear_infinite_reverse]" />

            <div className="relative w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_80px_rgba(251,191,36,0.4)] animate-pulse">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex flex-col items-center justify-center border-4 border-amber-200/30">
                <img src="/logo.png" alt="Tianguis Beats" className="w-14 h-14 object-contain drop-shadow-lg" />
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-black uppercase tracking-tighter text-amber-400 mb-1">Sello de Calidad Tianguis</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400/50">Certificado por la Comunidad · 2026</p>

          <div className="flex items-center justify-center gap-2 mt-4 w-full">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
        </MotionDiv>

        {/* Section Header */}
        <MotionDiv
          className="text-center mb-16"
          initial={{ opacity: 0, transform: 'translateY(20px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
            🏆 Productores Verificados
          </span>
          <h2 className="text-3xl md:text-7xl font-black uppercase tracking-tighter revolut-title">
            Lo que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              dicen ellos
            </span>
          </h2>
        </MotionDiv>

        {/* Review Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <MotionDiv
              key={i}
              initial={{ opacity: 0, transform: 'translateY(30px) scale(0.95)' }}
              whileInView={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <div className="group relative p-8 rounded-[2.5rem] bg-white/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.07] hover:border-amber-500/20 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full flex flex-col">
                {/* Decorative quote */}
                <div className="absolute top-4 right-6 text-[8rem] font-black text-slate-900/[0.03] dark:text-white/[0.02] leading-none select-none pointer-events-none">"</div>
                {/* Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(251,191,36,0.06), transparent 70%)' }} />

                <div className="flex gap-0.5 mb-5">
                  {[...Array(r.stars)].map((_, i) => (
                    <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-6 flex-1">
                  "{r.text}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-lg">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-sm">{r.name}</div>
                    <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">{r.genre}</div>
                  </div>
                  <div className="ml-auto">
                    <BadgeCheck size={18} className="text-blue-400" />
                  </div>
                </div>
              </div>
            </MotionDiv>
          ))}
        </div>
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
      <div
        className="h-full bg-blue-500 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════

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
            id,
            titulo,
            bpm,
            tono_escala,
            precio,
            reproducciones,
            portada_url,
            genero,
            created_at,
            productor_id,
            productor_nombre_usuario,
            productor_nombre_artistico,
            productor_foto_perfil,
            productor_esta_verificado,
            productor_es_fundador,
            esta_vendido,
            precio_basica_mxn
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
            // Map fallbacks for BeatCardPro
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
      {/* <ParallaxBackground scrollY={scrollY} /> Removed in favor of AbstractPuzzleBack */}
      {/* <FloatingParticles /> Moved inside Hero section */}

      <Navbar minimal={false} />

      <main className="relative z-10 text-foreground">
        {/* 🌌 HERO SECTION */}
        <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-32 pb-20">
          <AbstractHomeBack theme="blue" opacity={1} />

          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <FloatingParticles />
          </div>

          <HeroTitle scrollY={scrollY} />

          <MotionDiv
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 text-slate-400 dark:text-white/40"
            animate={{ transform: ['translateY(0px)', 'translateY(10px)', 'translateY(0px)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Explorar</span>
            <ChevronDown size={20} />
          </MotionDiv>
        </section>

        {/* REVOLUT STATS (Beats/Kits primero como solicitado) */}
        <KineticSection>
          <RevolutStats 
            beats={stats.beats}
            kits={stats.kits}
            producers={stats.producers}
            sales={stats.sales}
          />
        </KineticSection>

        {/* ¿POR QUÉ TIANGUIS BEATS? — BENTO GRID */}
        <KineticSection>
          <BentoWhySection />
        </KineticSection>

        {/* THE COSMOS FEED */}
        <KineticSection>
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center opacity-40">
              <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white">Sincronizando Universo...</p>
            </div>
          ) : (
            <CosmosFeed beats={beats} mousePosition={mousePosition} />
          )}
        </KineticSection>

        {/* CÓMO FUNCIONA — 3 PASOS */}
        <KineticSection>
          <HowItWorksSection />
        </KineticSection>

        {/* APP SHOWCASE */}
        <KineticSection>
          <AppShowcase />
        </KineticSection>

        {/* PRODUCTORES VERIFICADOS — SELLO + SOCIAL PROOF */}
        <KineticSection>
          <ProducersProofSection />
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

function MagicSearchIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
