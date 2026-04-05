"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Calendar, User, Music, Package, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingTianguis from '@/components/LoadingTianguis';

/**
 * Página de Verificación de Transacciones (v5.0 Global)
 * Ahora usa el API de verificación pública para permitir que usuarios
 * no autenticados puedan validar sus recibos/licencias.
 */

export default function VerificationPageWrapper() {
    return (
        <Suspense fallback={<LoadingTianguis />}>
            <VerificationPage />
        </Suspense>
    );
}

function VerificationPage() {
    const searchParams = useSearchParams();
    // Soporta tanto ?order= como ?id=
    const verifyId = searchParams.get('order') || searchParams.get('id');
    
    const [loading, setLoading] = useState(true);
    const [txData, setTxData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!verifyId) {
            setLoading(false);
            setError("No se proporcionó un ID de orden válido.");
            return;
        }

        const fetchPublicVerification = async () => {
            try {
                // Hacer el fetch al nuevo API público
                const response = await fetch(`/api/verify?id=${verifyId}`);
                
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || "Transacción no válida");
                }

                const data = await response.json();
                setTxData(data);
                setError(null);
            } catch (err: any) {
                console.error("Verification Client Error:", err);
                setError(err.message || "El código de verificación no coincide con ninguna transacción completada.");
            } finally {
                setLoading(false);
            }
        };

        fetchPublicVerification();
    }, [verifyId]);

    if (loading) return <LoadingTianguis />;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/30 selection:text-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-24 md:py-32">
                <div className="text-center mb-16">
                    <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-accent transition-all mb-10 hover:-translate-x-1">
                        <ArrowLeft size={14} /> Volver al Inicio
                    </Link>
                    
                    <div className={`w-28 h-28 ${error ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'} rounded-[3.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-700`}>
                        {error ? <AlertTriangle size={48} /> : <ShieldCheck size={48} />}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-4">
                        Sistema de <span className="text-accent underline underline-offset-8 decoration-accent/20">Verificación.</span>
                    </h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] opacity-60">Protocolo de Validación Digital Tianguis Beats</p>
                </div>

                {error ? (
                    <div className="bg-rose-500/[0.03] border border-rose-500/20 rounded-[3.5rem] p-12 text-center animate-in fade-in zoom-in duration-500 shadow-xl shadow-rose-500/5">
                        <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-4 flex items-center justify-center gap-3">
                            <AlertTriangle size={28} /> Pedido no Encontrado
                        </h2>
                        <p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed max-w-md mx-auto opacity-70">
                            Lo sentimos, el identificador <span className="text-foreground">"{verifyId}"</span> no corresponde a ninguna certificación válida en nuestro sistema oficial.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-10">
                            <Link href="/beats" className="bg-foreground text-background dark:bg-white dark:text-black px-12 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                                Explorar Tianguis
                            </Link>
                        </div>
                    </div>
                ) : txData && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        
                        {/* Status Success Banner */}
                        <div className="bg-emerald-600 dark:bg-emerald-500 text-white rounded-[4rem] p-14 text-center shadow-2xl shadow-emerald-500/30 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                           <div className="relative z-10">
                                <ShieldCheck size={72} className="mx-auto mb-8 animate-bounce-short" />
                                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">
                                    Certificación de Autenticidad
                                </h2>
                                <div className="inline-block py-2 px-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20 border-dotted mt-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Tianguis Beats Verified Registry</p>
                                </div>
                           </div>
                        </div>

                        {/* Parties Info */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-card border border-border/50 rounded-[3rem] p-10">
                                <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-6">Vendedor</p>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-1">{txData.sellerArtisticName}</h3>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Tianguis Certified Producer</p>
                            </div>
                            <div className="bg-card border border-border/50 rounded-[3rem] p-10 text-right">
                                <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-6">Comprador / Titular</p>
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-1">{txData.buyerArtisticName}</h3>
                                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Digital License Owner</p>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="bg-card border border-border/50 rounded-[3.5rem] overflow-hidden">
                            <div className="p-10 border-b border-border/50 bg-muted/20">
                                <h4 className="text-[12px] font-black text-foreground uppercase tracking-[0.4em]">Productos Vinculados</h4>
                            </div>
                            <div className="p-10 space-y-8">
                                {txData.items && txData.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center gap-6 group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-accent/5 rounded-2xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-lg border border-accent/10">
                                                {item.type === 'sound_kit' ? <Package size={24} /> : <Music size={24} />}
                                            </div>
                                            <div>
                                                <h5 className="font-black text-lg uppercase tracking-tight">{item.name}</h5>
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{item.type} • {item.license}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg font-mono">{item.price}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Totals Summary */}
                                <div className="mt-12 pt-10 border-t border-border/50 flex flex-col items-end space-y-4">
                                    <div className="flex justify-between w-full md:max-w-[300px] items-center">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Subtotal</span>
                                        <span className="font-black text-lg">{txData.subtotal}</span>
                                    </div>
                                    {txData.descuento && (
                                        <div className="flex justify-between w-full md:max-w-[300px] items-center">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Descuento ({txData.couponCode})</span>
                                            <span className="font-black text-lg text-rose-500">-{txData.descuento}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between w-full md:max-w-[300px] items-center py-4 border-t-2 border-accent border-dashed mt-4 box-content">
                                        <span className="text-[12px] font-black text-foreground uppercase tracking-widest">Total Verificado</span>
                                        <span className="font-black text-3xl text-accent">{txData.total}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Master Order Info */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-inner">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <ShieldCheck size={180} className="text-white" />
                            </div>
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3 opacity-60">ID de Orden Maestro</p>
                                    <p className="text-sm font-black text-white uppercase tracking-widest bg-white/[0.03] p-4 rounded-2xl border border-white/5">{txData.orderId}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3 opacity-60">Fecha de Emisión</p>
                                    <p className="text-sm font-black text-white uppercase tracking-widest bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                        {new Date(txData.transactionDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3 opacity-60">Referencia Pago</p>
                                    <p className="text-sm font-black text-white uppercase tracking-widest bg-white/[0.03] p-4 rounded-2xl border border-white/5 font-mono">{txData.pagoId}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40 px-10 leading-relaxed py-10 border-t border-border/20">
                            Tianguis Beats garantiza que esta certificación es legal y refleja fielmente los registros de nuestro sistema de validación. 
                            Este comprobante digital protege la propiedad intelectual y combate el plagio.
                        </p>
                    </div>
                )}
            </main>

            <Footer />

            <style jsx global>{`
                @keyframes bounce-short {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-5px); }
                }
                .animate-bounce-short {
                  animation: bounce-short 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
