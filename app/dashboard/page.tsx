"use client";

import React, { useState } from 'react';
import {
    Upload,
    Music,
    FileAudio,
    Layers,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ProducerDashboard() {
    const [isUploading, setIsUploading] = useState(false);
    const [activeStep, setActiveStep] = useState(1);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Panel del <span className="text-blue-600">Productor</span></h1>
                            <p className="text-slate-500 font-medium tracking-tight">Gestiona tus beats y sube material nuevo.</p>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
                                U
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Plan Actual</p>
                                <p className="text-sm font-black text-blue-600 uppercase">Premium</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Sidebar Stats / Actions */}
                        <div className="space-y-6">
                            <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-600/20">
                                <h3 className="font-black uppercase tracking-widest text-[10px] mb-6 text-blue-100 opacity-80">Estadísticas</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-4xl font-black tracking-tighter">12</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mt-1">Beats Activos</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black tracking-tighter">$4,250</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mt-1">Ventas (MXN)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <h3 className="font-black uppercase tracking-tight text-sm mb-4">Límites del Plan</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                            <span>Almacenamiento</span>
                                            <span className="text-blue-600">Ilimitado</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 w-[20%]"></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 italic">Estás en el plan más completo. ¡Sigue rompiendo!</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Upload Area */}
                        <div className="lg:col-span-2">
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center hover:border-blue-600 transition-all group flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <Upload className="text-blue-600" size={40} />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900 text-center mx-auto">Súbele al <span className="text-blue-600">Tianguis</span></h2>
                                <p className="text-slate-500 font-medium mb-12 max-w-sm text-center mx-auto">Arrastra tus archivos aquí o haz clic para seleccionar (MP3, WAV o Stems).</p>

                                <div className="grid grid-cols-3 gap-4 w-full max-w-md mx-auto">
                                    <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <FileAudio size={20} className="text-slate-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">MP3</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <Music size={20} className="text-slate-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">WAV</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                        <Layers size={20} className="text-blue-600" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Stems</span>
                                    </div>
                                </div>

                                <button className="mt-12 bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 transform active:scale-95">
                                    Seleccionar Archivos
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
