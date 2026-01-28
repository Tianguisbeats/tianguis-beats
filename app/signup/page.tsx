"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, ArrowRight, User, AudioLines, Loader2, Check, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

/**
 * Página de Registro: Permite crear cuentas de Productor o Artista.
 * Incluye campos para Nombre Artístico (único) y Edad.
 */
export default function SignupPage() {
    const [role, setRole] = useState<'producer' | 'artist' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [artisticName, setArtisticName] = useState('');
    const [birthDate, setBirthDate] = useState('');

    // Artistic name availability
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);

    // Debounce for artistic name check
    useEffect(() => {
        if (!artisticName) {
            setIsNameAvailable(null);
            return;
        }

        const checkName = async () => {
            setIsCheckingName(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('artistic_name')
                .eq('artistic_name', artisticName)
                .maybeSingle();

            setIsNameAvailable(!data);
            setIsCheckingName(false);
        };

        const timer = setTimeout(checkName, 500);
        return () => clearTimeout(timer);
    }, [artisticName]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isNameAvailable === false) {
            setError('Ese nombre artístico ya está en uso. Elige otro.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // Redirigir a la nueva página de confirmación
                    emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    data: {
                        full_name: fullName,
                        artistic_name: artisticName,
                        birth_date: birthDate,
                        role: role,
                    }
                }
            });

            if (authError) throw authError;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Error al crear cuenta');
        } finally {
            setLoading(false);
        }
    };

    const fillProofUser = () => {
        setFullName('Mauricio Garces');
        setArtisticName('SonDeMaik');
        setBirthDate('1995-01-01');
        setEmail('sdmsquad@hotmail.com');
        setPassword('Escuadron1');
        setRole('producer');
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
                <div className="max-w-2xl w-full">
                    {success ? (
                        <div className="text-center bg-blue-50 p-12 rounded-[3.5rem] border-2 border-blue-100 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-600/20">
                                <Music className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">¡Casi listo!</h2>
                            <p className="text-slate-600 font-medium mb-8">Hemos enviado un correo de confirmación a <span className="font-bold text-blue-600">{email}</span>. Revisa tu bandeja de entrada para verificar tu cuenta.</p>
                            <Link href="/login" className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs hover:underline">
                                Ir al Inicio de Sesión <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl transform rotate-3 shadow-xl shadow-blue-600/20 mb-6">
                                    <Music className="text-white w-8 h-8" />
                                </div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase mb-3 text-slate-900">
                                    Únete al <span className="text-blue-600">Tianguis</span>
                                </h1>
                                <p className="text-slate-500 font-medium whitespace-pre-line">
                                    La plataforma ideal para hacer match entre productores y artistas.{"\n"}
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
                                        Sube tus beats, gestiona licencias y empieza a vender a artistas de todo el Mundo.
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
                                        : 'bg-slate-50 border-slate-100 hover:border-blue-400'
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
                                    <form onSubmit={handleSignup} className="space-y-6">
                                        {error && (
                                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                                                {error}
                                            </div>
                                        )}

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="Nombres Apellidos"
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nombre Artístico</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={artisticName}
                                                        onChange={(e) => setArtisticName(e.target.value)}
                                                        placeholder="SonDeMaik"
                                                        className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 ${isNameAvailable === false ? 'border-red-400' : isNameAvailable === true ? 'border-green-400' : 'border-slate-100 focus:border-blue-600'}`}
                                                        required
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        {isCheckingName ? (
                                                            <Loader2 size={16} className="animate-spin text-slate-400" />
                                                        ) : isNameAvailable === true ? (
                                                            <Check size={16} className="text-green-500" />
                                                        ) : isNameAvailable === false ? (
                                                            <AlertTriangle size={16} className="text-red-500" />
                                                        ) : null}
                                                    </div>
                                                </div>
                                                {isNameAvailable === false && (
                                                    <p className="text-[9px] text-red-500 font-bold uppercase mt-2 ml-1">Este nombre ya está en el juego. Elige otro.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Fecha de Nacimiento</label>
                                                <input
                                                    type="date"
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
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
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || isNameAvailable === false}
                                            className={`w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg flex items-center justify-center gap-3 group disabled:opacity-50 ${role === 'producer' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-slate-900 hover:bg-black shadow-slate-900/20'
                                                }`}
                                        >
                                            {loading ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : (
                                                <>
                                                    Fichar como {role === 'producer' ? 'Productor' : 'Artista'}
                                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <p className="mt-8 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                                ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
                            </p>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
