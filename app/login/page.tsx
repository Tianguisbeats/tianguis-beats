"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Music, ArrowRight, Loader2, Lock, Mail, Check, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let loginEmail = email.trim();
            const isEmail = loginEmail.includes('@');

            if (!isEmail) {
                // If it's a username, look up the email
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('email')
                    .ilike('username', loginEmail)
                    .maybeSingle();

                if (profileError || !data?.email) {
                    throw new Error('Usuario no encontrado');
                }
                loginEmail = data.email;
            }

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            });

            if (authError) throw authError;

            // Session persistence is handled by Supabase client configuration
            // which defaults to local storage (persisting across restarts).
            // If rememberMe is false, we could theoretically sign out on window close,
            // but for standard web apps, just staying logged in is the default expected behavior.

            router.push('/beats');
        } catch (err: any) {
            setError(err.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4">
                <div className="max-w-xl w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl transform -rotate-3 shadow-xl shadow-blue-600/20 mb-6">
                            <Music className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2 text-slate-900">
                            Bienvenido al <span className="text-blue-600">Estudio</span>
                        </h1>
                    </div>

                    <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Email o Usuario</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="usuario o email@ejemplo.com"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                            </div>

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
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-12 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
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

                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group select-none">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400 bg-slate-50'}`}>
                                        {rememberMe && <Check size={12} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${rememberMe ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Recordarme</span>
                                </label>
                                <button type="button" className="text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4 group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        Iniciar Sesión
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mt-8">
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
