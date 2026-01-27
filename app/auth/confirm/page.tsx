"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Music } from 'lucide-react';
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
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setStatus('success');
                // Redirigir al dashboard después de 3 segundos
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            } else {
                // Si no hay sesión, podría ser un error o que aún está procesando
                setStatus('loading');
            }
        };

        checkSession();

        // Escuchar cambios de auth (por si el hash de la URL tarda en procesarse)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setStatus('success');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center pt-20">
                <div className="max-w-md w-full px-4 text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-600/20 rotate-3">
                        <Music className="text-white" size={40} />
                    </div>

                    {status === 'loading' && (
                        <div className="space-y-4">
                            <h1 className="text-3xl font-black tracking-tighter uppercase">Verificando tu <span className="text-blue-600">Cuenta</span></h1>
                            <p className="text-slate-500 font-medium">Espera un momento mientras preparamos tu puesto en el tianguis...</p>
                            <div className="flex justify-center pt-4">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                            <div className="flex justify-center mb-4">
                                <CheckCircle2 className="text-green-500" size={64} />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase">¡Correo <span className="text-blue-600">Verificado!</span></h1>
                            <p className="text-slate-500 font-medium">Bienvenido a TianguisBeats. Redirigiendo a tu panel...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-4">
                            <h1 className="text-3xl font-black tracking-tighter uppercase text-red-600">Hubo un Problema</h1>
                            <p className="text-slate-500 font-medium">No pudimos verificar tu cuenta automáticamente. Intenta iniciar sesión manualmente.</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="mt-6 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all"
                            >
                                Ir al Login
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
