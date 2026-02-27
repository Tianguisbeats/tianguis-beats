"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Send, AlertCircle, MessageSquare, CheckCircle2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

export default function QuejasSugerenciasPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [lastType, setLastType] = useState<'queja' | 'sugerencia'>('queja');
    const [user, setUser] = useState<any>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('perfiles').select('nombre_usuario, email').eq('id', user.id).single();
                setUser({ ...user, profile });
            }
            setCheckingAuth(false);
        };
        checkUser();
    }, []);

    // Form State for Evidences
    const [evidences, setEvidences] = useState<File[]>([]);
    const [uploadingEvidences, setUploadingEvidences] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (filesArray.length > 3) {
                showToast("Solo puedes seleccionar hasta 3 imágenes", "error");
                e.target.value = ''; // Limpiar el input
                setEvidences([]);
                return;
            }
            setEvidences(filesArray);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        setStatus('loading');
        setUploadingEvidences(true);

        const formData = new FormData(form);
        const tipo = formData.get('tipo') as string;
        const nombre = formData.get('nombre') as string;
        const email = formData.get('email') as string;
        const mensaje = formData.get('mensaje') as string;

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            // 1. Upload Evidences if any
            const evidenceUrls: string[] = ['', '', ''];
            for (let i = 0; i < evidences.length; i++) {
                const file = evidences[i];
                const ext = file.name.split('.').pop();
                const fileName = `${authUser?.id || 'anon'}/evidencia_${Date.now()}_${i}.${ext}`;
                const { data, error: uploadError } = await supabase.storage
                    .from('evidencias_quejas')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;
                evidenceUrls[i] = data.path;
            }

            // 2. Insert with correct column names (usuario_id, correo, descripcion_problema)
            const { error } = await supabase.from('quejas_y_sugerencias').insert([{
                tipo_mensaje: tipo,
                nombre_usuario: nombre,
                correo: email,
                descripcion_problema: mensaje,
                usuario_id: authUser?.id || null,
                estado: 'pendiente',
                evidencia_1: evidenceUrls[0],
                evidencia_2: evidenceUrls[1],
                evidencia_3: evidenceUrls[2]
            }]);

            if (error) throw error;

            setLastType(tipo as 'queja' | 'sugerencia');
            setStatus('success');
            form.reset();
        } catch (error: any) {
            console.error("Error submitting feedback:", error);
            const errorMsg = error.message || "Verifica tu conexión e intenta nuevamente.";
            showToast(`Error: ${errorMsg}`, "error");
            setStatus('idle');
        }
    };

    const handleReset = () => {
        setStatus('idle');
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            {/* Elementos Ambientales Premium */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-600/5 dark:bg-blue-500/10 blur-[150px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-purple-600/5 dark:bg-purple-500/10 blur-[150px] rounded-full animate-pulse-slow delay-1000" />
            </div>

            <main className="relative z-10 pt-32 pb-40 px-6 sm:px-10 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-4 bg-accent/10 border border-accent/20 rounded-full mb-6 text-accent animate-bounce-slow">
                        <MessageSquare size={32} />
                    </div>
                    <h1 className="text-4xl md:text-[4.5rem] font-black uppercase tracking-tighter text-slate-900 dark:text-foreground leading-[0.9] mb-4">
                        Quejas y <span className="text-accent">Sugerencias</span>
                    </h1>
                    <p className="text-muted text-sm md:text-base font-bold uppercase tracking-[0.3em] opacity-80 max-w-2xl mx-auto">
                        Tu retroalimentación construye un mejor tianguis.
                    </p>
                </div>

                <div className="bg-white/5 dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    {/* Decoración Glassmorphism */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] rounded-full pointer-events-none" />

                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground mb-4">
                                Mensaje Enviado
                            </h2>
                            <p className="text-slate-500 dark:text-muted text-sm font-bold uppercase tracking-widest max-w-md leading-relaxed">
                                {lastType === 'sugerencia' ? (
                                    "Gracias por tu sugerencia, la valoramos mucho. Tu aporte nos ayuda a crecer."
                                ) : (
                                    "No te preocupes, estamos para servirte. Lo solucionaremos lo antes posible y nos contactaremos contigo."
                                )}
                            </p>
                            <button
                                onClick={handleReset}
                                className="mt-10 px-8 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-accent/20"
                            >
                                Enviar otro mensaje
                            </button>
                        </div>
                    ) : checkingAuth ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                        </div>
                    ) : !user ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle size={40} className="text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground mb-4">
                                Acceso Restringido
                            </h2>
                            <p className="text-slate-500 dark:text-muted text-xs font-bold uppercase tracking-widest max-w-sm mb-10 leading-relaxed">
                                Necesitas tener una cuenta o registrarte para enviar tu queja o sugerencia.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                                <Link href="/login" className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-black py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all text-center">
                                    Iniciar Sesión
                                </Link>
                                <Link href="/signup" className="flex-1 border border-slate-200 dark:border-white/10 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-center">
                                    Registrarse
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-2">¿Qué tipo de mensaje envías?</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="cursor-pointer">
                                        <input type="radio" name="tipo" value="queja" className="peer sr-only" required defaultChecked />
                                        <div className="p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent transition-all hover:border-accent/30 font-black uppercase tracking-widest text-xs">
                                            Una Queja
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input type="radio" name="tipo" value="sugerencia" className="peer sr-only" required />
                                        <div className="p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent transition-all hover:border-accent/30 font-black uppercase tracking-widest text-xs">
                                            Una Sugerencia
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-2">Nombre de Usuario</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        required
                                        readOnly={!!user}
                                        defaultValue={user?.profile?.nombre_usuario || user?.user_metadata?.artistic_name || user?.user_metadata?.username || ''}
                                        className={`w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-5 font-black text-slate-900 dark:text-foreground outline-none focus:border-accent transition-colors placeholder:text-muted/40 uppercase tracking-widest text-xs ${user ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder="EJ. PRODUCTOR X"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-2">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        readOnly={!!user}
                                        defaultValue={user?.profile?.email || user?.email || ''}
                                        className={`w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-5 font-black text-slate-900 dark:text-foreground outline-none focus:border-accent transition-colors placeholder:text-muted/40 uppercase tracking-widest text-xs ${user ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        placeholder="EJ. TU@CORREO.COM"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-2">Expláyate</label>
                                <textarea
                                    name="mensaje"
                                    required
                                    rows={6}
                                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-6 font-bold text-slate-900 dark:text-foreground outline-none focus:border-accent transition-colors placeholder:text-muted/40 resize-none text-sm leading-relaxed"
                                    placeholder="Cuéntanos a detalle el problema que encontraste o la idea que tienes para mejorar la plataforma..."
                                ></textarea>
                            </div>

                            {/* Evidence Upload Section */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 ml-2">Evidencias (Opcional - Máx 3)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <label className="group cursor-pointer relative aspect-video bg-slate-50 dark:bg-black/40 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-accent/50 transition-all overflow-hidden">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="sr-only"
                                        />
                                        <Upload className="text-muted group-hover:text-accent transition-colors mb-2" size={24} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted group-hover:text-accent">
                                            {evidences.length > 0 ? `${evidences.length} Archivos` : 'Agregar Fotos'}
                                        </span>
                                        {evidences.length > 0 && (
                                            <div className="absolute inset-0 bg-accent/5 flex items-center justify-center">
                                                <div className="flex -space-x-3">
                                                    {evidences.map((_, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-accent border-2 border-background flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                                            {i + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                    <div className="sm:col-span-2 flex flex-col justify-center gap-3">
                                        <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] leading-relaxed">
                                            • Máximo 3 imágenes por reporte.<br />
                                            • Formatos: PNG, JPG, JPEG.
                                        </p>
                                        {evidences.length > 0 && (
                                            <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-border/50 animate-in fade-in slide-in-from-left-2 transition-all">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-accent mb-1">Archivos seleccionados:</p>
                                                {evidences.map((file, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-[9px] font-bold text-foreground">
                                                        <div className="w-1 h-1 rounded-full bg-accent" />
                                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                                        <span className="text-[8px] text-muted font-normal italic">({(file.size / 1024).toFixed(0)}KB)</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full h-16 bg-accent text-white rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:scale-[1.02] shadow-xl hover:shadow-accent/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:scale-100"
                                >
                                    {status === 'loading' ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Enviar Mensaje <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 mt-6">
                                <AlertCircle size={16} className="text-slate-500 dark:text-muted shrink-0" />
                                <p className="text-[9px] font-bold text-slate-500 dark:text-muted/80 uppercase tracking-widest">
                                    Todas las quejas y sugerencias son leídas por nuestro equipo de soporte para mejorar la experiencia de Tianguis Beats.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
