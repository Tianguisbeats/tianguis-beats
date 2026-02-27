"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Loader2, ShieldCheck, XCircle, CheckCircle, ExternalLink, User,
    Users, Ticket, DollarSign, TrendingUp, Search, Crown,
    Save, Trash2, Edit2, AlertCircle, Music, MessageSquare, FileKey
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

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
                .select('es_admin')
                .eq('id', user.id)
                .single();

            if (profile?.es_admin) {
                setIsAdmin(true);
            } else {
                setLoading(false);
            }
            setLoading(false);
        };

        checkAdmin();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );

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
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Nivel de Acceso: Dios</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-2">
                        Control <span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Maestro</span>
                    </h1>
                    <p className="text-muted text-[11px] font-black uppercase tracking-[0.3em] opacity-60">
                        Tianguis Beats Infrastructure Management
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
        activeSubscriptions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const [sales, users, beats, verifs, feedback] = await Promise.all([
                supabase.from('transacciones').select('precio'),
                supabase.from('perfiles').select('id', { count: 'exact', head: true }),
                supabase.from('beats').select('id', { count: 'exact', head: true }),
                supabase.from('solicitudes_verificacion').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('quejas_y_sugerencias').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente')
            ]);

            const revenue = sales.data?.reduce((acc, s) => acc + (s.precio || 0), 0) || 0;

            setStats({
                totalSales: revenue,
                totalUsers: users.count || 0,
                totalBeats: beats.count || 0,
                pendingVerifications: verifs.count || 0,
                pendingFeedback: feedback.count || 0,
                activeSubscriptions: 0 // Fetch logic needed for sub tracking later
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>;

    const cards = [
        { id: 'income', label: 'Ingresos Totales', value: `$${stats.totalSales.toLocaleString()}`, sub: 'Ventas de Beats/Kits', icon: <DollarSign className="text-emerald-500" />, gradient: 'hover:shadow-emerald-500/10' },
        { id: 'users', label: 'Usuarios', value: stats.totalUsers, sub: 'Productores registrados', icon: <Users className="text-blue-500" />, gradient: 'hover:shadow-blue-500/10' },
        { id: 'beats', label: 'Total Beats', value: stats.totalBeats, sub: 'En catálogo global', icon: <Music className="text-purple-500" />, gradient: 'hover:shadow-purple-500/10' },
        { id: 'verifications', label: 'Verificaciones', value: stats.pendingVerifications, sub: 'Solicitudes por revisar', icon: <ShieldCheck className="text-amber-500" />, gradient: 'hover:shadow-amber-500/10' },
        { id: 'coupons', label: 'Cupones', value: 'PRO', sub: 'Gestión de descuentos', icon: <Ticket className="text-emerald-500" />, gradient: 'hover:shadow-emerald-500/10' },
        { id: 'feedback', label: 'Quejas Pendientes', value: stats.pendingFeedback, sub: 'Ideas y reportes sin leer', icon: <MessageSquare className="text-rose-500" />, gradient: 'hover:shadow-rose-500/10' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {cards.map((card, i) => (
                <button
                    key={i}
                    onClick={() => onViewChange(card.id as View)}
                    className={`bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-lg dark:shadow-none transition-all duration-500 text-left group hover:scale-[1.02] hover:border-accent/40 ${card.gradient}`}
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center transition-transform group-hover:rotate-[10deg] duration-500 text-foreground">
                            {React.cloneElement(card.icon as React.ReactElement<any>, { size: 28 })}
                        </div>
                        <div className="w-10 h-10 rounded-full border border-slate-100 dark:border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <ExternalLink size={14} className="text-accent" />
                        </div>
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter mb-2 text-foreground group-hover:text-accent transition-colors">{card.value}</h3>
                    <p className="text-muted text-[11px] font-black uppercase tracking-[0.3em]">{card.label}</p>
                    <p className="text-[10px] text-muted/40 font-bold mt-2 uppercase tracking-widest">{card.sub}</p>
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
                .select(`*, perfiles:user_id (nombre_usuario, foto_perfil, correo, fecha_creacion)`)
                .eq('estado', 'pendiente')
                .order('fecha_creacion', { ascending: false });

            if (error) {
                const { data: retryData } = await supabase
                    .from('solicitudes_verificacion')
                    .select(`*, perfiles:user_id (nombre_usuario, foto_perfil, correo, fecha_creacion)`)
                    .eq('estado', 'pendiente');
                setRequests(retryData || []);
            } else {
                setRequests(data || []);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleDecision = async (requestId: string, userId: string, status: 'approved' | 'rejected') => {
        const confirmMsg = status === 'approved' ? "¿Aprobar verificación?" : "¿Rechazar solicitud?";
        if (!window.confirm(confirmMsg)) return;

        try {
            const { error: reqError } = await supabase
                .from('solicitudes_verificacion')
                .update({ estado: status === 'approved' ? 'aprobado' : 'rechazado' })
                .eq('id', requestId);

            if (reqError) throw reqError;

            if (status === 'approved') {
                await supabase.from('perfiles').update({ esta_verificado: true }).eq('id', userId);
            }

            setRequests(requests.filter(r => r.id !== requestId));
            showToast(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'}`, "success");
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className={`px-4 py-2 rounded-xl border transition-colors ${requests.length > 0 ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${requests.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {requests.length} {requests.length === 1 ? 'Pendiente' : 'Pendientes'}
                    </span>
                </div>
            </header>

            {requests.length === 0 ? (
                <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-[0_4px_20px_rgba(255,255,255,0.02)] rounded-[2rem] p-12 text-center">
                    <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-foreground">¡Sin pendientes!</h3>
                    <p className="text-muted text-sm mt-2">No hay solicitudes de verificación para revisar.</p>
                </div>
            ) : (
                requests.map((req) => (
                    <div key={req.id} className="relative bg-white dark:bg-[#020205] border-t-4 border-t-blue-600 border-x border-b border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-8 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,112,243,0.05)] hover:border-blue-500/30 transition-all duration-500">

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* User Info Section */}
                            <div className="lg:w-1/4 w-full">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-accent-soft shadow-lg">
                                        <img src={req.perfiles?.foto_perfil || `https://ui-avatars.com/api/?name=${req.nombre_usuario}`} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-xl text-foreground tracking-tighter truncate">{req.nombre_usuario}</h3>
                                        <div className="inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">@{req.nombre_usuario}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <DetailBox label="Nombre Real" value={req.nombre_completo} />
                                    <DetailBox label="Correo" value={req.correo} />
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border/50">
                                        <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1">Registro</p>
                                        <p className="text-[10px] font-bold text-foreground">
                                            {req.perfiles?.fecha_creacion ? new Date(req.perfiles.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content Sections - Layout Horizontal */}
                            <div className="flex-1 w-full space-y-4">
                                {/* Red Social Horizontal */}
                                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-1">Red Social a Verificar</p>
                                        <p className="text-sm font-black text-foreground truncate max-w-md">{req.url_red_social}</p>
                                    </div>
                                    <a href={req.url_red_social} target="_blank" className="shrink-0 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2">
                                        Visitar Perfil <ExternalLink size={12} />
                                    </a>
                                </div>

                                {/* Identificaciones Horizontal */}
                                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-border flex flex-col gap-3">
                                    <p className="text-[9px] font-black uppercase text-muted tracking-[0.2em]">Motivación del Artista</p>
                                    <p className="text-sm text-foreground font-medium italic opacity-80 leading-relaxed">
                                        "{req.motivacion}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Corner Position */}
                        <div className="flex justify-end gap-3 mt-4 border-t border-border pt-6">
                            <button
                                onClick={() => handleDecision(req.id, req.user_id, 'rejected')}
                                className="px-6 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Rechazar
                            </button>
                            <button
                                onClick={() => handleDecision(req.id, req.user_id, 'approved')}
                                className="px-8 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Aprobar
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
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
        <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border/50 text-left">
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

    const updateTier = async (userId: string, tier: string) => {
        const { error } = await supabase.from('perfiles').update({ nivel_suscripcion: tier }).eq('id', userId);
        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: tier } : u));
            showToast("Nivel actualizado con éxito", "success");
        }
    };

    const toggleAdmin = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`¿${currentStatus ? 'Quitar' : 'Asignar'} permisos de administrador?`)) return;
        const { error } = await supabase.from('perfiles').update({ es_admin: !currentStatus }).eq('id', userId);
        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
            showToast("Permisos actualizados", "success");
        }
    };

    const filteredUsers = users.filter(u =>
        u.nombre_usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.nombre_artistico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Gestión de Usuarios</span>
                </div>
            </header>
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, @ o email..."
                    className="w-full pl-12 pr-6 py-4 bg-white dark:bg-white/5 border border-border rounded-2xl font-bold text-sm outline-none focus:border-accent transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-lg dark:shadow-[0_4px_20px_rgba(255,255,255,0.02)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-slate-50 dark:bg-white/5">
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Usuario</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Membresía</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Admin</th>
                                <th className="px-8 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="py-20 text-center text-muted text-xs font-bold uppercase tracking-widest">No se encontraron usuarios</td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-accent-soft shrink-0 border border-border/50">
                                                <img src={user.foto_perfil || `https://ui-avatars.com/api/?name=${user.nombre_usuario}`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-xs text-foreground truncate">@{user.nombre_usuario}</p>
                                                <p className="text-[9px] text-muted uppercase tracking-widest truncate">{user.nombre_artistico}</p>
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
                                        <div className={`w-2 h-2 rounded-full ${user.es_admin ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-white/10'}`} />
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm"
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

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
                    <div className="relative bg-white dark:bg-[#0a0a0c] border border-border w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <header className="p-8 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-accent-soft">
                                    <img src={selectedUser.foto_perfil || `https://ui-avatars.com/api/?name=${selectedUser.nombre_usuario}`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedUser.nombre_artistico}</h3>
                                    <p className="text-xs text-muted font-bold uppercase tracking-widest">@{selectedUser.nombre_usuario}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-accent hover:text-white transition-all">
                                <XCircle size={20} />
                            </button>
                        </header>

                        <div className="p-8 grid md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-6">
                                <DetailItem label="Email" value={selectedUser.email} />
                                <DetailItem label="Nombre Completo" value={selectedUser.nombre_completo} />
                                <DetailItem label="ID de Usuario" value={selectedUser.id} copyable />
                                <DetailItem label="Fecha de Registro" value={selectedUser.fecha_creacion ? new Date(selectedUser.fecha_creacion).toLocaleDateString() : 'Desconocida'} />

                                {/* New Editable Dates */}
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border/50">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Inicio Suscripción</p>
                                    <input
                                        type="date"
                                        value={selectedUser.fecha_inicio_suscripcion ? selectedUser.fecha_inicio_suscripcion.split('T')[0] : ''}
                                        onChange={async (e) => {
                                            const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                                            const { error } = await supabase.from('perfiles').update({ comenzar_suscripcion: date }).eq('id', selectedUser.id);
                                            if (!error) setUsers(users.map(u => u.id === selectedUser.id ? { ...u, comenzar_suscripcion: date } : u));
                                        }}
                                        className="bg-transparent font-bold text-xs text-foreground outline-none w-full"
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <DetailItem label="Membresía" value={
                                    <select
                                        value={selectedUser.subscription_tier || 'free'}
                                        onChange={(e) => updateTier(selectedUser.id, e.target.value)}
                                        className="bg-transparent font-black text-xs uppercase tracking-widest text-accent outline-none cursor-pointer"
                                    >
                                        <option value="free">Gratis</option>
                                        <option value="pro">Pro</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                } />
                                <DetailItem label="Estado de Verificación" value={selectedUser.esta_verificado ? 'VERIFICADO' : 'NORMAL'} />

                                {/* End Date */}
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border/50">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Fin Suscripción</p>
                                    <input
                                        type="date"
                                        value={selectedUser.fecha_termino_suscripcion ? selectedUser.fecha_termino_suscripcion.split('T')[0] : ''}
                                        onChange={async (e) => {
                                            const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                                            const { error } = await supabase.from('perfiles').update({ termina_suscripcion: date }).eq('id', selectedUser.id);
                                            if (!error) {
                                                setUsers(users.map(u => u.id === selectedUser.id ? { ...u, termina_suscripcion: date } : u));
                                                showToast("Fecha final actualizada", "success");
                                            }
                                        }}
                                        className="bg-transparent font-bold text-xs text-foreground outline-none w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <footer className="p-8 bg-slate-50 dark:bg-white/5 flex gap-4">
                            <button
                                onClick={() => toggleAdmin(selectedUser.id, selectedUser.is_admin)}
                                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedUser.is_admin ? 'bg-red-500 text-white' : 'bg-accent text-white'
                                    }`}
                            >
                                {selectedUser.is_admin ? 'Quitar Admin' : 'Hacer Admin'}
                            </button>
                            <Link
                                href={`/${selectedUser.nombre_usuario}`}
                                target="_blank"
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center"
                            >
                                Ver Perfil Público
                            </Link>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, copyable }: { label: string, value: any, copyable?: boolean }) {
    return (
        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border/50">
            <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">{label}</p>
            <div className={`text-sm font-bold ${copyable ? 'font-mono text-[10px] break-all' : 'text-foreground'}`}>
                {value || '---'}
            </div>
        </div>
    );
}

// --- COUPON MANAGER MODULE ---
function CouponManager({ onBack }: { onBack: () => void }) {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [newCoupon, setNewCoupon] = useState({
        codigo: '',
        porcentaje_descuento: 20,
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
            if (error) {
                const { data: retryData } = await supabase.from('cupones')
                    .select('*')
                    .is('productor_id', null);
                setCoupons(retryData || []);
            } else {
                setCoupons(data || []);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase.from('cupones').update({
                    codigo: newCoupon.codigo.toUpperCase(),
                    porcentaje_descuento: newCoupon.porcentaje_descuento,
                    fecha_expiracion: newCoupon.fecha_expiracion || null,
                    nivel_objetivo: newCoupon.nivel_objetivo,
                    es_activo: newCoupon.es_activo
                }).eq('id', editingId);
                if (error) throw error;
                showToast("Cupón actualizado", "success");
            } else {
                const { error } = await supabase.from('cupones').insert([{
                    codigo: newCoupon.codigo.toUpperCase(),
                    porcentaje_descuento: newCoupon.porcentaje_descuento,
                    fecha_expiracion: newCoupon.fecha_expiracion || null,
                    nivel_objetivo: newCoupon.nivel_objetivo,
                    aplica_a: 'suscripciones'
                }]);
                if (error) throw error;
                showToast("Cupón creado", "success");
            }
            setNewCoupon({ codigo: '', porcentaje_descuento: 20, fecha_expiracion: '', nivel_objetivo: 'todos', es_activo: true });
            setEditingId(null);
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

    return (
        <div className="space-y-12">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Control de Cupones</span>
                </div>
            </header>
            <div className="bg-white/5 dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                {/* Decoración Glassmorphism */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="mb-10 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Control Maestro</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground leading-[0.9] flex items-center gap-4">
                        {editingId ? 'Refinar Cupón' : 'Nuevo Cupón'}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500/80 dark:text-muted/60 mt-2">
                        Exclusivo para descuentos en planes de Suscripción.
                    </p>
                </div>

                <form onSubmit={handleAction} className="relative z-10 space-y-8">
                    <div className="grid md:grid-cols-4 gap-6 items-start">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 pl-2 whitespace-nowrap">Código Promocional</label>
                            <input
                                required
                                value={newCoupon.codigo}
                                onChange={e => setNewCoupon({ ...newCoupon, codigo: e.target.value.toUpperCase() })}
                                placeholder="EJ. BLACKFRIDAY"
                                className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 font-black text-slate-900 dark:text-foreground text-sm outline-none focus:border-accent transition-all uppercase tracking-widest placeholder:text-muted/30 font-mono shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 pl-2 whitespace-nowrap">Descuento (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    required
                                    value={newCoupon.porcentaje_descuento || ''}
                                    onChange={e => setNewCoupon({ ...newCoupon, porcentaje_descuento: parseInt(e.target.value) })}
                                    className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 font-black text-slate-900 dark:text-foreground text-sm outline-none focus:border-accent transition-all tabular-nums font-mono shadow-sm"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/60 font-black text-sm">%</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 pl-2 whitespace-nowrap">Aplica a</label>
                            <select
                                value={newCoupon.nivel_objetivo}
                                onChange={e => setNewCoupon({ ...newCoupon, nivel_objetivo: e.target.value })}
                                className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 font-black text-slate-900 dark:text-foreground text-sm outline-none focus:border-accent transition-all uppercase tracking-widest shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="todos">Todos los Planes</option>
                                <option value="free">Solo Free</option>
                                <option value="pro">Solo Pro</option>
                                <option value="premium">Solo Premium</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-muted/60 pl-2 whitespace-nowrap">
                                Expiración <span className="opacity-40 lowercase font-bold tracking-normal">*Opcional</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={newCoupon.fecha_expiracion}
                                onChange={e => setNewCoupon({ ...newCoupon, fecha_expiracion: e.target.value })}
                                className="w-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 font-bold text-slate-900 dark:text-foreground text-xs outline-none focus:border-accent transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 h-14 bg-accent text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] shadow-xl hover:shadow-accent/40 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            {editingId ? <Edit2 size={16} /> : <Save size={16} />}
                            {editingId ? 'Guardar Cambios' : 'Activar Cupón'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => { setEditingId(null); setNewCoupon({ codigo: '', porcentaje_descuento: 20, fecha_expiracion: '', nivel_objetivo: 'todos', es_activo: true }); }}
                                className="w-14 h-14 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white rounded-2xl flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500 hover:text-rose-500 dark:hover:text-white transition-all shadow-sm active:scale-95"
                            >
                                <XCircle size={20} />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Coupons List - Premium Redesign */}
            {coupons.length > 0 && (
                <div className="grid lg:grid-cols-2 gap-8">
                    {coupons.map(cp => {
                        const isExpired = cp.fecha_expiracion && new Date(cp.fecha_expiracion) < new Date();

                        // Determinar el estilo basado en el nivel_objetivo, similar a la suite de productores
                        let tierConfig = { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'TODOS' };
                        if (cp.nivel_objetivo === 'free') tierConfig = { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'FREE' };
                        if (cp.nivel_objetivo === 'pro') tierConfig = { bg: 'bg-indigo-500/10', text: 'text-indigo-500', label: 'PRO' };
                        if (cp.nivel_objetivo === 'premium') tierConfig = { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'PREMIUM' };

                        return (
                            <div key={cp.id} className={`group relative bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 transition-all duration-700 hover:border-accent/40 hover:shadow-2xl dark:hover:shadow-[0_0_40px_rgba(var(--accent-rgb),0.1)] hover:-translate-y-1 overflow-hidden shadow-lg dark:shadow-none ${(!cp.es_activo || isExpired) && 'opacity-60 grayscale'}`}>
                                {/* Ticket pattern */}
                                <div className="absolute top-[88px] left-8 right-8 h-px border-t-2 border-dashed border-slate-200 dark:border-white/10 z-10" />

                                <div className="flex justify-between items-start mb-12 relative z-10">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-4xl text-slate-900 dark:text-foreground tracking-[-0.05em] uppercase font-mono leading-none">{cp.codigo}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${cp.es_activo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                            <p className="text-[9px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] opacity-80 dark:opacity-60">
                                                EXP: {cp.fecha_expiracion ? new Date(cp.fecha_expiracion).toLocaleDateString() : '∞'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-5 py-3 ${tierConfig.bg} border border-${tierConfig.text.replace('text-', '')}/20 rounded-2xl flex flex-col items-center gap-1 shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform`}>
                                        <div className={`absolute top-0 right-0 w-16 h-16 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${tierConfig.text}`}>{tierConfig.label}</span>
                                        <span className="text-xl font-black text-slate-900 dark:text-foreground tabular-nums tracking-tighter loading-none">
                                            -{cp.porcentaje_descuento}<span className="text-xs text-muted">%</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Target info */}
                                <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                                        <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] mb-2">Aplica a</p>
                                        <div className="flex items-center gap-2 text-slate-900 dark:text-foreground">
                                            <TrendingUp size={14} className="text-accent" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">SUSCRIPCIONES</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                                        <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] mb-2">Usos Realizados</p>
                                        <div className="flex items-center justify-between text-slate-900 dark:text-foreground">
                                            <span className="text-lg font-black tabular-nums leading-none">0</span>
                                            <span className="text-[10px] font-bold text-muted/60">∞ max</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="flex items-center justify-between gap-4 relative z-10 pt-6 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleStatus(cp.id, cp.es_activo)}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${cp.es_activo ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'} active:scale-95`}
                                        >
                                            {cp.es_activo ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 min-h-[44px]">
                                        {confirmDeleteId === cp.id ? (
                                            <div className="flex items-center gap-1 bg-rose-500 rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 shadow-lg shadow-rose-500/30">
                                                <button onClick={() => handleDelete(cp.id)} className="px-6 py-2.5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-colors">Borrar Cupón</button>
                                                <button onClick={() => setConfirmDeleteId(null)} className="p-2.5 text-white/60 hover:text-white transition-colors border-l border-white/20"><XCircle size={16} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditingId(cp.id); setNewCoupon({ codigo: cp.codigo, porcentaje_descuento: cp.porcentaje_descuento, fecha_expiracion: cp.fecha_expiracion || '', nivel_objetivo: cp.nivel_objetivo || 'todos', es_activo: cp.es_activo }); document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 hover:bg-slate-200 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95">
                                                    <Edit2 size={12} /> Editar
                                                </button>
                                                <button onClick={() => setConfirmDeleteId(cp.id)} className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center justify-center flex-shrink-0 active:scale-95">
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
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
        // Hacemos un join con profiles para obtener info del usuario productor
        const { data, error } = await supabase
            .from('quejas_y_sugerencias')
            .select(`*, perfiles:user_id (nombre_artistico, nombre_usuario, email)`)
            .order('fecha_creacion', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setFeedbacks(data || []);
        }
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
                <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Buzón de Sugerencias</span>
                </div>
            </header>
            {feedbacks.length === 0 ? (
                <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-[0_4px_20px_rgba(255,255,255,0.02)] rounded-[2.5rem] p-12 text-center">
                    <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-xl font-black uppercase text-foreground">Buzón vacío</h3>
                    <p className="text-muted text-[10px] uppercase font-bold tracking-widest mt-2">No hay quejas o sugerencias en este momento.</p>
                </div>
            ) : (
                feedbacks.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 space-y-6 flex flex-col shadow-lg dark:shadow-[0_4px_20px_rgba(255,255,255,0.02)] transition-all hover:border-accent/30">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${item.tipo_mensaje === 'queja' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                        {item.tipo_mensaje}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                        {new Date(item.fecha_creacion).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-black text-xl text-foreground">De: {item.perfiles ? item.perfiles.nombre_artistico || item.perfiles.nombre_usuario : item.nombre_usuario}</h3>
                                <p className="text-xs text-muted font-bold tracking-widest uppercase">{item.email} {item.perfiles && `(Usuario Registrado)`}</p>
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

                        <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-border">
                            <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-3">Mensaje</p>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.mensaje}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// --- INCOME MANAGER MODULE ---
function IncomeManager({ onBack }: { onBack: () => void }) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            const { data, error } = await supabase
                .from('transacciones')
                .select(`*, perfiles:comprador_id (nombre_usuario, nombre_artistico, email)`)
                .order('fecha_creacion', { ascending: false });
            if (!error) setTransactions(data || []);
            setLoading(false);
        };
        fetchTransactions();
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">
                    ← Volver al Dashboard
                </button>
                <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Historial de Transacciones</span>
                </div>
            </header>

            <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-slate-50 dark:bg-white/5">
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Fecha</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Comprador</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted">Producto</th>
                                <th className="px-8 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={4} className="py-20 text-center text-muted text-xs font-bold uppercase tracking-widest">No hay transacciones registradas</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-5 text-[10px] font-bold text-muted">
                                        {new Date(tx.fecha_creacion).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-black text-xs">@{tx.perfiles?.nombre_usuario || 'Desconocido'}</p>
                                        <p className="text-[9px] text-muted uppercase tracking-widest">{tx.perfiles?.email}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-xs capitalize">{tx.tipo_item || 'Beat'}</p>
                                        <p className="text-[9px] text-muted uppercase tracking-widest">{tx.beat_id ? 'ID: ' + tx.beat_id.slice(0, 8) : '---'}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-emerald-500">
                                        ${tx.precio || 0}
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

// --- BEATS MANAGER MODULE ---
function BeatsManager({ onBack }: { onBack: () => void }) {
    const [beats, setBeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBeats = async () => {
            const { data, error } = await supabase
                .from('beats')
                .select(`*, perfiles:productor_id (nombre_usuario, nombre_artistico)`)
                .order('created_at', { ascending: false });
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

            <div className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-slate-50 dark:bg-white/5">
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
                                <tr key={beat.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-5 text-[10px] font-bold text-muted">
                                        {new Date(beat.created_at).toLocaleDateString()}
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
                                        <Link href={`/beat/${beat.id}`} target="_blank" className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg hover:bg-accent hover:text-white transition-all inline-block">
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
