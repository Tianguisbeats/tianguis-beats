"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIChatBot from '@/components/AIChatBot';
import { BrainCircuit, Sparkles, TestTube2, MessageSquare } from 'lucide-react';

export default function AITestPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-500/20">
                                <TestTube2 size={40} />
                            </div>

                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-6">
                                Sandbox: <span className="text-blue-600">Tianguis AI</span>
                            </h1>

                            <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto mb-12">
                                Esta es una página de prueba aislada para el ChatBot. Aquí puedes verificar si la conexión con Gemini y la lógica de búsqueda funcionan correctamente.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 text-left">
                                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4 text-blue-600">
                                        <BrainCircuit size={24} />
                                        <h3 className="font-black text-sm uppercase tracking-widest">Inteligencia</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        El bot utiliza el modelo <strong>Gemini 1.5 Flash</strong> para procesar lenguaje natural y entender el contexto musical de la plataforma.
                                    </p>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4 text-purple-600">
                                        <MessageSquare size={24} />
                                        <h3 className="font-black text-sm uppercase tracking-widest">Pruebas Sugeridas</h3>
                                    </div>
                                    <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                                        <li>"Búscame algo de Trap"</li>
                                        <li>"¿Cómo subo un beat?"</li>
                                        <li>"¿Quién eres?"</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 flex flex-col items-center gap-6 animate-pulse">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Interactúa con la burbuja azul abajo a la derecha</p>
                        <div className="w-[1px] h-12 bg-gradient-to-b from-slate-200 to-transparent"></div>
                    </div>
                </div>
            </main>

            {/* Componente del ChatBot */}
            <AIChatBot />

            <Footer />
        </div>
    );
}
