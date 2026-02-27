"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle2,
    Download,
    FileText,
    Music,
    ArrowRight,
    Package,
    ShieldCheck,
    Mail,
    Crown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { getBeatFulfillmentLinks, getSoundKitFulfillmentLink } from '@/lib/fulfillment';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';

export default function SuccessPage() {
    const { showToast } = useToast();
    const { clearCart } = useCart();
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('session_id');

            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                // 1. Buscar transacciones por pago_id (Stripe Session)
                const { data: transacciones, error: txError } = await supabase
                    .from('transacciones')
                    .select('*')
                    .eq('id_pago_stripe', sessionId);

                if (txError) throw txError;

                if (transacciones && transacciones.length > 0) {
                    setOrderId(sessionId);
                    // Adaptar las transacciones al formato que espera la UI (items_orden)
                    const items = transacciones.map(tx => ({
                        id: tx.id,
                        tipo_producto: tx.tipo_producto,
                        nombre: tx.nombre_producto,
                        precio: tx.precio_total,
                        tipo_licencia: tx.tipo_licencia,
                        metadatos: tx.metadatos
                    }));
                    setPurchasedItems(items);
                }

                // Limpiar el carrito localmente después de una compra exitosa (Siempre que haya sessionId)
                clearCart();
                localStorage.removeItem('tianguis_cart');
            } catch (err) {
                console.error("Error fetching purchase session:", err);
                showToast("Hubo un error al cargar los detalles de tu compra.", 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, []);

    const handleDownload = async (item: any) => {
        let links: any[] = [];
        const metadata = item.metadatos || {}; // Usar metadatos de la DB

        if (item.tipo_producto === 'beat') {
            links = await getBeatFulfillmentLinks(metadata, item.tipo_licencia);
        } else if (item.tipo_producto === 'sound_kit') {
            const link = await getSoundKitFulfillmentLink(metadata);
            if (link) links.push(link);
        }

        if (links.length === 0) {
            showToast("No se encontraron archivos descargables para este producto.", 'error');
            return;
        }

        // Abrir el primero en una nueva pestaña
        window.open(links[0].url, '_blank');
        showToast("Descarga iniciada", 'success');

        if (links.length > 1) {
            showToast("Este producto incluye múltiples archivos. Iniciando descargas adicionales...", 'info');
            for (let i = 1; i < links.length; i++) {
                setTimeout(() => window.open(links[i].url, '_blank'), i * 500);
            }
        }
    };

    const handleDownloadLicense = (item: any) => {
        // 1. Intentar descargar el PDF oficial generado y guardado en la Base de Datos
        const savedPdfUrl = item.metadatos?.contract_pdf_url || item.metadatos?.contractPdfUrl;

        if (savedPdfUrl) {
            showToast("Obteniendo Licencia Oficial...", 'info');
            window.open(savedPdfUrl, '_blank');
            return;
        }

        // 2. Fallback: Si no hay URL (compras antiguas), se genera en vivo como antes
        showToast("Generando certificado legacy...", 'info');
        import('@/lib/pdfGenerator').then(({ downloadLicensePDF }) => {
            downloadLicensePDF({
                type: item.tipo_licencia as any || 'basic',
                producerName: item.metadatos?.producer_name || item.metadatos?.producerName || 'Productor Tianguis',
                buyerName: 'Cliente Tianguis', // Podríamos obtener el nombre real si estuviera en la orden
                productName: item.nombre,
                purchaseDate: new Date(item.fecha_creacion).toLocaleDateString(),
                amount: item.precio,
                orderId: orderId || 'N/A'
            });
            showToast("Licencia legacy generada con éxito", 'success');
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="animate-spin text-blue-500">
                    <Music size={48} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
            <Navbar />

            <main className="pt-32 pb-40 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                    {/* Success Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-500/10 text-blue-500 rounded-[2rem] mb-8 animate-bounce shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] border border-blue-500/20">
                            <CheckCircle2 size={48} />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
                            {purchasedItems.length > 0 && purchasedItems.every(i => i.tipo_producto === 'plan')
                                ? <>¡Suscripción <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Activada!</span></>
                                : <>¡Gracias por <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">tu compra!</span></>
                            }
                        </h1>
                        <p className="text-white/60 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                            {purchasedItems.length > 0 && purchasedItems.every(i => i.tipo_producto === 'plan')
                                ? "Tu plan ya está activo y todos los beneficios han sido vinculados a tu cuenta. ¡Bienvenido a la experiencia completa de Tianguis Beats!"
                                : "Tus archivos están listos para descargar. También puedes acceder a ellos en cualquier momento desde tu panel de Mis Compras."
                            }
                        </p>

                        {purchasedItems.length > 0 && purchasedItems.every(i => i.tipo_producto === 'plan') && (
                            <div className="mt-12 flex flex-col items-center gap-6">
                                {purchasedItems.some(i => i.tipo_producto === 'plan' && i.metadatos?.tier === 'premium') ? (
                                    <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl max-w-md">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4">Beneficios Premium activos:</h4>
                                        <ul className="text-left space-y-3">
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                Verificación Instantánea
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                Subidas Ilimitadas de Beats
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                Promoción Destacada en Inicio
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                Insignia de Fundador / Premium
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                Soporte Prioritario 24/7
                                            </li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl max-w-md">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4">Beneficios Pro activos:</h4>
                                        <ul className="text-left space-y-3">
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                Subidas Ilimitadas de Beats
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                Venta de Servicios y Sound Kits
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                Insignia de Suscriptor Pro
                                            </li>
                                            <li className="flex items-center gap-3 text-sm text-white/80 font-bold uppercase tracking-tight">
                                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                                                100% de Ganancias
                                            </li>
                                        </ul>
                                    </div>
                                )}
                                <Link
                                    href="/studio"
                                    className="px-10 py-5 bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-blue-500/20"
                                >
                                    Ir a mi Studio
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Downloads Section - Only show if there's at least one non-plan item */}
                    {purchasedItems.length > 0 && purchasedItems.some(i => i.tipo_producto !== 'plan') && (
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8 pl-4 flex items-center gap-3">
                                <Download size={14} className="text-blue-500" />
                                Tus Archivos en Alta Calidad
                            </h2>

                            {purchasedItems.filter(i => i.tipo_producto !== 'plan').map((item, idx) => (
                                <div key={idx} className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-500">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${item.tipo_producto === 'beat' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20' : 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20'}`}>
                                                {item.tipo_producto === 'beat' ? <Music size={32} /> : item.tipo_producto === 'plan' ? <ShieldCheck size={32} /> : <Package size={32} />}
                                            </div>
                                            <div className="text-center md:text-left">
                                                <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">{item.nombre}</h3>
                                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                                    {item.tipo_producto === 'beat' ? `Licencia ${item.tipo_licencia || 'MP3'}` : item.tipo_producto === 'plan' ? 'Acceso Premium Activado' : 'Sound Kit Original'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                                            {item.tipo_producto !== 'plan' && (
                                                <>
                                                    <button
                                                        onClick={() => handleDownload(item)}
                                                        className="px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-white/5"
                                                    >
                                                        <Download size={14} />
                                                        Descargar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadLicense(item)}
                                                        className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
                                                    >
                                                        <FileText size={14} />
                                                        Descargar Licencia
                                                    </button>
                                                </>
                                            )}
                                            {item.tipo_producto === 'plan' && (
                                                <Link
                                                    href="/studio"
                                                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                                >
                                                    Ir al Studio
                                                    <ArrowRight size={14} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Subscription-specific Highlight */}
                    {purchasedItems.length > 0 && purchasedItems.some(i => i.tipo_producto === 'plan') && (
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8 pl-4 flex items-center gap-3">
                                <ShieldCheck size={14} className="text-blue-500" />
                                Tu Suscripción Activa
                            </h2>

                            {purchasedItems.filter(i => i.tipo_producto === 'plan').map((item, idx) => (
                                <div key={idx} className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-blue-500/30 rounded-[2.5rem] p-10 hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.2)] transition-all duration-500 border-dashed">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row items-center gap-6">
                                            <div className="w-20 h-20 bg-blue-500 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                                                <Crown size={40} />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-2">{item.nombre}</h3>
                                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Acceso Ilimitado</span>
                                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">Studio Avanzado</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href="/studio"
                                            className="w-full md:w-auto px-10 py-5 bg-white text-black rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            Explorar Studio
                                            <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Support & Next Steps */}
                    <div className="mt-20 grid md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-500/20 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                            <ShieldCheck className="absolute -right-4 -bottom-4 text-blue-500/10 w-40 h-40 group-hover:scale-110 transition-transform duration-700" />
                            <h3 className="text-2xl font-black uppercase mb-4 tracking-tight">¿Necesitas Ayuda?</h3>
                            <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-xs">
                                Si tienes problemas con tus descargas o necesitas una factura, nuestro soporte está listo.
                            </p>
                            <Link href="/support" className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors">
                                Contactar Soporte <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-center hover:bg-white/10 transition-colors cursor-default">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                    <Mail size={24} />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Respaldo en Correo</h3>
                            </div>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Te enviamos un correo con los mismos enlaces de descarga para que los tengas disponibles siempre.
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-20">
                        <Link href="/beats" className="group inline-flex items-center gap-4 px-12 py-5 bg-white/5 border border-white/10 rounded-full font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white hover:text-black transition-all hover:scale-105 active:scale-95">
                            Seguir Explorando
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
