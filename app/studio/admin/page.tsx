"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users, DollarSign, Music, CheckCircle, Clock, Trash2,
    ChevronRight, Search, Loader2, ArrowUpRight, ArrowDownRight,
    TrendingUp, Calendar, Layout, Mail, ShieldCheck, UserPlus,
    ExternalLink, Filter, MoreVertical, X, AlertTriangle, AlertCircle,
    Ticket, MessageSquare, XCircle, Edit2, Save, Crown, User, FileKey,
    Plus, Percent, BadgeCheck, ShieldAlert, Target, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';

type View = 'dashboard' | 'verifications' | 'users' | 'coupons' | 'feedback' | 'income' | 'beats';

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const { showToast } = useToast();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('perfiles')
                .select('es_admin, es_soporte')
                .eq('id', user.id)
                .single();

            if (profile?.es_admin || profile?.es_soporte) {
                setIsAdmin(true);
            } else {
                setLoading(false);
            }
            setLoading(false);
        };

        checkAdmin();
    }, []);

    if (loading) return <LoadingTianguis />;

    if (!isAdmin) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h1 className="text-3xl font-black uppercase text-foreground mb-4">Acceso Denegado</h1>
            <p className="text-muted">No tienes permisos de administrador.</p>
            <Link href="/studio" className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-full font-bold uppercase text-xs tracking-widest">
                Volver al Studio
            </Link>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto">
            <header className="mb-12 flex flex-col items-center justify-center gap-6 text-center">
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full mb-4">
                        <ShieldCheck size={12} className="text-accent" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Nivel de Acceso: Administrador</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-2">
                        Panel de <span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Administrador</span>
                    </h1>
                    <p className="text-muted text-[11px] font-black uppercase tracking-[0.3em] opacity-60">
                        Gestión Administrativa Tianguis Beats
                    </p>
                </div>
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                {currentView === 'dashboard' && <GlobalStats onViewChange={setCurrentView} />}
                {currentView === 'verifications' && <VerificationManager onBack={() => setCurrentView('dashboard')} />}
                {currentView === 'users' && <UserManager onBack={() => setCurrentView('dashboard')} />}
                {currentView === 'coupons' && <CouponManager onBack={() => setCurrentView('dashboard')} />}
                {currentView === 'feedback' && <FeedbackManager onBack={() => setCurrentView('dashboard')} />}
                {currentView === 'income' && <IncomeManager onBack={() => setCurrentView('dashboard')} />}
                {currentView === 'beats' && <BeatsManager onBack={() => setCurrentView('dashboard')} />}
            </div>
        </div>
    );
}

// --- GLOBAL STATS MODULE ---
function GlobalStats({ onViewChange }: { onViewChange: (view: View) => void }) {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalUsers: 0,
        totalBeats: 0,
        pendingVerifications: 0,
        pendingFeedback: 0,
        monthlyRevenue: 0,
        activeSubscriptions: 0,
        totalCoupons: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const [sales, users, beats, verifs, feedback, coupons] = await Promise.all([
                supabase.from('transacciones').select('precio'),
                supabase.from('perfiles').select('id', { count: 'exact', head: true }),
                supabase.from('beats').select('id', { count: 'exact', head: true }),
                supabase.from('solicitudes_verificacion').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('quejas_y_sugerencias').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('cupones').select('id', { count: 'exact', head: true }).eq('es_activo', true)
            ]);

            const revenue = sales.data?.reduce((acc, s) => acc + (s.precio || 0), 0) || 0;

            // Ingresos del mes actual
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { data: monthlyData } = await supabase
                .from('transacciones')
                .select('precio')
                .gte('fecha_creacion', startOfMonth);

            const monthlyRevenue = monthlyData?.reduce((acc, s) => acc + (s.precio || 0), 0) || 0;

            const { data: verifsData } = await supabase.from('solicitudes_verificacion').select('id').eq('estado', 'pendiente');
            const pendingVerifs = verifsData?.length || 0;

            const { data: feedbackData } = await supabase.from('quejas_y_sugerencias').select('id').eq('estado', 'pendiente');
            const pendingFeedback = feedbackData?.length || 0;

            setStats({
                totalSales: revenue,
                totalUsers: users.count || 0,
                totalBeats: beats.count || 0,
                pendingVerifications: pendingVerifs,
                pendingFeedback: pendingFeedback,
                monthlyRevenue: monthlyRevenue,
                activeSubscriptions: 0,
                totalCoupons: coupons.count || 0
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <LoadingTianguis />;

    const cards = [
        { id: 'income', label: 'Ingresos Totales', value: `$${stats.totalSales.toLocaleString()}`, sub: 'Ventas Globales Históricas', icon: <DollarSign className="text-emerald-500" />, gradient: 'hover:shadow-emerald-500/10' },
        { id: 'users', label: 'Usuarios', value: stats.totalUsers.toLocaleString(), sub: 'Productores registrados', icon: <Users className="text-blue-500" />, gradient: 'hover:shadow-blue-500/10' },
        { id: 'beats', label: 'Total Beats', value: stats.totalBeats.toLocaleString(), sub: 'En catálogo global', icon: <Music className="text-purple-500" />, gradient: 'hover:shadow-purple-500/10' },
        { id: 'verifications', label: 'Verificaciones', value: stats.pendingVerifications, sub: 'Solicitudes por revisar', icon: <img src="/verified-badge.png" alt="Verified" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />, gradient: 'hover:shadow-blue-500/10' },
        { id: 'coupons', label: 'Cupones', value: stats.totalCoupons, sub: 'Cupones activos', icon: <Ticket className="text-amber-500" />, gradient: 'hover:shadow-amber-500/10' },
        { id: 'feedback', label: 'Buzón', value: stats.pendingFeedback, sub: 'Quejas y sugerencias', icon: <MessageSquare className="text-rose-500" />, gradient: 'hover:shadow-rose-500/10' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {cards.map((card, i) => (
                <button
                    key={i}
                    onClick={() => onViewChange(card.id as View)}
                    className={`bg-card border border-border rounded-[3.5rem] p-12 transition-all duration-500 group hover:scale-[1.02] hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5 ${card.gradient} flex flex-col items-center text-center relative overflow-hidden`}
                >
                    {/* Top glow line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-accent/10 transition-colors" />

                    <div className="w-20 h-20 rounded-[2rem] bg-foreground/5 flex items-center justify-center transition-all group-hover:rotate-[5deg] group-hover:scale-110 duration-500 text-foreground mb-8 border border-border">
                        {card.id === 'verifications' ? (
                            card.icon
                        ) : (
                            React.cloneElement(card.icon as React.ReactElement<any>, { size: 32 })
                        )}
                    </div>

                    <h3 className="text-5xl font-black tracking-tighter mb-4 text-foreground group-hover:text-accent transition-colors tabular-nums leading-none">
                        {card.value}
                    </h3>

                    <div className="space-y-1">
                        <p className="text-muted text-[11px] font-black uppercase tracking-[0.3em] leading-tight">
                            {card.label}
                        </p>
                        <p className="text-[10px] text-muted/50 font-bold uppercase tracking-widest">
                            {card.sub}
                        </p>
                    </div>

                    <div className="mt-8 w-10 h-10 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <ExternalLink size={14} className="text-accent" />
                    </div>
                </button>
            ))}
        </div>
    );
}

// --- VERIFICATION MANAGER MODULE ---
function VerificationManager({ onBack }: { onBack: () => void }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('solicitudes_verificacion')
                .select(`*, perfiles: user_id(nombre_usuario, foto_perfil, correo, fecha_creacion)`)
                .order('fecha_creacion', { ascending: false });

            if (error) {
                const { data: retryData } = await supabase
                    .from('solicitudes_verificacion')
                    .select(`*, perfiles: user_id(nombre_usuario, foto_perfil, correo, fecha_creacion)`)
                    .eq('estado', 'pendiente');
                setRequests(retryData || []);
            } else {
                setRequests(data || []);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const [confirmAction, setConfirmAction] = useState<{ requestId: string; userId: string; status: 'approved' | 'rejected' | 'reviewed' } | null>(null);
    const [selectedHistoryReq, setSelectedHistoryReq] = useState<any>(null); // NEW

    const handleDeleteHistoryReq = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta solicitud de verificación del historial? Esta acción no se puede deshacer.')) return;
        try {
            const { error } = await supabase.from('solicitudes_verificacion').delete().eq('id', id);
            if (error) throw error;
            setRequests(requests.filter(r => r.id !== id));
            setSelectedHistoryReq(null);
            showToast("Solicitud eliminada correctamente", "success");
        } catch (err) {
            console.error(err);
            showToast("Error al eliminar la solicitud", "error");
        }
    };

    const handleDecision = async () => {
        if (!confirmAction) return;
        const { requestId, userId, status } = confirmAction;
        setConfirmAction(null); // Cerrar modal

        try {
            // 1. Actualizar el estado de la solicitud
            const { error: reqError } = await supabase
                .from('solicitudes_verificacion')
                .update({ estado: status === 'approved' ? 'aprobado' : status === 'rejected' ? 'rechazado' : 'revisado' })
                .eq('id', requestId);

            if (reqError) throw reqError;

            // 2. Si se aprueba, actualizar el perfil Y habilitar la insignia
            if (status === 'approved') {
                const { error: profileError } = await supabase
                    .from('perfiles')
                    .update({
                        esta_verificado: true,
                        boletin_activo: true
                    })
                    .eq('id', userId);

                if (profileError) throw profileError;
            }

            setRequests(requests.map(r => r.id === requestId ? { ...r, estado: status === 'approved' ? 'aprobado' : status === 'rejected' ? 'rechazado' : 'revisado' } : r));
            showToast(`Solicitud ${status === 'approved' ? 'Aprobada ✅' : status === 'rejected' ? 'Rechazada ❌' : 'Marcada como Revisada 👁️'}`, "success");
        } catch (error: any) {
            console.error(error);
            showToast("Error al procesar la decisión. Verifica los permisos de la base de datos.", "error");
        }
    };

    const handleRevert = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('solicitudes_verificacion')
                .update({ estado: 'pendiente' })
                .eq('id', requestId);

            if (error) throw error;

            setRequests(requests.map(r => r.id === requestId ? { ...r, estado: 'pendiente' } : r));
            showToast("Solicitud devuelta a Pendientes", "success");
        } catch (err) {
            showToast("Error al revertir", "error");
        }
    };

    if (loading) return <LoadingTianguis />;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className={`flex items-center justify-center px-4 py-2 rounded-xl border transition-all ${requests.filter(r => r.estado === 'pendiente').length > 0 ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-emerald-500/10 border-emerald-500/20'} `}>
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${requests.filter(r => r.estado === 'pendiente').length > 0 ? 'text-amber-500' : 'text-emerald-500'} `}>
                        {requests.filter(r => r.estado === 'pendiente').length} {requests.filter(r => r.estado === 'pendiente').length === 1 ? 'Pendiente' : 'Pendientes'}
                    </span>
                </div>
            </header>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md" onClick={() => setConfirmAction(null)} />
                    <div className="relative bg-white dark:bg-card border border-border w-full max-w-md rounded-[3rem] p-10 text-center animate-in zoom-in duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${confirmAction.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} `}>
                            {confirmAction.status === 'approved' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">
                            {confirmAction.status === 'approved' ? '¿Aprobar Verificación?' : confirmAction.status === 'reviewed' ? '¿Marcar como Revisado?' : '¿Rechazar Solicitud?'}
                        </h3>
                        <p className="text-muted text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
                            {confirmAction.status === 'approved'
                                ? 'Esta acción otorgará la insignia oficial de verificado al productor.'
                                : confirmAction.status === 'reviewed'
                                    ? 'La solicitud se moverá al historial sin cambiar el estado de verificación del usuario.'
                                    : 'La solicitud será marcada como rechazada y el usuario no recibirá su insignia.'}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="py-4 bg-foreground/5 border border-border text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-foreground/10 transition-all font-bold text-foreground"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDecision}
                                className={`py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl text-white shadow-xl transition-all scale-100 hover:scale-105 active:scale-95 ${confirmAction.status === 'approved' ? 'bg-emerald-500 shadow-emerald-500/20' : confirmAction.status === 'reviewed' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-rose-500 shadow-rose-500/20'} `}
                            >
                                {confirmAction.status === 'approved' ? 'Sí, Aprobar' : confirmAction.status === 'reviewed' ? 'Sí, Marcar' : 'Sí, Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {requests.filter(r => r.estado === 'pendiente').length === 0 ? (
                <div className="bg-card border border-border rounded-[2rem] p-12 text-center">
                    <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-foreground">¡Sin pendientes!</h3>
                    <p className="text-muted text-sm mt-2">No hay solicitudes de verificación para revisar.</p>
                </div>
            ) : (
                requests.filter(r => r.estado === 'pendiente').map((req) => (
                    <div key={req.id} className="relative bg-card border-t-4 border-t-blue-600 border-x border-b border-border rounded-[2.5rem] p-8 flex flex-col gap-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500">

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* User Info Section - Photo above, text below */}
                            <div className="lg:w-1/4 w-full flex flex-col items-center lg:items-start">
                                <Link
                                    href={`/${req.nombre_usuario}`}
                                    target="_blank"
                                    className="group/user mb-6 flex flex-col items-center lg:items-start gap-4 hover:opacity-80 transition-opacity"
                                >
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-accent-soft shadow-lg border-2 border-border/50 group-hover/user:border-accent transition-colors">
                                        <img src={req.perfiles?.foto_perfil || `https://ui-avatars.com/api/?name=${req.nombre_usuario}`} alt="Avatar" className="w-full h-full object-cover" />
                                    </div >
                                    <div className="min-w-0 text-center lg:text-left">
                                        <h3 className="font-black text-xl text-foreground tracking-tighter truncate">{req.nombre_usuario}</h3>
                                        <div className="inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">@{req.nombre_usuario}</p>
                                        </div>
                                    </div>
                                </Link >
                                <div className="space-y-2 w-full">
                                    <DetailBox label="Nombre Real" value={req.nombre_completo} />
                                    <DetailBox label="Correo" value={req.perfiles?.correo || req.correo} />
                                    <div className="p-3 bg-foreground/5 rounded-2xl border border-border">
                                        <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1">Registro</p>
                                        <p className="text-[10px] font-bold text-foreground">
                                            {req.perfiles?.fecha_creacion ? new Date(req.perfiles.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                                        </p>
                                    </div>
                                </div>
                            </div >

                            {/* Content Sections - Layout Horizontal */}
                            < div className="flex-1 w-full space-y-4" >
                                <div className="p-6 bg-foreground/5 rounded-3xl border border-border flex flex-col gap-1">
                                    <p className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-1">Red Social a Verificar</p>
                                    <p className="text-sm font-black text-foreground break-all">{req.url_red_social}</p>
                                </div>

                                {/* Identificaciones Horizontal */}
                                <div className="p-6 bg-foreground/5 rounded-3xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-1">Documentos de Identidad</p>
                                        <p className="text-[10px] font-bold text-muted/60 uppercase">Doble Cara (Frente / Vuelta)</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <ImageDocPreview
                                            label="Frente"
                                            path={req.url_doc_frontal}
                                        />
                                        {req.url_doc_trasero && (
                                            <ImageDocPreview
                                                label="Vuelta"
                                                path={req.url_doc_trasero}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Motivación Horizontal */}
                                <div className="p-6 bg-foreground/5 rounded-3xl border border-border flex flex-col gap-3">
                                    <p className="text-[9px] font-black uppercase text-muted tracking-[0.2em]">Motivación del Artista</p>
                                    <p className="text-sm text-foreground font-medium italic opacity-80 leading-relaxed">
                                        "{req.motivacion}"
                                    </p>
                                </div>
                            </div >
                        </div >

                        {/* Action Buttons - Centered Position */}
                        < div className="flex flex-wrap justify-center gap-4 mt-4 border-t border-border pt-8" >
                            <button
                                onClick={() => setConfirmAction({ requestId: req.id, userId: req.user_id, status: 'rejected' })}
                                className="px-10 py-4 bg-slate-100 dark:bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                            >
                                Rechazar Solicitud
                            </button>
                            <button
                                onClick={() => setConfirmAction({ requestId: req.id, userId: req.user_id, status: 'reviewed' })}
                                className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted hover:bg-emerald-500/10 hover:text-emerald-500 rounded-2xl transition-all border border-transparent hover:border-emerald-500/20"
                            >
                                Marcar como Revisado
                            </button>
                            <button
                                onClick={() => setConfirmAction({ requestId: req.id, userId: req.user_id, status: 'approved' })}
                                className="px-12 py-4 bg-blue-600 text-[11px] font-black uppercase tracking-widest text-white rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Aprobar Verificación
                            </button>
                        </div >
                    </div >
                ))
            )}

            {/* History Detail Modal */}
            {selectedHistoryReq && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md" onClick={() => setSelectedHistoryReq(null)} />
                    <div className="relative bg-white dark:bg-card border border-border w-full max-w-2xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300">
                        <header className="flex justify-between items-start mb-8 border-b border-border/50 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-accent-soft shrink-0 border border-border/50">
                                    <img src={selectedHistoryReq.perfiles?.foto_perfil || `https://ui-avatars.com/api/?name=${selectedHistoryReq.nombre_usuario}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-foreground truncate">@{selectedHistoryReq.nombre_usuario}</h3>
                                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${selectedHistoryReq.estado === 'aprobado' ? 'bg-emerald-500/10 text-emerald-500' : selectedHistoryReq.estado === 'revisado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {selectedHistoryReq.estado}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedHistoryReq(null)} className="p-3 bg-foreground/5 border border-border rounded-2xl hover:bg-accent hover:text-white hover:border-accent transition-all text-muted">
                                <XCircle size={20} />
                            </button>
                        </header>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailBox label="Nombre Real" value={selectedHistoryReq.nombre_completo} />
                                <DetailBox label="Correo" value={selectedHistoryReq.perfiles?.correo || selectedHistoryReq.correo} />
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-border">
                                <p className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-1">Red Social a Verificar</p>
                                <p className="text-sm font-black text-foreground break-all">{selectedHistoryReq.url_red_social}</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <ImageDocPreview label="Frente" path={selectedHistoryReq.url_doc_frontal} />
                                {selectedHistoryReq.url_doc_trasero && <ImageDocPreview label="Vuelta" path={selectedHistoryReq.url_doc_trasero} />}
                            </div>

                            <div className="p-6 bg-foreground/5 rounded-3xl border border-border flex flex-col gap-3">
                                <p className="text-[9px] font-black uppercase text-muted tracking-[0.2em]">Motivación del Artista</p>
                                <p className="text-sm text-foreground font-medium italic opacity-80 leading-relaxed">
                                    "{selectedHistoryReq.motivacion || 'No proporcionada'}"
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4 pt-6 border-t border-border/50">
                            <button
                                onClick={() => handleDeleteHistoryReq(selectedHistoryReq.id)}
                                className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500 text-[10px] font-black uppercase tracking-widest rounded-3xl text-rose-500 hover:text-white transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Eliminar Verificación Definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Historial de Verificaciones Compacto */}
            {requests.filter(r => r.estado !== 'pendiente').length > 0 && (
                <div className="mt-20 pt-20 border-t border-border">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-muted">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Historial de Verificaciones</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Solicitudes Procesadas</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.filter(r => r.estado !== 'pendiente').map(req => (
                            <div key={req.id} className="group/hist relative bg-card border border-border rounded-[2.5rem] p-6 flex flex-col gap-6 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden bg-foreground/5 border border-border shrink-0">
                                        <img src={req.perfiles?.foto_perfil || `https://ui-avatars.com/api/?name=${req.nombre_usuario}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black uppercase tracking-tight text-foreground truncate">@{req.nombre_usuario}</p>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-none mt-1">{new Date(req.fecha_creacion).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedHistoryReq(req)}
                                        className="flex-1 py-3 bg-foreground/5 border border-border text-[10px] font-black uppercase tracking-widest text-foreground rounded-2xl hover:bg-foreground/10 hover:border-accent/20 transition-all text-center"
                                    >
                                        Ver Detalles
                                    </button>
                                    <div className={`flex-1 flex items-center justify-center py-3 text-center rounded-2xl text-[10px] font-black uppercase tracking-widest ${req.estado === 'aprobado' || req.estado === 'revisado' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {req.estado}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div >
    );
}

function ImageDocPreview({ label, path }: { label: string, path: string }) {
    // 🛡️ SOLUCIÓN 404: Asegurar la URL correcta del bucket público
    const publicUrl = supabase.storage.from('documentos_verificacion').getPublicUrl(path).data.publicUrl;

    return (
        <div className="group/img relative w-24 h-16 rounded-xl overflow-hidden border-2 border-border/50 hover:border-blue-500 transition-all shadow-sm">
            <img
                src={publicUrl}
                className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 transition-all"
                alt={label}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center transition-opacity">
                <a
                    href={publicUrl}
                    target="_blank"
                    className="p-1.5 bg-white text-black rounded-lg hover:scale-110 transition-transform"
                >
                    <ExternalLink size={14} />
                </a>
                <span className="text-[8px] font-black text-white uppercase mt-1 tracking-tighter">{label}</span>
            </div>
        </div>
    );
}

function DetailBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="p-3 bg-foreground/5 rounded-2xl border border-border text-left">
            <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1">{label}</p>
            <p className="text-[10px] font-bold text-foreground truncate">{value || '---'}</p>
        </div>
    );
}

// --- USER MANAGER MODULE ---
function UserManager({ onBack }: { onBack: () => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();



    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .order('fecha_creacion', { ascending: false })
                .limit(100);

            if (error) {
                // Si fecha_de_creacion falla, intentamos sin orden (o con created_at por si acaso)
                const { data: retryData } = await supabase.from('perfiles').select('*').limit(100);
                setUsers(retryData || []);
            } else {
                setUsers(data || []);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Initialize edit form when a user is selected
    useEffect(() => {
        if (selectedUser) {
            const formatDateSafe = (dateStr: any) => {
                try {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return '';
                    return date.toISOString().split('T')[0];
                } catch {
                    return '';
                }
            };

            setEditForm({
                nivel_suscripcion: selectedUser.nivel_suscripcion || 'free',
                fecha_inicio_suscripcion: formatDateSafe(selectedUser.fecha_inicio_suscripcion),
                fecha_termino_suscripcion: formatDateSafe(selectedUser.fecha_termino_suscripcion),
                esta_verificado: selectedUser.esta_verificado || false,
                es_admin: selectedUser.es_admin || false,
                es_soporte: selectedUser.es_soporte || false
            });
        }
    }, [selectedUser]);

    const hasChanges = (() => {
        if (!selectedUser) return false;
        const formatDateSafe = (dateStr: any) => {
            try {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0];
            } catch {
                return '';
            }
        };

        return editForm.nivel_suscripcion !== (selectedUser.nivel_suscripcion || 'free') ||
            editForm.fecha_inicio_suscripcion !== formatDateSafe(selectedUser.fecha_inicio_suscripcion) ||
            editForm.fecha_termino_suscripcion !== formatDateSafe(selectedUser.fecha_termino_suscripcion) ||
            editForm.esta_verificado !== (selectedUser.esta_verificado || false) ||
            editForm.es_admin !== (selectedUser.es_admin || false) ||
            editForm.es_soporte !== (selectedUser.es_soporte || false);
    })();

    const handleSave = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({
                    nivel_suscripcion: editForm.nivel_suscripcion,
                    fecha_inicio_suscripcion: editForm.fecha_inicio_suscripcion ? new Date(editForm.fecha_inicio_suscripcion).toISOString() : null,
                    fecha_termino_suscripcion: editForm.fecha_termino_suscripcion ? new Date(editForm.fecha_termino_suscripcion).toISOString() : null,
                    esta_verificado: editForm.esta_verificado,
                    es_admin: editForm.es_admin,
                    es_soporte: editForm.es_soporte
                })
                .eq('id', selectedUser.id);

            if (error) throw error;

            // Update local lists
            const updatedUser = {
                ...selectedUser,
                nivel_suscripcion: editForm.nivel_suscripcion,
                fecha_inicio_suscripcion: editForm.fecha_inicio_suscripcion ? new Date(editForm.fecha_inicio_suscripcion).toISOString() : null,
                fecha_termino_suscripcion: editForm.fecha_termino_suscripcion ? new Date(editForm.fecha_termino_suscripcion).toISOString() : null,
                esta_verificado: editForm.esta_verificado,
                es_admin: editForm.es_admin,
                es_soporte: editForm.es_soporte
            };

            setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
            setSelectedUser(null);
            showToast("Cambios guardados correctamente", "success");
        } catch (err: any) {
            showToast(err.message || "Error al guardar cambios", "error");
        }
        setSaving(false);
    };

    const filteredUsers = users.filter(u =>
        u.nombre_usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.nombre_artistico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className="px-4 py-2 bg-foreground/5 border border-border rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Gestión de Usuarios</span>
                </div>
            </header>
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, @ o email..."
                    className="w-full pl-12 pr-6 py-4 bg-foreground/5 border border-border rounded-2xl font-bold text-sm outline-none focus:border-accent transition-all text-foreground"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-slate-50 dark:bg-white/5">
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Usuario</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Membresía</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Registro</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted text-center">Admin</th>
                                <th className="px-8 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="py-20 text-center text-muted text-xs font-bold uppercase tracking-widest">No se encontraron usuarios</td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-foreground/[0.03] transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-foreground/5 shrink-0 border border-border">
                                                <img src={user.foto_perfil || `https://ui-avatars.com/api/?name=${user.nombre_usuario}`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-black text-xs text-foreground truncate">@{user.nombre_usuario}</p>
                                                    {user.esta_verificado && (
                                                        <BadgeCheck size={14} className="text-accent fill-accent" />
                                                    )}
                                                </div>
                                                <p className="text-[9px] text-muted uppercase tracking-widest truncate">{user.nombre_artistico}</p>
                                                <p className="text-[8px] text-muted font-bold truncate lowercase">{user.correo || user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`inline-flex px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${user.nivel_suscripcion === 'premium' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            user.nivel_suscripcion === 'pro' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-slate-500/10 text-muted border-slate-500/20'
                                            }`}>
                                            {user.nivel_suscripcion || 'Gratis'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[10px] font-bold text-muted uppercase">
                                            {user.fecha_creacion ? new Date(user.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : '---'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className={`w-2 h-2 rounded-full mx-auto ${user.es_admin ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-white/10'}`} />
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="px-4 py-2 bg-foreground/5 border border-border text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-accent hover:text-white hover:border-accent transition-all"
                                        >
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PREMIUM User Detail Modal */}
            {selectedUser && editForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 dark:bg-black/80" onClick={() => hasChanges ? null : setSelectedUser(null)} />

                    <div className="relative bg-white dark:bg-[#08080a] border border-border dark:border-white/10 w-full max-w-2xl rounded-[3.5rem] p-10 md:p-16 shadow-[0_0_100px_rgba(var(--accent-rgb),0.2)] overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Environmental Glow */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />

                        <header className="relative z-10 mb-12 flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-foreground/5 border border-border shrink-0 shadow-2xl">
                                    <img src={selectedUser.foto_perfil || `https://ui-avatars.com/api/?name=${selectedUser.nombre_usuario}`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground dark:text-white leading-none">{selectedUser.nombre_artistico || 'Sin nombre'}</h3>
                                        {selectedUser.esta_verificado && (
                                            <BadgeCheck size={24} className="text-accent fill-accent animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em]">@{selectedUser.nombre_usuario}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="w-12 h-12 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-full flex items-center justify-center text-foreground dark:text-white hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </header>

                        <div className="relative z-10 grid md:grid-cols-2 gap-8 mb-12">
                            <div className="space-y-6">
                                <DetailItem label="Correo Electrónico" value={selectedUser.correo || selectedUser.email || 'No registrado'} />
                                <DetailItem label="Nombre Completo" value={selectedUser.nombre_completo || 'No especificado'} />
                                <DetailItem label="Fecha de Registro" value={selectedUser.fecha_creacion ? new Date(selectedUser.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No disponible'} />

                                <div className="p-5 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-3xl space-y-3">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Inicio Suscripción</p>
                                    <input
                                        type="date"
                                        value={editForm.fecha_inicio_suscripcion}
                                        onChange={(e) => setEditForm({ ...editForm, fecha_inicio_suscripcion: e.target.value })}
                                        className="w-full bg-transparent font-black text-xs text-foreground dark:text-white outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-5 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-3xl space-y-3">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Membresía Actual</p>
                                    <div className="relative group/select">
                                        <select
                                            value={editForm.nivel_suscripcion}
                                            onChange={(e) => setEditForm({ ...editForm, nivel_suscripcion: e.target.value })}
                                            className={`w-full bg-transparent font-black text-xs uppercase tracking-widest outline-none cursor-pointer appearance-none pr-8 transition-colors ${editForm.nivel_suscripcion === 'premium' ? 'text-blue-500' :
                                                editForm.nivel_suscripcion === 'pro' ? 'text-amber-500' :
                                                    'text-zinc-500 dark:text-zinc-400'
                                                }`}
                                        >
                                            <option value="free" className="text-zinc-800">Gratis (Free)</option>
                                            <option value="pro" className="text-amber-600">Plan Pro</option>
                                            <option value="premium" className="text-blue-600">Plan Premium</option>
                                        </select>
                                        <ChevronRight size={14} className={`absolute right-0 top-1/2 -translate-y-1/2 group-hover/select:translate-x-1 transition-all pointer-events-none ${editForm.nivel_suscripcion === 'premium' ? 'text-blue-500' :
                                            editForm.nivel_suscripcion === 'pro' ? 'text-amber-500' :
                                                'text-zinc-400'
                                            }`} />
                                    </div>
                                </div>

                                <div className="p-5 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-3xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1">Verificación</p>
                                        <p className="font-black text-[10px] text-foreground dark:text-white uppercase tracking-widest">{editForm.esta_verificado ? 'Verificado' : 'Sin Verificar'}</p>
                                    </div>
                                    <button
                                        onClick={() => setEditForm({ ...editForm, esta_verificado: !editForm.esta_verificado })}
                                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${editForm.esta_verificado ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
                                    >
                                        {editForm.esta_verificado ? 'Quitar' : 'Verificar'}
                                    </button>
                                </div>

                                <div className="p-5 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-3xl space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Fin Suscripción</p>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    const base = editForm.fecha_termino_suscripcion ? new Date(editForm.fecha_termino_suscripcion) : new Date();
                                                    base.setDate(base.getDate() + 30);
                                                    setEditForm({ ...editForm, fecha_termino_suscripcion: base.toISOString().split('T')[0] });
                                                }}
                                                className="px-2 py-0.5 bg-accent/10 text-accent text-[8px] font-black rounded-lg hover:bg-accent hover:text-white transition-colors"
                                            >
                                                +30D
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const base = editForm.fecha_termino_suscripcion ? new Date(editForm.fecha_termino_suscripcion) : new Date();
                                                    base.setFullYear(base.getFullYear() + 1);
                                                    setEditForm({ ...editForm, fecha_termino_suscripcion: base.toISOString().split('T')[0] });
                                                }}
                                                className="px-2 py-0.5 bg-accent/10 text-accent text-[8px] font-black rounded-lg hover:bg-accent hover:text-white transition-colors"
                                            >
                                                +1A
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="date"
                                        value={editForm.fecha_termino_suscripcion}
                                        onChange={(e) => setEditForm({ ...editForm, fecha_termino_suscripcion: e.target.value })}
                                        className="w-full bg-transparent font-black text-xs text-foreground dark:text-white outline-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-4 mb-8">
                            <div className="p-5 bg-accent/5 border border-accent/20 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${editForm.es_admin ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-white">Admin</p>
                                        <p className="text-[8px] text-muted font-bold uppercase tracking-widest">{editForm.es_admin ? 'Total' : 'No'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditForm({ ...editForm, es_admin: !editForm.es_admin })}
                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${editForm.es_admin ? 'bg-amber-500 text-white border-amber-600' : 'dark:bg-white/5 border-border'}`}
                                >
                                    {editForm.es_admin ? 'Quitar' : 'Hacer'}
                                </button>
                            </div>

                            <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${editForm.es_soporte ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-white">Soporte</p>
                                        <p className="text-[8px] text-muted font-bold uppercase tracking-widest">{editForm.es_soporte ? 'Activo' : 'No'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditForm({ ...editForm, es_soporte: !editForm.es_soporte })}
                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${editForm.es_soporte ? 'bg-blue-500 text-white border-blue-600' : 'dark:bg-white/5 border-border'}`}
                                >
                                    {editForm.es_soporte ? 'Quitar' : 'Hacer'}
                                </button>
                            </div>
                        </div>

                        <footer className="relative z-10 flex gap-4 pt-8 border-t border-border dark:border-white/10">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`flex-1 h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-3 ${hasChanges
                                    ? 'bg-accent text-white shadow-accent/40'
                                    : 'bg-emerald-600 text-white shadow-emerald-600/30'
                                    }`}
                            >
                                {saving ? <Loader2 className="animate-spin" /> : hasChanges ? <Save size={16} /> : <CheckCircle size={16} />}
                                {hasChanges ? 'Guardar Cambios' : 'Todo en Orden'}
                            </button>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 h-16 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 hover:border-accent/30 text-foreground dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all"
                            >
                                <X size={16} />
                                {hasChanges ? 'Cancelar' : 'Cerrar'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, copyable }: { label: string, value: any, copyable?: boolean }) {
    return (
        <div className="p-4 bg-foreground/5 rounded-2xl border border-border">
            <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">{label}</p>
            <div className={`text-sm font-bold ${copyable ? 'font-mono text-[10px] break-all text-accent' : 'text-foreground'}`}>
                {value || '---'}
            </div>
        </div>
    );
}

// --- COUPON MANAGER MODULE ---
function CouponManager({ onBack }: { onBack: () => void }) {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [formCoupon, setFormCoupon] = useState({
        codigo: '',
        porcentaje_descuento: 20,
        usos_maximos: '',
        fecha_expiracion: '',
        nivel_objetivo: 'todos',
        es_activo: true
    });
    const { showToast } = useToast();

    useEffect(() => { fetchCoupons(); }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('cupones')
                .select('*')
                .is('productor_id', null)
                .order('fecha_creacion', { ascending: false });
            if (error) throw error;
            setCoupons(data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                codigo: formCoupon.codigo.toUpperCase(),
                porcentaje_descuento: formCoupon.porcentaje_descuento,
                usos_maximos: formCoupon.usos_maximos ? parseInt(formCoupon.usos_maximos as string) : null,
                fecha_expiracion: formCoupon.fecha_expiracion || null,
                nivel_objetivo: formCoupon.nivel_objetivo,
                es_activo: formCoupon.es_activo,
                aplica_a: 'suscripciones' // Admin coupons only for subscriptions
            };

            if (editingId) {
                const { error } = await supabase.from('cupones').update(payload).eq('id', editingId);
                if (error) throw error;
                showToast("Cupón actualizado", "success");
            } else {
                const { error } = await supabase.from('cupones').insert([payload]);
                if (error) throw error;
                showToast("Cupón creado", "success");
            }
            setShowModal(false);
            setEditingId(null);
            setFormCoupon({ codigo: '', porcentaje_descuento: 20, usos_maximos: '', fecha_expiracion: '', nivel_objetivo: 'todos', es_activo: true });
            fetchCoupons();
        } catch (error: any) { showToast(error.message, "error"); }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('cupones').delete().eq('id', id);
        if (error) {
            showToast("Error al eliminar", "error");
        } else {
            showToast("Cupón eliminado definitivamente", "success");
            fetchCoupons();
        }
        setConfirmDeleteId(null);
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase.from('cupones').update({ es_activo: !currentStatus }).eq('id', id);
        if (!error) {
            setCoupons(coupons.map(cp => cp.id === id ? { ...cp, es_activo: !currentStatus } : cp));
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormCoupon({ codigo: '', porcentaje_descuento: 20, usos_maximos: '', fecha_expiracion: '', nivel_objetivo: 'todos', es_activo: true });
        setShowModal(true);
    };

    const openEditModal = (cp: any) => {
        setEditingId(cp.id);
        setFormCoupon({
            codigo: cp.codigo,
            porcentaje_descuento: cp.porcentaje_descuento,
            usos_maximos: cp.usos_maximos || '',
            fecha_expiracion: cp.fecha_expiracion ? cp.fecha_expiracion.split('.')[0] : '', // format for datetime-local
            nivel_objetivo: cp.nivel_objetivo || 'todos',
            es_activo: cp.es_activo
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors group">
                    <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
                </button>
                <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
                >
                    <Plus size={14} /> Nuevo Cupón
                </button>
            </header>

            <div className="grid lg:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
                ) : coupons.length === 0 ? (
                    <div className="col-span-full bg-card border border-border rounded-[2.5rem] p-20 text-center">
                        <Ticket size={64} className="mx-auto text-muted/20 mb-6" />
                        <h3 className="text-2xl font-black uppercase text-foreground">Sin cupones activos</h3>
                        <p className="text-muted text-[10px] uppercase font-bold tracking-widest mt-2">Comienza creando una oferta de suscripción.</p>
                    </div>
                ) : (
                    coupons.map(cp => {
                        const isExpired = cp.fecha_expiracion && new Date(cp.fecha_expiracion) < new Date();
                        let tierStyle = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                        if (cp.nivel_objetivo === 'free') tierStyle = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                        if (cp.nivel_objetivo === 'pro') tierStyle = "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
                        if (cp.nivel_objetivo === 'premium') tierStyle = "bg-amber-500/10 text-amber-500 border-amber-500/20";

                        return (
                            <div key={cp.id} className={`group relative bg-card/40 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 transition-all duration-500 hover:border-accent/40 hover:shadow-2xl overflow-hidden flex flex-col ${(!cp.es_activo || isExpired) && 'opacity-60 grayscale'}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-3xl text-foreground tracking-tighter uppercase font-mono">{cp.codigo}</h3>
                                            <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border ${tierStyle}`}>
                                                TARGET: {cp.nivel_objetivo}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${cp.es_activo && !isExpired ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                {isExpired ? 'Expirado' : cp.es_activo ? 'Activo' : 'Pausado'} • {cp.fecha_expiracion ? new Date(cp.fecha_expiracion).toLocaleDateString() : 'Sin Vencimiento'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-accent">-{cp.porcentaje_descuento}%</div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-muted opacity-60">SUSCRIPCIONES</div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between gap-4 relative z-10">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(cp)} className="p-3 rounded-xl bg-foreground/5 text-foreground hover:bg-accent hover:text-white transition-all active:scale-95 shadow-sm">
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => confirmDeleteId === cp.id ? handleDelete(cp.id) : setConfirmDeleteId(cp.id)}
                                            className={`p-3 rounded-xl transition-all active:scale-95 shadow-sm ${confirmDeleteId === cp.id ? 'bg-rose-500 text-white w-32' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                                        >
                                            {confirmDeleteId === cp.id ? <span className="text-[10px] font-black uppercase">¿Borrar?</span> : <Trash2 size={16} />}
                                        </button>
                                        {confirmDeleteId === cp.id && (
                                            <button onClick={() => setConfirmDeleteId(null)} className="p-3 rounded-xl bg-foreground/5 text-muted hover:text-foreground">
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleStatus(cp.id, cp.es_activo)}
                                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${cp.es_activo ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'} active:scale-95 shadow-lg`}
                                    >
                                        {cp.es_activo ? 'Pausar' : 'Reactivar'}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* HIGH-END MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 dark:bg-black/80" onClick={() => setShowModal(false)} />

                    <div className="relative bg-white dark:bg-[#08080a] border border-border dark:border-white/10 w-full max-w-2xl rounded-[3.5rem] p-10 md:p-16 shadow-[0_0_100px_rgba(var(--accent-rgb),0.2)] overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Environmental Glow */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />

                        <header className="relative z-10 mb-12 flex justify-between items-start">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Marketing Engine</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground dark:text-white leading-none">
                                    {editingId ? 'Editar' : 'Crear'} <br />
                                    <span className="text-accent">Cupón.</span>
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-full flex items-center justify-center text-foreground dark:text-white hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleAction} className="relative z-10 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Código Promocional</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                            <Ticket size={18} />
                                        </div>
                                        <input
                                            required
                                            value={formCoupon.codigo}
                                            onChange={e => setFormCoupon({ ...formCoupon, codigo: e.target.value.toUpperCase() })}
                                            placeholder="EJ. VERANO50"
                                            className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all uppercase tracking-[0.2em] placeholder:text-muted/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Descuento (%)</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                            <Percent size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            required
                                            value={formCoupon.porcentaje_descuento || ''}
                                            onChange={e => setFormCoupon({ ...formCoupon, porcentaje_descuento: parseInt(e.target.value) })}
                                            className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-12 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Uso Límite</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                            <Users size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formCoupon.usos_maximos || ''}
                                            onChange={e => setFormCoupon({ ...formCoupon, usos_maximos: e.target.value })}
                                            placeholder="Vacío = Ilimitado"
                                            className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-12 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted/40"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Segmento Objetivo</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                            <Target size={18} />
                                        </div>
                                        <select
                                            value={formCoupon.nivel_objetivo}
                                            onChange={e => setFormCoupon({ ...formCoupon, nivel_objetivo: e.target.value })}
                                            className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-xs outline-none focus:border-accent transition-all uppercase tracking-widest appearance-none cursor-pointer"
                                        >
                                            <option value="todos">Todos (Excl. Free)</option>
                                            <option value="pro">Solo Plan PRO</option>
                                            <option value="premium">Solo Plan PREMIUM</option>
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-muted/30 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Fecha de Expiración</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors pointer-events-none z-10">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="datetime-local"
                                        value={formCoupon.fecha_expiracion}
                                        onChange={e => setFormCoupon({ ...formCoupon, fecha_expiracion: e.target.value })}
                                        className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-xs outline-none focus:border-accent transition-all cursor-pointer relative z-0 [color-scheme:light] dark:[color-scheme:dark]"
                                        placeholder="Vacío = No expira"
                                    />
                                    {!formCoupon.fecha_expiracion && (
                                        <div className="absolute left-14 top-1/2 -translate-y-1/2 text-muted/40 text-xs font-bold pointer-events-none z-10">
                                            Vacío = No expira
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-6 bg-accent/5 border border-accent/20 rounded-2xl">
                                <ShieldCheck size={20} className="text-accent" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/80 leading-relaxed">
                                    Este cupón solo afectará a planes de suscripción. Los porcentajes de regalías de beats no se verán afectados.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full h-16 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.01] shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn mt-8"
                            >
                                {editingId ? <Edit2 size={16} /> : <Save size={16} />}
                                {editingId ? 'Guardar Cambios' : 'Desplegar Cupón'}
                            </button>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}

// --- FEEDBACK MANAGER MODULE ---
function FeedbackManager({ onBack }: { onBack: () => void }) {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('quejas_y_sugerencias')
                .select('*')
                .order('fecha_creacion', { ascending: false });

            if (error) {
                throw error;
            } else if (data) {
                // Hacemos el mapeo manualmente ya que la base de datos no tiene una llave foránea explícita
                const userIds = [...new Set(data.map(d => d.usuario_id).filter(Boolean))];
                let profilesMap: Record<string, any> = {};

                if (userIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('perfiles')
                        .select('id, nombre_artistico, nombre_usuario, foto_perfil')
                        .in('id', userIds);

                    if (profiles) {
                        profiles.forEach(p => { profilesMap[p.id] = p; });
                    }
                }

                const mergedFeedbacks = data.map(item => ({
                    ...item,
                    perfiles: item.usuario_id ? (profilesMap[item.usuario_id] || null) : null
                }));

                setFeedbacks(mergedFeedbacks);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from('quejas_y_sugerencias').update({ estado: newStatus }).eq('id', id);
        if (!error) {
            setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, estado: newStatus } : f));
            showToast("Estado actualizado", "success");
        } else {
            showToast("Error al actualizar estado", "error");
        }
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className={`flex items-center justify-center px-4 py-2 rounded-xl border transition-colors ${feedbacks.filter(f => (f.estado || 'pendiente') === 'pendiente').length > 0 ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-emerald-500/10 border-emerald-500/20'} `}>
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${feedbacks.filter(f => (f.estado || 'pendiente') === 'pendiente').length > 0 ? 'text-amber-500' : 'text-emerald-500'} `}>
                        {feedbacks.filter(f => (f.estado || 'pendiente') === 'pendiente').length} {feedbacks.filter(f => (f.estado || 'pendiente') === 'pendiente').length === 1 ? 'Pendiente' : 'Pendientes'}
                    </span>
                </div>
            </header>
            {feedbacks.filter(f => (f.estado || 'pendiente') === 'pendiente').length === 0 ? (
                <div className="bg-card border border-border rounded-[2.5rem] p-12 text-center">
                    <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-xl font-black uppercase text-foreground">Buzón de sugerencias vacío</h3>
                    <p className="text-muted text-[10px] uppercase font-bold tracking-widest mt-2">No hay quejas o sugerencias en este momento.</p>
                </div>
            ) : (
                feedbacks.filter(f => (f.estado || 'pendiente') === 'pendiente').map((item) => {
                    const isPending = (item.estado || 'pendiente') === 'pendiente';
                    return (
                        <div
                            key={item.id}
                            className={`bg-card border rounded-[2.5rem] p-8 space-y-6 flex flex-col transition-all duration-500 overflow-hidden relative ${isPending
                                ? 'border-amber-500/40 ring-1 ring-amber-500/10'
                                : 'border-border opacity-80'
                                } hover:border-accent/30`}
                        >
                            {isPending && (
                                <div className="absolute top-0 right-0 px-4 py-1 bg-amber-500 text-[8px] font-black text-white rounded-bl-xl uppercase tracking-widest animate-pulse">
                                    Por revisar
                                </div>
                            )}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${item.tipo_mensaje === 'queja' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                            {item.tipo_mensaje === 'queja' ? 'QUEJA' : 'SUGERENCIA'}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                            {new Date(item.fecha_creacion).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-xl text-foreground">De: {item.perfiles ? item.perfiles.nombre_artistico || item.perfiles.nombre_usuario : item.usuario_q}</h3>
                                    <p className="text-xs text-muted font-bold tracking-widest uppercase">{item.correo} {item.perfiles && `(Usuario Registrado)`}</p>
                                </div>

                                <select
                                    value={item.estado || 'pendiente'}
                                    onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border transition-colors cursor-pointer ${item.estado === 'pendiente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : item.estado === 'leido' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="leido">Leído</option>
                                    <option value="resuelto">Resuelto</option>
                                </select>
                            </div>

                            <div className="p-6 bg-foreground/5 rounded-2xl border border-border">
                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-3">Mensaje</p>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.descripcion_problema}</p>
                            </div>

                            {/* Evidencias Layout */}
                            {(item.evidencia_1 || item.evidencia_2 || item.evidencia_3) && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest px-2">Evidencias Adjuntas</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        {[item.evidencia_1, item.evidencia_2, item.evidencia_3].map((path, idx) => {
                                            if (!path) return null;
                                            const publicUrl = supabase.storage.from('evidencias_quejas').getPublicUrl(path).data.publicUrl;
                                            return (
                                                <div key={idx} className="group/img relative aspect-square bg-slate-50 dark:bg-white/5 rounded-3xl overflow-hidden border border-border shadow-md hover:border-accent/40 transition-all duration-500">
                                                    <img src={publicUrl} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" title="Ver evidencia completa" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-2xl">
                                                            <ExternalLink size={18} />
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })
            )}

            {/* Historial de Feedback Compacto */}
            {feedbacks.filter(f => (f.estado || 'pendiente') !== 'pendiente').length > 0 && (
                <div className="mt-20 pt-20 border-t border-border">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-muted">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Historial de Sugerencias</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Mensajes Procesados</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-foreground/[0.03]">
                                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Fecha</th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Usuario</th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Tipo</th>
                                    <th className="px-8 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {feedbacks.filter(f => (f.estado || 'pendiente') !== 'pendiente').map(item => (
                                    <tr key={item.id} className="hover:bg-foreground/[0.03] transition-colors">
                                        <td className="px-8 py-4 text-[10px] font-bold text-muted">
                                            {new Date(item.fecha_creacion).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-xs">@{item.perfiles ? item.perfiles.nombre_usuario : item.usuario_q}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${item.tipo_mensaje === 'queja' ? 'bg-rose-500/5 text-rose-500 border-rose-500/10' : 'bg-blue-500/5 text-blue-500 border-blue-500/10'}`}>
                                                {item.tipo_mensaje}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest ${item.estado === 'resuelto' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {item.estado}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- INCOME MANAGER MODULE ---
function IncomeManager({ onBack }: { onBack: () => void }) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transacciones')
                .select(`
                    *,
                    comprador:comprador_id(nombre_usuario, nombre_artistico, foto_perfil, correo),
                    vendedor:vendedor_id(nombre_usuario, nombre_artistico, foto_perfil, correo)
                `)
                .order('fecha_creacion', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (err) {
            console.error(err);
            showToast("Error al cargar transacciones", "error");
        }
        setLoading(false);
    };

    const totalHistorical = transactions.reduce((acc, tx) => acc + (tx.precio || 0), 0);
    const totalMonthly = transactions.filter(tx => {
        const date = new Date(tx.fecha_creacion);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((acc, tx) => acc + (tx.precio || 0), 0);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                        ← Volver al Dashboard
                    </button>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Ingresos del <span className="text-accent">Sitio</span></h2>
                </div>

                <div className="flex gap-4">
                    <div className="px-8 py-5 bg-card border border-border rounded-[2rem] text-center hover:border-accent/30 transition-all">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1">Este Mes</p>
                        <p className="text-2xl font-black text-accent tabular-nums">${totalMonthly.toLocaleString()}</p>
                    </div>
                    <div className="px-8 py-5 bg-card border border-border rounded-[2rem] text-center hover:border-accent/30 transition-all">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1">Total Histórico</p>
                        <p className="text-2xl font-black text-foreground tabular-nums">${totalHistorical.toLocaleString()}</p>
                    </div>
                </div>
            </header>

            <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-2xl shadow-foreground/5 relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-foreground/[0.03]">
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Orden / Fecha</th>
                                <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Producto</th>
                                <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Comprador</th>
                                <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Vendedor</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Monto</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-muted text-xs font-bold uppercase tracking-widest">No hay transacciones registradas</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest mb-1">#{tx.id.slice(0, 8)}</p>
                                        <p className="text-[9px] font-bold text-muted uppercase">{new Date(tx.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                                {tx.tipo_producto === 'beat' ? <Music size={14} /> : tx.tipo_producto === 'plan' ? <Crown size={14} /> : <Layout size={14} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-xs uppercase tracking-tight text-foreground">{tx.nombre_producto || 'Producto sin nombre'}</p>
                                                <p className="text-[9px] text-muted uppercase font-bold tracking-widest">{tx.tipo_producto}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        {tx.comprador ? (
                                            <div className="flex items-center gap-2">
                                                <img src={tx.comprador.foto_perfil || `https://ui-avatars.com/api/?name=${tx.comprador.nombre_usuario}`} className="w-6 h-6 rounded-full border border-border" />
                                                <p className="font-bold text-[10px] text-foreground">@{tx.comprador.nombre_usuario}</p>
                                            </div>
                                        ) : <span className="text-[10px] text-muted">---</span>}
                                    </td>
                                    <td className="px-6 py-6">
                                        {tx.vendedor ? (
                                            <div className="flex items-center gap-2">
                                                <img src={tx.vendedor.foto_perfil || `https://ui-avatars.com/api/?name=${tx.vendedor.nombre_usuario}`} className="w-6 h-6 rounded-full border border-border" />
                                                <p className="font-bold text-[10px] text-foreground">@{tx.vendedor.nombre_usuario}</p>
                                            </div>
                                        ) : <span className="text-[10px] text-muted italic">Tianguis</span>}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-xs text-emerald-500 tabular-nums">
                                        ${tx.precio?.toLocaleString() || '0'}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => setSelectedTx(tx)}
                                            className="px-3 py-1.5 bg-foreground/5 border border-border rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-all"
                                        >
                                            Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalles de Transacción */}
            {selectedTx && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setSelectedTx(null)} />
                    <div className="relative w-full max-w-2xl bg-card border border-border rounded-[3rem] shadow-2xl p-10 overflow-hidden">
                        <header className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground">Detalles de <span className="text-accent">Orden</span></h3>
                                <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em]">ID: {selectedTx.id}</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="w-12 h-12 bg-foreground/5 border border-border rounded-full flex items-center justify-center text-foreground hover:bg-rose-500 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </header>

                        <div className="grid md:grid-cols-2 gap-8 mb-10">
                            <div className="space-y-6">
                                <div className="p-6 bg-foreground/5 rounded-3xl border border-border">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-3">Información del Producto</p>
                                    <p className="text-lg font-black text-foreground uppercase tracking-tight">{selectedTx.nombre_producto}</p>
                                    <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">{selectedTx.tipo_producto}</p>
                                    {selectedTx.tipo_licencia && <p className="text-[10px] text-muted uppercase font-bold mt-2">Licencia: {selectedTx.tipo_licencia}</p>}
                                </div>

                                <div className="p-6 bg-foreground/5 rounded-3xl border border-border">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-3">Comprador</p>
                                    <div className="flex items-center gap-3">
                                        <img src={selectedTx.comprador?.foto_perfil || `https://ui-avatars.com/api/?name=${selectedTx.comprador?.nombre_usuario}`} className="w-10 h-10 rounded-xl border border-border" />
                                        <div>
                                            <p className="font-black text-sm text-foreground">@{selectedTx.comprador?.nombre_usuario}</p>
                                            <p className="text-[10px] text-muted uppercase font-bold">{selectedTx.comprador?.correo}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
                                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-3">Monto de Transacción</p>
                                    <p className="text-4xl font-black text-emerald-500 tabular-nums">${selectedTx.precio?.toLocaleString()}</p>
                                    <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest mt-1">Moneda: {selectedTx.moneda || 'MXN'}</p>
                                </div>

                                <div className="p-6 bg-foreground/5 rounded-3xl border border-border">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-3">Vendedor</p>
                                    {selectedTx.vendedor ? (
                                        <div className="flex items-center gap-3">
                                            <img src={selectedTx.vendedor.foto_perfil || `https://ui-avatars.com/api/?name=${selectedTx.vendedor.nombre_usuario}`} className="w-10 h-10 rounded-xl border border-border" />
                                            <div>
                                                <p className="font-black text-sm text-foreground">@{selectedTx.vendedor.nombre_usuario}</p>
                                                <p className="text-[10px] text-muted uppercase font-bold">{selectedTx.vendedor.correo}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <p className="font-black text-sm text-foreground uppercase tracking-widest">Tianguis Beats</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-foreground/5 rounded-3xl border border-border flex items-center justify-between mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Método de Pago</p>
                                <p className="font-black text-[10px] text-foreground uppercase tracking-widest">{selectedTx.metodo_pago || 'Stripe'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Status</p>
                                <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full">Completado</span>
                            </div>
                        </div>

                        <button onClick={() => setSelectedTx(null)} className="w-full h-16 bg-foreground text-background dark:bg-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.02] transition-all active:scale-95 shadow-xl">
                            Cerrar Detalles
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- BEATS MANAGER MODULE ---
function BeatsManager({ onBack }: { onBack: () => void }) {
    const [beats, setBeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBeats = async () => {
            const { data, error } = await supabase
                .from('beats')
                .select(`*, perfiles:productor_id (nombre_usuario, nombre_artistico)`)
                .order('fecha_creacion', { ascending: false });
            if (!error) setBeats(data || []);
            setLoading(false);
        };
        fetchBeats();
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Catálogo Global de Beats</span>
                </div>
            </header>

            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-foreground/[0.03]">
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Fecha</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Productor</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Beat</th>
                                <th className="px-8 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></td></tr>
                            ) : beats.length === 0 ? (
                                <tr><td colSpan={4} className="py-20 text-center text-muted text-xs font-bold uppercase tracking-widest">No hay beats registrados</td></tr>
                            ) : beats.map(beat => (
                                <tr key={beat.id} className="hover:bg-foreground/[0.03] transition-colors">
                                    <td className="px-8 py-5 text-[10px] font-bold text-muted">
                                        {new Date(beat.fecha_creacion).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-black text-xs">{beat.perfiles?.nombre_artistico || 'Desconocido'}</p>
                                        <p className="text-[9px] text-muted uppercase tracking-widest">@{beat.perfiles?.nombre_usuario}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-xs">{beat.titulo}</p>
                                        <p className="text-[9px] text-muted uppercase tracking-widest">{beat.genero} • {beat.bpm} BPM</p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <Link href={`/beat/${beat.id}`} target="_blank" className="p-2 bg-foreground/5 border border-border rounded-lg hover:bg-accent hover:text-white hover:border-accent transition-all inline-block">
                                            <ExternalLink size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
