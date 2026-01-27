"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Music, ArrowRight, User, AudioLines } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SignupPage() {
    const [role, setRole] = useState<'producer' | 'artist' | null>(null);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
                <div className="max-w-2xl w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl transform rotate-3 shadow-xl shadow-blue-600/20 mb-6">
                            <Music className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-3">
                            Únete al <span className="text-blue-600">Tianguis</span>
                        </h1>
                        <p className="text-slate-500 font-medium whitespace-pre-line">
                            La plataforma ideal para productores y artistas mexas.{"\n"}
                            Selecciona tu perfil para comenzar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        {/* Productor Card */}
                        <button
                            onClick={() => setRole('producer')}
                            className={`p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col h-full group ${role === 'producer'
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-600/20'
                                    : 'bg-slate-50 border-slate-100 hover:border-blue-400'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${role === 'producer' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
                                }`}>
                                <AudioLines size={28} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Productor</h3>
                            <p className={`text-sm font-medium mb-6 flex-1 ${role === 'producer' ? 'text-blue-100' : 'text-slate-500'}`}>
                                Sube tus beats, gestiona licencias y empieza a vender a artistas de todo el país.
                            </p>
                            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${role === 'producer' ? 'text-white' : 'text-blue-600'
                                }`}>
                                Seleccionar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>

                        {/* Artista Card */}
                        <button
                            onClick={() => setRole('artist')}
                            className={`p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col h-full group ${role === 'artist'
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20'
                                    : 'bg-slate-50 border-slate-100 hover:border-slate-900/30'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${role === 'artist' ? 'bg-white/20' : 'bg-slate-200 text-slate-900'
                                }`}>
                                <User size={28} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Artista</h3>
                            <p className={`text-sm font-medium mb-6 flex-1 ${role === 'artist' ? 'text-slate-300' : 'text-slate-500'}`}>
                                Encuentra el sonido perfecto para tu próximo éxito y conecta con los mejores productores.
                            </p>
                            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${role === 'artist' ? 'text-white' : 'text-slate-900'
                                }`}>
                                Seleccionar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </div>

                    {role && (
                        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            placeholder="Juan Perez"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Email</label>
                                        <input
                                            type="email"
                                            placeholder="tu@email.com"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Contraseña</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={`w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg flex items-center justify-center gap-3 group ${role === 'producer' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-slate-900 hover:bg-black shadow-slate-900/20'
                                        }`}
                                >
                                    Crear cuenta de {role === 'producer' ? 'Productor' : 'Artista'}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        </div>
                    )}

                    <p className="mt-8 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                        ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
