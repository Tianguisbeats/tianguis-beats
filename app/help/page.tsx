"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, ChevronDown, Music, CreditCard, User, Upload, MessageCircle } from 'lucide-react';

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const categories = [
        { title: 'Comenzando', icon: <User />, count: 5 },
        { title: 'Subir contenido', icon: <Upload />, count: 3 },
        { title: 'Pagos y Licencias', icon: <CreditCard />, count: 4 },
        { title: 'Mi Perfil', icon: <Music />, count: 2 },
    ];

    const faqs = [
        {
            q: "¿Cómo puedo subir mi primer beat?",
            a: "Primero debes iniciar sesión y completar tu perfil de productor. Luego, haz clic en el botón 'Sube tu Beat' en la barra de navegación y sigue los pasos para cargar tus archivos y establecer precios."
        },
        {
            q: "¿Qué tipos de licencias ofrecen?",
            a: "Ofrecemos tres tipos de licencias: Básica (MP3), Pro (WAV + Stems) y Premium (Derechos exclusivos). Cada productor puede personalizar los términos específicos de sus licencias."
        },
        {
            q: "¿Cómo recibo mis pagos?",
            a: "Los pagos se procesan de forma inmediata a través de nuestra pasarela segura. Una vez que se confirma la venta, el saldo se refleja en tu Studio y puedes solicitar el retiro a tu cuenta bancaria vinculada."
        },
        {
            q: "¿Qué es el Tianguis Studio?",
            a: "Es tu centro de mando. Aquí puedes ver tus estadísticas, gestionar tus ventas, actualizar tus beats y controlar tu suscripción a la plataforma."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Hero Section */}
                <div className="bg-white border-b border-slate-100 pb-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto">
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-8">
                                Centro de <span className="text-blue-600">Ayuda</span>
                            </h1>

                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="¿En qué podemos ayudarte hoy?"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-full py-6 pl-16 pr-8 text-lg font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
                    {/* Category Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {categories.map((cat, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    {cat.icon}
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-tight mb-2">{cat.title}</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{cat.count} artículos</p>
                            </div>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-10 text-center">Preguntas Frecuentes</h2>

                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden transition-all">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                                    >
                                        <span className="font-bold text-slate-700">{faq.q}</span>
                                        <ChevronDown className={`text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} size={20} />
                                    </button>

                                    <div className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                        <div className="p-6 pt-0 text-slate-500 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Banner */}
                    <div className="mt-20 bg-blue-600 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-600/20">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <MessageCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">¿No encuentras lo que buscas?</h3>
                                <p className="text-blue-100 font-medium">Nuestro equipo de soporte está listo para ayudarte en lo que necesites.</p>
                            </div>
                        </div>
                        <button className="whitespace-nowrap px-8 py-4 bg-white text-blue-600 rounded-full font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all shadow-lg">
                            Contactar Soporte
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
