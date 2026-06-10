"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
    Music, Layers, Users, ChevronDown, Play, Star, Plus, 
    Verified, ArrowRight, ShieldCheck, Zap, Disc, Mic, 
    Headphones, Settings2, AudioLines 
} from 'lucide-react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ══════════════════════════════════════════════════════════════════════
   HEROIC EDITORIAL DESIGN (Beats v7 - v11.8.3)
   ══════════════════════════════════════════════════════════════════════ */

const SectionLabel = ({ activeIndex }: { activeIndex: number }) => (
    <div className="fixed right-10 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-[100] hidden md:flex">
        {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 justify-end group">
                <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeIndex === i ? 'opacity-100 text-white translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                    {i === 0 ? 'Beats' : i === 1 ? 'Sound Kits' : 'Productores'}
                </span>
                <div className={`w-3 h-3 rounded-full border-2 border-white transition-all duration-300 ${activeIndex === i ? 'bg-white scale-125' : 'bg-transparent opacity-30 hover:opacity-60'}`} />
            </div>
        ))}
    </div>
);

// Icono Flotante optimizado con CSS nativo para máximo rendimiento
const FloatingIcon = ({ icon: Icon, delay, x, y, size = 32 }: any) => (
    <div 
        className="absolute opacity-20 pointer-events-none animate-float-glow"
        style={{ 
            left: x, 
            top: y,
            animationDelay: `${delay}s`,
            willChange: 'transform'
        }}
    >
        <Icon size={size} strokeWidth={1.5} />
    </div>
);

export default function BeatsPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        if (!isNaN(index)) {
                            setActiveIndex(index);
                        }
                    }
                });
            },
            { 
                threshold: 0.5,
                rootMargin: "-10% 0px -10% 0px"
            }
        );

        document.querySelectorAll('section[data-index]').forEach((section) => {
            observer.observe(section);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="relative w-full">
            <style dangerouslySetInnerHTML={{ __html: `
                html {
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                }
                @keyframes float-glow {
                    0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
                    33% { transform: translateY(-20px) rotate(5deg) scale(1.05); }
                    66% { transform: translateY(-10px) rotate(-5deg) scale(0.95); }
                }
                @keyframes bar-grow {
                    0%, 100% { height: 20%; }
                    50% { height: 100%; }
                }
                .animate-float-glow {
                    animation: float-glow 6s ease-in-out infinite;
                }
                .animate-bar {
                    animation: bar-grow 1.2s ease-in-out infinite;
                }
                section {
                    transform: translateZ(0);
                    will-change: transform;
                }
            ` }} />
            
            <Navbar />
            <SectionLabel activeIndex={activeIndex} />
            
            {/* PROGRESS BAR */}
            <motion.div 
                className="fixed bottom-0 left-0 right-0 h-1.5 bg-white origin-left z-[200] opacity-30"
                style={{ scaleX }}
            />

            {/* SECCIÓN 1: BEATS (VERDE - #34D399) */}
            <section data-index={0} className="min-h-screen w-full flex items-center justify-center relative px-6 md:px-20 overflow-hidden bg-[#34D399] dark:bg-[#1A5C43]">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <motion.h1
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 0.1 }}
                        transition={{ duration: 1.5 }}
                        className="text-[42vw] md:text-[35vw] font-black uppercase tracking-tighter text-white leading-none select-none"
                    >
                        BEATS
                    </motion.h1>
                </div>
                <div className="md:hidden absolute inset-0 pointer-events-none">
                    <FloatingIcon icon={Music} delay={0.1} x="78%" y="17%" size={42} />
                    <FloatingIcon icon={AudioLines} delay={1.1} x="8%" y="67%" size={38} />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                        className="absolute top-28 -right-16 w-40 h-40 rounded-[2.5rem] border border-white/20"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.3, 0.18] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-24 -left-10 w-36 h-36 rounded-full bg-white/20 blur-2xl"
                    />
                </div>
                
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 items-center gap-12 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-white"
                    >
                        <div className="flex items-center gap-4 mb-6 md:mb-10">
                            <Zap className="fill-white" size={24} />
                            <div className="h-0.5 w-12 bg-white rounded-full" />
                        </div>
                        <h2 className="text-4xl sm:text-6xl md:text-[10rem] font-black uppercase tracking-tighter leading-[0.85] mb-6 md:mb-8">
                            Beats<br /><span className="text-white/40">Premium.</span>
                        </h2>
                        <p className="max-w-md text-white/80 text-base md:text-xl font-medium mb-8 md:mb-12 leading-relaxed">Encuentra tu próximo Hit aquí.</p>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.35 }}
                            className="md:hidden mb-8 rounded-[2rem] border border-white/25 bg-white/12 backdrop-blur-2xl p-5 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <div className="text-[8px] font-black uppercase tracking-[0.4em] text-white/55">Preview</div>
                                    <div className="text-2xl font-black uppercase tracking-tighter">Beat Store</div>
                                </div>
                                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-xl">
                                    <Play fill="#34D399" className="text-[#34D399]" size={17} />
                                </div>
                            </div>
                            <div className="flex items-end gap-1.5 h-24">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-full bg-white/80 animate-bar"
                                        style={{ animationDelay: `${i * 0.08}s` }}
                                    />
                                ))}
                            </div>
                            <div className="mt-5 grid grid-cols-3 gap-2">
                                {['Trap', 'R&B', 'Reggaeton'].map((genre) => (
                                    <div key={genre} className="rounded-full bg-white/15 px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-white/75">
                                        {genre}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        <Link href="/beats/catalog" className="group inline-flex items-center gap-3 md:gap-6 px-8 py-5 md:px-14 md:py-7 bg-white text-[#34D399] dark:text-[#1A5C43] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-2xl">
                            Explorar catálogo <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, rotate: 10, scale: 0.9 }}
                        whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="hidden md:flex justify-center"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-8 border border-white/20 rounded-[4rem] animate-[spin_30s_linear_infinite]" />
                            <div className="w-[500px] h-[600px] bg-white/10 backdrop-blur-3xl border border-white/30 rounded-[3.5rem] p-16 shadow-2xl flex flex-col justify-between overflow-hidden">
                                <div className="flex items-end gap-1.5 h-32">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                        <div 
                                            key={i}
                                            className="flex-1 bg-white rounded-full opacity-60 animate-bar"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <div className="text-7xl font-black uppercase text-white leading-none tracking-tighter">Tianguis<br />Beats.</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center"><Play fill="#34D399" className="text-[#34D399]" size={18} /></div>
                                        <span className="text-xs font-black uppercase tracking-widest text-white/60">Reproduciendo ahora</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 flex flex-col items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Scroll</span>
                    <ChevronDown size={20} className="animate-bounce" />
                </div>
            </section>

            {/* SECCIÓN 2: SOUND KITS (NARANJA - #F59E0B) */}
            <section data-index={1} className="min-h-screen w-full flex items-center justify-center relative px-6 md:px-20 overflow-hidden bg-[#F59E0B] dark:bg-[#784A06]">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 100 }}
                        whileInView={{ opacity: 0.1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="text-[44vw] md:text-[35vw] font-black uppercase tracking-tighter text-white leading-none select-none"
                    >
                        KITS
                    </motion.h1>
                </div>
                <div className="md:hidden absolute inset-0 pointer-events-none">
                    <FloatingIcon icon={Disc} delay={0.4} x="74%" y="19%" size={44} />
                    <FloatingIcon icon={Headphones} delay={1.3} x="10%" y="66%" size={42} />
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                        className="absolute top-28 -left-12 w-40 h-40 rounded-full border border-dashed border-white/25"
                    />
                    <motion.div
                        animate={{ opacity: [0.16, 0.32, 0.16] }}
                        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-20 -right-12 w-44 h-44 rounded-full bg-white/20 blur-2xl"
                    />
                </div>
                
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 items-center gap-20 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="hidden md:flex flex-col items-center relative"
                    >
                        <motion.div 
                            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -inset-10 border-2 border-dashed border-white/20 rounded-full" 
                        />
                        <div className="w-80 h-80 rounded-full bg-white/10 backdrop-blur-3xl border-2 border-white/30 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                            <Disc size={120} className="text-white animate-[spin_10s_linear_infinite]" />
                            <AudioLines size={40} className="absolute text-white/40 bottom-10" />
                        </div>
                        <div className="mt-12 text-center">
                            <span className="text-xs font-black uppercase tracking-[0.5em] text-white/60">Calidad de Estudio</span>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white md:text-right"
                    >
                        <div className="flex items-center gap-4 mb-10 md:justify-end">
                            <div className="h-0.5 w-12 bg-white rounded-full" />
                            <Star className="fill-white" size={24} />
                        </div>
                        <h2 className="text-4xl sm:text-6xl md:text-[10rem] font-black uppercase tracking-tighter leading-[0.85] mb-6 md:mb-8">
                            Sound<br /><span className="text-white/40">Kits.</span>
                        </h2>
                        <p className="max-w-md text-white/80 text-base md:text-xl font-medium mb-8 md:mb-12 leading-relaxed md:ml-auto">Librerías exclusivas con sonidos y Presets de alta calidad para tus Beats.</p>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.25 }}
                            className="md:hidden mb-8 rounded-[2rem] border border-white/25 bg-white/12 backdrop-blur-2xl p-5 shadow-2xl overflow-hidden text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                                    <Disc size={42} className="text-white animate-[spin_10s_linear_infinite]" />
                                    <div className="absolute inset-5 rounded-full border border-white/20" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[8px] font-black uppercase tracking-[0.4em] text-white/55">Studio Pack</div>
                                    <div className="text-2xl font-black uppercase tracking-tighter">Drums & Presets</div>
                                    <div className="mt-2 flex gap-2">
                                        {['WAV', 'MIDI', 'FX'].map((label) => (
                                            <span key={label} className="rounded-full bg-white/15 px-3 py-1 text-[8px] font-black tracking-widest text-white/80">{label}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        <Link href="/sound-kits" className="group inline-flex items-center gap-3 md:gap-6 px-8 py-5 md:px-14 md:py-7 bg-white text-[#F59E0B] dark:text-[#784A06] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-2xl">
                            Ver librerías <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* SECCIÓN 3: HUB DE PRODUCTORES (MORADO - #8B5CF6) */}
            <section data-index={2} className="min-h-screen w-full flex items-center justify-center relative px-6 md:px-20 overflow-hidden bg-[#8B5CF6] dark:bg-[#3B1B7D]">
                {/* ICONOS FLOTANTES INTERACTIVOS */}
                <FloatingIcon icon={Mic} delay={0} x="10%" y="20%" size={40} />
                <FloatingIcon icon={Headphones} delay={1} x="80%" y="30%" size={50} />
                <FloatingIcon icon={Settings2} delay={2} x="15%" y="70%" size={35} />
                <FloatingIcon icon={AudioLines} delay={3} x="75%" y="65%" size={45} />
                <FloatingIcon icon={Music} delay={0.5} x="50%" y="15%" size={30} />
                <FloatingIcon icon={Users} delay={1.5} x="30%" y="40%" size={60} />
                <FloatingIcon icon={Star} delay={2.5} x="60%" y="25%" size={40} />
                
                <div className="max-w-6xl mx-auto w-full flex flex-col items-center justify-center text-center text-white relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <div className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 text-white/60">Hub de Productores Especializados</div>
                        <h2 className="text-4xl sm:text-6xl md:text-[11rem] font-black uppercase tracking-tighter leading-[0.85] mb-6 md:mb-10">
                            Conecta con<br /><span className="text-white/40">Los Mejores.</span>
                        </h2>
                        <p className="max-w-2xl text-white/70 text-base md:text-2xl font-medium mb-8 md:mb-16 leading-relaxed mx-auto">Los mejores productores están aquí.</p>
                        <div className="md:hidden grid grid-cols-3 gap-2 mb-8">
                            {[
                                ['Pro', 'Curados'],
                                ['Live', 'Perfiles'],
                                ['Mix', 'Servicios'],
                            ].map(([top, bottom]) => (
                                <div key={top} className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-xl">
                                    <div className="text-xl font-black leading-none">{top}</div>
                                    <div className="mt-1 text-[7px] font-black uppercase tracking-widest text-white/55">{bottom}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                            <Link href="/productores" className="px-8 py-5 md:px-16 md:py-8 bg-white text-[#8B5CF6] dark:text-[#3B1B7D] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-2xl flex items-center gap-3 md:gap-4">
                                Ver Productores <ArrowRight size={20} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER SECTION: Eliminado snap-start para evitar cortes visuales y permitir flujo natural */}
            <div className="relative z-10 bg-white dark:bg-[#050505] border-t border-black/5 dark:border-white/5">
                <Footer />
            </div>
        </div>
    );
}
