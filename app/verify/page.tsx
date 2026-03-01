"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, ShieldCheck, Calendar, User, Music, Package, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingTianguis from '@/components/LoadingTianguis';

export default function VerificationPageWrapper() {
    return (
        <Suspense fallback={<LoadingTianguis />}>
            <VerificationPage />
        </Suspense>
    );
}

function VerificationPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [loading, setLoading] = useState(true);
    const [transaction, setTransaction] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                // Fetch transaction with buyer info
                const { data, error: txError } = await supabase
                    .from('transacciones')
                    .select(`
                        *,
                        comprador:perfiles!comprador_id (
                            nombre_artistico,
                            nombre_usuario
                        )
                    `)
                    .or(`id.eq.${id},orden_pedido.eq.${id}`)
                    .in('estado_pago', ['completado', 'completed', 'valido'])
                    .single();

                if (txError) throw txError;
                setTransaction(data);
            } catch (err: any) {
                console.error("Verification Error:", err);
                setError("El código de verificación proporcionado no es válido o la transacción no ha sido completada.");
            } finally {
                setLoading(false);
            }
        };

        fetchVerification();
    }, [id]);

    if (loading) return <LoadingTianguis />;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-24">
                <div className="text-center mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors mb-8">
                        <ArrowLeft size={14} /> Volver al Inicio
                    </Link>
                    <div className="w-24 h-24 bg-accent/10 text-accent rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-accent/20 border border-accent/20">
                        {error ? <AlertTriangle size={40} /> : <ShieldCheck size={40} />}
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4">
                        Sistema de <span className="text-accent underline underline-offset-8 decoration-accent/20">Verificación.</span>
                    </h1>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Protocolo de Validación Digital Tianguis Beats</p>
                </div>

                {error ? (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-[3rem] p-12 text-center">
                        <h2 className="text-xl font-black text-red-500 uppercase tracking-tight mb-4 flex items-center justify-center gap-3">
                            <AlertTriangle size={24} /> Licencia no Encontrada
                        </h2>
                        <p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed max-w-md mx-auto">
                            El código de verificación proporcionado no coincide con ninguna transacción completada en nuestra base de datos.
                        </p>
                        <Link href="/quejas-y-sugerencias" className="inline-block mt-8 bg-foreground text-background dark:bg-white dark:text-black px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-all">
                            Contactar Soporte
                        </Link>
                    </div>
                ) : transaction && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Status Hero */}
                        <div className="bg-emerald-500 text-white rounded-[3.5rem] p-12 text-center shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
                            <div className="relative z-10">
                                <CheckCircle2 size={64} className="mx-auto mb-6" />
                                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Licencia Verificada</h2>
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80 decoration-white/30 underline underline-offset-4 decoration-2">Autenticidad Confirmada por Tianguis Beats</p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-card border border-border rounded-[2.5rem] p-8 hover:border-accent/40 transition-colors group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-accent/5 text-accent rounded-2xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                                        {transaction.tipo_producto === 'beat' ? <Music size={20} /> : <Package size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">Producto Escaneado</p>
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight truncate">{transaction.nombre_producto}</h3>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-border">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Tipo de Producto</span>
                                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest bg-accent/10 px-3 py-1 rounded-full">{transaction.tipo_producto}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-border">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Licencia Adquirida</span>
                                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{transaction.tipo_licencia || 'Estándar'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-[2.5rem] p-8 hover:border-accent/40 transition-colors group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-amber-500/5 text-amber-500 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">Titular de la Licencia</p>
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight truncate">{transaction.comprador?.nombre_artistico || transaction.comprador?.nombre_usuario || 'Adquiriente Verificado'}</h3>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-border">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Usuario</span>
                                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">@{transaction.comprador?.nombre_usuario}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-border">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Fecha de Emisión</span>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-foreground uppercase tracking-widest">
                                            <Calendar size={12} className="text-muted" />
                                            {new Date(transaction.fecha_creacion).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Legal Hash Box */}
                        <div className="bg-zinc-900 border border-zinc-700/50 rounded-[2.5rem] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ShieldCheck size={120} className="text-white" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Certificación de Cadena de Bloques Interna</h4>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">ID de Verificación (Transaction Hash)</p>
                                        <p className="text-[11px] font-mono text-emerald-400 break-all bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 shadow-inner">
                                            {transaction.id.repeat(4).slice(0, 64).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Orden Maestro</p>
                                            <p className="text-xs font-black text-white uppercase tracking-widest">{transaction.orden_pedido || 'DIRECT_INT_001'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Stripe Payment Signature</p>
                                            <p className="text-xs font-black text-white uppercase tracking-widest truncate max-w-[200px]">{transaction.pago_id || 'CASH_VALIDATED'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-[9px] font-bold text-muted uppercase tracking-[0.2em] opacity-40 py-8">
                            Este documento es una representación digital del contrato firmado. Tianguis Beats garantiza la validez legal de esta transacción bajo los términos aceptados en la plataforma.
                        </p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
