"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Loader2, ShieldCheck, XCircle, CheckCircle, ExternalLink, User,
    Users, Ticket, DollarSign, TrendingUp, Search, Crown,
    Save, Trash2, Edit2, AlertCircle, Music
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

type Tab = 'dashboard' | 'verifications' | 'users' | 'coupons';

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const { showToast } = useToast();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (profile?.is_admin) {
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
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-2">
                        Control <span className="text-accent">Maestro</span>
                    </h1>
                    <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                        Panel de Administración de Tianguis Beats
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-border">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={14} /> },
                        { id: 'verifications', label: 'Verificaciones', icon: <ShieldCheck size={14} /> },
                        { id: 'users', label: 'Usuarios', icon: <Users size={14} /> },
                        { id: 'coupons', label: 'Cupones', icon: <Ticket size={14} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-white/10 text-foreground shadow-sm'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            {tab.icon} {tab.id === 'dashboard' ? 'Dashboard' : tab.id === 'verifications' ? 'Verificaciones' : tab.id === 'users' ? 'Usuarios' : 'Cupones'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'dashboard' && <GlobalStats />}
                {activeTab === 'verifications' && <VerificationManager />}
                {activeTab === 'users' && <UserManager />}
                {activeTab === 'coupons' && <CouponManager />}
            </div>
        </div>
    );
}

// --- GLOBAL STATS MODULE ---
function GlobalStats() {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalUsers: 0,
        totalBeats: 0,
        pendingVerifications: 0,
        activeSubscriptions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const [sales, users, beats, verifs] = await Promise.all([
                supabase.from('ventas').select('monto'),
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('beats').select('id', { count: 'exact', head: true }),
                supabase.from('verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
            ]);

            const revenue = sales.data?.reduce((acc, s) => acc + (s.monto || 0), 0) || 0;

            setStats({
                totalSales: revenue,
                totalUsers: users.count || 0,
                totalBeats: beats.count || 0,
                pendingVerifications: verifs.count || 0,
                activeSubscriptions: 0 // Fetch logic needed for sub tracking later
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>;

    const cards = [
        { label: 'Ingresos Totales', value: `$${stats.totalSales.toLocaleString()}`, sub: 'Ventas de Beats/Kits', icon: <DollarSign className="text-emerald-500" /> },
        { label: 'Usuarios', value: stats.totalUsers, sub: 'Productores registrados', icon: <Users className="text-blue-500" /> },
        { label: 'Total Beats', value: stats.totalBeats, sub: 'En catálogo global', icon: <Music className="text-purple-500" /> },
        { label: 'Verificaciones', value: stats.pendingVerifications, sub: 'Solicitudes pendientes', icon: <ShieldCheck className="text-amber-500" /> }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
                <div key={i} className="bg-white dark:bg-white/5 border border-border rounded-[2.5rem] p-8 shadow-sm hover:translate-y-[-4px] transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                        {card.icon}
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter mb-1">{card.value}</h3>
                    <p className="text-muted text-[10px] font-black uppercase tracking-widest">{card.label}</p>
                    <p className="text-[9px] text-muted/50 mt-1">{card.sub}</p>
                </div>
            ))}
        </div>
    );
}

// --- VERIFICATION MANAGER MODULE ---
function VerificationManager() {
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
                .from('verification_requests')
                .select(`*, profiles:user_id (username, foto_perfil, email)`)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                const { data: retryData } = await supabase
                    .from('verification_requests')
                    .select(`*, profiles:user_id (username, foto_perfil, email)`)
                    .eq('status', 'pending');
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
                .from('verification_requests')
                .update({ status })
                .eq('id', requestId);

            if (reqError) throw reqError;

            if (status === 'approved') {
                await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
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
            {requests.length === 0 ? (
                <div className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-12 text-center border border-border">
                    <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-foreground">¡Sin pendientes!</h3>
                    <p className="text-muted text-sm mt-2">No hay solicitudes de verificación para revisar.</p>
                </div>
            ) : (
                requests.map((req) => (
                    <div key={req.id} className="bg-white dark:bg-white/5 border border-border rounded-[2.5rem] p-8 flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-accent-soft">
                                    <img src={req.profiles?.foto_perfil || `https://ui-avatars.com/api/?name=${req.artistic_name}`} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-foreground">{req.artistic_name}</h3>
                                    <p className="text-xs text-muted">@{req.profiles?.username}</p>
                                </div>
                            </div>
                            <div className="space-y-1 text-[10px] font-bold uppercase tracking-widest text-muted/60">
                                <p>Email: {req.profiles?.email}</p>
                                <p>Nombre: {req.real_name}</p>
                                <p>ID: {req.user_id}</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-border">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">Portafolio</p>
                                    <a href={req.portfolio_url} target="_blank" className="text-sm font-bold text-blue-500 hover:underline flex items-center gap-2">
                                        {req.portfolio_url} <ExternalLink size={12} />
                                    </a>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-border">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">Identificación</p>
                                    <a href={req.id_document_url} target="_blank" className="text-sm font-bold text-accent hover:underline flex items-center gap-2">
                                        Ver Documento <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-border">
                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">Motivación</p>
                                <p className="text-xs text-foreground italic leading-relaxed">"{req.motivation}"</p>
                            </div>
                        </div>

                        <div className="lg:w-48 flex flex-col gap-3 justify-center">
                            <button onClick={() => handleDecision(req.id, req.user_id, 'approved')} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Aprobar</button>
                            <button onClick={() => handleDecision(req.id, req.user_id, 'rejected')} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Rechazar</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// --- USER MANAGER MODULE ---
function UserManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const { showToast } = useToast();



    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('fecha_de_creacion', { ascending: false })
                .limit(100);

            if (error) {
                // Si fecha_de_creacion falla, intentamos sin orden (o con created_at por si acaso)
                const { data: retryData } = await supabase.from('profiles').select('*').limit(100);
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
        const { error } = await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId);
        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: tier } : u));
            showToast("Nivel actualizado con éxito", "success");
        }
    };

    const toggleAdmin = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`¿${currentStatus ? 'Quitar' : 'Asignar'} permisos de administrador?`)) return;
        const { error } = await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
            showToast("Permisos actualizados", "success");
        }
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.artistic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
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

            <div className="bg-white dark:bg-white/5 border border-border rounded-[2.5rem] overflow-hidden">
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
                                                <img src={user.foto_perfil || `https://ui-avatars.com/api/?name=${user.username}`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-xs text-foreground truncate">@{user.username}</p>
                                                <p className="text-[9px] text-muted uppercase tracking-widest truncate">{user.artistic_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`inline-flex px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${user.subscription_tier === 'premium' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            user.subscription_tier === 'pro' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-slate-500/10 text-muted border-slate-500/20'
                                            }`}>
                                            {user.subscription_tier || 'Gratis'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`w-2 h-2 rounded-full ${user.is_admin ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-white/10'}`} />
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
                                    <img src={selectedUser.foto_perfil || `https://ui-avatars.com/api/?name=${selectedUser.username}`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedUser.artistic_name}</h3>
                                    <p className="text-xs text-muted font-bold uppercase tracking-widest">@{selectedUser.username}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-accent hover:text-white transition-all">
                                <XCircle size={20} />
                            </button>
                        </header>

                        <div className="p-8 grid md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-6">
                                <DetailItem label="Email" value={selectedUser.email} />
                                <DetailItem label="Nombre Completo" value={selectedUser.full_name} />
                                <DetailItem label="ID de Usuario" value={selectedUser.id} copyable />
                                <DetailItem label="Fecha de Registro" value={selectedUser.fecha_de_creacion ? new Date(selectedUser.fecha_de_creacion).toLocaleDateString() : 'Desconocida'} />

                                {/* New Editable Dates */}
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border/50">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Inicio Suscripción</p>
                                    <input
                                        type="date"
                                        value={selectedUser.comenzar_suscripcion ? selectedUser.comenzar_suscripcion.split('T')[0] : ''}
                                        onChange={async (e) => {
                                            const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                                            const { error } = await supabase.from('profiles').update({ comenzar_suscripcion: date }).eq('id', selectedUser.id);
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
                                <DetailItem label="Estado de Verificación" value={selectedUser.is_verified ? 'VERIFICADO' : 'NORMAL'} />

                                {/* End Date */}
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border/50">
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Fin Suscripción</p>
                                    <input
                                        type="date"
                                        value={selectedUser.termina_suscripcion ? selectedUser.termina_suscripcion.split('T')[0] : ''}
                                        onChange={async (e) => {
                                            const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                                            const { error } = await supabase.from('profiles').update({ termina_suscripcion: date }).eq('id', selectedUser.id);
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
                                href={`/${selectedUser.username}`}
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
function CouponManager() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_percent: 20,
        valid_until: '',
        is_active: true
    });
    const { showToast } = useToast();

    useEffect(() => { fetchCoupons(); }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
            if (error) {
                const { data: retryData } = await supabase.from('coupons').select('*');
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
                const { error } = await supabase.from('coupons').update({
                    code: newCoupon.code.toUpperCase(),
                    discount_percent: newCoupon.discount_percent,
                    valid_until: newCoupon.valid_until || null,
                    is_active: newCoupon.is_active
                }).eq('id', editingId);
                if (error) throw error;
                showToast("Cupón actualizado", "success");
            } else {
                const { error } = await supabase.from('coupons').insert([{
                    code: newCoupon.code.toUpperCase(),
                    discount_percent: newCoupon.discount_percent,
                    valid_until: newCoupon.valid_until || null
                }]);
                if (error) throw error;
                showToast("Cupón creado", "success");
            }
            setNewCoupon({ code: '', discount_percent: 20, valid_until: '', is_active: true });
            setEditingId(null);
            fetchCoupons();
        } catch (error: any) { showToast(error.message, "error"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar cupón?")) return;
        await supabase.from('coupons').delete().eq('id', id);
        fetchCoupons();
    };

    return (
        <div className="space-y-12">
            <div className="bg-white dark:bg-white/5 border border-border rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                    {editingId ? <Edit2 size={20} className="text-accent" /> : <Save size={20} className="text-accent" />}
                    {editingId ? 'Editar Cupón' : 'Nuevo Cupón'}
                </h3>
                <form onSubmit={handleAction} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted tracking-widest pl-2">Código</label>
                        <input value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })} placeholder="VERANO50" className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-border rounded-xl font-bold text-sm uppercase" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted tracking-widest pl-2">Desc %</label>
                        <input type="number" min="1" max="100" value={newCoupon.discount_percent} onChange={e => setNewCoupon({ ...newCoupon, discount_percent: parseInt(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-border rounded-xl font-bold text-sm" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted tracking-widest pl-2">Expira</label>
                        <input type="datetime-local" value={newCoupon.valid_until} onChange={e => setNewCoupon({ ...newCoupon, valid_until: e.target.value })} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-border rounded-xl font-bold text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 py-4 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl transition-all">
                            {editingId ? 'Actualizar' : 'Guardar'}
                        </button>
                        {editingId && (
                            <button onClick={() => { setEditingId(null); setNewCoupon({ code: '', discount_percent: 20, valid_until: '', is_active: true }); }} className="p-4 bg-slate-200 dark:bg-white/10 text-foreground rounded-xl">
                                <XCircle size={18} />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="grid gap-4">
                {coupons.map(cp => (
                    <div key={cp.id} className="bg-white dark:bg-white/5 border border-border rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-accent/30 transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center text-accent font-black text-2xl">
                                {cp.discount_percent}%
                            </div>
                            <div>
                                <h4 className="text-2xl font-black uppercase tracking-tighter">{cp.code}</h4>
                                <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-muted/60 mt-1">
                                    <span>Válido hasta: {cp.valid_until ? new Date(cp.valid_until).toLocaleDateString() : 'Siempre'}</span>
                                    <span className={cp.is_active ? 'text-emerald-500' : 'text-red-500'}>{cp.is_active ? 'Activo' : 'Inactivo'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => { setEditingId(cp.id); setNewCoupon({ code: cp.code, discount_percent: cp.discount_percent, valid_until: cp.valid_until || '', is_active: cp.is_active }); }} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 dark:bg-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all">Editar</button>
                            <button onClick={() => handleDelete(cp.id)} className="p-3 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
