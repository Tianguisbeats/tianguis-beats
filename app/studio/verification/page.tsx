"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, CheckCircle2, XCircle, ChevronRight, Upload, AlertTriangle, Lock, Edit3, Link as LinkIcon, Music, BarChart2, DollarSign, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

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
    const [status, setStatus] = useState<'loading' | 'none' | 'pending' | 'verified' | 'rejected'>('loading');

    // Requirements State
    const [checks, setChecks] = useState({
        plan: false,
        profileComplete: false,
        activityMin: false, // 5 beats
        socialsLinked: false,
        performance: false // 100 plays OR 1 sale
    });

    // Form State
    const [form, setForm] = useState({
        realName: '',
        artisticName: '',
        portfolioUrl: '',
        motivation: '',
        idDocument: null as File | null
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
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(profile);
        if (profile) {
            setForm(prev => ({
                ...prev,
                realName: profile.full_name || '',
                artisticName: profile.artistic_name || ''
            }));
        }

        // 2. Fetch Beats (Count & Plays)
        const { data: beats } = await supabase
            .from('beats')
            .select('play_count')
            .eq('producer_id', user.id);

        const beatCount = beats?.length || 0;
        const playCount = beats?.reduce((sum, b) => sum + (b.play_count || 0), 0) || 0;

        // 3. Fetch Sales (Transacciones)
        const { count: saleCount } = await supabase
            .from('transacciones')
            .select('id', { count: 'exact', head: true })
            .eq('vendedor_id', user.id);

        setStats({ beatCount, playCount, saleCount: saleCount || 0 });

        // 4. Check existing request
        const { data: existingRequest } = await supabase
            .from('verification_requests')
            .select('status')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle to avoid error if not found

        if (profile?.is_verified) {
            setStatus('verified');
        } else if (existingRequest) {
            setStatus(existingRequest.status as any); // 'pending' | 'rejected'
        } else {
            setStatus('none');
        }

        // 5. Evaluate Requirements
        setChecks({
            plan: profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'premium',
            profileComplete: !!(profile?.foto_perfil && profile?.portada_perfil && profile?.bio && profile?.artistic_name),
            activityMin: beatCount >= 5,
            socialsLinked: !!(profile?.verify_instagram && profile?.verify_youtube && profile?.verify_tiktok),
            performance: playCount >= 100 && (saleCount || 0) >= 1
        });

        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setForm({ ...form, idDocument: e.target.files[0] });
        }
    };

    const { showToast } = useToast();

    // ... (rest of code) ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!form.idDocument) throw new Error("Debes subir una identificación oficial.");
            if (!profile?.username) throw new Error("No se pudo obtener el nombre de usuario.");

            // 1. Upload ID (using username in path)
            const fileExt = form.idDocument.name.split('.').pop();
            const fileName = `${profile.username}/${Date.now()}_verification.${fileExt}`;
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('verification-docs')
                .upload(fileName, form.idDocument);

            if (uploadError) throw uploadError;

            // 2. Insert Request
            const { error: insertError } = await supabase
                .from('verification_requests')
                .insert({
                    user_id: user.id,
                    real_name: form.realName,
                    artistic_name: form.artisticName,
                    portfolio_url: form.portfolioUrl,
                    motivation: form.motivation,
                    id_document_url: uploadData.path,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            // 3. Update Verification Status in Profile (Optimistic / Cache)
            await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', user.id);

            setStatus('pending');
            showToast("Solicitud enviada con éxito.", "success");

        } catch (error: any) {
            console.error(error);
            showToast(error.message || "Error al enviar solicitud", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full"></div>
        </div>
    );

    const allChecksPassed = Object.values(checks).every(Boolean);

    if (status === 'verified') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                    <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">¡Estás Verificado!</h1>
                <p className="text-muted text-sm font-bold uppercase tracking-widest leading-loose">
                    Tu cuenta ya cuenta con la insignia de autenticidad. Gracias por ser un productor destacado en Tianguis Beats.
                </p>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <ShieldCheck className="w-12 h-12 text-amber-500" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Solicitud en Revisión</h1>
                <p className="text-muted text-sm font-bold uppercase tracking-widest leading-loose">
                    Nuestro equipo está revisando tu documentación. Te notificaremos por correo electrónico cuando haya una actualización (24-48 horas).
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    <img src="/verified-badge.png" alt="Verificado" className="w-16 h-16 md:w-20 md:h-20 object-contain shadow-2xl shadow-blue-500/20 rounded-full" />
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">Solicitud de <span className="text-accent">Verificación</span></h1>
                        <p className="text-muted font-bold uppercase tracking-widest text-xs max-w-xl leading-relaxed">
                            La insignia de verificación confirma tu identidad y destaca tu perfil como un profesional de confianza.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                {/* Requirements Checklist */}
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm">1</span>
                        Requisitos Mínimos
                    </h3>

                    <div className="space-y-4">
                        {/* Plan */}
                        <div className={`p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${checks.plan ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${checks.plan ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'}`}>
                                {checks.plan ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground uppercase text-[10px] tracking-widest mb-0.5">Plan Pro o Premium</h3>
                                <p className="text-[10px] text-muted leading-tight">Suscripción activa requerida.</p>
                            </div>
                            {!checks.plan && (
                                <Link href="/pricing" className="px-4 py-2 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                    <DollarSign size={10} /> Mejorar
                                </Link>
                            )}
                        </div>

                        {/* Perfil */}
                        <div className={`p-5 rounded-[2rem] border transition-all flex flex-col gap-4 ${checks.profileComplete ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${checks.profileComplete ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'}`}>
                                    {checks.profileComplete ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-foreground uppercase text-[10px] tracking-widest mb-0.5">Perfil Completo</h3>
                                    <p className="text-[10px] text-muted leading-tight">Configura tu presencia en el estudio.</p>
                                </div>
                                {!checks.profileComplete && profile?.username && (
                                    <Link href={`/${profile.username}`} className="px-4 py-2 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                        <Edit3 size={10} /> Editar
                                    </Link>
                                )}
                            </div>

                            {/* Sub-indicadores de perfil */}
                            <div className="grid grid-cols-2 gap-2 pl-14">
                                {[
                                    { label: 'Foto Perfil', passed: !!profile?.foto_perfil },
                                    { label: 'Portada', passed: !!profile?.portada_perfil },
                                    { label: 'Smart Bio', passed: !!profile?.bio },
                                    { label: 'Aka Artístico', passed: !!profile?.artistic_name }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        {item.passed ? (
                                            <CheckCircle2 size={10} className="text-emerald-500" />
                                        ) : (
                                            <XCircle size={10} className="text-red-400 opacity-50" />
                                        )}
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${item.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Beats */}
                        <div className={`p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${checks.activityMin ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${checks.activityMin ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'}`}>
                                {checks.activityMin ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground uppercase text-[10px] tracking-widest mb-0.5">Actividad ({stats.beatCount}/5)</h3>
                                <p className="text-[10px] text-muted leading-tight">Mínimo 5 beats en tu catálogo.</p>
                            </div>
                            {!checks.activityMin && (
                                <Link href="/upload" className="px-4 py-2 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                    <Music size={10} /> Subir
                                </Link>
                            )}
                        </div>

                        {/* Redes */}
                        <div className={`p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${checks.socialsLinked ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${checks.socialsLinked ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'}`}>
                                {checks.socialsLinked ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground uppercase text-[10px] tracking-widest mb-0.5">Redes Conectadas</h3>
                                <p className="text-[10px] text-muted leading-tight">Instagram, YouTube y TikTok vinculados en Smart Bio.</p>
                            </div>
                            {!checks.socialsLinked && profile?.username && (
                                <Link href={`/${profile.username}`} className="px-4 py-2 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                    <LinkIcon size={10} /> Vincular
                                </Link>
                            )}
                        </div>

                        {/* Stats */}
                        <div className={`p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${checks.performance ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${checks.performance ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'}`}>
                                {checks.performance ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-foreground uppercase text-[10px] tracking-widest mb-0.5">Validación</h3>
                                <p className="text-[10px] text-muted leading-tight">100 plays Y al menos 1 venta.</p>
                            </div>
                            {!checks.performance && (
                                <Link href="/studio/stats" className="px-4 py-2 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                    <BarChart2 size={10} /> Stats
                                </Link>
                            )}
                        </div>
                    </div>

                    {!allChecksPassed && (
                        <div className="mt-8 p-6 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl flex items-start gap-4">
                            <Lock className="text-muted shrink-0 mt-1" size={20} />
                            <div>
                                <h4 className="font-black text-muted uppercase text-[10px] tracking-widest mb-1">Formulario Bloqueado</h4>
                                <p className="text-xs text-muted">Completa todos los requisitos para desbloquear la solicitud oficial.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Application Form */}
                <div className={`transition-opacity duration-500 ${!allChecksPassed ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm">2</span>
                        Solicitud Oficial
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-border shadow-xl">
                        <div className="grid grid-cols-2 gap-6 items-start">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Nombre Real</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all min-h-[44px]"
                                    placeholder="Como en tu INE/ID"
                                    value={form.realName}
                                    onChange={e => setForm({ ...form, realName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Nombre Artístico</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all min-h-[44px]"
                                    placeholder="Tu aka"
                                    value={form.artisticName}
                                    onChange={e => setForm({ ...form, artisticName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Enlace a Portafolio / Red Principal</label>
                            <input
                                type="url"
                                required
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all"
                                placeholder="https://instagram.com/..."
                                value={form.portfolioUrl}
                                onChange={e => setForm({ ...form, portfolioUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Identificación Oficial (INE/Passport)</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    required
                                    accept="image/*,.pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                />
                                <div className="w-full bg-background border-2 border-dashed border-border rounded-xl px-4 py-8 flex flex-col items-center justify-center text-center hover:bg-accent/5 transition-all">
                                    <Upload className="text-muted mb-2" size={20} />
                                    <span className="text-xs font-bold text-foreground">
                                        {form.idDocument ? form.idDocument.name : "Click para subir archivo"}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted mt-1">JPG, PNG o PDF (Max 5MB)</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">¿Por qué quieres verificarte?</label>
                            <textarea
                                required
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all h-24 resize-none"
                                placeholder="Cuéntanos brevemente..."
                                value={form.motivation}
                                onChange={e => setForm({ ...form, motivation: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-foreground text-background rounded-xl font-black uppercase tracking-widest text-xs hover:bg-accent hover:text-white transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Enviando...' : 'Enviar Solicitud'}
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
