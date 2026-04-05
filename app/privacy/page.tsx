"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Lock, Eye, Database, Mail, ShieldCheck, Cookie, Globe, AlertCircle } from 'lucide-react';
import { LegalPageShell, LegalBadge, LegalSection, LegalBullet, LegalHighlight, LegalAlert, LegalSidebar } from '@/components/ui/LegalPageShell';

const sections = [
    { id: 'responsable',  title: '1. Responsable del Tratamiento',  icon: <ShieldCheck size={14} /> },
    { id: 'datos',        title: '2. Datos Recabados',               icon: <Database size={14} /> },
    { id: 'finalidades',  title: '3. Finalidades del Tratamiento',   icon: <Eye size={14} /> },
    { id: 'stripe',       title: '4. Stripe y Pagos',                icon: <Lock size={14} /> },
    { id: 'terceros',     title: '5. Transferencia a Terceros',      icon: <Globe size={14} /> },
    { id: 'arco',         title: '6. Derechos ARCO',                 icon: <Mail size={14} /> },
    { id: 'cookies',      title: '7. Cookies y Rastreo',             icon: <Cookie size={14} /> },
    { id: 'menores',      title: '8. Menores de Edad',               icon: <AlertCircle size={14} /> },
    { id: 'cambios',      title: '9. Cambios al Aviso',              icon: <Eye size={14} /> },
];

export default function PrivacyPage() {
    return (
        <LegalPageShell theme="violet">
            <Navbar />
            <main className="pt-28 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── HERO ── */}
                    <div className="text-center mb-16 flex flex-col items-center">
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="w-16 h-16 mb-6 flex items-center justify-center -rotate-6 hover:rotate-0 transition-transform duration-500 drop-shadow-2xl">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </motion.div>
                        <LegalBadge label="Privacidad · LFPDPPP · INAI" theme="violet" />
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
                            Aviso de<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-400">Privacidad.</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                            className="text-muted/70 font-medium max-w-xl mx-auto text-sm leading-relaxed">
                            Cumplimos con la <span className="text-foreground font-bold">LFPDPPP</span> y las disposiciones del <span className="text-foreground font-bold">INAI</span>. Tu privacidad es sagrada.
                        </motion.p>
                    </div>

                    {/* Quick stats */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                        {[
                            { icon: <Lock size={20} />, title: 'No Vendemos tus Datos', desc: 'Tu información nunca se vende a terceros.', color: '#a855f7' },
                            { icon: <ShieldCheck size={20} />, title: 'Cifrado SSL/TLS', desc: 'Toda comunicación viaja encriptada.', color: '#818cf8' },
                            { icon: <Mail size={20} />, title: 'Derechos ARCO', desc: 'Accede, rectifica o elimina tus datos.', color: '#c084fc' },
                        ].map((p, i) => (
                            <div key={i} className="p-5 rounded-[1.5rem] border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm flex gap-4 items-start hover:border-violet-500/20 transition-all group shadow-lg">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30` }}>{p.icon}</div>
                                <div>
                                    <h3 className="font-black text-xs uppercase tracking-tight text-foreground mb-1">{p.title}</h3>
                                    <p className="text-xs text-muted/60">{p.desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    <div className="flex flex-col lg:flex-row gap-10">
                        <LegalSidebar sections={sections} theme="violet" extras={
                            <div className="space-y-2">
                                <a href="mailto:privacidad@tianguisbeats.com" style={{ textDecoration: 'none' }} className="flex items-center gap-2 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors">
                                    <Mail size={12} /> Ejercer Derechos ARCO
                                </a>
                            </div>
                        } />

                        <div className="flex-1 min-w-0">
                            <LegalSection id="responsable" num="1" title="Responsable del Tratamiento" icon={<ShieldCheck size={14} />} theme="violet">
                                <p><LegalHighlight>Tianguis Beats</LegalHighlight> es responsable del tratamiento de sus datos personales según la LFPDPPP.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    {[
                                        { label: 'Denominación', value: 'Tianguis Beats' },
                                        { label: 'País de Operación', value: 'México 🇲🇽' },
                                        { label: 'Correo de Privacidad', value: 'privacidad@tianguisbeats.com' },
                                        { label: 'Correo General', value: 'contacto@tianguisbeats.com' },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 hover:border-violet-500/20 transition-all">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted/50 mb-1">{item.label}</p>
                                            <p className="text-sm font-bold text-foreground">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </LegalSection>

                            <LegalSection id="datos" num="2" title="Datos Personales que Recabamos" icon={<Database size={14} />} theme="violet">
                                <p><LegalHighlight>Datos de Identificación:</LegalHighlight></p>
                                <ul className="space-y-2 ml-2">
                                    <LegalBullet>Nombre artístico o nombre real</LegalBullet>
                                    <LegalBullet>Dirección de correo electrónico</LegalBullet>
                                    <LegalBullet>País y ciudad de residencia</LegalBullet>
                                    <LegalBullet>Foto de perfil (opcional)</LegalBullet>
                                </ul>
                                <p><LegalHighlight>Datos Financieros:</LegalHighlight></p>
                                <p>Tianguis Beats <LegalHighlight>NO almacena</LegalHighlight> datos de tarjetas de crédito/débito, CVV ni datos bancarios. Son procesados directamente por <LegalHighlight>Stripe</LegalHighlight> (PCI DSS Nivel 1).</p>
                            </LegalSection>

                            <LegalSection id="finalidades" num="3" title="Finalidades del Tratamiento" icon={<Eye size={14} />} theme="violet">
                                <p><LegalHighlight>Finalidades Primarias (necesarias para el servicio):</LegalHighlight></p>
                                <ul className="space-y-2 ml-2">
                                    <LegalBullet>Crear y gestionar tu cuenta de usuario.</LegalBullet>
                                    <LegalBullet>Procesar las compras y validar los pagos.</LegalBullet>
                                    <LegalBullet>Generar y entregar los contratos de licencia.</LegalBullet>
                                    <LegalBullet>Cumplir con obligaciones fiscales ante el SAT.</LegalBullet>
                                </ul>
                                <p><LegalHighlight>Finalidades Secundarias (puedes oponerte):</LegalHighlight></p>
                                <ul className="space-y-2 ml-2">
                                    <LegalBullet>Enviarte comunicaciones promocionales y novedades.</LegalBullet>
                                    <LegalBullet>Avisarte sobre nuevos beats de productores que sigues.</LegalBullet>
                                </ul>
                            </LegalSection>

                            <LegalSection id="stripe" num="4" title="Pagos con Stripe — Tratamiento Financiero" icon={<Lock size={14} />} theme="violet">
                                <p>Tianguis Beats utiliza <LegalHighlight>Stripe</LegalHighlight> (PCI DSS Nivel 1) como procesador de pagos.</p>
                                <LegalAlert color="blue">
                                    <p className="font-black text-[9px] uppercase tracking-widest mb-2">Declaración Obligatoria (LFPDPPP Art. 36)</p>
                                    <p>Sus datos financieros son procesados exclusivamente por <strong>Stripe</strong>. Tianguis Beats <strong>no almacena, no tiene acceso ni procesa</strong> sus números de tarjeta, fechas de vencimiento ni CVV.</p>
                                </LegalAlert>
                            </LegalSection>

                            <LegalSection id="terceros" num="5" title="Transferencia de Datos a Terceros" icon={<Globe size={14} />} theme="violet">
                                <p>Tianguis Beats puede compartir datos con proveedores de servicios únicamente en la medida necesaria para operar la Plataforma. <LegalHighlight>Nunca vendemos</LegalHighlight> tus datos a empresas de marketing.</p>
                                <div className="overflow-x-auto -mx-2 mt-3">
                                    <table className="w-full text-xs border-collapse">
                                        <thead><tr className="border-b border-white/10">
                                            {['Proveedor','Finalidad','País'].map(h => <th key={h} className="px-3 py-2 text-left font-black uppercase tracking-widest text-[9px] text-muted/50">{h}</th>)}
                                        </tr></thead>
                                        <tbody>
                                            {[
                                                { p: 'Stripe',    f: 'Procesamiento de pagos',                  c: 'EUA / Global' },
                                                { p: 'Supabase',  f: 'Base de datos y almacenamiento de audio', c: 'EUA' },
                                                { p: 'Vercel',    f: 'Hospedaje y distribución del sitio web',  c: 'EUA / Global' },
                                            ].map((row, i) => (
                                                <tr key={i} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-3 py-3 font-black text-violet-400 text-[11px]">{row.p}</td>
                                                    <td className="px-3 py-3 text-muted/70 text-[11px]">{row.f}</td>
                                                    <td className="px-3 py-3 text-muted/70 text-[11px]">{row.c}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </LegalSection>

                            <LegalSection id="arco" num="6" title="Derechos ARCO" icon={<Mail size={14} />} theme="violet">
                                <ul className="space-y-2 ml-2">
                                    <LegalBullet><LegalHighlight>Acceso:</LegalHighlight> Conocer qué datos tenemos sobre ti.</LegalBullet>
                                    <LegalBullet><LegalHighlight>Rectificación:</LegalHighlight> Corregir datos incorrectos.</LegalBullet>
                                    <LegalBullet><LegalHighlight>Cancelación:</LegalHighlight> Eliminar tus datos cuando resulte procedente.</LegalBullet>
                                    <LegalBullet><LegalHighlight>Oposición:</LegalHighlight> Oponerte al uso de datos para finalidades secundarias.</LegalBullet>
                                </ul>
                                <LegalAlert color="blue">
                                    Envía un correo a <strong>privacidad@tianguisbeats.com</strong> con el asunto "Solicitud ARCO". Respondemos en máximo <strong>20 días hábiles</strong> conforme al Art. 32 LFPDPPP.
                                </LegalAlert>
                            </LegalSection>

                            <LegalSection id="cookies" num="7" title="Cookies y Tecnologías de Rastreo" icon={<Cookie size={14} />} theme="violet">
                                <ul className="space-y-2 ml-2">
                                    <LegalBullet><LegalHighlight>Cookies Técnicas:</LegalHighlight> Mantienen tu sesión activa. Necesarias para el servicio.</LegalBullet>
                                    <LegalBullet><LegalHighlight>Cookies de Personalización:</LegalHighlight> Recuerdan tema, moneda, idioma. Desactivables en tu navegador.</LegalBullet>
                                    <LegalBullet><LegalHighlight>Stripe Radar:</LegalHighlight> Detectan fraude y protegen tus transacciones.</LegalBullet>
                                    <LegalBullet><LegalHighlight>Cookies de Análisis (anónimas):</LegalHighlight> Mejoran la experiencia. Sin datos de identificación personal.</LegalBullet>
                                </ul>
                            </LegalSection>

                            <LegalSection id="menores" num="8" title="Menores de Edad" icon={<AlertCircle size={14} />} theme="violet">
                                <p>Tianguis Beats no está dirigido a personas menores de <LegalHighlight>18 años</LegalHighlight>. Si detectas que un menor ha registrado datos, contacta inmediatamente a <LegalHighlight>privacidad@tianguisbeats.com</LegalHighlight>.</p>
                            </LegalSection>

                            <LegalSection id="cambios" num="9" title="Cambios al Aviso de Privacidad" icon={<Eye size={14} />} theme="violet">
                                <p>Modificaciones sustanciales serán notificadas con al menos <LegalHighlight>15 días naturales</LegalHighlight> de anticipación. El uso continuado de la Plataforma constituye aceptación de los cambios.</p>
                                <div className="mt-4 flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                                    <div className="w-10 h-10 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted/50">Privacidad y Datos</p>
                                        <a href="mailto:privacidad@tianguisbeats.com" style={{ textDecoration: 'none' }} className="font-bold text-violet-400 hover:text-violet-300 text-sm transition-colors">privacidad@tianguisbeats.com</a>
                                    </div>
                                </div>
                            </LegalSection>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </LegalPageShell>
    );
}
