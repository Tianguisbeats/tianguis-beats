"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Music, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            console.error('Error restableciendo contraseña:', err);
            setError(err.message || 'Error al actualizar la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background text-foreground font-sans flex flex-col transition-colors duration-300 selection:bg-blue-600 selection:text-white">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl transform rotate-3 shadow-xl shadow-blue-600/20 mb-6 group hover:scale-110 transition-transform">
                            <Lock className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                            Nueva <span className="text-blue-600">Contraseña</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Define tu nueva clave de acceso para Tianguis Beats.</p>
                    </div>

                    <div className="bg-white dark:bg-card border-2 border-slate-100 dark:border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                        {success ? (
                            <div className="text-center space-y-6 animate-in zoom-in duration-500">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                                        <CheckCircle2 className="text-green-500" size={56} />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">¡Actualizada!</h2>
                                <p className="text-slate-500 font-medium">Tu contraseña ha sido cambiada con éxito. Redirigiendo al inicio de sesión...</p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                >
                                    Ir al login ahora <ArrowRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl text-center">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nueva Contraseña</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-16 pr-12 py-4 outline-none focus:border-blue-600 transition-all font-bold text-foreground"
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

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Confirmar Contraseña</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-16 pr-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-foreground"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4 group"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            Cambiar Contraseña
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
