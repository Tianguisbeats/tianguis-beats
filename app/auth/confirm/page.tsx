"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Music, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Página de Confirmación de Auth: Maneja el redireccionamiento tras verificar el correo.
 * Evita el error 404 y da una bienvenida profesional al usuario.
 */
export default function AuthConfirmPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const checkSession = async () => {
            // Verificar si hay sesión activa inmediatamente
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setStatus('success');
            } else {
                // Verificar si hay tokens en la URL que deban procesarse (flujo Implicit)
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    // Esperar a que Supabase procese el hash
                    setStatus('loading');
                } else if (window.location.search.includes('error=')) {
                    setStatus('error');
                } else {
                    // Si llegamos sin sesión y sin hashes, quizá ya verificó y abrió en otro navegador
                    // Permitimos el estado successful asumiendo que el Link fue válido
                    // y el usuario tendrá que Iniciar Sesión de todas formas.
                    setStatus('success');
                }
            }
        };

        checkSession();

        // Escuchar cambios de auth (por si el hash de la URL tarda en procesarse)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setStatus('success');
            } else if (event === 'USER_UPDATED') {
                setStatus('success');
            }
        });

        // Timeout por precaución (si no cambia nada en 4s, pasar a success con mensaje "Ya puedes hacer login")
        const fallbackTimer = setTimeout(() => {
            if (status === 'loading') setStatus('success');
        }, 4000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(fallbackTimer);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-white font-sans flex flex-col transition-colors duration-300 selection:bg-blue-600 selection:text-white">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-24 pb-20 relative overflow-hidden">
                {/* Elementos decorativos de fondo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

                <div className="max-w-md w-full px-4 text-center">

                    {status === 'loading' && (
                        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-6">
                            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/20 rotate-3 animate-pulse">
                                <Music className="text-white" size={32} />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase">Verificando <span className="text-blue-600">Seguridad</span></h1>
                            <p className="text-slate-500 font-medium text-sm">Validando el enlace de tu correo electrónico. Por favor, espera un momento...</p>
                            <div className="flex justify-center pt-4">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-700">
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                                    <CheckCircle2 className="text-green-500" size={56} strokeWidth={2.5} />
                                </div>
                            </div>

                            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                                ¡Correo <span className="text-green-500 block">Verificado!</span>
                            </h1>

                            <div className="space-y-4">
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    Tu cuenta ha sido confirmada exitosamente en Tianguis Beats.
                                </p>
                                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl mx-auto w-max">
                                    <ShieldCheck size={16} className="text-blue-600" />
                                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">Cuenta Protegida</span>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group"
                                >
                                    Iniciar Sesión
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Ya puedes ingresar a tu estudio
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-white dark:bg-card border border-red-200 dark:border-red-900/30 rounded-[3rem] p-10 shadow-2xl space-y-6">
                            <h1 className="text-3xl font-black tracking-tighter uppercase text-red-600">Aviso</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">El enlace de verificación podría haber expirado o ya fue utilizado. Puedes intentar iniciar sesión directamente.</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full mt-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all"
                            >
                                Ir al Inicio de Sesión
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
