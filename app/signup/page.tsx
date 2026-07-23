"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, Check, AlertTriangle, Eye, EyeOff, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { NoiseOverlay, AbstractPuzzleBack } from '@/components/ui/BackgroundEffects';
import { motion } from 'framer-motion';

/**
 * Página de Registro: Formulario directo para crear cuenta.
 * Tema: Verde pistache / lime.
 */
export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [artisticName, setArtisticName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const dateInputRef = React.useRef<HTMLInputElement>(null);

    const [isCheckingName, setIsCheckingName] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [hasImmediateSession, setHasImmediateSession] = useState(false);

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
            setError(`Faltan datos obligatorios: ${missingFields.join(', ')}`);
            return;
        }

        if (isUsernameAvailable === false) {
            setError('Ese usuario ya está registrado, busca otro.');
            return;
        }

        setLoading(true);
        setError(null);

        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        if (age < 18) {
            setError('Debes ser mayor de 18 años para registrarte en Tianguis Beats.');
            setLoading(false);
            return;
        }

        try {
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
                setHasImmediateSession(true);
                setSuccess(true);
                return;
            }

            setSuccess(true);
        } catch (err: any) {
            console.error('DETALLES DEL ERROR:', err);
            let userMessage = `${err.message || 'Error inesperado al registrar.'}`;

            if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
                userMessage = 'Ese usuario o correo ya está registrado. Intenta iniciar sesión.';
            }

            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase 
            ? e.target.value.toLowerCase().replace(/\s/g, '')
            : '';
        if (/^[a-z0-9_]*$/.test(val)) {
            setUsername(val);
        }
    };

    /* Green pistache accent color: lime-500 / #84cc16 */
    const accentColor = "lime";
    const inputClass = "w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 outline-none focus:border-lime-500/50 focus:bg-lime-500/5 transition-all duration-500 font-bold text-foreground placeholder:text-foreground/20 dark:placeholder:text-white/20 text-sm";

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-lime-500 selection:text-white flex flex-col transition-colors duration-300 relative">
            <Navbar />

            {/* Premium Background System - Green Pistache Theme */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <AbstractPuzzleBack theme="green" opacity={0.6} />
                <NoiseOverlay />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
                {/* Green glow orbs */}
                <div className="absolute top-[5%] left-[5%] w-[45%] h-[45%] bg-lime-500/12 blur-[130px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[0%] w-[35%] h-[35%] bg-emerald-400/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[55%] right-[25%] w-[20%] h-[20%] bg-lime-400/8 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-xl w-full"
                >
                    {success ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-2xl md:rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden"
                        >
                            {/* Accent border top */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500/60 to-transparent" />
                            <div className="absolute -top-16 -right-16 w-32 h-32 bg-lime-500/15 blur-[50px] rounded-full pointer-events-none" />
                            
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                                className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8"
                            >
                                <Check className="text-emerald-500 w-10 h-10" strokeWidth={3} />
                            </motion.div>

                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3 leading-[0.85]">
                                <span className="text-foreground/50 dark:text-white/50">Bienvenido a la</span><br />
                                <span className="text-lime-500 relative inline-block">
                                    Familia.
                                    <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-lime-500/60 to-transparent rounded-full" />
                                </span>
                            </h2>
                            <p className="text-foreground/50 dark:text-white/50 text-[11px] font-black uppercase tracking-[0.2em] mb-10 leading-relaxed">
                                {hasImmediateSession ? (
                                    <>Tu cuenta ha sido creada exitosamente. Ya puedes empezar a explorar el <span className="text-foreground dark:text-white font-bold">Tianguis.</span></>
                                ) : (
                                    <>Hemos enviado un correo de confirmación a <span className="text-foreground dark:text-white font-bold">{email}</span>. Revisa tu bandeja para activar tu cuenta.</>
                                )}
                            </p>

                            <div className="flex flex-col gap-4">
                                <Link href="/" className="w-full py-5 bg-lime-500 hover:bg-lime-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-3 shadow-lg shadow-lime-500/25">
                                    Explorar Tianguis <ArrowRight size={16} />
                                </Link>

                                <Link href="/" className="text-foreground/30 dark:text-white/30 font-black uppercase tracking-[0.3em] text-[8px] hover:text-foreground dark:hover:text-white hover:scale-105 active:scale-95 transition-all">
                                    Ir a la Página de Inicio
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-center mb-8"
                            >
                                {/* Logo con rotación */}
                                <motion.div 
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: -6 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                                    className="inline-flex items-center justify-center w-20 h-20 mb-8"
                                >
                                    <Image
                                        src="/logo.png"
                                        alt="Tianguis Beats"
                                        width={64}
                                        height={64}
                                        priority
                                        className="w-16 h-16 object-contain drop-shadow-[0_0_30px_rgba(132,204,22,0.4)] transform -rotate-6 hover:rotate-0 hover:scale-110 transition-all duration-500"
                                    />
                                </motion.div>

                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-3 leading-[0.85]">
                                    <span className="text-foreground/50 dark:text-white/50">Crear</span>
                                    <br />
                                    <span className="text-lime-500 relative inline-block">
                                        Cuenta.
                                        <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-lime-500/60 to-transparent rounded-full" />
                                    </span>
                                </h1>
                                <p className="text-foreground/40 dark:text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-4">
                                    Crea tu identidad digital y domina el catálogo.
                                </p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.7, delay: 0.4 }}
                                className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-10 relative group overflow-hidden"
                            >
                                {/* Accent border top */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500/60 to-transparent" />
                                {/* Corner glows */}
                                <div className="absolute -top-16 -right-16 w-32 h-32 bg-lime-500/15 blur-[50px] rounded-full pointer-events-none" />
                                <div className="absolute -bottom-16 -left-16 w-24 h-24 bg-emerald-400/10 blur-[40px] rounded-full pointer-events-none" />
                                
                                <form onSubmit={handleSignup} className="space-y-5 relative z-10">
                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider rounded-xl text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-4 md:gap-5">
                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50 mb-2.5 ml-1">Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Nombres Apellidos"
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50 mb-2.5 ml-1">Username</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={handleUsernameChange}
                                                    placeholder="tu_username"
                                                    className={`${inputClass} pr-10 ${isUsernameAvailable === false ? '!border-red-500/40' : isUsernameAvailable === true ? '!border-emerald-500/40' : ''}`}
                                                    required
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {isCheckingName ? (
                                                        <Loader2 size={14} className="animate-spin text-foreground/25 dark:text-white/25" />
                                                    ) : isUsernameAvailable === true ? (
                                                        <Check size={14} className="text-emerald-500" />
                                                    ) : isUsernameAvailable === false ? (
                                                        <AlertTriangle size={14} className="text-red-500" />
                                                    ) : null}
                                                </div>
                                            </div>
                                            {isUsernameAvailable === false && (
                                                <p className="text-[7px] text-red-500 font-black uppercase mt-1.5 ml-1 animate-pulse tracking-widest">Ese usuario ya existe</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50 mb-2.5 ml-1">Nombre Artístico</label>
                                            <input
                                                type="text"
                                                value={artisticName}
                                                onChange={(e) => setArtisticName(e.target.value)}
                                                placeholder="Tu nombre de artista"
                                                className={inputClass}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50 mb-2.5 ml-1">Fecha de Nacimiento</label>
                                            <div 
                                                className="relative group/date cursor-pointer"
                                                onClick={() => {
                                                    if (dateInputRef.current) {
                                                        if ('showPicker' in HTMLInputElement.prototype) {
                                                            try {
                                                                dateInputRef.current.showPicker();
                                                            } catch (err) {
                                                                dateInputRef.current.click();
                                                            }
                                                        } else {
                                                            dateInputRef.current.click();
                                                        }
                                                    }
                                                }}
                                            >
                                                <input
                                                    ref={dateInputRef}
                                                    type="date"
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                    className={`${inputClass} !bg-transparent relative z-10 cursor-pointer text-foreground dark:text-white`}
                                                    required
                                                />
                                                {/* Background Layer */}
                                                <div className="absolute inset-0 bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl pointer-events-none group-focus-within/date:border-lime-500/50 group-focus-within/date:bg-lime-500/5 transition-all duration-500" />
                                                
                                                {/* Single Custom Icon (Native icons hidden via CSS) */}
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                                                    <Calendar size={16} className="text-foreground/30 dark:text-white/30 group-hover:text-lime-500 transition-colors" />
                                                </div>
                                                
                                                {/* Custom Placeholder (Only shows when no date is picked and input doesn't have focus) */}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50 mb-2.5 ml-1">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                            placeholder="tu@email.com"
                                            className={inputClass}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50 mb-2.5 ml-1">Contraseña</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className={`${inputClass} pr-12`}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/25 dark:text-white/25 hover:text-foreground dark:hover:text-white transition-all hover:scale-110 active:scale-90"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || isUsernameAvailable === false}
                                        className="w-full py-5 bg-lime-500 hover:bg-lime-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 mt-2 shadow-lg shadow-lime-500/25"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <>
                                                Crear Cuenta
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.3em] text-foreground/30 dark:text-white/30">
                                    ¿Ya tienes cuenta? <Link href="/login" className="text-lime-500 hover:text-lime-600 hover:scale-110 inline-block transition-all">Inicia sesión</Link>
                                </p>
                            </motion.div>
                        </>
                    )}
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
