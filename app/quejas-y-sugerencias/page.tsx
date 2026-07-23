"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Send, AlertCircle, MessageSquare, CheckCircle2, Upload, MessageCircle, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { LegalPageShell, AbstractLegalBg, LegalBadge } from '@/components/ui/LegalPageShell';

const inputCls = `w-full bg-white/10 dark:bg-black/20 border border-rose-500/20 rounded-2xl p-4 font-semibold text-black dark:text-white text-sm outline-none 
    focus:border-rose-500/60 focus:bg-white/20 dark:focus:bg-black/30 focus:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all placeholder:text-black/40 dark:placeholder:text-white/40 backdrop-blur-md shadow-[0_0_10px_rgba(244,63,94,0.05)]`;

export default function QuejasSugerenciasPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [lastType, setLastType] = useState<'queja' | 'sugerencia'>('queja');
    const [user, setUser] = useState<any>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [evidences, setEvidences] = useState<File[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('perfiles').select('nombre_usuario, nombre_artistico').eq('id', user.id).single();
                    setUser({ ...user, profile });
                    setNombre(profile?.nombre_usuario || profile?.nombre_artistico || user?.user_metadata?.username || '');
                    setEmail(user?.email || '');
                }
            } catch (err) { console.error(err); }
            finally { setCheckingAuth(false); }
        };
        checkUser();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length > 3) { showToast('Solo puedes seleccionar hasta 3 imágenes', 'error'); e.target.value = ''; setEvidences([]); return; }
            setEvidences(files);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        setStatus('loading');
        const formData = new FormData(form);
        const tipo = formData.get('tipo') as string;
        const mensaje = formData.get('mensaje') as string;
        const finalNombre = nombre || user?.profile?.nombre_usuario || user?.id || 'Usuario';
        const finalEmail = email || user?.email || 'anonimo@tianguisbeats.com';
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const evidenceUrls: string[] = ['', '', ''];
            const folder = finalNombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            for (let i = 0; i < evidences.length; i++) {
                const file = evidences[i];
                const ext = file.name.split('.').pop();
                const { data, error: uploadError } = await supabase.storage.from('evidencias_quejas').upload(`${folder}/evidencia_${Date.now()}_${i}.${ext}`, file);
                if (uploadError) throw uploadError;
                evidenceUrls[i] = data.path;
            }
            const { error } = await supabase.from('quejas_y_sugerencias').insert([{
                tipo_mensaje: tipo, usuario_q: finalNombre, correo: finalEmail, descripcion_problema: mensaje,
                usuario_id: authUser?.id || null, estado: 'pendiente',
                evidencia_1: evidenceUrls[0], evidencia_2: evidenceUrls[1], evidencia_3: evidenceUrls[2]
            }]);
            if (error) throw error;
            setLastType(tipo as 'queja' | 'sugerencia');
            setStatus('success');
            setEvidences([]);
            if (!user) { setNombre(''); setEmail(''); }
            form.reset();
        } catch (error: any) {
            showToast(`Error: ${error.message || 'Intenta nuevamente.'}`, 'error');
            setStatus('idle');
        }
    };

    return (
        <LegalPageShell theme="rose">
            <Navbar />
            <main className="pt-28 pb-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">

                    {/* ── HERO ── */}
                    <div className="text-center mb-14 flex flex-col items-center">
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="w-16 h-16 mb-6 flex items-center justify-center -rotate-6 hover:rotate-0 transition-transform duration-500 drop-shadow-2xl">
                            <Image src="/logo.png" alt="Logo" width={64} height={64} className="w-full h-full object-contain" />
                        </motion.div>
                        <LegalBadge label="Quejas · Sugerencias · Soporte" theme="rose" />
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
                            Tu Voz<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-500 to-red-400">Importa.</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                            className="text-black/70 dark:text-white/70 font-medium max-w-md mx-auto text-sm leading-relaxed">
                            Tu retroalimentación construye un mejor Tianguis. Leemos cada mensaje cuidadosamente.
                        </motion.p>
                    </div>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="grid grid-cols-3 gap-3 mb-10">
                        {[
                            { icon: <MessageCircle size={18} />, label: 'Respondemos en 24–48 h', color: '#f43f5e' },
                            { icon: <Star size={18} />, label: 'Tu feedback mejora Tianguis', color: '#fb7185' },
                            { icon: <CheckCircle2 size={18} />, label: 'Equipo real te atiende', color: '#f43f5e' },
                        ].map((s, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm text-center hover:border-rose-500/20 transition-all">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg" style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}>{s.icon}</div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted/55">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Form card */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="relative rounded-[2.5rem] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl overflow-hidden p-8 md:p-12">
                        {/* Top rose glow */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
                        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(244,63,94,0.06)' }} />

                        {status === 'success' ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <CheckCircle2 size={48} className="text-emerald-400" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-4">Mensaje Enviado ✓</h2>
                                <p className="text-muted/60 text-sm font-medium max-w-md leading-relaxed mb-8">
                                    {lastType === 'sugerencia' ? 'Gracias por tu sugerencia. Tu aporte nos ayuda a crecer y mejorar Tianguis Beats.' : 'Recibimos tu queja. Nuestro equipo la atenderá y te contactaremos a la brevedad posible.'}
                                </p>
                                <button onClick={() => setStatus('idle')} className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 hover:bg-rose-400 transition-all shadow-xl shadow-rose-500/20 active:scale-95">
                                    Enviar Otro Mensaje
                                </button>
                            </motion.div>
                        ) : checkingAuth ? (
                            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" /></div>
                        ) : !user ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                                    <AlertCircle size={36} className="text-rose-400" />
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-3">Acceso Restringido</h2>
                                <p className="text-muted/60 text-xs font-medium max-w-sm mb-8 leading-relaxed">Necesitas una cuenta para enviar quejas o sugerencias.</p>
                                <div className="flex gap-3">
                                    <Link href="/login" style={{ textDecoration: 'none' }} className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-400 hover:scale-105 transition-all shadow-xl shadow-rose-500/20 active:scale-95">
                                        Iniciar Sesión
                                    </Link>
                                    <Link href="/signup" style={{ textDecoration: 'none' }} className="px-6 py-3 border border-white/[0.1] text-foreground/70 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:border-rose-500/30 hover:text-rose-400 transition-all">
                                        Registrarse
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form key={user?.id || 'anon'} onSubmit={handleSubmit} className="space-y-7 relative z-10">
                                {/* Type selector */}
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-black/60 dark:text-white/60 block mb-3">¿Qué tipo de mensaje?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[{ val: 'queja', label: '⚠️ Una Queja' }, { val: 'sugerencia', label: '💡 Una Sugerencia' }].map(opt => (
                                            <label key={opt.val} className="cursor-pointer">
                                                <input type="radio" name="tipo" value={opt.val} className="peer sr-only" required defaultChecked={opt.val === 'queja'} />
                                                <div className="p-4 rounded-2xl border border-rose-500/10 bg-white/5 dark:bg-black/20 text-center peer-checked:border-rose-500/60 peer-checked:bg-rose-500/10 peer-checked:text-rose-400 peer-checked:shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all hover:border-rose-500/40 font-black uppercase tracking-widest text-xs cursor-pointer text-black dark:text-white">
                                                    {opt.label}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Name / Email */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-black/60 dark:text-white/60 block mb-2">Usuario</label>
                                        <input type="text" name="nombre" required readOnly={!!user} value={nombre} onChange={e => setNombre(e.target.value)} className={`${inputCls} ${user ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="Tu nombre" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-black/60 dark:text-white/60 block mb-2">Correo Electrónico</label>
                                        <input type="email" name="email" required readOnly={!!user} value={email} onChange={e => setEmail(e.target.value)} className={`${inputCls} ${user ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="tu@correo.com" />
                                    </div>
                                </div>
                                {/* Message */}
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-black/60 dark:text-white/60 block mb-2">Tu Mensaje</label>
                                    <textarea name="mensaje" required rows={6} className={inputCls} placeholder="Cuéntanos a detalle el problema o tu idea para mejorar la plataforma..." />
                                </div>
                                {/* Evidence */}
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-black/60 dark:text-white/60 block mb-2">Evidencias (Opcional — Máx 3)</label>
                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <label className="group cursor-pointer relative aspect-video bg-white/10 dark:bg-black/20 border-2 border-dashed border-rose-500/20 rounded-2xl flex flex-col items-center justify-center hover:border-rose-500/40 transition-all overflow-hidden shadow-[0_0_10px_rgba(244,63,94,0.05)]">
                                            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" />
                                            <Upload className="text-black/40 dark:text-white/40 group-hover:text-rose-400 transition-colors mb-2" size={22} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 group-hover:text-rose-400 transition-colors">
                                                {evidences.length > 0 ? `${evidences.length} Archivo${evidences.length > 1 ? 's' : ''}` : 'Agregar Fotos'}
                                            </span>
                                        </label>
                                        <div className="sm:col-span-2 flex flex-col justify-center gap-2">
                                            <p className="text-[9px] font-bold text-muted/40 uppercase tracking-widest leading-relaxed">• Máximo 3 imágenes · PNG, JPG, JPEG</p>
                                            {evidences.length > 0 && (
                                                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1.5">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-rose-400">Archivos seleccionados:</p>
                                                    {evidences.map((file, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-[9px] font-bold text-foreground/60">
                                                            <div className="w-1 h-1 rounded-full bg-rose-500" />
                                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                                            <span className="text-[8px] text-muted/40">({(file.size / 1024).toFixed(0)}KB)</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Submit */}
                                <button type="submit" disabled={status === 'loading'}
                                    className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-sm bg-rose-500 text-white hover:bg-rose-400 hover:scale-[1.02] shadow-2xl shadow-rose-500/25 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                    {status === 'loading'
                                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <><Send size={18} /> Enviar Mensaje</>}
                                </button>
                                <div className="flex items-center gap-3 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                                    <AlertCircle size={16} className="text-muted/40 shrink-0" />
                                    <p className="text-[9px] font-bold text-muted/40 uppercase tracking-widest">Todas las quejas y sugerencias son leídas por nuestro equipo para mejorar Tianguis Beats.</p>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </LegalPageShell>
    );
}
