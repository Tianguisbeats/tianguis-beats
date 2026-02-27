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
                .from('perfiles')
                .select('nombre_usuario')
                .eq('nombre_usuario', username)
                .maybeSingle();

            setIsUsernameAvailable(!data);
            setIsCheckingName(false);
        };

        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [username]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        const missingFields = [];
        if (!fullName) missingFields.push('Nombre Completo');
        if (!username) missingFields.push('Username');
        if (!artisticName) missingFields.push('Nombre Artístico');
        if (!birthDate) missingFields.push('Fecha de Nacimiento');
        if (!email) missingFields.push('Email');
        if (!password) missingFields.push('Contraseña');

        if (missingFields.length > 0) {
            setError(`⚠️ Faltan datos obligatorios: ${missingFields.join(', ')}`);
            return;
        }

        if (isUsernameAvailable === false) {
            setError('⚠️ Ese usuario ya está registrado, busca otro.');
            return;
        }

        setLoading(true);
        setError(null);

        // Validar edad (mínimo 18 años)
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        if (age < 18) {
            setError('⚠️ Debes ser mayor de 18 años para registrarte en Tianguis Beats.');
            setLoading(false);
            return;
        }

        try {
            console.log('Intentando registro con:', { email, username, fullName, artisticName });

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    data: {
                        nombre_completo: fullName,
                        nombre_usuario: username,
                        nombre_artistico: artisticName,
                        fecha_nacimiento: birthDate
                    }
                }
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('No se recibió información del usuario tras el registro.');
            }

            if (authData.session) {
                window.location.href = '/studio';
                return;
            }

            setSuccess(true);
        } catch (err: any) {
            console.error('DETALLES DEL ERROR:', err);
            let userMessage = `⚠️ ${err.message || 'Error inesperado al registrar.'}`;

            if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
                userMessage = '⚠️ Ese usuario o correo ya está registrado. Intenta iniciar sesión.';
            }

            setError(userMessage);
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
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white flex flex-col transition-colors duration-300">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4">
                <div className="max-w-xl w-full">
                    {success ? (
                        <div className="card-modern bg-accent/5 p-12 text-center animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-accent/20">
                                <Music className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">¡Casi listo!</h2>
                            <p className="text-muted font-medium mb-8">Hemos enviado un correo de confirmación a <span className="font-bold text-accent">{email}</span>. Revisa tu bandeja de entrada para verificar tu cuenta.</p>
                            <Link href="/login" className="inline-flex items-center gap-2 text-accent font-black uppercase tracking-widest text-xs hover:underline">
                                Ir al Inicio de Sesión <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl transform rotate-3 shadow-xl shadow-accent/20 mb-6">
                                    <Music className="text-white w-8 h-8" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2 text-foreground text-center">
                                    Bienvenido al <span className="text-accent">Estudio</span>
                                </h1>
                                <p className="text-muted font-medium">
                                    Crea tu cuenta y descubre el mejor catálogo de beats.
                                </p>
                            </div>

                            <div className="card-modern p-8 md:p-10">
                                <form onSubmit={handleSignup} className="space-y-5">
                                    {error && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl text-center animate-in fade-in slide-in-from-top-2 duration-300">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2 ml-1">Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Nombres Apellidos"
                                                className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 outline-none focus:border-accent transition-all font-bold text-foreground placeholder:text-muted/50"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2 ml-1">Username</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={handleUsernameChange}
                                                    placeholder="tu_username"
                                                    className={`w-full bg-background border rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-foreground placeholder:text-muted/50 ${isUsernameAvailable === false ? 'border-error/40' : isUsernameAvailable === true ? 'border-success/40' : 'border-border focus:border-accent'}`}
                                                    required
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {isCheckingName ? (
                                                        <Loader2 size={16} className="animate-spin text-muted" />
                                                    ) : isUsernameAvailable === true ? (
                                                        <Check size={16} className="text-success" />
                                                    ) : isUsernameAvailable === false ? (
                                                        <AlertTriangle size={16} className="text-error" />
                                                    ) : null}
                                                </div>
                                            </div>
                                            {isUsernameAvailable === false && (
                                                <p className="text-[9px] text-error font-black uppercase mt-1.5 ml-1 animate-pulse">Ese usuario ya está registrado, busca otro</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2 ml-1">Nombre Artístico</label>
                                            <input
                                                type="text"
                                                value={artisticName}
                                                onChange={(e) => setArtisticName(e.target.value)}
                                                placeholder="Tu nombre de artista"
                                                className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 outline-none focus:border-accent transition-all font-bold text-foreground placeholder:text-muted/50"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2 ml-1">Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                value={birthDate}
                                                onChange={(e) => setBirthDate(e.target.value)}
                                                className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 outline-none focus:border-accent transition-all font-bold text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2 ml-1">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@email.com"
                                            className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 outline-none focus:border-accent transition-all font-bold text-foreground placeholder:text-muted/50"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2 ml-1">Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 outline-none focus:border-accent transition-all font-bold text-foreground placeholder:text-muted/50 pr-12"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || isUsernameAvailable === false}
                                        className="w-full py-4 rounded-2xl gap-3 mt-2 group text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center bg-accent text-white shadow-xl shadow-accent/20 hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

                                <p className="mt-6 text-center text-[11px] font-black uppercase tracking-widest text-muted">
                                    ¿Ya tienes cuenta? <Link href="/login" className="text-accent underline hover:opacity-80 transition-opacity">Inicia sesión</Link>
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
