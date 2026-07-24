"use client";

import React, { useEffect, useState } from 'react';
import { supabase, getUserSafe } from '@/lib/supabase';
import {
    Users, DollarSign, Music, CheckCircle, Clock, Trash2,
    ChevronRight, Search, Loader2, ArrowUpRight, ArrowDownRight,
    TrendingUp, Calendar, Layout, Mail, ShieldCheck, UserPlus,
    ExternalLink, Filter, MoreVertical, X, AlertTriangle, AlertCircle,
    Ticket, MessageSquare, XCircle, Edit2, Save, Crown, User, FileKey,
    Plus, Percent, BadgeCheck, ShieldAlert, Target, ChevronDown,
    Package, Download, CreditCard, CheckCircle2, FileText, Star, Settings2, Power, Globe, ShoppingCartIcon
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';
import { useGestionUsuarios } from '@/hooks/admin/useGestionUsuarios';
import { useGestionFeedback } from '@/hooks/admin/useGestionFeedback';
import { useGestionBeats } from '@/hooks/admin/useGestionBeats';
import { useGestionControles } from '@/hooks/admin/useGestionControles';
import { useEstadisticasGlobales } from '@/hooks/admin/useEstadisticasGlobales';
import { useGestionCupones } from '@/hooks/admin/useGestionCupones';
import { useGestionVerificaciones } from '@/hooks/admin/useGestionVerificaciones';
import { useLicensePreview } from '@/hooks/admin/useLicensePreview';
import { useGestionIngresos } from '@/hooks/admin/useGestionIngresos';
import { MetricaStorage } from '@/components/admin/MetricaStorage';

type View = 'dashboard' | 'verifications' | 'users' | 'coupons' | 'feedback' | 'income' | 'beats' | 'controls' | 'licenses';

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const { showToast } = useToast();

    useEffect(() => {
        const checkAdmin = async () => {
            const user = await getUserSafe();
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
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                        <span className="opacity-40">Panel de</span> <br />
                        <span className="text-blue-500 relative inline-block">
                            Administrador
                            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                        </span>
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
                {currentView === 'controls' && <ControlsManager onBack={() => setCurrentView('dashboard')} />}
                {currentView === 'licenses' && <LicensePreviewManager onBack={() => setCurrentView('dashboard')} />}
            </div>
        </div>
    );
}

// --- GLOBAL STATS MODULE ---
function GlobalStats({ onViewChange }: { onViewChange: (view: View) => void }) {
    const { showToast } = useToast();
    const { stats, loading } = useEstadisticasGlobales({
        onError: (m) => showToast(m, 'error'),
    });

    if (loading) return <LoadingTianguis />;

    const formatStatValue = (val: number | string, isCurrency: boolean = false) => {
        const num = Number(val);
        if (isNaN(num)) return val;

        if (num >= 10000) {
            const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
            return isCurrency ? `$${formatted}` : formatted;
        }

        return isCurrency ? `$${num.toLocaleString()}` : num.toLocaleString();
    };

    const cards = [
        { id: 'income', label: 'Ingresos Totales', value: formatStatValue(stats.totalSales, true), sub: 'Ventas Globales Históricas', icon: <DollarSign className="text-emerald-500" />, gradient: '' },
        { id: 'users', label: 'Usuarios', value: formatStatValue(stats.totalUsers), sub: 'Productores registrados', icon: <Users className="text-blue-500" />, gradient: '' },
        { id: 'beats', label: 'Total Beats', value: formatStatValue(stats.totalBeats), sub: 'En catálogo global', icon: <Music className="text-purple-500" />, gradient: '' },
        { id: 'verifications', label: 'Verificaciones', value: stats.pendingVerifications, sub: 'Solicitudes por revisar', icon: <img src="/verified-badge.png" alt="Verified" className="w-10 h-10 object-contain" />, gradient: '' },
        { id: 'coupons', label: 'Cupones', value: stats.totalCoupons, sub: 'Cupones activos', icon: <Ticket className="text-amber-500" />, gradient: '' },
        { id: 'feedback', label: 'Buzón', value: stats.pendingFeedback, sub: 'Quejas y sugerencias', icon: <MessageSquare className="text-rose-500" />, gradient: '' },
        { id: 'licenses', label: 'Licencias', value: 'PREVIEW', sub: 'Editor y PDF de Contratos', icon: <FileText className="text-indigo-500" />, gradient: 'bg-indigo-500/5' },
        { id: 'controls', label: 'Controles', value: 'MASTER', sub: 'Ajustes Globales', icon: <Settings2 className="text-blue-400" />, gradient: 'bg-blue-500/5' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {cards.map((card, i) => (
                <button
                    key={i}
                    onClick={() => onViewChange(card.id as View)}
                    className={`bg-card border border-border rounded-[3.5rem] p-12 transition-all duration-500 group hover:scale-[1.02] hover:border-accent/40 ${card.gradient} flex flex-col items-center text-center relative overflow-hidden`}
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
    const { showToast } = useToast();
    const {
        requests,
        loading,
        confirmAction,
        setConfirmAction,
        selectedHistoryReq,
        setSelectedHistoryReq,
        handleDeleteHistoryReq,
        handleDecision,
        handleRevert,
    } = useGestionVerificaciones({
        onError: (m) => showToast(m, 'error'),
        onExito: (m) => showToast(m, 'success'),
    });

    if (loading) return <LoadingTianguis />;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className={`flex items-center justify-center px-4 py-2 rounded-xl border transition-all ${requests.filter(r => r.estado === 'pendiente').length > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} `}>
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${requests.filter(r => r.estado === 'pendiente').length > 0 ? 'text-amber-500' : 'text-emerald-500'} `}>
                        {requests.filter(r => r.estado === 'pendiente').length} {requests.filter(r => r.estado === 'pendiente').length === 1 ? 'Pendiente' : 'Pendientes'}
                    </span>
                </div>
            </header>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md" onClick={() => setConfirmAction(null)} />
                    <div className="relative bg-white dark:bg-card border border-border w-full max-w-md rounded-2xl md:rounded-[3rem] p-6 md:p-10 text-center animate-in zoom-in duration-300">
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
                                className={`py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl text-white transition-all scale-100 hover:scale-105 active:scale-95 ${confirmAction.status === 'approved' ? 'bg-emerald-500' : confirmAction.status === 'reviewed' ? 'bg-blue-500' : 'bg-rose-500'} `}
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
                    <div key={req.id} className="relative bg-card border-t-4 border-t-blue-600 border-x border-b border-border rounded-[2.5rem] p-8 flex flex-col gap-8 hover:border-accent/30 transition-all duration-500">

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* User Info Section - Photo above, text below */}
                            <div className="lg:w-1/4 w-full flex flex-col items-center lg:items-start">
                                <Link
                                    href={`/${req.nombre_usuario}`}
                                    target="_blank"
                                    className="group/user mb-6 flex flex-col items-center lg:items-start gap-4 hover:opacity-80 transition-opacity"
                                >
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-accent-soft border-2 border-border/50 group-hover/user:border-accent transition-colors">
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
                                    <p className="text-sm text-foreground font-medium opacity-80 leading-relaxed">
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
                                className="px-12 py-4 bg-blue-600 text-[11px] font-black uppercase tracking-widest text-white rounded-2xl hover:scale-105 active:scale-95 transition-all"
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
                    <div className="relative bg-white dark:bg-card border border-border w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
                        <header className="flex justify-between items-start mb-8 border-b border-border/50 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-accent-soft shrink-0 border border-border/50">
                                    <img src={selectedHistoryReq.perfiles?.foto_perfil || `https://ui-avatars.com/api/?name=${selectedHistoryReq.nombre_usuario}`} className="w-full h-full object-cover" alt={selectedHistoryReq.nombre_usuario} />
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
                                <p className="text-sm text-foreground font-medium opacity-80 leading-relaxed">
                                    "{selectedHistoryReq.motivacion || 'No proporcionada'}"
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4 pt-6 border-t border-border/50">
                            <button
                                onClick={() => handleDeleteHistoryReq(selectedHistoryReq.id)}
                                className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500 text-[10px] font-black uppercase tracking-widest rounded-3xl text-rose-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
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
                            <div key={req.id} className="group/hist relative bg-card border border-border rounded-[2.5rem] p-6 flex flex-col gap-6 hover:border-accent/30 transition-all duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden bg-foreground/5 border border-border shrink-0">
                                        <img src={req.perfiles?.foto_perfil || `https://ui-avatars.com/api/?name=${req.nombre_usuario}`} className="w-full h-full object-cover" alt={req.nombre_usuario} />
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
                                    <div className={`flex-1 flex items-center justify-center py-3 text-center rounded-2xl text-[10px] font-black uppercase tracking-widest ${req.estado === 'aprobado' || req.estado === 'revisado' ? 'bg-emerald-500 text-white' : 'bg-rose-500/10 text-rose-500'}`}>
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
        <div className="group/img relative w-24 h-16 rounded-xl overflow-hidden border-2 border-border/50 hover:border-blue-500 transition-all">
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
    const { showToast } = useToast();
    const {
        filteredUsers,
        loading,
        searchTerm,
        setSearchTerm,
        selectedUser,
        setSelectedUser,
        editForm,
        setEditForm,
        hasChanges,
        saving,
        handleSave,
    } = useGestionUsuarios({
        onError: (m) => showToast(m, 'error'),
        onExito: (m) => showToast(m, 'success'),
    });

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
                                        <div className={`w-2 h-2 rounded-full mx-auto ${user.es_admin ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`} />
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

                    <div className="relative bg-white dark:bg-[#08080a] border border-border dark:border-white/10 w-full max-w-2xl rounded-[3.5rem] p-10 md:p-16 overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Environmental Glow */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />

                        <header className="relative z-10 mb-12 flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-foreground/5 border border-border shrink-0">
                                    <img src={selectedUser.foto_perfil || `https://ui-avatars.com/api/?name=${selectedUser.nombre_usuario}`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground dark:text-white leading-none">{selectedUser?.nombre_artistico || selectedUser?.nombre_usuario || 'Sin nombre'}</h3>
                                        {selectedUser?.esta_verificado && (
                                            <img
                                                src="/verified-badge.png"
                                                alt="Verificado"
                                                className="w-6 h-6 object-contain"
                                            />
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
                                <MetricaStorage username={selectedUser.nombre_usuario} />

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
                                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${editForm.esta_verificado ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500 text-white'}`}
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
                                className={`flex-1 h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${hasChanges
                                    ? 'bg-accent text-white'
                                    : 'bg-emerald-600 text-white'
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
    const { showToast } = useToast();
    const {
        coupons,
        loading,
        showModal,
        setShowModal,
        editingId,
        confirmDeleteId,
        setConfirmDeleteId,
        isStripeOnly,
        formCoupon,
        setFormCoupon,
        handleAction,
        handleDelete,
        toggleStatus,
        openCreateModal,
        openStripeOnlyModal,
        openEditModal,
    } = useGestionCupones({
        onError: (m) => showToast(m, 'error'),
        onExito: (m) => showToast(m, 'success'),
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors group">
                    <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={openStripeOnlyModal}
                        className="px-6 py-3 bg-slate-900 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:border-accent hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <CreditCard size={14} /> Vincular Stripe
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={14} /> Cupón Interno
                    </button>
                </div>
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
                        return (
                            <div key={cp.id} className={`group relative bg-card border rounded-[2.5rem] p-8 transition-all duration-500 hover:border-accent/40 overflow-hidden flex flex-col ${(!cp.es_activo || isExpired) ? 'opacity-70 grayscale-[0.5]' : 'border-border'}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-accent/10 rounded-2xl text-accent border border-accent/20">
                                                <Ticket size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground group-hover:text-accent font-mono transition-colors">{cp.codigo}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cp.es_activo && !isExpired ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted leading-none">
                                                        {isExpired ? 'Expirado' : cp.es_activo ? 'Activo' : 'Pausado'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-black text-accent leading-none">-{cp.porcentaje_descuento}%</div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-muted mt-2 opacity-60">SUSCRIPCIONES</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                    <div className="p-4 bg-foreground/5 rounded-2xl border border-border/50">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-1.5">
                                            <Calendar size={10} /> Expiración
                                        </p>
                                        <p className="text-[10px] font-bold text-foreground uppercase">
                                            {cp.fecha_expiracion ? new Date(cp.fecha_expiracion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : 'Sin Límite'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-foreground/5 rounded-2xl border border-border/50">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-1.5">
                                            <Target size={10} /> Alcance
                                        </p>
                                        <p className="text-[10px] font-bold text-foreground uppercase truncate">
                                            {cp.nivel_objetivo === 'todos' ? 'Todos' : cp.nivel_objetivo.toUpperCase()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between gap-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleStatus(cp.id, cp.es_activo)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${cp.es_activo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${cp.es_activo ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted">Habilitado</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(cp)} className="p-2.5 rounded-xl bg-foreground/5 text-muted hover:bg-accent hover:text-white transition-all active:scale-95 border border-border/50">
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => confirmDeleteId === cp.id ? handleDelete(cp.id) : setConfirmDeleteId(cp.id)}
                                            className={`p-2.5 rounded-xl transition-all active:scale-95 border flex items-center justify-center gap-2 ${confirmDeleteId === cp.id
                                                ? 'bg-rose-500 text-white border-rose-600 px-4'
                                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                                                }`}
                                        >
                                            {confirmDeleteId === cp.id ? <span className="text-[8px] font-black uppercase">¿Borrar?</span> : <Trash2 size={14} />}
                                            {confirmDeleteId === cp.id && <Trash2 size={12} />}
                                        </button>
                                        {confirmDeleteId === cp.id && (
                                            <button onClick={() => setConfirmDeleteId(null)} className="p-2.5 rounded-xl bg-foreground/5 text-muted hover:text-foreground border border-border/50">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
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

                    <div className="relative bg-white dark:bg-[#08080a] border border-border dark:border-white/10 w-full max-w-2xl rounded-[3.5rem] p-10 md:p-16 overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Environmental Glow */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />

                        <header className="relative z-10 mb-12 flex justify-between items-start">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Marketing Engine</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground dark:text-white leading-none">
                                    {editingId ? 'Editar' : 'Vincular'} <br />
                                    <span className="text-accent">{isStripeOnly ? 'Stripe.' : 'Interno.'}</span>
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-full flex items-center justify-center text-foreground dark:text-white hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleAction} className="relative z-10 space-y-6">
                            <div className={`grid md:grid-cols-2 gap-6 ${isStripeOnly ? 'flex flex-col' : ''}`}>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Nombre / Código</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                            <Ticket size={18} />
                                        </div>
                                        <input
                                            required
                                            value={formCoupon.codigo}
                                            onChange={e => setFormCoupon({ ...formCoupon, codigo: e.target.value.toUpperCase() })}
                                            placeholder="EJ. PROMO_VERANO"
                                            className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all uppercase tracking-[0.2em] placeholder:text-muted/20"
                                        />
                                    </div>
                                </div>

                                <div className={`space-y-2 col-span-2 md:col-span-1 ${isStripeOnly ? 'block' : 'hidden'}`}>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1 font-black text-accent">ID de Cupón Stripe</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-accent transition-colors">
                                            <CreditCard size={18} />
                                        </div>
                                        <input
                                            required={isStripeOnly}
                                            value={formCoupon.id_cupon_stripe}
                                            onChange={e => setFormCoupon({ ...formCoupon, id_cupon_stripe: e.target.value })}
                                            placeholder="promo_1TB..."
                                            className="w-full h-14 bg-accent/5 border border-accent/30 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all placeholder:text-muted/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Vista de Descuento (Texto)</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                            <MessageSquare size={18} />
                                        </div>
                                        <input
                                            value={formCoupon.texto_descuento}
                                            onChange={e => setFormCoupon({ ...formCoupon, texto_descuento: e.target.value })}
                                            placeholder="EJ. 3 MESES GRATIS"
                                            className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all placeholder:text-muted/20"
                                        />
                                    </div>
                                </div>

                                {!isStripeOnly && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">
                                                {isStripeOnly ? 'Descuento Estimado (Cálculo Carrito %)' : 'Descuento (%)'}
                                            </label>
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
                                    </>
                                )}

                                {isStripeOnly && (
                                    <>
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
                                    </>
                                )}
                            </div>

                            {!isStripeOnly && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">
                                        Fecha de Expiración <span className="text-muted/40 lowercase ml-2 font-bold">(vacío no expira)</span>
                                    </label>
                                    <div
                                        className="relative group cursor-pointer"
                                        onClick={(e) => {
                                            const input = (e.currentTarget as HTMLElement).querySelector('input');
                                            if (input && 'showPicker' in input) {
                                                try { input.showPicker(); } catch (e) { console.error(e); }
                                            }
                                        }}
                                    >
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors pointer-events-none z-10">
                                            <Calendar size={18} />
                                        </div>
                                        <input
                                            type="datetime-local"
                                            value={formCoupon.fecha_expiracion}
                                            onChange={e => setFormCoupon({ ...formCoupon, fecha_expiracion: e.target.value })}
                                            className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-xs outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}


                            <button
                                type="submit"
                                className="w-full h-16 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 active:scale-95 group/btn mt-8"
                            >
                                {editingId ? <Edit2 size={16} /> : <Save size={16} />}
                                {editingId ? 'Guardar Cambios' : 'Desplegar Cupón'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- FEEDBACK MANAGER MODULE ---
function FeedbackManager({ onBack }: { onBack: () => void }) {
    const { showToast } = useToast();
    const { feedbacks, loading, handleUpdateStatus } = useGestionFeedback({
        onError: (m) => showToast(m, 'error'),
        onExito: (m) => showToast(m, 'success'),
    });

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className={`flex items-center justify-center px-4 py-2 rounded-xl border transition-colors ${feedbacks.filter(f => (f.estado || 'pendiente') === 'pendiente').length > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} `}>
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
                                                <div key={idx} className="group/img relative aspect-square bg-slate-50 dark:bg-white/5 rounded-3xl overflow-hidden border border-border hover:border-accent/40 transition-all duration-500">
                                                    <img src={publicUrl} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" title="Ver evidencia completa" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
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
    const { showToast } = useToast();
    const {
        filteredOrders,
        loading,
        selectedOrder,
        setSelectedOrder,
        searchTerm,
        setSearchTerm,
        categoryFilter,
        setCategoryFilter,
        totalHistorical,
        totalMonthly,
        handleDownloadReceipt,
    } = useGestionIngresos({
        onInfo: (m) => showToast(m, 'info'),
        onError: (m) => showToast(m, 'error'),
        onExito: (m) => showToast(m, 'success'),
    });

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                        ← Volver al Dashboard
                    </button>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Ingresos del <span className="text-accent">Sitio</span></h2>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
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
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por Licencia, Nombre o # Pedido..."
                        className="w-full pl-16 pr-6 py-5 bg-card border border-border rounded-[2rem] font-bold text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-foreground"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative group">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={18} />
                    <select
                        className="w-full pl-16 pr-10 py-5 bg-card border border-border rounded-[2rem] font-bold text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-foreground appearance-none cursor-pointer"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">Categoría: Ver Todo</option>
                        <option value="beat">Beat</option>
                        <option value="soundkit">Sound Kit</option>
                        <option value="service">Servicio</option>
                        <option value="plan">Suscripción</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl md:rounded-[3rem] overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-foreground/[0.03]">
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Pedido / Fecha</th>
                                <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Items</th>
                                <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Comprador</th>
                                <th className="px-6 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Vendedor</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Monto Total</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-muted text-xs font-bold uppercase tracking-widest">No hay transacciones registradas</td></tr>
                            ) : filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest mb-1">
                                            {order.orden_pedido || `#${order.id.slice(0, 8).toUpperCase()}`}
                                        </p>
                                        <p className="text-[9px] font-bold text-muted uppercase">
                                            {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {order.items.map((item: any) => (
                                                <div key={item.id} className="px-3 py-1 bg-accent/5 border border-accent/10 rounded-full flex items-center gap-2 group-hover:bg-accent/10 transition-colors">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-accent">
                                                        {item.product_type === 'beat' ? 'Beat' :
                                                            item.product_type === 'plan' ? `Suscripción ${item.metadata?.cycle === 'yearly' ? 'Anual' : 'Mensual'}` :
                                                                item.product_type === 'soundkit' || item.product_type === 'sound_kit' ? 'Sound Kit' :
                                                                    item.product_type === 'service' ? 'Servicio' : item.product_type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <p className="font-bold text-[10px] text-foreground uppercase">@{order.comprador?.nombre_usuario || '---'}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <p className="font-bold text-[10px] text-muted uppercase">{order.vendedor?.nombre_usuario ? `@${order.vendedor.nombre_usuario}` : 'Tianguis Beats'}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-xs text-emerald-500 tabular-nums">
                                        ${order.total_amount.toLocaleString()} <span className="text-[8px] opacity-60 uppercase">{order.currency}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                                        >
                                            Ver detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalles de Pedido Unificado - REDISEÑADO */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-background/40 backdrop-blur-xl animate-in fade-in duration-500"
                        onClick={() => setSelectedOrder(null)}
                    />
                    <div className="relative w-full max-w-3xl bg-white dark:bg-[#08080a] border border-border/50 rounded-[3.5rem] overflow-hidden animate-in zoom-in-95 fade-in duration-500 mb-20 border-t-8 border-t-blue-600">

                        {/* Header Minimalista */}
                        <div className="p-10 pb-6 flex items-center justify-between relative">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Transacción Completada</span>
                                </div>
                                <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground">Detalles de <span className="text-blue-600">Venta</span></h3>
                                <p className="text-[11px] font-bold text-muted uppercase tracking-[0.3em] mt-1 opacity-60">ADMINISTRATION RECEIPT</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-14 h-14 rounded-[2rem] bg-foreground/5 border border-border flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Contenido Principal */}
                        <div className="px-10 pb-10 space-y-8">

                            {/* Grid de 4 tarjetas estilo My Subscription */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-6 bg-slate-50 dark:bg-white/5 border border-border/50 rounded-[2.5rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full" />
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <CreditCard size={12} className="text-blue-500" /> Pago
                                    </p>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{selectedOrder.payment_method}</p>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">Stripe Checkout</p>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-white/5 border border-border/50 rounded-[2.5rem] relative overflow-hidden group">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Calendar size={12} className="text-purple-500" /> Fecha
                                    </p>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                        {new Date(selectedOrder.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </p>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                                        {new Date(selectedOrder.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-white/5 border border-border/50 rounded-[2.5rem] relative overflow-hidden group">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-emerald-500" /> Estatus
                                    </p>
                                    <p className="text-sm font-black text-emerald-500 uppercase tracking-tight">{selectedOrder.status}</p>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">Verificado</p>
                                </div>

                                <div className="p-6 bg-blue-600 border border-blue-500 rounded-[2.5rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 blur-2xl rounded-full translate-x-10 -translate-y-10" />
                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <DollarSign size={12} className="text-white" /> Total
                                    </p>
                                    <p className="text-xl font-black text-white tracking-tighter">${selectedOrder.total_amount.toLocaleString()}</p>
                                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-0.5">{selectedOrder.currency}</p>
                                </div>
                            </div>

                            {/* Sección de Sello Notarial y Hash */}
                            <div className="p-5 md:p-8 bg-[#f8fafc] dark:bg-white/[0.02] border border-dashed border-border rounded-2xl md:rounded-[3rem] flex flex-col md:flex-row items-center gap-6 md:gap-8 relative overflow-hidden">
                                <div className="shrink-0 w-24 h-24 bg-white dark:bg-card border border-border rounded-3xl flex items-center justify-center p-3">
                                    <div className="w-full h-full opacity-20 bg-gradient-to-br from-slate-900 to-slate-400 dark:from-white dark:to-slate-500 rounded-lg flex items-center justify-center font-black text-[8px] text-center leading-tight">TIANGUIS<br />SEAL</div>
                                </div>
                                <div className="flex-1 space-y-3 text-center md:text-left">
                                    <div>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-1">Hash de Transacción Digital</p>
                                        <p className="text-[10px] font-mono text-foreground/40 break-all leading-relaxed bg-foreground/5 p-3 rounded-xl border border-border/50">
                                            {selectedOrder.pago_id || `TB_${Math.random().toString(36).substring(2, 15).toUpperCase()}`}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted">Protección SSL/256</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted">Legalmente Vinculante</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desglose de contenido */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.4em] px-2">ORDER CONTENT</h4>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item: any) => (
                                        <div key={item.id} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-border/50 flex items-center justify-between gap-4 group hover:bg-white dark:hover:bg-white/10 hover:border-accent/30 transition-all duration-500">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-white dark:bg-card border border-border/50 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-500">
                                                    {item.product_type === 'beat' ? <Music size={20} /> : item.product_type === 'plan' ? <Crown size={20} /> : <Package size={20} />}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-sm text-foreground uppercase tracking-tight">{item.name}</h5>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">
                                                        {item.product_type === 'beat' ? `Licencia ${item.license_type}` : item.product_type.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-foreground tracking-tighter">${Number(item.price).toLocaleString()}</p>
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{selectedOrder.currency}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comisiones y Netas */}
                            <div className="p-6 md:p-10 bg-[#0a0a0c] dark:bg-white/[0.03] text-white rounded-2xl md:rounded-[3rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full -mr-32 -mt-32" />

                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-8">FINANCIAL BREAKdown</h4>

                                <div className="space-y-5">
                                    <div className="flex justify-between items-center pb-5 border-b border-white/10">
                                        <span className="text-xs font-bold uppercase tracking-widest text-white/60">Subtotal Bruto</span>
                                        <span className="text-lg font-black">${selectedOrder.total_amount.toFixed(2)}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-rose-400/80">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                <span>Stripe Fee (3.6% + $3) + IVA</span>
                                            </div>
                                            <span>-${(selectedOrder.earnings?.stripeCommission + selectedOrder.earnings?.ivaOnCommission).toFixed(2)}</span>
                                        </div>

                                        <div className={`flex justify-between items-center text-[10px] font-bold uppercase tracking-wider ${selectedOrder.vendedor?.nivel_suscripcion?.toLowerCase() === 'free' || !selectedOrder.vendedor ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${selectedOrder.vendedor?.nivel_suscripcion?.toLowerCase() === 'free' || !selectedOrder.vendedor ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                                <span>Comisión Tianguis (Plan {selectedOrder.vendedor?.nivel_suscripcion?.toUpperCase() || 'FREE'})</span>
                                            </div>
                                            <span>{selectedOrder.vendedor?.nivel_suscripcion?.toLowerCase() === 'free' || !selectedOrder.vendedor ? `-$${(selectedOrder.total_amount * 0.15).toFixed(2)}` : '$0.00'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-white/20 flex flex-col items-center gap-3">
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Pago Neto Estimado al Productor</p>
                                        <p className="text-5xl font-black text-emerald-400 tracking-tighter">${selectedOrder.earnings?.netAmount.toFixed(2)}</p>
                                        <div className="px-4 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 tracking-[0.2em]">Fondos Verificados</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de Acción Centrado */}
                            <div className="flex flex-col items-center gap-6 pt-4">
                                <button
                                    onClick={() => handleDownloadReceipt(selectedOrder)}
                                    className="w-full max-w-sm px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                >
                                    <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                                    Descargar Comprobante PDF
                                </button>

                                <div className="flex items-center gap-3 text-muted">
                                    <ShieldCheck size={16} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Transacción Protegida Digitalsign v2.0</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- BEATS MANAGER MODULE ---
function BeatsManager({ onBack }: { onBack: () => void }) {
    const { showToast } = useToast();
    const { beats, loading } = useGestionBeats({
        onError: (m) => showToast(m, 'error'),
    });

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
                                        <Link
                                            href={`/beats/${beat.id}`}
                                            target="_blank"
                                            className="px-4 py-2 bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 w-fit ml-auto"
                                        >
                                            <ExternalLink size={14} />
                                            Detallado
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

// --- CONTROLS MANAGER MODULE ---
function ControlsManager({ onBack }: { onBack: () => void }) {
    const { showToast } = useToast();
    const {
        controls,
        loading,
        bannerTexto,
        setBannerTexto,
        savingBanner,
        saveBannerTexto,
        toggleControl,
    } = useGestionControles({
        onError: (m) => showToast(m, 'error'),
        onExito: (m) => showToast(m, 'success'),
    });

    const getControlIcon = (clave: string) => {
        switch (clave) {
            case 'modo_mantenimiento': return <Power className="text-rose-500" />;
            case 'subidas_habilitadas': return <Music className="text-blue-500" />;
            case 'ventas_habilitadas': return <ShoppingCartIcon className="text-emerald-500" />;
            case 'bloqueo_exclusivos': return <Crown className="text-amber-500" />;
            case 'banner_noticia_activa': return <Globe className="text-purple-500" />;
            default: return <Settings2 className="text-slate-400" />;
        }
    };

    const getControlDescription = (clave: string) => {
        switch (clave) {
            case 'modo_mantenimiento': return 'Bloquea el acceso al sitio para usuarios normales. Solo Admins pueden entrar.';
            case 'subidas_habilitadas': return 'Permite o bloquea la subida de nuevos beats y kits de sonido.';
            case 'ventas_habilitadas': return 'Habilita o desactiva la pasarela de pagos en todo el marketplace.';
            case 'bloqueo_exclusivos': return 'Si se vende una licencia EXCLUSIVA, bloquea automáticamente todas las demás licencias.';
            case 'banner_noticia_activa': return 'Muestra un aviso importante en la parte superior del sitio.';
            default: return 'Ajuste de sistema.';
        }
    };

    if (loading) return <LoadingTianguis />;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors group">
                     <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
                </button>
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Controles Maestros</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {controls.map((control) => (
                    <div 
                        key={control.id} 
                        className={`bg-card border border-border rounded-[2.5rem] p-8 transition-all duration-300 relative overflow-hidden group ${control.valor ? 'border-accent/40 shadow-lg shadow-accent/5' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                                    {getControlIcon(control.clave)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
                                        {control.clave.replace(/_/g, ' ')}
                                    </h4>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                                        Global Switch
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => toggleControl(control.id, control.clave, control.valor)}
                                className={`relative w-16 h-8 rounded-full transition-all duration-500 ${control.valor ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-500 transform ${control.valor ? 'translate-x-8' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <p className="text-[11px] font-medium text-muted/80 leading-relaxed mb-6">
                            {getControlDescription(control.clave)}
                        </p>

                        {/* Campo de texto editable solo para el banner */}
                        {control.clave === 'banner_noticia_activa' && (
                            <div className="mb-6 space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-widest text-purple-400">Texto del Banner</label>
                                <textarea
                                    value={bannerTexto}
                                    onChange={e => setBannerTexto(e.target.value)}
                                    placeholder="Ej: 🎉 Nueva funcionalidad disponible — Sube tus beats ahora..."
                                    rows={2}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[11px] font-medium text-foreground placeholder:text-muted/40 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                                <button
                                    onClick={saveBannerTexto}
                                    disabled={savingBanner}
                                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    {savingBanner ? 'Guardando...' : 'Guardar texto'}
                                </button>
                            </div>
                        )}

                        <div className="pt-4 border-t border-border flex items-center justify-between">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${control.valor ? 'text-emerald-500' : 'text-rose-500/50'}`}>
                                {control.valor ? 'Estado: ACTIVO' : 'Estado: DESACTIVADO'}
                            </span>
                            <span className="text-[8px] font-bold text-muted/30 uppercase tracking-widest">
                                {new Date(control.ultima_actualizacion).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- LICENSE PREVIEW MANAGER MODULE ---
function LicensePreviewManager({ onBack }: { onBack: () => void }) {
    const { showToast } = useToast();
    const { licenseTypes, handleDownloadPreview } = useLicensePreview({
        onInfo: (m) => showToast(m, 'info'),
        onError: (m) => showToast(m, 'error'),
        onExito: (m) => showToast(m, 'success'),
    });

    return (
        <div className="space-y-12 pb-24">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[1.5rem]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Gestor de Previsualizaciones</span>
                </div>
            </header>

            <div className="max-w-4xl mx-auto space-y-10">
                <div className="text-center space-y-3">
                    <h2 className="text-5xl font-black uppercase tracking-tighter text-foreground">
                        Editor de <span className="text-indigo-500">Entregables</span>
                    </h2>
                    <p className="text-muted text-[11px] font-black uppercase tracking-[0.3em] opacity-60">
                        Previsualiza cómo se imprimen los contratos con las variables actuales
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {licenseTypes.map((lic) => (
                        <div 
                            key={lic.key}
                            className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col items-center text-center group hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-${lic.color}-500/10 flex items-center justify-center text-${lic.color}-500 mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                <FileText size={24} />
                            </div>
                            
                            <h3 className="text-sm font-black uppercase tracking-tight text-foreground mb-2">{lic.label}</h3>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-none mb-8 opacity-40">Formato PDF Oficial</p>
                            
                            <button
                                onClick={() => handleDownloadPreview(lic.key)}
                                className="w-full py-4 bg-foreground/5 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={14} /> Descargar Preview
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] mt-12">
                    <div className="flex gap-6 items-start">
                        <AlertCircle className="text-indigo-500 shrink-0" size={24} />
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 leading-none">Guía de Pruebas de Impresión</h4>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-loose">
                                Estas previsualizaciones utilizan los **textos legales base** definidos en `license-utils`. <br />
                                Sirven para verificar: <br />
                                1. La alineación y tipografía del PDF. <br />
                                2. Que los formatos de archivos coincidan con lo legal (ej. WAV, Stems). <br />
                                3. La legibilidad de las cláusulas.
                            </p>
                            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-xl w-fit">
                                <ShieldCheck size={12} className="text-indigo-500" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500">Legal Signature Framework v4.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
