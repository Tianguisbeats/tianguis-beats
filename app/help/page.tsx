"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, ChevronDown, User, Upload, CreditCard, Package, Star, Scale, FileText, Lock, ExternalLink, MessageCircle, Check } from 'lucide-react';
import EarningsCalculator from '@/components/EarningsCalculator';
import { LegalPageShell, LegalBadge } from '@/components/ui/LegalPageShell';

/* ─── FAQ DATA ─── */
const faqs = [
    { cat: 'Comenzando', q: '¿Cómo creo mi cuenta en Tianguis Beats?', a: 'Haz clic en "Sign Up" en la barra superior. Puedes registrarte con correo y contraseña. Una vez dentro, completa tu perfil con foto y nombre artístico para aparecer en el catálogo de productores.' },
    { cat: 'Comenzando', q: '¿Cómo verifico mi cuenta?', a: 'Para obtener el badge de verificación (✓), completa tu perfil al 100%, sube al menos 3 beats de calidad y solicita la revisión desde Ajustes → Verificación. Nuestro equipo valida tu identidad dentro de 72 horas.' },
    { cat: 'Comenzando', q: '¿Qué beneficios tiene el Plan Premium?', a: 'Los planes de suscripción te dan: 0% de comisión en ventas (vs 15% en plan gratuito), aparición en "Productores Destacados", badge dorado, cupones de descuento propios y subidas sin restricción de peso. El plan Anual te da 2 meses gratis.' },
    { cat: 'Comenzando', q: '¿Puedo explorar beats sin registrarme?', a: 'Sí. El catálogo, el reproductor de audio y los perfiles de productores son públicos. Solo necesitas cuenta para comprar, descargar, dar likes o comentar.' },
    { cat: 'Subir contenido', q: '¿Cómo subo mi primer beat?', a: 'Inicia sesión → Tianguis Studio → "Subir Beat". Carga el MP3 con tag (muestra), el WAV de estudio y los Stems. Completa título, género, BPM, tono, mood, portada y precios por licencia. ¡Aparece en el catálogo en segundos!' },
    { cat: 'Subir contenido', q: '¿Qué formatos y calidades debo subir?', a: 'Imagen (JPG/PNG, min 800×800px) · MP3 con tag (Licencia Gratis) · MP3 320kbps sin tag (Licencia Básica) · WAV 24bit/44.1kHz (Licencia Pro/Premium) · ZIP Stems (Licencia Premium). Sound Kits: ZIP con todos los archivos.' },
    { cat: 'Subir contenido', q: '¿Cómo edito un beat ya publicado?', a: 'Tianguis Studio → Mis Beats → icono de edición (✏️). Puedes modificar precio, portada, título y archivos en cualquier momento.' },
    { cat: 'Pagos y Licencias', q: '¿Cómo funcionan las 5 licencias?', a: 'GRATIS (MP3+tag, no comercial, 5K streams, 1 año) · BÁSICA ($299+, MP3 HQ, comercial, 50K streams, 2-5 años) · PRO ($599+, WAV+MP3, radio+video, 500K streams) · PREMIUM ($999+, Stems+WAV+MP3, ilimitada, perpetua) · EXCLUSIVA (propiedad del máster, perpetua).' },
    { cat: 'Pagos y Licencias', q: '¿Hay reembolsos?', a: 'No. Los productos digitales no son reembolsables una vez descargados (LFPC, bienes de contenido digital). Excepción: archivo corrupto o dañado reportado dentro de 72 horas a soporte@tianguisbeats.com.' },
    { cat: 'Pagos y Licencias', q: '¿Cuál es la comisión de Tianguis Beats?', a: 'Plan gratuito: 15% de comisión. Planes de suscripción: 0% de comisión. En ambos casos se aplican las tarifas de Stripe: 3.6% + $3 MXN + 16% IVA sobre la comisión de Stripe.' },
    { cat: 'Pagos y Licencias', q: '¿Puedo registrar un beat en YouTube Content ID?', a: 'NO. Todos los planes prohíben el registro en Content ID, Meta Rights Manager, etc. sin acuerdo escrito previo con Tianguis Beats. Para acuerdos especiales: legal@tianguisbeats.com.' },
    { cat: 'Sound Kits', q: '¿Qué puedo hacer con un Sound Kit comprado?', a: 'Usar los sonidos en tus producciones sin pagar regalías adicionales. Distribución y monetización de canciones resultantes en streaming. Prohibido: revender el kit, incluir sonidos en otro sample pack o registrarlos en Content ID.' },
    { cat: 'Mi Perfil', q: '¿Cómo personalizo mi perfil de productor?', a: 'Ve a tu perfil → "Editar Perfil". Cambia foto, portada, nombre artístico, biografía (Smart Bio con IA), redes sociales y tu "Smart TV" (video de presentación).' },
    { cat: 'Mi Perfil', q: '¿Puedo ofrecer servicios de producción?', a: 'Sí, los usuarios con plan de suscripción pueden listar Servicios desde Studio → Servicios. Aparecen en la pestaña "Servicios" de tu perfil público.' },
    { cat: 'Legal', q: '¿Bajo qué leyes opera Tianguis Beats?', a: 'Bajo las leyes federales mexicanas: LFDA, LFPC y LFPDPPP. La jurisdicción es Ciudad de México. Ver Términos completos en /terms.' },
    { cat: 'Legal', q: '¿Cómo maneja Tianguis Beats mis datos personales?', a: 'Cumplimos con la LFPDPPP. Tus datos financieros son procesados por Stripe México (PCI DSS) — nunca almacenamos número de tarjeta, CVC ni fecha de vencimiento. Tienes derechos ARCO escribiendo a privacidad@tianguisbeats.com.' },
];

const categoryMeta = [
    { title: 'Comenzando',       icon: <User size={18} />,       hex: '#60a5fa', bg: 'bg-blue-500/10 text-blue-400',    border: 'border-blue-500/25' },
    { title: 'Subir contenido',  icon: <Upload size={18} />,     hex: '#a855f7', bg: 'bg-violet-500/10 text-violet-400', border: 'border-violet-500/25' },
    { title: 'Pagos y Licencias',icon: <CreditCard size={18} />, hex: '#34d399', bg: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/25' },
    { title: 'Sound Kits',       icon: <Package size={18} />,    hex: '#f59e0b', bg: 'bg-amber-500/10 text-amber-400',   border: 'border-amber-500/25' },
    { title: 'Mi Perfil',        icon: <Star size={18} />,       hex: '#f472b6', bg: 'bg-pink-500/10 text-pink-400',    border: 'border-pink-500/25' },
    { title: 'Legal',            icon: <Scale size={18} />,      hex: '#fb923c', bg: 'bg-orange-500/10 text-orange-400', border: 'border-orange-500/25' },
];

export default function HelpPage() {
    const [searchTerm, setSearchTerm]     = useState('');
    const [openFaq, setOpenFaq]           = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filteredFaqs = faqs.filter(faq => {
        const matchSearch = faq.q.toLowerCase().includes(searchTerm.toLowerCase()) || faq.a.toLowerCase().includes(searchTerm.toLowerCase()) || faq.cat.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch && (activeCategory ? faq.cat === activeCategory : true);
    });

    return (
        <LegalPageShell theme="amber">
            <Navbar />
            <main className="pt-28 pb-24">

                {/* ── HERO & SEARCH ── */}
                <div className="relative pb-16 overflow-hidden mb-4">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
                        <div className="text-center flex flex-col items-center">
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                className="w-16 h-16 mb-6 flex items-center justify-center -rotate-6 hover:rotate-0 transition-transform duration-500 drop-shadow-2xl">
                                <Image src="/logo.png" alt="Logo" width={64} height={64} className="w-full h-full object-contain" />
                            </motion.div>
                            <LegalBadge label="Centro de Ayuda · Tianguis Beats" theme="amber" />
                            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
                                ¿En qué podemos<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400">ayudarte?</span>
                            </motion.h1>
                            {/* Search */}
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative group w-full max-w-2xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted/40 group-focus-within:text-amber-400 transition-colors" size={20} />
                                <input type="text" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setActiveCategory(null); }}
                                    placeholder="Busca tu pregunta aquí..."
                                    className="w-full relative bg-white/[0.05] border border-white/[0.1] rounded-full py-5 pl-16 pr-8 text-base font-medium focus:outline-none focus:border-amber-500/50 transition-all backdrop-blur-sm placeholder:text-muted/30" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    {/* Category Buttons */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
                        {categoryMeta.map((cat, i) => {
                            const count = faqs.filter(f => f.cat === cat.title).length;
                            const isActive = activeCategory === cat.title;
                            return (
                                <button key={i} onClick={() => setActiveCategory(prev => prev === cat.title ? null : cat.title)}
                                    className={`p-4 rounded-[1.5rem] border transition-all hover:-translate-y-0.5 hover:shadow-xl text-left group ${isActive ? `${cat.bg} ${cat.border} shadow-lg` : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]'}`}>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all ${isActive ? cat.bg : 'bg-white/[0.05] text-muted/50'}`}>
                                        {cat.icon}
                                    </div>
                                    <h3 className="font-black text-[10px] uppercase tracking-tight text-foreground leading-tight mb-1">{cat.title}</h3>
                                    <p className="text-[9px] text-muted/40 font-bold uppercase tracking-widest">{count} artículos</p>
                                </button>
                            );
                        })}
                    </motion.div>

                    {/* Quick Legal Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12 max-w-3xl mx-auto">
                        {[
                            { href: '/terms',    icon: <FileText size={14} />,  label: 'Términos de Servicio',  desc: 'LFDA · LFPC · Jurisdicción CDMX' },
                            { href: '/privacy',  icon: <Lock size={14} />,      label: 'Aviso de Privacidad',   desc: 'LFPDPPP · Stripe · Datos ARCO' },
                            { href: '/licencias',icon: <Scale size={14} />,     label: 'Acuerdos de Licencia',  desc: 'Beats + Sound Kits · 5 planes' },
                        ].map((item, i) => (
                            <Link key={i} href={item.href} style={{ textDecoration: 'none' }}
                                className="flex items-center gap-3 p-4 border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm rounded-2xl hover:border-amber-500/25 hover:shadow-xl transition-all group no-underline">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">{item.icon}</div>
                                <div className="min-w-0">
                                    <p className="font-black text-xs uppercase tracking-tight text-foreground">{item.label}</p>
                                    <p className="text-[9px] text-muted/50 truncate">{item.desc}</p>
                                </div>
                                <ExternalLink size={10} className="text-muted/20 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-3xl mx-auto mb-16">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-6 text-center">
                            {activeCategory ? activeCategory : searchTerm ? `Resultados para "${searchTerm}"` : 'Preguntas Frecuentes'}
                            <span className="ml-2 text-sm font-bold text-muted/50 normal-case tracking-normal">({filteredFaqs.length})</span>
                        </h2>
                        <div className="space-y-2">
                            {filteredFaqs.length > 0 ? filteredFaqs.map((faq, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm overflow-hidden hover:border-amber-500/20 transition-all shadow-sm group">
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors">
                                        <div className="flex flex-col gap-1 min-w-0 pr-4">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">{faq.cat}</span>
                                            <span className="font-semibold text-foreground/85 text-sm leading-snug">{faq.q}</span>
                                        </div>
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${openFaq === i ? 'bg-amber-500/15 text-amber-400' : 'bg-white/[0.05] text-muted/40 group-hover:bg-amber-500/10 group-hover:text-amber-400'}`}>
                                            <ChevronDown className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} size={14} />
                                        </div>
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                        <div className="p-5 pt-0 text-muted/70 leading-relaxed border-t border-white/[0.05] bg-white/[0.02] text-sm">{faq.a}</div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-16">
                                    <p className="text-muted/50 font-bold uppercase tracking-widest text-sm">No encontramos lo que buscas</p>
                                    <p className="text-muted/30 text-xs mt-2">Prueba con otra palabra o contacta a soporte.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* License Quick Reference */}
                    <div className="max-w-4xl mx-auto mb-16">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-6 text-center">Resumen de Licencias de Beats</h3>
                        <div className="overflow-x-auto rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm shadow-xl">
                            <table className="w-full text-xs">
                                <thead><tr className="border-b border-white/[0.07]">
                                    {['Plan','Formato','Streams','Radio','Video','Stems','Vigencia'].map(h => (
                                        <th key={h} className="text-left px-4 py-4 font-black uppercase tracking-widest text-muted/40 text-[9px]">{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {[
                                        { plan: 'Gratis',    color: '#94a3b8', fmt: 'MP3+Tag',       streams: '5,000',   radio: false, video: false, stems: false, vig: '1 año' },
                                        { plan: 'Básica',    color: '#60a5fa', fmt: 'MP3 HQ',        streams: '50,000',  radio: false, video: false, stems: false, vig: '2–5 años' },
                                        { plan: 'Pro',       color: '#818cf8', fmt: 'WAV+MP3',       streams: '500,000', radio: true,  video: true,  stems: false, vig: '5–10 años' },
                                        { plan: 'Premium',   color: '#34d399', fmt: 'Stems+WAV+MP3', streams: '∞',       radio: true,  video: true,  stems: true,  vig: 'Perpetua' },
                                        { plan: 'Exclusiva', color: '#f43f5e', fmt: 'Stems+WAV+MP3', streams: '∞',       radio: true,  video: true,  stems: true,  vig: 'Perpetua' },
                                    ].map((row, i) => (
                                        <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-4 font-black uppercase tracking-widest text-[11px]" style={{ color: row.color }}>{row.plan}</td>
                                            <td className="px-4 py-4 text-muted/60 text-[11px]">{row.fmt}</td>
                                            <td className="px-4 py-4 font-black text-foreground/80 text-[11px]">{row.streams}</td>
                                            {[row.radio, row.video, row.stems].map((b, j) => (
                                                <td key={j} className="px-4 py-4 text-center">
                                                    {b ? <Check size={13} className="text-emerald-400 mx-auto" /> : <span className="text-muted/25 text-[11px]">—</span>}
                                                </td>
                                            ))}
                                            <td className="px-4 py-4 text-muted/60 text-[11px]">{row.vig}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-center mt-3 text-xs text-muted/35">
                            Todos los planes requieren crédito: "Prod. [Nombre] / Tianguis Beats" ·{' '}
                            <Link href="/licencias" style={{ textDecoration: 'none' }} className="text-amber-400 hover:text-amber-300 font-bold transition-colors">Ver contratos completos</Link>
                        </p>
                    </div>

                    {/* Earnings Calculator */}
                    <div className="max-w-3xl mx-auto mb-16 space-y-8">
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Transparencia de Pagos</h3>
                            <p className="text-sm text-muted/60 max-w-xl mx-auto">Sin comisión oculta. Con suscripción, recibes el <strong className="text-foreground">100%</strong> de tu venta menos Stripe.</p>
                        </div>
                        <EarningsCalculator />
                    </div>

                    {/* Support Banner */}
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="relative rounded-[3rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/8 via-yellow-500/5 to-transparent overflow-hidden shadow-2xl p-10 md:p-14 mb-4"
                        style={{ boxShadow: '0 40px 100px -20px rgba(245,158,11,0.15)' }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                        <div className="absolute -top-20 right-0 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'rgba(245,158,11,0.08)' }} />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex items-center gap-5 flex-1">
                                <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-xl" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    <MessageCircle size={28} className="text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-1">¿No encuentras lo que buscas?</h3>
                                    <p className="text-muted/60 font-medium text-sm">Nuestro asistente IA responde en segundos. Para temas legales, escribe a legal@tianguisbeats.com</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center shrink-0">
                                <button onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                                    className="px-7 py-3.5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 hover:scale-105 transition-all shadow-xl shadow-amber-500/25 active:scale-95 whitespace-nowrap">
                                    Soporte IA Ahora
                                </button>
                                <a href="mailto:legal@tianguisbeats.com" style={{ textDecoration: 'none' }}
                                    className="px-7 py-3.5 border border-amber-500/25 text-amber-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500/10 hover:scale-105 transition-all whitespace-nowrap">
                                    Soporte Legal
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </LegalPageShell>
    );
}
