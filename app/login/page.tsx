"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, Lock, Mail, Check, Eye, EyeOff, Sparkles, ArrowLeft, Send } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { NoiseOverlay, AbstractPuzzleBack } from '@/components/ui/BackgroundEffects';
import { motion } from 'framer-motion';

type LoginMode = 'password' | 'magic-link' | 'forgot-password';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<LoginMode>('password');

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            let loginEmail = email.trim();

            if (mode === 'password') {
                const isEmail = loginEmail.includes('@');
                if (!isEmail) {
                    const { data, error: profileError } = await supabase
                        .from('perfiles')
                        .select('correo')
                        .ilike('nombre_usuario', loginEmail)
                        .maybeSingle();

                    if (profileError || !data?.correo) {
                        throw new Error('Usuario no encontrado');
                    }
                    loginEmail = data.correo;
                }

                const { error: authError } = await supabase.auth.signInWithPassword({
                    email: loginEmail,
                    password,
                });
                if (authError) throw authError;

                // Actualizar fecha de última sesión
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) {
                    await supabase
                        .from('perfiles')
                        .update({ fecha_ultima_sesion: new Date().toISOString() })
                        .eq('id', userData.user.id);
                }

                router.push('/');
            }
            else if (mode === 'magic-link') {
                let targetEmail = loginEmail;

                // Si no es un correo, buscarlo por nombre de usuario
                if (!targetEmail.includes('@')) {
                    const { data, error: profileError } = await supabase
                        .from('perfiles')
                        .select('correo')
                        .ilike('nombre_usuario', targetEmail)
                        .maybeSingle();

                    if (profileError || !data?.correo) {
                        throw new Error('No encontramos un usuario con ese nombre.');
                    }
                    targetEmail = data.correo;
                }

                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: targetEmail,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    }
                });
                if (otpError) throw otpError;
                setSuccessMessage('¡Enlace enviado! Revisa tu correo de registro para entrar sin contraseña.');
            }
            else if (mode === 'forgot-password') {
                let targetEmail = loginEmail;

                // Si no es un correo, buscarlo por nombre de usuario
                if (!targetEmail.includes('@')) {
                    const { data, error: profileError } = await supabase
                        .from('perfiles')
                        .select('correo')
                        .ilike('nombre_usuario', targetEmail)
                        .maybeSingle();

                    if (profileError || !data?.correo) {
                        throw new Error('No encontramos un usuario con ese nombre.');
                    }
                    targetEmail = data.correo;
                }

                const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                });
                if (resetError) throw resetError;
                setSuccessMessage('Instrucciones enviadas. Revisa tu correo de registro para cambiar tu contraseña.');
            }

        } catch (err: any) {
            console.error('Error de auth capturado:', err);

            let userMessage = 'Ocurrió un error. Verifica tus datos.';

            if (err.message?.includes('Invalid login credentials')) {
                userMessage = 'Datos incorrectos. Revisa tu correo/usuario y contraseña.';
            } else if (err.message?.includes('Email not confirmed')) {
                userMessage = 'Tu cuenta aún no ha sido confirmada. Revisa tu correo.';
            } else if (err.message?.includes('too many requests') || err.message?.includes('rate limit')) {
                userMessage = 'Demasiados intentos. Por seguridad, espera unos minutos.';
            } else if (err.message === 'Usuario no encontrado') {
                userMessage = 'No encontramos ninguna cuenta con esos datos.';
            } else {
                userMessage = err.message || 'Error inesperado. Inténtalo de nuevo.';
            }

            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300 relative">
            <Navbar />
            
            {/* Premium Background System - Blue Theme */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <AbstractPuzzleBack theme="blue" opacity={0.6} />
                <NoiseOverlay />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background pointer-events-none" />
                {/* Large blue glow orbs */}
                <div className="absolute top-[10%] right-[5%] w-[45%] h-[45%] bg-blue-500/15 blur-[130px] rounded-full animate-pulse" />
                <div className="absolute bottom-[5%] left-[0%] w-[35%] h-[35%] bg-blue-400/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[50%] left-[30%] w-[20%] h-[20%] bg-sky-400/8 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-xl w-full"
                >
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
                                className="w-16 h-16 object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.4)] transform -rotate-6 hover:rotate-0 hover:scale-110 transition-all duration-500"
                            />
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-3 leading-[0.85]">
                            <span className="text-foreground/50 dark:text-white/50">
                                {mode === 'forgot-password' ? 'Recuperar' : 'Iniciar'}
                            </span>
                            <br />
                            <span className="text-blue-500 relative inline-block">
                                {mode === 'forgot-password' ? 'Acceso.' : 'Sesión.'}
                                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500/60 to-transparent rounded-full" />
                            </span>
                        </h1>
                        <p className="text-foreground/40 dark:text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-4">
                            {mode === 'password' && 'Ingresa tus credenciales para continuar.'}
                            {mode === 'magic-link' && 'Entra rápido con un código único en tu email.'}
                            {mode === 'forgot-password' && 'Te enviaremos un enlace para cambiar tu contraseña.'}
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-12 relative group overflow-hidden"
                    >
                        {/* Accent border top */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
                        {/* Corner glows */}
                        <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-500/15 blur-[50px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-24 h-24 bg-blue-400/10 blur-[40px] rounded-full pointer-events-none" />

                        {(mode === 'magic-link' || mode === 'forgot-password') && (
                            <button
                                onClick={() => { setMode('password'); setError(null); setSuccessMessage(null); }}
                                className="absolute left-6 md:left-8 top-6 md:top-8 text-foreground/40 hover:text-blue-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors z-10"
                            >
                                <ArrowLeft size={14} /> Volver
                            </button>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5 pt-2 relative z-10">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {successMessage && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-2xl text-center"
                                >
                                    <div className="flex justify-center mb-2">
                                        <div className="bg-emerald-500 text-white rounded-full p-1">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    </div>
                                    {successMessage}
                                </motion.div>
                            )}

                            {!successMessage && (
                                <>
                                    <div>
                                        <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50 mb-3 ml-1">
                                            {mode === 'password' ? 'Email o Usuario' : 'Tu Correo Electrónico'}
                                        </label>
                                        <div className="relative group/input">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/25 dark:text-white/25 group-focus-within/input:text-blue-500 transition-colors duration-500">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                                placeholder={mode === 'password' ? "usuario o email@ejemplo.com" : "tu@email.com"}
                                                className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl pl-14 pr-6 py-4 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all duration-500 font-bold text-foreground placeholder:text-foreground/20 dark:placeholder:text-white/20 text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {mode === 'password' && (
                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/50 mb-3 ml-1">Contraseña</label>
                                            <div className="relative group/input">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/25 dark:text-white/25 group-focus-within/input:text-blue-500 transition-colors duration-500">
                                                    <Lock size={18} />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl pl-14 pr-12 py-4 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all duration-500 font-bold text-foreground placeholder:text-foreground/20 dark:placeholder:text-white/20 text-sm"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/25 dark:text-white/25 hover:text-foreground dark:hover:text-white transition-colors hover:scale-110 active:scale-90"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'password' && (
                                        <div className="flex items-center justify-between pt-1">
                                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-blue-500 border-blue-500 text-white' : 'border-foreground/15 dark:border-white/15 group-hover:border-blue-500/50 bg-black/5 dark:bg-white/5'}`}>
                                                    {rememberMe && <Check size={11} strokeWidth={4} />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                />
                                                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${rememberMe ? 'text-foreground dark:text-white' : 'text-foreground/40 dark:text-white/40 group-hover:text-foreground dark:group-hover:text-white'}`}>Recuérdame</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setMode('forgot-password')}
                                                className="text-blue-500 hover:scale-105 active:scale-95 text-[9px] font-black uppercase tracking-widest transition-all"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 mt-2 shadow-lg shadow-blue-500/25"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <>
                                                {mode === 'password' ? 'Entrar al Estudio' : mode === 'magic-link' ? 'Enviar Enlace Mágico' : 'Enviar Instrucciones'}
                                                {mode === 'password' ? <ArrowRight size={16} /> : <Send size={16} />}
                                            </>
                                        )}
                                    </button>

                                    {mode === 'password' && (
                                        <div className="pt-6 flex flex-col items-center gap-5">
                                            <div className="flex items-center gap-4 w-full opacity-20">
                                                <div className="h-px flex-1 bg-foreground dark:bg-white" />
                                                <span className="text-[7px] font-black text-foreground dark:text-white uppercase tracking-[0.5em]">Acceso Rápido</span>
                                                <div className="h-px flex-1 bg-foreground dark:bg-white" />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setMode('magic-link')}
                                                className="flex items-center gap-3 text-foreground/40 dark:text-white/40 hover:text-blue-500 hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase tracking-widest"
                                            >
                                                <Sparkles size={14} className="text-blue-500" />
                                                Iniciar sesión con enlace único
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </form>

                        <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30 dark:text-white/30 mt-10">
                            ¿No tienes cuenta? <Link href="/signup" className="text-blue-500 hover:text-blue-600 hover:scale-110 inline-block transition-all">Regístrate gratis</Link>
                        </p>
                    </motion.div>

                    <p className="text-center text-[8px] text-foreground/25 dark:text-white/25 font-black uppercase tracking-widest mt-10 max-w-sm mx-auto leading-relaxed">
                        Al entrar, aceptas nuestros <Link href="#" className="text-foreground/40 dark:text-white/40 hover:text-foreground dark:hover:text-white transition-colors">Términos</Link> y <Link href="#" className="text-foreground/40 dark:text-white/40 hover:text-foreground dark:hover:text-white transition-colors">Privacidad</Link>.
                    </p>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
