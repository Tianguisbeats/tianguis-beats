"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldCheck, XCircle, CheckCircle, ExternalLink, User } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);

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
                fetchRequests();
            } else {
                setLoading(false);
            }
        };

        checkAdmin();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('verification_requests')
            .select(`
                *,
                profiles:user_id (
                    username,
                    foto_perfil,
                    email
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching requests:", error);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    const handleDecision = async (requestId: string, userId: string, status: 'approved' | 'rejected') => {
        const confirmMsg = status === 'approved' ? "¿Aprobar verificación?" : "¿Rechazar solicitud?";
        if (!window.confirm(confirmMsg)) return;

        try {
            // 1. Update request status
            const { error: reqError } = await supabase
                .from('verification_requests')
                .update({ status })
                .eq('id', requestId);

            if (reqError) throw reqError;

            // 2. If approved, update profile is_verified
            if (status === 'approved') {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ is_verified: true })
                    .eq('id', userId);

                if (profileError) throw profileError;
            }

            // 3. Refresh list
            setRequests(requests.filter(r => r.id !== requestId));
            alert(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} con éxito.`);

        } catch (error: any) {
            console.error("Error processing request:", error);
            alert("Error: " + error.message);
        }
    };

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
        <div className="max-w-5xl mx-auto">
            <header className="mb-12">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-2">
                    Panel de <span className="text-accent">Administración</span>
                </h1>
                <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                    Gestionando {requests.length} solicitudes pendientes
                </p>
            </header>

            <div className="grid gap-6">
                {requests.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-12 text-center border border-border">
                        <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                        <h3 className="text-xl font-bold text-foreground">¡Todo al día!</h3>
                        <p className="text-muted text-sm mt-2">No hay solicitudes de verificación pendientes.</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
                            {/* User Info */}
                            <div className="flex items-start gap-4 md:w-1/3">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                                    {req.profiles?.foto_perfil ? (
                                        <img src={req.profiles.foto_perfil} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted">
                                            <User size={24} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground leading-tight">{req.artistic_name}</h3>
                                    <p className="text-sm text-muted">{req.real_name}</p>
                                    <p className="text-xs text-accent mt-1">@{req.profiles?.username}</p>
                                    <p className="text-[10px] text-muted mt-2">ID: {req.user_id}</p>
                                </div>
                            </div>

                            {/* Evidence */}
                            <div className="flex-1 space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground min-w-[80px]">Portafolio:</span>
                                    <a href={req.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                        {req.portfolio_url} <ExternalLink size={12} />
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground min-w-[80px]">ID Doc:</span>
                                    {req.id_document_url ? (
                                        <a href={req.id_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                            Ver Documento <ExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span className="text-red-500">No adjunto</span>
                                    )}
                                </div>
                                <div>
                                    <span className="font-bold text-foreground block mb-1">Motivación:</span>
                                    <p className="text-muted italic bg-slate-50 dark:bg-black/20 p-3 rounded-xl text-xs">
                                        "{req.motivation}"
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col justify-center gap-3 md:w-48 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                                <button
                                    onClick={() => handleDecision(req.id, req.user_id, 'approved')}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                >
                                    <CheckCircle size={16} /> Aprobar
                                </button>
                                <button
                                    onClick={() => handleDecision(req.id, req.user_id, 'rejected')}
                                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                >
                                    <XCircle size={16} /> Rechazar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
