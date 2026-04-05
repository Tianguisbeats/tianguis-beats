"use client";

import React from 'react';
import Link from 'next/link';
import { Brain, Cloud, TrendingUp, ArrowRight, Cpu, Network, Zap } from 'lucide-react';
import { ScrollReveal, GlowCard } from './ui/BackgroundEffects';

export default function TechStack() {
    const features = [
        {
            icon: Brain,
            title: "Smart Matchdowning",
            description: "Nuestro algoritmo analiza tus preferencias y estructura de composición para sugerirte beats exactos. Reducción del 80% en tiempo de búsqueda.",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            icon: Cloud,
            title: "Hybrid Cloud Infrastructure",
            description: "Procesamiento distribuido en nodos de baja latencia para una experiencia fluida. Escalabilidad infinita para tu creatividad.",
            gradient: "from-cyan-500 to-emerald-500",
        },
        {
            icon: TrendingUp,
            title: "Predictive Audio Scaling",
            description: "Anticipamos las tendencias de la industria y las frecuencias que dominan los charts actuales para ofrecerte lo más relevante.",
            gradient: "from-emerald-500 to-blue-500",
        },
    ];

    return (
        <section className="relative py-24 bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <ScrollReveal direction="up">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                            <Cpu size={16} className="text-blue-500" />
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Stack Tecnológico</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4">
                            Tianguis <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">Engine v2.0</span>
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Potenciado por Redes Neuronales de Aprendizaje Profundo
                        </p>
                    </div>
                </ScrollReveal>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                            <GlowCard
                                className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500/30 transition-all group h-full"
                                glowColor="#3b82f6"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="text-white" size={32} />
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>

                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Learn More Link */}
                                <Link
                                    href="/help"
                                    className="inline-flex items-center gap-2 mt-6 text-blue-500 font-semibold text-sm hover:gap-3 transition-all"
                                >
                                    Aprender más
                                    <ArrowRight size={16} />
                                </Link>
                            </GlowCard>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Bottom Note */}
                <ScrollReveal direction="up" delay={0.4}>
                    <div className="mt-12 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            En Tianguis Beats, el algoritmo trabaja para el productor. Aplicamos modelos de Machine Learning para garantizar que cada licencia cumpla con los estándares de la industria actual.
                        </p>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
