"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    CheckCircle2,
    Download,
    FileText,
    Music,
    ArrowRight,
    Package,
    ShieldCheck,
    Mail,
    Crown,
    Briefcase,
    Loader2,
    Sparkles,
    Star,
    Zap,
    Clock,
    AlertCircle,
    CreditCard,
    Disc3,
    ShoppingBag
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';
import { triggerSuccessConfetti } from '@/lib/confetti';
import { ParallaxBackground, FloatingParticles, AbstractPuzzleBack, SonicWaveBack, NoiseOverlay, ScrollReveal } from '@/components/ui/BackgroundEffects';
import { motion, AnimatePresence } from 'framer-motion';

const LICENSE_LABELS: Record<string, string> = {
    basica: 'Básica',
    basic: 'Básica',
    mp3: 'MP3 Estándar',
    pro: 'Pro',
    premium: 'Premium',
    ilimitada: 'Ilimitada',
    unlimited: 'Ilimitada',
    exclusiva: 'Exclusiva',
    exclusive: 'Exclusiva',
    soundkit: 'Sound Kit',
    sound_kit: 'Sound Kit',
    service: 'Servicio',
};

function getLicenseBadge(tipo_licencia: string | null, productName?: string) {
    let effectiveLicense = (tipo_licencia || '').toLowerCase().trim();
    const isKit = productName?.toLowerCase().includes('sound kit') || productName?.toLowerCase().includes('soundkit');

    if (isKit) {
        return { label: 'Licencia Sound Kit', color: 'text-orange-400', dot: 'bg-orange-400' };
    }

    // [FALLBACK] Smart license detection from product name if DB metadata is missing/wrong
    if ((!effectiveLicense || effectiveLicense === 'basica') && productName?.includes('[')) {
        const match = productName.match(/\[(.*?)\]/);
        if (match && match[1]) {
            const extracted = match[1].toLowerCase().trim();
            const validLicenses = ['pro', 'premium', 'exclusiva', 'exclusive', 'ilimitada', 'unlimited'];
            if (validLicenses.includes(extracted)) {
                effectiveLicense = extracted;
            }
        }
    }

    if (!effectiveLicense) return { label: 'Licencia Digital', color: 'text-blue-500', dot: 'bg-blue-500' };
    const key = effectiveLicense.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Forzado para Sound Kits si el tipo de licencia es incorrecto o vacío (redundancia)
    if (key.includes('soundkit') || key.includes('sound_kit')) {
        return { label: 'Licencia Sound Kit', color: 'text-orange-400', dot: 'bg-orange-400' };
    }

    const label = LICENSE_LABELS[effectiveLicense] || LICENSE_LABELS[key] || effectiveLicense;

    // Normalización para colores específicos solicitados
    if (key.includes('exclusiv')) return { label: label, color: 'text-red-500', dot: 'bg-red-500' };
    if (key.includes('ilimitad') || key.includes('unlimited')) return { label: label, color: 'text-purple-400', dot: 'bg-purple-400' };
    if (key.includes('premium')) return { label: label, color: 'text-amber-400', dot: 'bg-amber-400' };
    if (key.includes('pro')) return { label: label, color: 'text-blue-400', dot: 'bg-blue-400' };
    if (key.includes('gratis') || key.includes('free')) return { label: label, color: 'text-gray-400', dot: 'bg-gray-400' };
    if (key === 'service') return { label: 'Servicio Profesional', color: 'text-teal-400', dot: 'bg-teal-400' };
    
    // Básica / MP3
    return { label: label, color: 'text-emerald-400', dot: 'bg-emerald-400' };
}

export default function SuccessPage() {
    const { showToast } = useToast();
    const { clearCart } = useCart();
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [pagoPendiente, setPagoPendiente] = useState(false);

    useEffect(() => {
        const fetchOrder = async (retryCount = 0) => {
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('session_id');

            if (!sessionId) { setLoading(false); return; }

            try {
                // Buscamos por pago_id (ID de sesión o de factura)
                // O por el ID de sesión guardado en metadatos (crucial para suscripciones)
                const { data: transacciones, error: txError } = await supabase
                    .from('transacciones')
                    .select('*')
                    .or(`pago_id.eq.${sessionId},metadatos->>checkout_session_id.eq.${sessionId}`);

                if (txError) throw txError;

                // Backoff exponencial: 1s, 2s, 4s, 8s, 16s, 32s (6 reintentos = hasta ~63s)
                if ((!transacciones || transacciones.length === 0) && retryCount < 6) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 32000);
                    setTimeout(() => fetchOrder(retryCount + 1), delay);
                    return;
                }

                if (transacciones && transacciones.length > 0) {
                    setOrderId(transacciones[0].orden_pedido || sessionId);
                    const items = transacciones.map(tx => ({
                        id: tx.id,
                        tipo_producto: tx.tipo_producto,
                        nombre: tx.nombre_producto,
                        precio: tx.precio_total,
                        tipo_licencia: tx.tipo_licencia,
                        metadatos: tx.metadatos,
                        producto_id: tx.producto_id,
                        orden_pedido: tx.orden_pedido,
                        estado_pago: tx.estado_pago,
                        portada_url: tx.metadatos?.portada_url || tx.metadatos?.image || tx.metadatos?.cover
                    }));

                    // Detectar si hay pagos pendientes (asíncronos like Oxxo)
                    const isAnyPending = items.some(item => item.estado_pago === 'pendiente');
                    setPagoPendiente(isAnyPending);

                    const txIds = transacciones.map(t => t.id);
                    const { data: projects } = await supabase
                        .from('proyectos')
                        .select('id, transaccion_id')
                        .in('transaccion_id', txIds);

                    if (projects && projects.length > 0) {
                        items.forEach(item => {
                            const p = projects.find(proj => proj.transaccion_id === item.id);
                            if (p) (item as any).project_id = p.id;
                        });
                    }

                    setPurchasedItems(items);
                    setLoading(false);
                    // Trigger celebration confetti! 🎊
                    triggerSuccessConfetti();
                } else {
                    // Si tras los reintentos no hay nada
                    setLoading(false);
                }

                clearCart();
            } catch (err) {
                console.error("Error fetching purchase session:", err);
                if (retryCount >= 6) {
                    showToast("Hubo un error al cargar los detalles de tu compra.", 'error');
                    setLoading(false);
                } else {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 32000);
                    setTimeout(() => fetchOrder(retryCount + 1), delay);
                }
            }
        };

        fetchOrder();
    }, []);

    const handleDownload = async (item: any) => {
        try {
            setDownloadingId(item.id);
            showToast("Iniciando descarga...", 'info');

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error("Sesión expirada. Por favor inicia sesión de nuevo.");

            const response = await fetch(`/api/download?txId=${item.id}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (!response.ok) {
                let errorMsg = 'Error en la descarga';
                try {
                    const errorData = await response.json();
                    if (errorData.error) errorMsg = errorData.error;
                } catch (e) { }
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get('Content-Type');
            const contentDisposition = response.headers.get('Content-Disposition');

            if (contentType?.includes('application/json')) {
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                if (data.url) {
                    const a = document.createElement('a');
                    a.href = data.url;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    showToast("¡Descarga iniciada!", "success");
                    return;
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            let filename = `TianguisBeats_${item.nombre}.zip`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch?.[1]) filename = filenameMatch[1];
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast("¡Descarga iniciada!", "success");
        } catch (error: any) {
            console.error("Download error:", error);
            showToast(error.message || "Error al iniciar la descarga", 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadLicense = async (item: any) => {
        const isBeat = item.tipo_producto === 'beat';
        const savedPdfUrl = item.metadatos?.contract_pdf_url || item.metadatos?.contractPdfUrl;

        // Use generator for beats to ensure the new letterhead design
        if (savedPdfUrl && !isBeat) {
            showToast("Obteniendo Licencia Oficial...", 'info');
            window.open(savedPdfUrl, '_blank');
            return;
        }

        showToast("Generando certificado...", 'info');
        let licenseType: any = 'basic';
        if (item.tipo_producto === 'sound_kit') licenseType = 'soundkit';
        else if (item.tipo_producto === 'service') licenseType = 'service';
        else licenseType = item.tipo_licencia?.toLowerCase() || 'basic';

        try {
            const { downloadLicensePDF } = await import('@/lib/pdfGenerator');
            let effectiveLicense: string = licenseType;
            if (effectiveLicense === 'basic') effectiveLicense = 'basica';
            if (effectiveLicense === 'free' || effectiveLicense === 'demo') effectiveLicense = 'gratis';
            if (effectiveLicense === 'unlimited') effectiveLicense = 'ilimitada';
            if (effectiveLicense === 'exclusive') effectiveLicense = 'exclusiva';
            if (item.tipo_producto === 'sound_kit' || item.tipo_producto === 'soundkit') effectiveLicense = 'soundkits';

            await downloadLicensePDF({
                orderId: orderId || item.id,
                transactionId: item.id,
                licenseType: effectiveLicense,
                beatId: item.producto_id,
                buyerName: 'Cliente Tianguis',
                buyerEmail: '',
                productName: item.nombre
            });
            showToast("Licencia generada exitosamente", 'success');
        } catch (error) {
            console.error("Error al generar la licencia:", error);
            showToast("Hubo un problema al crear la licencia.", 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-5 text-center px-8">
                    <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">Verificando compra...</p>
                    <p className="text-[9px] text-muted/60 max-w-xs leading-relaxed">Esto puede tomar unos segundos mientras confirmamos tu pago con Stripe.</p>
                </div>
            </div>
        );
    }

    const isAllPlans = purchasedItems.length > 0 && purchasedItems.every(i => i.tipo_producto === 'plan');
    const beatKitItems = purchasedItems.filter(i => i.tipo_producto !== 'plan');
    const planItems = purchasedItems.filter(i => i.tipo_producto === 'plan');

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <NoiseOverlay />
            
            <div className="fixed inset-0 pointer-events-none z-[-1]">
                <SonicWaveBack theme="blue" opacity={0.6} />
            </div>

            {/* Ambient background glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[120px]" />
            </div>

            <main className="pt-32 pb-40 relative z-10 w-full overflow-hidden">
                {/* Background Large Text (Catalog Style) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
                    <motion.span 
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute top-[10%] left-[-5%] text-[20vw] font-black leading-none text-blue-500/[0.04] dark:text-blue-500/[0.07] tracking-tighter uppercase -rotate-6 block whitespace-nowrap"
                    >
                        GRACIAS
                    </motion.span>
                </div>

                <div className="max-w-[1700px] mx-auto px-6 sm:px-12 relative z-10 text-center lg:text-left">
                    <ScrollReveal direction="up" delay={0.1}>
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500 mix-blend-difference dark:mix-blend-normal">Compra Verificada</span>
                        </div>
                        
                        <div className="relative inline-block">
                            <h1 className="text-6xl md:text-8xl lg:text-[7rem] xl:text-[8rem] font-black uppercase tracking-tighter leading-[0.85] mb-12 relative z-10">
                                <span className="text-blue-500">Gracias por</span> <br />
                                <span className="text-slate-400/50 dark:text-white/20">Tu Compra</span>
                            </h1>
                        </div>

                        <div className="max-w-2xl mx-auto lg:mx-0">
                            <p className="text-black/50 dark:text-white/30 text-[11px] font-black uppercase tracking-[0.4em] mb-12 leading-loose">
                                Tu pedido <span className="text-blue-500 font-black">#{orderId || 'PROCESS-ERR'}</span> ha sido procesado exitosamente. 
                                Los archivos y licencias ya están listos en tu panel de control.
                            </p>
                            
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6">
                                <Link href="/explore" className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-foreground flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                                    Seguir Comprando
                                    <ArrowRight size={14} />
                                </Link>
                                {!isAllPlans && (
                                    <Link href="/perfil" className="h-14 px-8 rounded-2xl bg-blue-500 text-white flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/20">
                                        Ver en mis compras
                                        <ArrowRight size={14} />
                                    </Link>
                                )}
                                {isAllPlans && (
                                    <Link href="/studio/billing" className="h-14 px-8 rounded-2xl bg-blue-500 text-white flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/20">
                                        Gestionar suscripción
                                        <ArrowRight size={14} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Content Sections */}
                    <div className="mt-32 space-y-24">
                        
                        {/* PLAN SECTION */}
                        {planItems.length > 0 && (
                            <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Tu Suscripción</h3>
                                </div>
                                <div className="grid gap-6">
                                    {planItems.map((item, idx) => {
                                        const isPremium = item.nombre?.toLowerCase().includes('premium');
                                        return (
                                            <div key={idx} className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-10 backdrop-blur-3xl overflow-hidden relative group">
                                                <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${isPremium ? 'text-blue-500' : 'text-amber-500'}`}>
                                                    <Crown size={120} />
                                                </div>
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-20 h-20 ${isPremium ? 'bg-blue-600 shadow-blue-500/20' : 'bg-amber-500 shadow-amber-500/20'} text-white rounded-3xl flex items-center justify-center shadow-xl`}>
                                                        <Crown size={32} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-2xl font-black uppercase tracking-tight text-foreground">{item.nombre}</h4>
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1">Suscripción Activa • Acceso Ilimitado</p>
                                                    </div>
                                                </div>
                                                <Link href="/studio/billing" className={`h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 ${
                                                    isPremium 
                                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                    : 'bg-white text-black hover:bg-amber-500 hover:text-white'
                                                }`}>
                                                    Gestionar suscripción
                                                    <CreditCard size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* BEATS & KITS SECTION */}
                        {beatKitItems.length > 0 && (
                            <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Productos Adquiridos</h3>
                                </div>
                                <div className="grid gap-4">
                                    {beatKitItems.map((item, idx) => (
                                        <div key={idx} className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 backdrop-blur-3xl group hover:bg-white/[0.05] transition-all">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="relative w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 overflow-hidden shrink-0">
                                                        {item.portada_url ? (
                                                            <Image src={item.portada_url} alt={item.nombre} fill className="object-cover" sizes="64px" />
                                                        ) : (
                                                            item.tipo_producto === 'sound_kit' ? <Disc3 size={28} /> : <Music size={28} />
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="text-xl font-black uppercase tracking-tight text-foreground line-clamp-1">{item.nombre}</h4>
                                                        <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] mt-1">
                                                            {item.tipo_producto === 'sound_kit' ? 'Sound Kit' : 'Beat'} • {item.tipo_licencia || 'Licencia Estándar'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* HELP FOOTER */}
                        {!isAllPlans && (
                            <div className="pt-20 border-t border-white/5 text-center">
                                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.4em] mb-6">¿Tienes problemas con tu descarga?</p>
                                <Link href="/help" className="text-blue-500 font-black text-xs uppercase tracking-widest hover:underline">Contactar Soporte Técnico</Link>
                            </div>
                        )}

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
