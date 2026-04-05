"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, CheckCircle2, XCircle, ChevronRight, Upload, AlertTriangle, Lock, Edit3, Link as LinkIcon, Music, BarChart2, DollarSign, Globe, ExternalLink, Clock, Crown, Shield, MessageSquare, Loader2, Check, Sparkles, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';
import { motion, AnimatePresence } from 'framer-motion';
import { NoiseOverlay, AbstractPuzzleBack } from '@/components/ui/BackgroundEffects';

export default function VerificationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({
        beatCount: 0,
        playCount: 0,
        saleCount: 0
    });
    const [status, setStatus] = useState<'loading' | 'none' | 'pending' | 'verified' | 'rejected' | 'rechazado'>('loading');

    // Requirements State
    const [checks, setChecks] = useState({
        plan: false,
        profile: false,
        catalog: false,
        plays: false,
        sales: false
    });

    // Form State
    const [form, setForm] = useState({
        realName: '',
        artisticName: '',
        portfolioUrl: '',
        motivacion: '', // Cambiado de motivation a motivacion para consistencia
        idDocumentFront: null as File | null,
        idDocumentBack: null as File | null
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);

        // 1. Fetch Profile
        const { data: profile } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(profile);
        if (profile) {
            setForm(prev => ({
                ...prev,
                realName: profile.nombre_completo || '',
                artisticName: profile.nombre_usuario || '' // Ahora mapeado a nombre_usuario
            }));
        }

        // 2. Fetch Beats (Count & Plays)
        const { data: beats } = await supabase
            .from('beats')
            .select('conteo_reproducciones')
            .eq('productor_id', user.id);

        const beatCount = beats?.length || 0;
        const playCount = beats?.reduce((sum, b) => sum + (b.conteo_reproducciones || 0), 0) || 0;

        // 3. Fetch Sales (Transacciones)
        const { count: saleCount } = await supabase
            .from('transacciones')
            .select('id', { count: 'exact', head: true })
            .eq('vendedor_id', user.id);

        setStats({ beatCount, playCount, saleCount: saleCount || 0 });

        // 4. Check existing request (using correct table name)
        const { data: existingRequest } = await supabase
            .from('solicitudes_verificacion')
            .select('estado')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profile?.esta_verificado) {
            setStatus('verified');
        } else if (existingRequest) {
            setStatus(existingRequest.estado as any); // 'pendiente' | 'rechazado'
        } else {
            setStatus('none');
        }

        // 5. Evaluate Requirements
        setChecks({
            plan: profile?.nivel_suscripcion === 'pro' || profile?.nivel_suscripcion === 'premium',
            profile: !!(profile?.foto_perfil && profile?.biografia && (profile?.verificacion_instagram || profile?.verificacion_youtube || profile?.verificacion_tiktok)),
            catalog: beatCount >= 5,
            plays: playCount >= 100,
            sales: (saleCount || 0) >= 1
        });

        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        if (e.target.files && e.target.files[0]) {
            if (side === 'front') {
                setForm({ ...form, idDocumentFront: e.target.files[0] });
            } else {
                setForm({ ...form, idDocumentBack: e.target.files[0] });
            }
        }
    };

    const { showToast } = useToast();

    // ... (rest of code) ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!form.idDocumentFront || !form.idDocumentBack) {
                throw new Error("Es obligatorio subir ambos lados de tu identificación (Frente y Vuelta).");
            }
            if (!profile?.nombre_usuario) throw new Error("No se pudo obtener el nombre de usuario.");

            let url_doc_frontal = '';
            let url_doc_trasero = '';

            // 1. Upload ID Front
            const frontExt = form.idDocumentFront.name.split('.').pop();
            const frontFileName = `${profile.nombre_usuario}/frente_${Date.now()}.${frontExt}`;
            const { error: frontError, data: frontData } = await supabase.storage
                .from('documentos_verificacion')
                .upload(frontFileName, form.idDocumentFront);

            if (frontError) throw frontError;
            url_doc_frontal = frontData.path;

            // 2. Upload ID Back (Optional but recommended)
            if (form.idDocumentBack) {
                const backExt = form.idDocumentBack.name.split('.').pop();
                const backFileName = `${profile.nombre_usuario}/vuelta_${Date.now()}.${backExt}`;
                const { error: backError, data: backData } = await supabase.storage
                    .from('documentos_verificacion')
                    .upload(backFileName, form.idDocumentBack);

                if (backError) throw backError;
                url_doc_trasero = backData.path;
            }

            // 3. Insert into solicitudes_verificacion
            const { error: insertError } = await supabase
                .from('solicitudes_verificacion')
                .insert({
                    user_id: user.id,
                    nombre_completo: form.realName,
                    nombre_usuario: form.artisticName,
                    correo: profile.correo || profile.email,
                    url_red_social: form.portfolioUrl,
                    motivacion: form.motivacion,
                    url_doc_frontal,
                    url_doc_trasero,
                    estado: 'pendiente'
                });

            if (insertError) throw insertError;

            setStatus('pending');
            showToast("Solicitud enviada con éxito.", "success");

        } catch (error: any) {
            console.error(error);
            let userMessage = "Error al enviar la solicitud";
            if (error.message?.includes("Bucket not found")) userMessage = "Error: El almacén de documentos no está configurado.";
            if (error.message?.includes("row-level security policy")) userMessage = "Error de permisos: No tienes autorización para esta acción.";

            showToast(userMessage, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingTianguis />;

    const allChecksPassed = Object.values(checks).every(Boolean);

    if (status === 'verified') {
        return (
            <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden -m-8 md:-m-12 lg:-m-16">
                <NoiseOverlay />
                <div className="fixed inset-0 z-0">
                    <AbstractPuzzleBack theme="green" opacity={0.15} />
                </div>

                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6"
                >
                    <div className="relative mb-16 group">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-12 bg-emerald-500/20 blur-[60px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="w-48 h-48 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[4rem] flex items-center justify-center relative backdrop-blur-xl shadow-2xl shadow-emerald-500/20">
                            <ShieldCheck className="w-24 h-24 text-emerald-500 drop-shadow-glow-emerald" />
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 border-4 border-emerald-500/30 rounded-[4rem]"
                            />
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white dark:bg-emerald-500 rounded-3xl flex items-center justify-center border-[6px] border-background shadow-2xl">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Acreditación Élite Confirmada</span>
                        </div>

                        <h1 className="text-8xl font-black uppercase tracking-tighter mb-6 leading-[0.8] text-foreground">
                            Estatus:<br />
                            <span className="text-emerald-500">Verificado.</span>
                        </h1>

                        <p className="text-muted text-xs font-bold uppercase tracking-[0.3em] leading-loose max-w-sm mx-auto opacity-70 mb-12">
                            Tu identidad ha sido blindada por el consejo de Tianguis Beats. Tu insignia brilla ahora en el catálogo global.
                        </p>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link href="/studio/beats" className="group relative px-12 py-6 bg-foreground text-background dark:bg-white dark:text-black rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all shadow-2xl">
                                Gestionar Catálogo <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden -m-8 md:-m-12 lg:-m-16">
                <NoiseOverlay />
                <div className="fixed inset-0 z-0">
                    <AbstractPuzzleBack theme="purple" opacity={0.15} />
                </div>

                <motion.div 
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative z-10 flex flex-col items-center text-center max-w-3xl px-6"
                >
                    <div className="relative mb-16">
                        <div className="w-48 h-48 bg-blue-500/10 border-2 border-blue-500/20 rounded-[4rem] flex items-center justify-center backdrop-blur-3xl shadow-2xl">
                            <Loader2 className="w-20 h-20 text-blue-500 animate-spin" strokeWidth={1} />
                            <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full opacity-30" />
                        </div>
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white dark:bg-blue-500 rounded-3xl flex items-center justify-center border-[6px] border-background shadow-xl">
                            <Clock className="w-8 h-8 text-blue-500 dark:text-white animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Expediente en Auditoría</span>
                        </div>

                        <h1 className="text-8xl font-black uppercase tracking-tighter mb-8 leading-[0.8] text-foreground">
                            Análisis en<br /><span className="text-blue-500">Progreso.</span>
                        </h1>

                        <p className="text-muted text-xs font-bold uppercase tracking-[0.3em] leading-loose max-w-lg mx-auto opacity-70 mb-12">
                            Estamos verificando tus credenciales con precisión quirúrgica. Una vez validado, tu estatus cambiará globalmente.
                        </p>

                        <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                            <div className="p-8 bg-card/40 border border-border/50 rounded-[3rem] text-left backdrop-blur-3xl group hover:border-blue-500/30 transition-all">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted/60 mb-3 ml-1">Tiempo de Respuesta</p>
                                <p className="text-3xl font-black text-foreground tracking-tighter">24-48<span className="text-sm text-muted/40 ml-1">H</span></p>
                            </div>
                            <div className="p-8 bg-card/40 border border-border/50 rounded-[3rem] text-left backdrop-blur-3xl group hover:border-blue-500/30 transition-all">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted/60 mb-3 ml-1">Canal</p>
                                <p className="text-base font-black text-foreground uppercase tracking-tight leading-tight">Centro de Notificaciones</p>
                            </div>
                        </div>

                        <Link href="/studio" className="inline-block mt-12 text-[10px] font-black uppercase tracking-[0.4em] text-muted hover:text-foreground transition-colors">
                            Volver al Panel Central
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (status === 'rechazado' || status === 'rejected') {
        return (
            <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden -m-8 md:-m-12 lg:-m-16">
                <NoiseOverlay />
                <div className="fixed inset-0 z-0">
                    <AbstractPuzzleBack theme="pink" opacity={0.15} />
                </div>

                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6"
                >
                    <div className="relative mb-16">
                        <div className="w-48 h-48 bg-red-500/10 border-2 border-red-500/20 rounded-[4rem] flex items-center justify-center backdrop-blur-3xl shadow-2xl">
                            <XCircle className="w-24 h-24 text-red-500" />
                            <div className="absolute inset-0 bg-red-500/20 blur-[60px] rounded-full opacity-40" />
                        </div>
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white dark:bg-red-500 rounded-3xl flex items-center justify-center border-[6px] border-background shadow-xl">
                            <AlertTriangle className="w-8 h-8 text-red-500 dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Solicitud Denegada</span>
                        </div>

                        <h1 className="text-8xl font-black uppercase tracking-tighter mb-6 leading-[0.8] text-foreground">
                            Estatus:<br />
                            <span className="text-red-500">Rechazado.</span>
                        </h1>

                        <p className="text-muted text-xs font-bold uppercase tracking-[0.3em] leading-loose max-w-sm mx-auto opacity-70 mb-12">
                            Tu solicitud no cumple con los protocolos de élite actuales. Revisa tus requisitos y vuelve a intentarlo en 30 días.
                        </p>

                        <button 
                            onClick={() => setStatus('none')}
                            className="group relative px-12 py-6 bg-foreground text-background dark:bg-white dark:text-black rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all shadow-2xl"
                        >
                            Ver Detalles & Reintentar <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-16 pb-20 px-4 md:px-0 py-12 relative z-10 transition-all duration-700">
            {/* ── Encabezado Principal ── */}
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500">Identity Verification Protocol</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] text-foreground">
                    <span className="opacity-40">Solicitud de</span> <br />
                    <span className="text-blue-500 relative inline-block">
                        Verificación
                        <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                    </span>
                </h1>
                <p className="text-muted text-[11px] font-bold uppercase tracking-widest max-w-lg opacity-40 leading-relaxed">
                    Completa los requisitos básicos de actividad y profesionalismo para obtener tu insignia de élite.
                </p>
            </div>

            {/* ── Fase 01: Checklist de Requisitos ── */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Fase 01 <span className="opacity-30">/ Requisitos</span></h2>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { id: 'plan', label: 'Suscripción Activa', sub: 'Membresía Pro o Premium', passed: checks.plan, link: '/pricing' },
                        { id: 'profile', label: 'Perfil Completo', sub: 'Foto, Bio y Redes vinculadas', passed: checks.profile, link: `/${profile?.nombre_usuario}` },
                        { id: 'catalog', label: 'Catálogo Sólido', sub: 'Mínimo 5 beats publicados', passed: checks.catalog, link: '/upload' },
                        { id: 'plays', label: 'Tráfico Global', sub: 'Mínimo 100 reproducciones', passed: checks.plays, link: '/studio/stats' },
                        { id: 'sales', label: 'Historial Comercial', sub: 'Al menos 1 venta registrada', passed: checks.sales, link: '/studio/sales' }
                    ].map(req => (
                        <div key={req.id} className={`group relative p-6 rounded-3xl border transition-all flex items-center justify-between ${req.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5'}`}>
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${req.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}>
                                    {req.passed ? <Check size={20} /> : <Lock size={18} />}
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-widest">{req.label}</h4>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-wider opacity-60">{req.sub}</p>
                                </div>
                            </div>
                            {!req.passed && (
                                <Link href={req.link} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline px-4 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10 transition-all active:scale-95">Completar</Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Fase 02: Formulario de Revisión ── */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Fase 02 <span className="opacity-30">/ Expediente</span></h2>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/5" />
                </div>

                <div className={`relative transition-all duration-700 ${!allChecksPassed ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                    {!allChecksPassed && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-[2px]">
                            <div className="px-8 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl">
                                Bloqueado - Completa la Fase 01
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 md:p-12 space-y-10 shadow-2xl shadow-black/5">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Nombre Completo (Legal)</label>
                                <input type="text" required value={form.realName} onChange={e => setForm({ ...form, realName: e.target.value })} className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Como aparece en tu identificación" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Link de Referencia Principal</label>
                                <input type="url" required value={form.portfolioUrl} onChange={e => setForm({ ...form, portfolioUrl: e.target.value })} className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Instagram, YouTube o Portafolio" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted text-center block">Identificación (Frente)</label>
                                <div className="relative aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden bg-white/50 dark:bg-black/20 group hover:border-blue-500/50 transition-all cursor-pointer">
                                    <input type="file" required accept="image/*" onChange={(e) => handleFileChange(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    {form.idDocumentFront ? <img src={URL.createObjectURL(form.idDocumentFront)} className="w-full h-full object-cover" /> : <Upload className="text-muted group-hover:text-blue-500 transition-colors" />}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted text-center block">Identificación (Vuelta)</label>
                                <div className="relative aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden bg-white/50 dark:bg-black/20 group hover:border-blue-500/50 transition-all cursor-pointer">
                                    <input type="file" required accept="image/*" onChange={(e) => handleFileChange(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    {form.idDocumentBack ? <img src={URL.createObjectURL(form.idDocumentBack)} className="w-full h-full object-cover" /> : <Upload className="text-muted group-hover:text-blue-500 transition-colors" />}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">¿Por qué deseas ser verificado?</label>
                            <textarea required value={form.motivacion} onChange={e => setForm({ ...form, motivacion: e.target.value })} className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-3xl px-8 py-6 text-sm font-bold focus:border-blue-500 outline-none transition-all h-40 resize-none shadow-sm" placeholder="Cuéntanos brevemente sobre tu carrera..." />
                        </div>

                        <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-3">
                            {submitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18} /> Enviar Expediente</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function CheckItem({ label, sub, passed, action }: { label: string, sub: string, passed: boolean, action?: React.ReactNode }) {
    return (
        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${passed ? 'bg-green-500/5 border-green-500/20' : 'bg-background border-border'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${passed ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-400'}`}>
                {passed ? <CheckCircle2 size={20} /> : <Lock size={18} />}
            </div>
            <div className="flex-1">
                <h4 className={`text-xs font-black uppercase tracking-wide ${passed ? 'text-foreground' : 'text-muted'}`}>{label}</h4>
                <p className="text-[10px] text-muted font-medium">{sub}</p>
            </div>
            {action}
        </div>
    );
}
