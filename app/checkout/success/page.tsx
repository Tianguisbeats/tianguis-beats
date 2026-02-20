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
    Mail
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getBeatFulfillmentLinks, getSoundKitFulfillmentLink } from '@/lib/fulfillment';
import { generateLicenseText } from '@/lib/licenses';
import { useToast } from '@/context/ToastContext';

export default function SuccessPage() {
    const { showToast } = useToast();
    const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // En un escenario real, cargaríamos esto desde la base de datos usando el ID de la transacción
        // Por ahora simularemos la recuperación de los items comprados recientemente
        const lastPurchase = localStorage.getItem('last_purchase');
        if (lastPurchase) {
            setPurchasedItems(JSON.parse(lastPurchase));
        }
        setLoading(false);
    }, []);

    const handleDownload = async (item: any) => {
        let links: any[] = [];
        const metadata = item.metadata || {};

        if (item.type === 'beat') {
            links = await getBeatFulfillmentLinks(metadata, item.licenseType);
        } else if (metadata.isSoundKit || item.type === 'license') {
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
        const licenseText = generateLicenseText(item.licenseType || 'basic', {
            producerName: item.metadata?.producer_name || item.producerName || 'Productor Tianguis',
            buyerName: 'Cliente Tianguis',
            productName: item.name,
            purchaseDate: new Date().toLocaleDateString(),
            amount: item.price.toString()
        });

        const blob = new Blob([licenseText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Licencia_${item.name.replace(/\s+/g, '_')}.txt`;
        a.click();
    };

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
                            ¡Gracias por <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">tu compra!</span>
                        </h1>
                        <p className="text-white/60 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                            Tus archivos están listos para descargar. También hemos enviado una copia de tus licencias a tu correo electrónico.
                        </p>
                    </div>

                    {/* Downloads Section */}
                    <div className="space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8 pl-4 flex items-center gap-3">
                            <Download size={14} className="text-blue-500" />
                            Tus Archivos de Alta Calidad
                        </h2>

                        {purchasedItems.length > 0 ? purchasedItems.map((item, idx) => (
                            <div key={idx} className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all duration-500">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${item.type === 'beat' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20' : 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20'}`}>
                                            {item.type === 'beat' ? <Music size={32} /> : <Package size={32} />}
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">{item.name}</h3>
                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                                {item.type === 'beat' ? `Licencia ${item.licenseType || 'MP3'}` : 'Sound Kit Original'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
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
                                            Licencia
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 bg-white/5 border border-white/10 rounded-[2.5rem] text-center">
                                <p className="text-white/40 font-bold text-sm">No se encontraron archivos recientes.</p>
                            </div>
                        )}
                    </div>

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
