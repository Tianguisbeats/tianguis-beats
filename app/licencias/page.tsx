"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Zap, Crown, Gift, Star, ChevronDown, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { LICENSE_PLANS, LicensePlan, SOUND_KIT_LICENSE } from '@/lib/licensePlans';
import { LegalPageShell, LegalBadge, LegalAlert } from '@/components/ui/LegalPageShell';

const PLAN_UI: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; glow: string; price: string; hex: string; gradient: string }> = {
    Gratis:    { icon: <Gift    size={28} />, color: 'text-slate-400',   bg: 'bg-slate-500/5',   border: 'border-slate-500/20', glow: 'rgba(100,116,139,0.1)', price: '$0 MXN',           hex: '#94a3b8', gradient: 'from-slate-500/10 to-transparent' },
    Básica:    { icon: <Music   size={28} />, color: 'text-blue-400',    bg: 'bg-blue-500/5',    border: 'border-blue-500/20',  glow: 'rgba(59,130,246,0.15)', price: 'Desde $299 MXN',   hex: '#60a5fa', gradient: 'from-blue-500/10 to-transparent' },
    Pro:       { icon: <Zap    size={28} />, color: 'text-indigo-400',  bg: 'bg-indigo-500/5',  border: 'border-indigo-500/20',glow: 'rgba(99,102,241,0.15)', price: 'Desde $599 MXN',   hex: '#818cf8', gradient: 'from-indigo-500/10 to-transparent' },
    Premium:   { icon: <Star   size={28} />, color: 'text-rose-400',    bg: 'bg-rose-500/5',    border: 'border-rose-500/20',   glow: 'rgba(244,63,94,0.15)',  price: 'Desde $1,499 MXN', hex: '#f43f5e', gradient: 'from-rose-500/10 to-transparent' },
    Exclusiva: { icon: <Crown  size={28} />, color: 'text-purple-400',  bg: 'bg-purple-500/5',  border: 'border-purple-500/20', glow: 'rgba(168,85,247,0.15)', price: 'A convenir',       hex: '#a855f7', gradient: 'from-purple-500/10 to-transparent' },
    'Exclusiva Premium': { icon: <Crown  size={28} />, color: 'text-rose-400',    bg: 'bg-rose-500/5',    border: 'border-rose-500/20',   glow: 'rgba(244,63,94,0.15)',  price: 'Paquete Completo', hex: '#f43f5e', gradient: 'from-rose-500/10 to-transparent' },
};

function FeatureRow({ label, included, index }: { label: string; included: boolean; index: number }) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0 group/row"
        >
            <span className="text-xs md:text-sm text-muted/60 transition-colors group-hover/row:text-foreground">{label}</span>
            {included
                ? <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><Check size={10} className="text-emerald-400" /></div>
                : <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/10"><X size={10} className="text-rose-400/40" /></div>}
        </motion.div>
    );
}

export default function LicenciasPage() {
    const [openClause, setOpenClause] = useState<string | null>(null);

    return (
        <LegalPageShell theme="emerald">
            <Navbar />
            <main className="pt-28 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── HERO ── */}
                    <div className="text-center mb-14 flex flex-col items-center">
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="w-16 h-16 mb-6 flex items-center justify-center -rotate-6 hover:rotate-0 transition-transform duration-500 drop-shadow-2xl">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </motion.div>
                        <LegalBadge label="Acuerdos de Licencia · LFDA México" theme="emerald" />
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
                            Acuerdos de<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Licencia.</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                            className="text-muted/70 font-medium max-w-xl mx-auto text-sm leading-relaxed">
                            Cada beat está protegido bajo la <span className="font-bold text-foreground">Ley Federal del Derecho de Autor.</span> Elige el plan que mejor se ajuste a tu proyecto.
                        </motion.p>
                    </div>

                    {/* Trust pills */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto px-4">
                        {[
                            { icon: '💳', title: 'Pagos Seguros', desc: 'Stripe PCI DSS — Encriptación bancaria.' },
                            { icon: '📑', title: 'Contratos Legales', desc: 'Licencias automáticas bajo la LFDA México.' },
                            { icon: '⚡', title: 'Entrega Inmediata', desc: 'Descarga archivos y contrato al instante.' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 border border-white/[0.07] bg-white/[0.03] rounded-2xl backdrop-blur-sm hover:border-emerald-500/20 transition-all">
                                <span className="text-2xl shrink-0">{item.icon}</span>
                                <div>
                                    <h3 className="font-black text-xs uppercase tracking-tight text-foreground mb-1">{item.title}</h3>
                                    <p className="text-xs text-muted/60">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Nota Legal */}
                    <div className="max-w-3xl mx-auto mb-8 px-4">
                        <LegalAlert color="amber">
                            <strong>Nota Legal:</strong> El Productor conserva sus <strong>Derechos Morales</strong> de forma irrenunciable en todos los planes (Art. 18–23 LFDA). La combinación del beat con la voz genera una Obra Derivada con reparto <strong>50/50 en derechos de composición.</strong>
                        </LegalAlert>
                    </div>
                    
                    <div className="max-w-3xl mx-auto mb-16 px-4 flex items-start gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-2xl">
                        <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-300/80">
                            <strong className="text-blue-300">Negociaciones Especiales (Content ID / Sincronización):</strong> Para usos en TV, cine, publicidad o registro en Content ID, contacta a{' '}
                            <a href="mailto:legal@tianguisbeats.com" style={{ textDecoration: 'none' }} className="font-bold text-blue-400 hover:text-blue-300">legal@tianguisbeats.com</a>. Se requiere acuerdo escrito previo.
                        </p>
                    </div>

                    {/* ── License Cards ── */}
                    <div className="flex flex-col gap-10 md:gap-16">
                        {(LICENSE_PLANS as LicensePlan[]).map((plan, idx) => {
                            const ui = PLAN_UI[plan.id];
                            if (!ui) return null;
                            const isOpen = openClause === plan.id;
                            return (
                                <motion.div key={plan.id}
                                    initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.6, delay: idx * 0.1 }}
                                    className={`relative rounded-[3rem] border ${ui.border} bg-white/[0.02] dark:bg-black/20 backdrop-blur-3xl overflow-hidden transition-all duration-700 group ring-1 ring-white/5`}>
                                    
                                    {/* Abstract Background Decoration */}
                                    <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20 transition-transform duration-1000 group-hover:scale-110">
                                        <div className={`absolute top-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full blur-[80px] bg-gradient-to-br ${ui.gradient}`} />
                                    </div>

                                    {/* Card Header Premium */}
                                    <div className="relative z-10 p-8 md:p-12 flex flex-col lg:flex-row lg:items-center gap-8 md:gap-12 border-b border-white/[0.05]">
                                        <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
                                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 ${ui.color} shadow-2xl relative overflow-hidden`}
                                                style={{ background: `${ui.hex}10`, border: `2px solid ${ui.hex}40`, boxShadow: `0 0 40px ${ui.hex}20` }}>
                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                                {ui.icon}
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                                                    <h2 className={`text-5xl md:text-6xl font-black uppercase tracking-tighter ${ui.color} italic leading-none`}>{plan.id}</h2>
                                                    <span className="text-[10px] font-black text-muted/40 bg-white/[0.05] border border-white/[0.1] px-4 py-1.5 rounded-full uppercase tracking-widest">{plan.tipo}</span>
                                                </div>
                                                <p className="text-base md:text-lg text-muted/60 font-medium max-w-xl">{plan.subtitle}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Pricing Unit */}
                                        <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] flex flex-col items-center lg:items-end justify-center min-w-[240px] shadow-inner">
                                            <p className="text-[10px] text-muted/40 uppercase tracking-[0.3em] font-black mb-2 px-3 py-1 bg-white/[0.05] rounded-full">Inversión Sugerida</p>
                                            <p className={`text-4xl font-black ${ui.color} tracking-tighter`}>{ui.price}</p>
                                        </div>
                                    </div>

                                    {/* Card Content Grid */}
                                    <div className="relative z-10 p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-0.5 w-6 bg-blue-500" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/40">Especificaciones Técnicas</p>
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-x-12">
                                                <div className="space-y-1">
                                                    <FeatureRow label={`Formato: ${plan.formato}`} included={true} index={1} />
                                                    <FeatureRow label={`Streams: ${plan.streams}`} included={true} index={2} />
                                                    <FeatureRow label={`Vigencia: ${plan.vigencia}`} included={true} index={3} />
                                                </div>
                                                <div className="space-y-1">
                                                    <FeatureRow label="Uso Comercial" included={plan.comercial} index={4} />
                                                    <FeatureRow label="WAV High-End" included={plan.wav} index={5} />
                                                    <FeatureRow label="Stems Auditables" included={plan.stems} index={6} />
                                                    <FeatureRow label="Uso en Radio" included={plan.radio} index={7} />
                                                    <FeatureRow label="Videoclip" included={plan.videoMusical} index={8} />
                                                    <FeatureRow label="Live Shows" included={plan.livePerf} index={9} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col h-full">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-0.5 w-6 bg-purple-500" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/40">Cuerpo Contractual</p>
                                            </div>
                                            
                                            <div className={`flex-1 overflow-hidden transition-all duration-700 ${isOpen ? 'max-h-[800px]' : 'max-h-[140px]'}`}>
                                                <div className="space-y-4 pr-4 custom-scrollbar overflow-y-auto max-h-[400px]">
                                                    {plan.clauses.map((clause, i) => (
                                                        <motion.div 
                                                            key={i} 
                                                            initial={{ opacity: 0 }}
                                                            whileInView={{ opacity: 1 }}
                                                            className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] group/clause hover:border-white/10 transition-colors"
                                                        >
                                                            <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black scale-90 group-hover/clause:scale-100 transition-transform ${ui.color}`}
                                                                style={{ background: `${ui.hex}10`, border: `1px solid ${ui.hex}30` }}>{i + 1}</span>
                                                            <p className="text-xs text-muted/60 leading-relaxed font-medium group-hover/clause:text-muted/90 transition-colors">{clause}</p>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-8">
                                                <button 
                                                    onClick={() => setOpenClause(isOpen ? null : plan.id)}
                                                    className={`w-full py-5 rounded-2xl border ${ui.border} ${ui.bg} flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] group/btn`}>
                                                    <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${ui.color}`}>
                                                        {isOpen ? 'Ocultar términos legales' : 'Expandir cláusulas completas'}
                                                    </span>
                                                    <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
                                                        <ChevronDown size={18} className={ui.color} />
                                                    </div>
                                                </button>
                                                {!isOpen && (
                                                    <p className="text-center text-[9px] font-bold text-muted/30 uppercase tracking-[0.2em] mt-3">Transparencia legal absoluta para tu seguridad</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Bottom Decorative Edge */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 opacity-20"
                                        style={{ background: `linear-gradient(90deg, ${ui.hex}, transparent, ${ui.hex})` }} />
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ── Sound Kit ── */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-32 relative rounded-[3rem] border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl overflow-hidden shadow-2xl group"
                    >
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                        
                        <div className="p-8 md:p-14 flex flex-col lg:flex-row gap-12 border-b border-white/[0.05]">
                            <div className="flex flex-col md:flex-row items-center gap-10 flex-1">
                                <div className="w-24 h-24 rounded-[2rem] bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/20 group-hover:rotate-3 transition-transform">🎛️</div>
                                <div className="text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                                        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-amber-400 italic leading-none">Sound Kit</h2>
                                        <span className="text-[10px] font-black text-amber-500/60 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full uppercase tracking-widest">Royalty-Free Profundo</span>
                                    </div>
                                    <p className="text-lg text-muted/60 font-medium">{SOUND_KIT_LICENSE.subtipo}</p>
                                </div>
                            </div>
                            <div className="p-8 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex flex-col items-center lg:items-end justify-center min-w-[240px]">
                                <p className="text-[10px] text-amber-500/60 uppercase tracking-[0.3em] font-black mb-1">Modelo de Venta</p>
                                <p className="text-3xl font-black text-amber-400 tracking-tighter">PAGO ÚNICO</p>
                            </div>
                        </div>

                        <div className="p-8 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
                            <div className="grid sm:grid-cols-2 gap-10">
                                <div>
                                    <p className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-emerald-500/20">✅ Permitido</p>
                                    <div className="space-y-4">
                                        {SOUND_KIT_LICENSE.allows.map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 text-sm text-foreground/70 font-medium">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={10} className="text-emerald-400" /></div>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-rose-500/20">🚫 Prohibido</p>
                                    <div className="space-y-4">
                                        {SOUND_KIT_LICENSE.prohibitions.map((item, i) => (
                                            <div key={i} className="flex items-start gap-3 text-sm text-muted/40 font-medium">
                                                <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5"><X size={10} className="text-rose-400/60" /></div>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <button onClick={() => setOpenClause(openClause === 'soundkit' ? null : 'soundkit')}
                                    className="w-full py-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-4 text-amber-400 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                                        {openClause === 'soundkit' ? 'Cerrar Cláusulas' : 'Abrir Cláusulas Contractuales'}
                                    </span>
                                    <ChevronDown size={18} className={`transition-transform duration-500 ${openClause === 'soundkit' ? 'rotate-180' : ''}`} />
                                </button>
                                
                                <AnimatePresence>
                                    {openClause === 'soundkit' && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-6 space-y-4 overflow-hidden"
                                        >
                                            <div className="pr-4 custom-scrollbar overflow-y-auto max-h-[300px] space-y-3">
                                                {SOUND_KIT_LICENSE.clauses.map((clause, i) => (
                                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03]">
                                                        <span className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20">{i + 1}</span>
                                                        <p className="text-xs text-muted/60 leading-relaxed font-medium">{clause}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="mt-8 pt-6 border-t border-white/[0.05]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted/40 mb-4 px-2">Formatos Maestros</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SOUND_KIT_LICENSE.formatos.map((f, i) => (
                                            <span key={i} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-colors">{f}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer CTA */}
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="mt-20 p-10 border border-white/[0.07] bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                        <h3 className="font-black text-foreground mb-4 uppercase tracking-tighter text-3xl italic">¿Dudas Legales?</h3>
                        <p className="text-muted/60 text-base mb-8 max-w-2xl mx-auto">Consulta nuestros Términos de Servicio o agenda una consultoría directamente. Siempre puedes actualizar tu licencia después de la compra.</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/terms" style={{ textDecoration: 'none' }} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95">
                                Ver Términos de Servicio
                            </Link>
                            <a href="mailto:legal@tianguisbeats.com" style={{ textDecoration: 'none' }} className="px-8 py-4 border border-white/[0.1] text-foreground/70 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-emerald-500/30 hover:text-emerald-400 transition-all backdrop-blur-xl bg-white/5">
                                Contactar Soporte Legal
                            </a>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </LegalPageShell>
    );
}
