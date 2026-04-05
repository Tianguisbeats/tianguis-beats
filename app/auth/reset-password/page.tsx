"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Music, CheckCircle2, ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { NoiseOverlay, AbstractPuzzleBack } from '@/components/ui/BackgroundEffects';

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

            // Forzar cierre de sesión para que el usuario tenga que usar la nueva clave sí o sí
            await supabase.auth.signOut();

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 1000); // 1s es suficiente para una experiencia rápida
        } catch (err: any) {
            console.error('Error restableciendo contraseña:', err);
            
            let userFriendlyError = 'Error al actualizar la contraseña.';
            
            if (err.message?.includes('Auth session missing')) {
                userFriendlyError = 'Tu enlace de recuperación ha expirado o ya fue utilizado. Por seguridad, solicita uno nuevo desde el login.';
            } else if (err.message?.includes('New password should be different')) {
                userFriendlyError = 'La nueva contraseña debe ser distinta a la anterior.';
            } else {
                userFriendlyError = err.message || userFriendlyError;
            }

            setError(userFriendlyError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300 relative overflow-hidden">
            <Navbar />

            {/* Premium Background System */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <AbstractPuzzleBack theme="blue" opacity={0.6} />
                <NoiseOverlay />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
                <div className="absolute top-[20%] left-[5%] w-[40%] h-[40%] bg-blue-600/10 blur-[130px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[5%] w-[35%] h-[35%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-xl w-full"
                >
                    <div className="text-center mb-10">
                        <motion.div 
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: -6 }}
                            className="inline-flex items-center justify-center w-20 h-20 mb-8"
                        >
                            <img 
                                src="/logo.png" 
                                alt="Tianguis Beats" 
                                className="w-16 h-16 object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]" 
                            />
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-4 leading-none">
                            Nueva <br />
                            <span className="text-blue-500">Contraseña.</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Estás a un paso de recuperar el control</p>
                    </div>

                    <div className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-[2.5rem] p-6 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                        <AnimatePresence mode="wait">
                            {success ? (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-30" />
                                        <CheckCircle2 className="text-emerald-500" size={56} />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-emerald-500">¡ACTUALIZADA!</h2>
                                    <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest leading-relaxed mb-10">
                                        Tu contraseña ha sido cambiada con éxito. Redirigiendo al login...
                                    </p>
                                    <button
                                        onClick={() => router.push('/login')}
                                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                                    >
                                        Ir al login ahora <ArrowRight size={18} />
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleReset} className="space-y-6">
                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl text-center"
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <ShieldAlert size={14} />
                                                {error}
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-3 ml-1">Nueva Contraseña</label>
                                            <div className="relative group/input">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within/input:text-blue-500 transition-colors">
                                                    <Lock size={18} />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-14 pr-12 py-5 outline-none focus:border-blue-500/50 transition-all font-bold text-foreground"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-3 ml-1">Confirmar Contraseña</label>
                                            <div className="relative group/input">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within/input:text-blue-500 transition-colors">
                                                    <Lock size={18} />
                                                </div>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-14 pr-6 py-5 outline-none focus:border-blue-500/50 transition-all font-bold text-foreground"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 group"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                Cambiar Contraseña
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
