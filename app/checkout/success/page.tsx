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

export default function SuccessPage() {
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
            alert("No se encontraron archivos descargables para este producto.");
            return;
        }

        // Abrir el primero en una nueva pestaña
        window.open(links[0].url, '_blank');

        if (links.length > 1) {
            alert("Este producto incluye múltiples archivos. Se han iniciado las descargas adicionales.");
            for (let i = 1; i < links.length; i++) {
                window.open(links[i].url, '_blank');
            }
        }
    };

    const handleDownloadLicense = (item: any) => {
        const licenseText = generateLicenseText(item.licenseType || 'basic', {
            producerName: item.metadata?.producer_name || item.producerName || 'Productor Tianguis',
            buyerName: 'Cliente Tianguis',
            beatTitle: item.name,
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
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />

            <main className="pt-32 pb-40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Success Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/10 text-green-500 rounded-full mb-8 animate-bounce">
                            <CheckCircle2 size={48} />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                            ¡Gracias por <br />
                            <span className="text-accent">tu compra!</span>
                        </h1>
                        <p className="text-muted text-lg font-medium max-w-lg mx-auto">
                            Tus archivos están listos para descargar. También hemos enviado una copia de tus licencias a tu correo electrónico.
                        </p>
                    </div>

                    {/* Downloads Section */}
                    <div className="space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted mb-8 pl-4 flex items-center gap-3">
                            <Download size={14} className="text-accent" />
                            Tus Archivos de Alta Calidad
                        </h2>

                        {purchasedItems.length > 0 ? purchasedItems.map((item, idx) => (
                            <div key={idx} className="bg-card border border-border rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-accent/5 transition-all">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                                            {item.type === 'beat' ? <Music size={32} /> : <Package size={32} />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">{item.name}</h3>
                                            <p className="text-muted text-[10px] font-black uppercase tracking-widest mt-1">
                                                {item.type === 'beat' ? `Licencia ${item.licenseType || 'MP3'}` : 'Sound Kit Original'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                                        <button
                                            onClick={() => handleDownload(item)}
                                            className="px-6 py-3 bg-foreground text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2"
                                        >
                                            <Download size={14} />
                                            Descargar Archivos
                                        </button>
                                        <button
                                            onClick={() => handleDownloadLicense(item)}
                                            className="px-6 py-3 bg-card border border-border text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-background transition-all flex items-center gap-2"
                                        >
                                            <FileText size={14} />
                                            Bajar Licencia
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 bg-card border border-border rounded-[2.5rem] text-center">
                                <p className="text-muted font-bold text-sm">No se encontraron archivos recientes.</p>
                            </div>
                        )}
                    </div>

                    {/* Support & Next Steps */}
                    <div className="mt-20 grid md:grid-cols-2 gap-8">
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                            <ShieldCheck className="absolute -right-4 -bottom-4 text-white/5 w-40 h-40" />
                            <h3 className="text-2xl font-black uppercase mb-4">¿Necesitas Ayuda?</h3>
                            <p className="text-white/60 text-sm mb-8 leading-relaxed">
                                Si tienes problemas con tus descargas o necesitas una factura, nuestro soporte está listo para ayudarte.
                            </p>
                            <Link href="/support" className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-accent hover:text-white transition-colors">
                                Contactar Soporte <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="bg-accent/5 border border-border rounded-[2.5rem] p-10 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                    <Mail size={24} />
                                </div>
                                <h3 className="text-xl font-black uppercase">Respaldo en Correo</h3>
                            </div>
                            <p className="text-muted text-sm leading-relaxed">
                                Te enviamos un correo con los mismos enlaces de descarga para que los tengas disponibles siempre.
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-20">
                        <Link href="/beats" className="inline-flex items-center gap-4 px-12 py-5 bg-card border border-border rounded-full font-black uppercase text-[11px] tracking-[0.2em] hover:bg-foreground hover:text-background transition-all">
                            Seguir Explorando
                            <ArrowRight size={18} />
                        </Link>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
