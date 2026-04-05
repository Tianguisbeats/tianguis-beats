"use client";

import React from 'react';
import { Mic, Layers, Music, Clock, ArrowRight } from 'lucide-react';
import { ScrollReveal, GlowCard } from './ui/BackgroundEffects';

export default function AIStudioSuite() {
    const features = [
        {
            icon: Music,
            title: "AI Mastering & Normalization",
            description: "Ajuste automático de decibeles y normalización a -14 LUFS para Spotify. Tu sonido siempre optimizado para streaming.",
            comingSoon: true,
            gradient: "from-violet-500 to-purple-500",
        },
        {
            icon: Layers,
            title: "Stem Separation",
            description: "Extracción de instrumentos mediante IA para control total de licencias. Separa, modifica y crea nuevas mezclas.",
            comingSoon: true,
            gradient: "from-purple-500 to-pink-500",
        },
        {
            icon: Mic,
            title: "Vocal Pitch Correction Preview",
            description: "Análisis de tonalidad de voz para encontrar el beat perfecto según el rango dinámico de tu voz.",
            comingSoon: true,
            gradient: "from-pink-500 to-rose-500",
        },
    ];

    return (
        <section className="relative py-24 bg-white dark:bg-slate-950 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <ScrollReveal direction="up">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                            <Clock size={16} className="text-violet-500" />
                            <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">Próximamente</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4">
                            AI Studio <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Suite</span>
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Herramientas de siguiente generación para productores profesionales
                        </p>
                    </div>
                </ScrollReveal>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {features.map((feature, index) => (
                        <ScrollReveal key={index} direction="up" delay={index * 0.15}>
                            <GlowCard
                                className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500/30 transition-all group h-full relative overflow-hidden"
                                glowColor="#8b5cf6"
                            >
                                {/* Coming Soon Badge */}
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 text-xs font-bold uppercase tracking-wider">
                                        Soon
                                    </span>
                                </div>

                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="text-white" size={32} />
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>

                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Subscribe CTA */}
                                <button className="inline-flex items-center gap-2 mt-6 text-violet-500 font-semibold text-sm hover:gap-3 transition-all">
                                    Notifícame
                                    <ArrowRight size={16} />
                                </button>
                            </GlowCard>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Newsletter Signup */}
                <ScrollReveal direction="up" delay={0.4}>
                    <div className="mt-12 max-w-md mx-auto">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="Tu email para notificaciones"
                                className="flex-1 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:outline-none transition-colors"
                            />
                            <button className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform">
                                Suscribirse
                            </button>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
