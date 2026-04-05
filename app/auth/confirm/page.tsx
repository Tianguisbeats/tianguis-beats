"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Music, ArrowRight, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { NoiseOverlay, AbstractPuzzleBack } from '@/components/ui/BackgroundEffects';
import Link from 'next/link';

/**
 * Página de Confirmación de Auth: Maneja el redireccionamiento tras verificar el correo.
 * Rediseño Premium con estética Tianguis Beats.
 */
export default function AuthConfirmPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setStatus('success');
            } else {
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    setStatus('loading');
                } else if (window.location.search.includes('error=')) {
                    setStatus('error');
                } else {
                    setStatus('success');
                }
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setStatus('success');
            } else if (event === 'USER_UPDATED') {
                setStatus('success');
            }
        });

        const fallbackTimer = setTimeout(() => {
            if (status === 'loading') setStatus('success');
        }, 4000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(fallbackTimer);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300 relative overflow-hidden">
            <Navbar />
            
            {/* Premium Background System */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <AbstractPuzzleBack theme="blue" opacity={0.6} />
                <NoiseOverlay />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
                <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[130px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-sky-500/5 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 px-4 relative z-10">
                <AnimatePresence mode="wait">
                    {status === 'loading' && (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="max-w-md w-full text-center"
                        >
                            <div className="relative inline-block mb-8">
                                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse" />
                                <div className="w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center justify-center relative z-10 rotate-3">
                                    <Loader2 className="text-blue-500 animate-spin" size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">
                                Verificando <span className="text-blue-500">Acceso.</span>
                            </h1>
                            <div className="flex justify-center items-center gap-3">
                                <div className="h-px w-8 bg-blue-500/30" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Sincronizando con el servidor</p>
                                <div className="h-px w-8 bg-blue-500/30" />
                            </div>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-xl w-full"
                        >
                            <div className="bg-white/70 dark:bg-white/[0.04] backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
                                {/* Accent gradient line */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                                
                                <div className="text-center relative z-10">
                                    <motion.div 
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", damping: 10, delay: 0.2 }}
                                        className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-10 relative"
                                    >
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-30" />
                                        <CheckCircle2 className="text-emerald-500" size={56} strokeWidth={2.5} />
                                    </motion.div>

                                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
                                        ¡ENLACE <span className="text-emerald-500 block">VALIDADO!</span>
                                    </h1>

                                    <div className="flex items-center justify-center gap-3 mb-10">
                                        <ShieldCheck size={18} className="text-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/40">Conexión de alta seguridad establecida</span>
                                    </div>

                                    <p className="text-sm font-medium text-foreground/60 max-w-sm mx-auto mb-12 leading-relaxed">
                                        Tu identidad ha sido confirmada con éxito. Ya puedes acceder a todas las funciones de Tianguis Beats.
                                    </p>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => router.push('/studio/beats')}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-3 group transition-all duration-500"
                                    >
                                        Ir a mi Estudio <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div 
                            key="error"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-md w-full"
                        >
                            <div className="bg-red-500/5 backdrop-blur-2xl border border-red-500/20 rounded-[3rem] p-12 text-center">
                                <XCircle className="text-red-500 mx-auto mb-8" size={64} strokeWidth={1} />
                                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-red-500">Error de Enlace</h1>
                                <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest leading-relaxed mb-10">
                                    El enlace ha expirado o ya fue utilizado por razones de seguridad.
                                </p>
                                <Link 
                                    href="/login"
                                    className="block w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 py-5 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                                >
                                    Volver al Login
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
}
