"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Music, ArrowRight, Github, Chrome, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Simple redirect (could be more complex depending on role)
            router.push('/beats');
        } catch (err: any) {
            setError(err.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    const fillProofUser = () => {
        setEmail('prueba@tianguisbeats.com');
        setPassword('prueba123');
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl transform rotate-3 shadow-xl shadow-blue-600/20 mb-6">
                            <Music className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-3">
                            Bienvenido de <span className="text-blue-600">Vuelta</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Entra a tu tianguis digital y rompe la escena.</p>

                        <button
                            onClick={fillProofUser}
                            className="mt-6 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors"
                        >
                            ⚡ Usar cuenta de prueba
                        </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Contraseña</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        Entrar al Tianguis
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="mt-8 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                        ¿No tienes cuenta? <Link href="/signup" className="text-blue-600 hover:underline">Regístrate gratis</Link>
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
