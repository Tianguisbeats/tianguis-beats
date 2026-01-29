"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, ArrowRight, Loader2, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

/**
 * Página de Registro: Formulario directo para crear cuenta.
 * Todos los usuarios tienen el mismo tipo de cuenta.
 */
export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [artisticName, setArtisticName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Username availability
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

    // Debounce for username check
    useEffect(() => {
        if (!username) {
            setIsUsernameAvailable(null);
            return;
        }

        const checkUsername = async () => {
            setIsCheckingName(true);
            const { data } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            setIsUsernameAvailable(!data);
            setIsCheckingName(false);
        };

        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [username]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isUsernameAvailable === false) {
            setError('Ese nombre de usuario ya está en uso. Elige otro.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Iniciando registro para:', email, username);

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    data: {
                        full_name: fullName,
                        username: username,
                        artistic_name: artisticName,
                        birth_date: birthDate,
                        role: 'artist'
                    }
                }
            });

            if (authError) {
                console.error('Error de Supabase Auth:', authError);
                throw authError;
            }

            if (!authData.user) {
                throw new Error('No se pudo crear el usuario en el sistema de autenticación.');
            }

            console.log('Usuario creado exitosamente:', authData.user.id);
            setSuccess(true);
        } catch (err: any) {
            console.error('Error capturado en Signup:', err);
            setError(err.message || 'Error al crear cuenta. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase().replace(/\s/g, '');
        if (/^[a-z0-9_]*$/.test(val)) {
            setUsername(val);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4">
                <div className="max-w-xl w-full">
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
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl transform rotate-3 shadow-xl shadow-blue-600/20 mb-6">
                                    <Music className="text-white w-8 h-8" />
                                </div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase mb-3 text-slate-900">
                                    Únete al <span className="text-blue-600">Tianguis</span>
                                </h1>
                                <p className="text-slate-500 font-medium">
                                    Crea tu cuenta y descubre el mejor catálogo de beats.
                                </p>
                            </div>

                            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                                <form onSubmit={handleSignup} className="space-y-5">
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Nombres Apellidos"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Username</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={handleUsernameChange}
                                                    placeholder="tu_username"
                                                    className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 ${isUsernameAvailable === false ? 'border-red-400' : isUsernameAvailable === true ? 'border-green-400' : 'border-slate-100 focus:border-blue-600'}`}
                                                    required
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {isCheckingName ? (
                                                        <Loader2 size={16} className="animate-spin text-slate-400" />
                                                    ) : isUsernameAvailable === true ? (
                                                        <Check size={16} className="text-green-500" />
                                                    ) : isUsernameAvailable === false ? (
                                                        <AlertTriangle size={16} className="text-red-500" />
                                                    ) : null}
                                                </div>
                                            </div>
                                            {isUsernameAvailable === false && (
                                                <p className="text-[9px] text-red-500 font-bold uppercase mt-1.5 ml-1">Usuario no disponible</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nombre Artístico</label>
                                            <input
                                                type="text"
                                                value={artisticName}
                                                onChange={(e) => setArtisticName(e.target.value)}
                                                placeholder="Tu nombre de artista"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                value={birthDate}
                                                onChange={(e) => setBirthDate(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@email.com"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300 pr-12"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || isUsernameAvailable === false}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 group disabled:opacity-50 mt-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <>
                                                Crear Cuenta
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
