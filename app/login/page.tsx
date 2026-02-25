"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Music, ArrowRight, Loader2, Lock, Mail, Check, Eye, EyeOff, Key, Sparkles, ArrowLeft, Send } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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

            // Si el modo es contraseña, permitimos nombre de usuario
            if (mode === 'password') {
                const isEmail = loginEmail.includes('@');
                if (!isEmail) {
                    const { data, error: profileError } = await supabase
                        .from('perfiles')
                        .select('email')
                        .ilike('nombre_usuario', loginEmail)
                        .maybeSingle();

                    if (profileError || !data?.email) {
                        throw new Error('Usuario no encontrado');
                    }
                    loginEmail = data.email;
                }

                const { error: authError } = await supabase.auth.signInWithPassword({
                    email: loginEmail,
                    password,
                });
                if (authError) throw authError;
                router.push('/beats');
            }
            // Modo Magic Link
            else if (mode === 'magic-link') {
                // Verificar si el correo existe antes de enviar
                const { data: profile } = await supabase
                    .from('perfiles')
                    .select('id')
                    .eq('email', loginEmail)
                    .maybeSingle();

                if (!profile) {
                    throw new Error('Este correo no está registrado en Tianguis Beats.');
                }

                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: loginEmail,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    }
                });
                if (otpError) throw otpError;
                setSuccessMessage('¡Enlace enviado! Revisa tu correo para entrar sin contraseña.');
            }
            // Modo Olvidé Contraseña
            else if (mode === 'forgot-password') {
                // Verificar si el correo existe antes de enviar
                const { data: profile } = await supabase
                    .from('perfiles')
                    .select('id')
                    .eq('email', loginEmail)
                    .maybeSingle();

                if (!profile) {
                    throw new Error('Este correo no está registrado en Tianguis Beats.');
                }

                const { error: resetError } = await supabase.auth.resetPasswordForEmail(loginEmail, {
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                });
                if (resetError) throw resetError;
                setSuccessMessage('Instrucciones enviadas. Revisa tu correo para cambiar tu contraseña.');
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
        <div className="min-h-screen bg-slate-50 dark:bg-background text-foreground font-sans flex flex-col transition-colors duration-300">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4 relative overflow-hidden">
                {/* Fondo decorativo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <div className="max-w-xl w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl transform rotate-3 shadow-xl shadow-blue-600/20 mb-6 group hover:rotate-6 transition-transform">
                            <Music className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2 text-foreground">
                            {mode === 'forgot-password' ? 'Recuperar ' : 'Bienvenido al '}
                            <span className="text-blue-600">{mode === 'forgot-password' ? 'Acceso' : 'Estudio'}</span>
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {mode === 'password' && 'Ingresa tus credenciales para continuar.'}
                            {mode === 'magic-link' && 'Entra rápido con un código único en tu email.'}
                            {mode === 'forgot-password' && 'Te enviaremos un enlace para cambiar tu contraseña.'}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-card border-2 border-slate-100 dark:border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative">

                        {(mode === 'magic-link' || mode === 'forgot-password') && (
                            <button
                                onClick={() => { setMode('password'); setError(null); setSuccessMessage(null); }}
                                className="absolute left-8 top-8 text-slate-400 hover:text-blue-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                <ArrowLeft size={14} /> Volver
                            </button>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6 pt-4">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl text-center animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-6 bg-green-50 border border-green-100 text-green-700 text-sm font-bold rounded-[2rem] text-center animate-in zoom-in">
                                    <div className="flex justify-center mb-2">
                                        <div className="bg-green-500 text-white rounded-full p-1">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    </div>
                                    {successMessage}
                                </div>
                            )}

                            {!successMessage && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">
                                            {mode === 'password' ? 'Email o Usuario' : 'Tu Correo Electrónico'}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={mode === 'password' ? "usuario o email@ejemplo.com" : "tu@email.com"}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-16 pr-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-foreground placeholder:text-muted/50"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {mode === 'password' && (
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Contraseña</label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                    <Lock size={20} />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-16 pr-12 py-4 outline-none focus:border-blue-600 transition-all font-bold text-foreground placeholder:text-muted/50"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'password' && (
                                        <div className="flex items-center justify-between pt-2">
                                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-200 dark:border-white/10 group-hover:border-blue-400 bg-slate-50 dark:bg-slate-900'}`}>
                                                    {rememberMe && <Check size={12} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                />
                                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${rememberMe ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Recordarme</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setMode('forgot-password')}
                                                className="text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest transition-colors"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4 group"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <>
                                                {mode === 'password' ? 'Iniciar Sesión' : mode === 'magic-link' ? 'Enviar Enlace Mágico' : 'Enviar Instrucciones'}
                                                {mode === 'password' ? <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /> : <Send size={18} className="group-hover:scale-110 transition-transform" />}
                                            </>
                                        )}
                                    </button>

                                    {mode === 'password' && (
                                        <div className="pt-6 flex flex-col items-center gap-4">
                                            <div className="flex items-center gap-4 w-full">
                                                <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">O entra con</span>
                                                <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setMode('magic-link')}
                                                className="flex items-center gap-3 text-slate-500 hover:text-blue-600 transition-colors text-xs font-bold"
                                            >
                                                <Sparkles size={16} className="text-amber-500" />
                                                Iniciar sesión con enlace único
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </form>

                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300 mt-10">
                            ¿No tienes cuenta? <Link href="/signup" className="text-blue-600 hover:underline">Regístrate gratis</Link>
                        </p>
                    </div>

                    <p className="text-center text-[10px] text-slate-400 font-medium mt-12 max-w-sm mx-auto leading-relaxed">
                        Al iniciar sesión, aceptas nuestros <Link href="#" className="text-slate-600 hover:text-blue-600 underline">Términos de Servicio</Link> y <Link href="#" className="text-slate-600 hover:text-blue-600 underline">Política de Privacidad</Link>.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
