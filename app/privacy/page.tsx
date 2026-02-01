"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lock, Eye, Database, Mail, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
    const points = [
        { title: 'Recopilación de Datos', desc: 'Recopilamos información necesaria para el funcionamiento de tu cuenta y el procesamiento de tus pagos.', icon: <Database /> },
        { title: 'Protección de Datos', desc: 'Utilizamos los estándares más altos de seguridad para proteger tu información personal y financiera.', icon: <Lock /> },
        { title: 'Derechos ARCO', desc: 'Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales.', icon: <Eye /> },
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="max-w-3xl mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-green-100">
                            Privacidad & Seguridad
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-6">
                            Aviso de <span className="text-blue-600">Privacidad</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg">
                            En Tianguis Beats, nos tomamos muy en serio la seguridad de tu información. Cumplimos con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> de México.
                        </p>
                    </div>

                    {/* Quick Stats/Points */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        {points.map((point, i) => (
                            <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                    {point.icon}
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight mb-2">{point.title}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{point.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Detailed Content */}
                    <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white shadow-2xl shadow-slate-900/20">
                        <div className="max-w-4xl">
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
                                <ShieldCheck className="text-blue-500" size={32} />
                                Detalles sobre tu información
                            </h2>

                            <div className="space-y-12">
                                <div>
                                    <h4 className="text-blue-400 font-black uppercase tracking-widest text-xs mb-4">Transferencia Internacional de Datos</h4>
                                    <p className="text-slate-300 leading-relaxed text-lg">
                                        Al utilizar Tianguis Beats, aceptas que tu información pueda ser procesada en servidores ubicados fuera de México (como los de Supabase o Stripe). Sin embargo, garantizamos que estos proveedores cumplen con estándares internacionales de protección equivalentes a la LFPDPPP.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-blue-400 font-black uppercase tracking-widest text-xs mb-4">Conservación de Datos</h4>
                                    <p className="text-slate-300 leading-relaxed text-lg">
                                        Mantendremos tus datos personales únicamente durante el tiempo que sea necesario para cumplir con los fines para los cuales fueron recopilados, incluyendo el cumplimiento de obligaciones legales, contables o de reporte.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-blue-400 font-black uppercase tracking-widest text-xs mb-4">Uso de Cookies y Tecnologías Similares</h4>
                                    <p className="text-slate-300 leading-relaxed text-lg">
                                        Utilizamos cookies técnicas para mantener tu sesión activa, cookies de personalización para recordar tus preferencias de búsqueda, y cookies de análisis para entender cómo mejorar el Tianguis. Puedes desactivarlas en la configuración de tu navegador, aunque algunas funciones podrían no estar disponibles.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-blue-400 font-black uppercase tracking-widest text-xs mb-4">Derechos ARCO</h4>
                                    <p className="text-slate-300 leading-relaxed text-lg">
                                        Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición enviando un correo a <span className="text-blue-400 font-bold">privacidad@tianguisbeats.com</span>. Atenderemos tu solicitud en un plazo máximo de 20 días hábiles.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-16 pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">¿Dudas sobre privacidad?</p>
                                        <p className="font-bold text-slate-100">soporte@tianguisbeats.com</p>
                                    </div>
                                </div>
                                <button className="px-8 py-4 bg-white text-slate-900 rounded-full font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all">
                                    Más información
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
