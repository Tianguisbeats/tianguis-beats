"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, ChevronDown, Music, CreditCard, User, Upload, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const categories = [
        { title: 'Comenzando', icon: <User />, count: 5, color: 'bg-blue-500/10 text-blue-500' },
        { title: 'Subir contenido', icon: <Upload />, count: 3, color: 'bg-purple-500/10 text-purple-500' },
        { title: 'Pagos y Licencias', icon: <CreditCard />, count: 4, color: 'bg-green-500/10 text-green-500' },
        { title: 'Mi Perfil', icon: <Music />, count: 2, color: 'bg-orange-500/10 text-orange-500' },
    ];

    const faqs = [
        {
            q: "¿Cómo puedo subir mi primer beat?",
            a: "Inicia sesión, ve a 'Sube tu Beat', carga tu archivo MP3 (con tag) y los archivos de alta calidad (WAV/Stems). Define el género, BPM y precio. ¡Listo!",
            cat: 'Subir contenido'
        },
        {
            q: "¿Qué tipos de licencias ofrecen?",
            a: "Licencia Básica (MP3 para demos), Pro (WAV para grabaciones profesionales) y Premium (Stems + Derechos exclusivos).",
            cat: 'Pagos y Licencias'
        },
        {
            q: "¿Cómo recibo mis pagos?",
            a: "Los pagos se procesan vía Stripe o PayPal. El dinero llega a tu cuenta de Tianguis Studio y puedes retirarlo tras la validación de la venta.",
            cat: 'Pagos y Licencias'
        },
        {
            q: "¿Qué es el Tianguis Studio?",
            a: "Es tu centro de administración donde ves ventas, estadísticas de reproducciones y gestionas tus suscripciones.",
            cat: 'Mi Perfil'
        },
        {
            q: "¿Cómo configuro mi nombre artístico?",
            a: "Ve a tu perfil, haz clic en 'Editar Perfil' y actualiza tu nombre artístico, biografía y redes sociales para verte más profesional.",
            cat: 'Comenzando'
        },
        {
            q: "¿Qué pasa si pierdo mi contraseña?",
            a: "En la página de Log In, selecciona 'Olvidé mi contraseña' y te enviaremos un correo de recuperación.",
            cat: 'Comenzando'
        }
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.cat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openSupportChat = () => {
        window.dispatchEvent(new CustomEvent('open-ai-chat'));
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Hero Section */}
                <div className="bg-background border-b border-border pb-20 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/5 rounded-full blur-[120px]"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto">
                            <h1 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter mb-8 leading-none">
                                Centro de <span className="text-accent">Ayuda</span>
                            </h1>

                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="¿En qué podemos ayudarte hoy?"
                                    className="w-full bg-card border-2 border-border rounded-full py-6 pl-16 pr-8 text-lg font-medium focus:outline-none focus:border-accent transition-all shadow-sm placeholder:text-muted/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                    {/* Category Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {categories.map((cat, i) => (
                            <div key={i} onClick={() => setSearchTerm(cat.title)} className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all ${cat.color}`}>
                                    {cat.icon}
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-tight mb-2 text-foreground">{cat.title}</h3>
                                <p className="text-[10px] text-muted font-black uppercase tracking-widest">{cat.count} artículos</p>
                            </div>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-10 text-center">
                            {searchTerm ? `Resultados para "${searchTerm}"` : 'Preguntas Frecuentes'}
                        </h2>

                        <div className="space-y-4">
                            {filteredFaqs.length > 0 ? filteredFaqs.map((faq, i) => (
                                <div key={i} className="bg-card rounded-3xl border border-border overflow-hidden transition-all shadow-sm">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full p-6 flex items-center justify-between text-left hover:bg-muted/5 transition-colors"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-accent">{faq.cat}</span>
                                            <span className="font-bold text-foreground/90">{faq.q}</span>
                                        </div>
                                        <ChevronDown className={`text-muted transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} size={20} />
                                    </button>

                                    <div className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                        <div className="p-6 pt-0 text-muted leading-relaxed border-t border-border bg-muted/5">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <p className="text-muted font-bold uppercase tracking-widest text-sm">No encontramos lo que buscas</p>
                                    <p className="text-muted/60 text-xs mt-2">Prueba con otra palabra o contacta a soporte.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Support Banner */}
                    <div className="mt-20 bg-accent rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-accent/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <MessageCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">¿No encuentras lo que buscas?</h3>
                                <p className="text-white/80 font-medium">Nuestro equipo de soporte está listo para ayudarte en lo que necesites.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                            className="relative z-10 whitespace-nowrap px-8 py-4 bg-white text-accent rounded-full font-black uppercase tracking-widest text-xs hover:bg-foreground hover:text-white transition-all shadow-lg text-center"
                        >
                            Contactar Soporte IA
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
