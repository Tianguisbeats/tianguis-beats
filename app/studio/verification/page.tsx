"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, CheckCircle2, XCircle, ChevronRight, Upload, AlertTriangle, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

        // 2. Fetch Beats (Count & Plays)
        const { data: beats } = await supabase
            .from('beats')
            .select('play_count')
            .eq('producer_id', user.id);

        const beatCount = beats?.length || 0;
        const playCount = beats?.reduce((sum, b) => sum + (b.play_count || 0), 0) || 0;

        // 3. Fetch Sales
        const { count: saleCount } = await supabase
            .from('sales')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', user.id);

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
            profileComplete: !!(profile?.foto_perfil && profile?.foto_portada && profile?.bio),
            activityMin: beatCount >= 5,
            socialsLinked: !!(profile?.social_links && Object.values(profile.social_links).some(url => url)),
            performance: playCount >= 100 || (saleCount || 0) >= 1
        });

        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setForm({ ...form, idDocument: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!form.idDocument) throw new Error("Debes subir una identificación oficial.");

            // 1. Upload ID
            const fileExt = form.idDocument.name.split('.').pop();
            const fileName = `${user.id}_${Math.random()}.${fileExt}`;
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
            alert("Solicitud enviada con éxito.");

        } catch (error: any) {
            console.error(error);
            alert("Error al enviar solicitud: " + error.message);
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
            <div className="mb-12">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Verificación de Productor</h1>
                <p className="text-muted font-bold uppercase tracking-widest text-xs max-w-2xl leading-relaxed">
                    La insignia de verificación confirma tu identidad y destaca tu perfil como un profesional de confianza.
                    Completa los requisitos para solicitarla.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16">
                {/* Requirements Checklist */}
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm">1</span>
                        Requisitos Mínimos
                    </h3>

                    <div className="space-y-6">
                        <CheckItem
                            label="Plan Activo"
                            sub="Debes tener una suscripción Pro o Premium"
                            passed={checks.plan}
                            action={!checks.plan ? <Link href="/pricing" className="text-xs text-accent hover:underline font-bold ml-auto">Mejorar Plan</Link> : null}
                        />
                        <CheckItem
                            label="Perfil Completo"
                            sub="Foto de perfil, portada y biografía"
                            passed={checks.profileComplete}
                            action={!checks.profileComplete ? <Link href="/studio/stats" className="text-xs text-accent hover:underline font-bold ml-auto">Editar Perfil</Link> : null}
                        />
                        <CheckItem
                            label="Actividad Constante"
                            sub={`Mínimo 5 beats subidos (Tienes ${stats.beatCount})`}
                            passed={checks.activityMin}
                        />
                        <CheckItem
                            label="Redes Conectadas"
                            sub="Instagram o YouTube vinculados"
                            passed={checks.socialsLinked}
                        />
                        <CheckItem
                            label="Validación de Mercado"
                            sub={`100+ Plays o 1 Ventas (Tienes ${stats.playCount} plays, ${stats.saleCount} ventas)`}
                            passed={checks.performance}
                        />
                    </div>

                    {!allChecksPassed && (
                        <div className="mt-8 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
                            <AlertTriangle className="text-red-500 shrink-0 mt-1" size={20} />
                            <div>
                                <h4 className="font-black text-red-500 uppercase text-xs tracking-widest mb-1">Requisitos Incompletos</h4>
                                <p className="text-xs text-muted">Asegúrate de cumplir todos los puntos anteriores para desbloquear el formulario de solicitud.</p>
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
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Nombre Real</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all"
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
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all"
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
