"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Book, Scale, FileText, AlertCircle } from 'lucide-react';

export default function TermsPage() {
    const sections = [
        { id: 'intro', title: '1. Introducción', icon: <FileText size={18} /> },
        { id: 'intellectual-property', title: '2. Propiedad Intelectual', icon: <Book size={18} /> },
        { id: 'user-conduct', title: '3. Conducta del Usuario', icon: <Shield size={18} /> },
        { id: 'payments', title: '4. Pagos y Suscripciones', icon: <AlertCircle size={18} /> },
        { id: 'legal', title: '5. Jurisdicción y Ley Aplicable', icon: <Scale size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100">
                            Legal & Transparencia
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                            Términos de <span className="text-blue-600">Servicio</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                            Última actualización: 31 de enero de 2026. Por favor, lee estos términos detenidamente para entender tus derechos y responsabilidades al usar Tianguis Beats.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar Index */}
                        <aside className="lg:w-64 shrink-0 lg:sticky lg:top-32 h-fit">
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Contenido</h2>
                                <nav className="space-y-4">
                                    {sections.map((section) => (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors group"
                                        >
                                            <span className="text-slate-300 group-hover:text-blue-200 transition-colors">
                                                {section.icon}
                                            </span>
                                            {section.title}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        {/* Content */}
                        <div className="flex-1 prose prose-slate prose-lg max-w-none">
                            <section id="intro" className="mb-12 scroll-mt-32">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">1</span>
                                    Introducción
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Bienvenido a Tianguis Beats. Estos Términos de Servicio regulan el uso de nuestra plataforma y servicios relacionados. Al acceder o utilizar Tianguis Beats, aceptas estar sujeto a estos términos. Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    Nuestra plataforma funciona como un mercado (marketplace) que conecta a productores de música con artistas y compradores, facilitando la licencia y compra de obras musicales.
                                </p>
                            </section>

                            <section id="intellectual-property" className="mb-12 scroll-mt-32">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">2</span>
                                    Propiedad Intelectual
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    De acuerdo con la <strong>Ley Federal del Derecho de Autor (LFDA)</strong> en México:
                                </p>
                                <ul className="list-disc pl-6 space-y-3 text-slate-600">
                                    <li>Los productores retienen la propiedad intelectual de sus obras originales, otorgando licencias de uso a los compradores según el tipo de licencia adquirida (Básica, Pro o Premium).</li>
                                    <li>Tianguis Beats no reclama propiedad sobre el contenido subido por los usuarios.</li>
                                    <li>Los usuarios garantizan que poseen todos los derechos necesarios sobre el contenido que publican y que no infringen derechos de terceros.</li>
                                </ul>
                            </section>

                            <section id="user-conduct" className="mb-12 scroll-mt-32">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">3</span>
                                    Conducta del Usuario
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Como usuario de Tianguis Beats, te comprometes a:
                                </p>
                                <ul className="list-disc pl-6 space-y-3 text-slate-600">
                                    <li>Proporcionar información verídica y mantenerla actualizada.</li>
                                    <li>No utilizar la plataforma para distribuir contenido ilegal, ofensivo o que infrinja derechos de autor.</li>
                                    <li>No realizar ingeniería inversa o intentar comprometer la seguridad de la plataforma.</li>
                                    <li>Respetar los acuerdos de licencia establecidos entre productores y compradores.</li>
                                </ul>
                            </section>

                            <section id="payments" className="mb-12 scroll-mt-32">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">4</span>
                                    Pagos y Reembolsos
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Todas las transacciones se realizan a través de procesadores de pago seguros integrados. Debido a la naturaleza digital de los productos (beats y licencias), <strong>todas las ventas son finales y no reembolsables</strong> una vez que el archivo ha sido descargado o el acceso ha sido concedido.
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    En caso de suscripciones PRO o PREMIUM, puedes cancelar tu renovación en cualquier momento desde el Studio, pero no se realizarán reembolsos prorrateados por periodos ya pagados.
                                </p>
                            </section>

                            <section id="termination" className="mb-12 scroll-mt-32">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">5</span>
                                    Terminación de Cuenta
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Tianguis Beats se reserva el derecho de suspender o cancelar tu cuenta de manera inmediata, sin previo aviso ni responsabilidad, por cualquier razón que consideremos una violación de estos Términos, incluyendo pero no limitado a infracciones de derechos de autor o comportamiento fraudulento.
                                </p>
                            </section>

                            <section id="legal" className="mb-12 scroll-mt-32">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">6</span>
                                    Jurisdicción y Ley Aplicable
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Estos términos se regirán de acuerdo con las leyes de México. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes en la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
