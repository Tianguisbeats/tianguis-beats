"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Book, Scale, FileText, AlertCircle, Music, CreditCard, Lock, Users, Ban, ExternalLink } from 'lucide-react';
import { LegalPageShell, AbstractLegalBg, LegalBadge, LegalSection, LegalBullet, LegalHighlight, LegalAlert, LegalSidebar } from '@/components/ui/LegalPageShell';

const licenseTable = [
    { plan: 'Gratis',    color: '#94a3b8', fmt: 'MP3 con Tag',       tipo: 'No Exclusiva', streams: '5,000',     uso: 'Solo promocional',             vigencia: '1 año' },
    { plan: 'Básica',    color: '#60a5fa', fmt: 'MP3 HQ',            tipo: 'No Exclusiva', streams: '50,000',    uso: 'Comercial limitado',           vigencia: '2-5 años' },
    { plan: 'Pro',       color: '#818cf8', fmt: 'WAV + MP3',         tipo: 'No Exclusiva', streams: '500,000',   uso: 'Comercial + Radio + Sincro',    vigencia: '5-10 años' },
    { plan: 'Premium',   color: '#34d399', fmt: 'Stems + WAV + MP3', tipo: 'No Exclusiva', streams: 'Ilimitado', uso: 'Comercial ilimitado',           vigencia: 'Perpetua' },
    { plan: 'Exclusiva', color: '#f43f5e', fmt: 'Stems + WAV + MP3', tipo: 'Exclusiva',    streams: 'Sin límite', uso: 'Propiedad del Máster',         vigencia: 'Perpetua' },
];

const sections = [
    { id: 'intro',           title: '1. Aceptación y Partes',               icon: <FileText size={14} /> },
    { id: 'propiedad',       title: '2. Propiedad Intelectual',              icon: <Book size={14} /> },
    { id: 'licencias',       title: '3. Licencias de Uso',                   icon: <Music size={14} /> },
    { id: 'exclusiva',       title: '4. Licencia Exclusiva',                 icon: <Shield size={14} /> },
    { id: 'conducts',        title: '5. Obligaciones del Usuario',           icon: <Users size={14} /> },
    { id: 'samples',         title: '6. Originalidad y Samples',             icon: <AlertCircle size={14} /> },
    { id: 'pagos',           title: '7. Pagos y No Reembolso',               icon: <CreditCard size={14} /> },
    { id: 'stems',           title: '8. Uso de Stems',                       icon: <Lock size={14} /> },
    { id: 'contentid',       title: '9. Prohibición Content ID',             icon: <Ban size={14} /> },
    { id: 'responsabilidad', title: '10. Limitación de Responsabilidad',     icon: <AlertCircle size={14} /> },
    { id: 'jurisdiccion',    title: '11. Jurisdicción y Ley',                icon: <Scale size={14} /> },
    { id: 'contacto',        title: '12. Contacto y Disputas',               icon: <ExternalLink size={14} /> },
];

export default function TermsPage() {
    return (
        <LegalPageShell theme="blue">
            <Navbar />
            <main className="pt-28 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── HERO ── */}
                    <div className="text-center mb-16 flex flex-col items-center">
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="w-16 h-16 mb-6 flex items-center justify-center -rotate-6 hover:rotate-0 transition-transform duration-500 drop-shadow-2xl">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </motion.div>
                        <LegalBadge label="Legal · Transparencia · Tianguis Beats" theme="blue" />
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
                            Términos de<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">Servicio.</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                            className="text-muted/70 font-medium max-w-xl mx-auto text-sm leading-relaxed">
                            Última actualización: <span className="text-foreground font-bold">4 de marzo de 2026.</span>{' '}
                            Al usar Tianguis Beats aceptas estos términos en su totalidad.
                        </motion.p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10">
                        <LegalSidebar sections={sections} theme="blue" extras={
                            <div className="space-y-2">
                                <Link href="/privacy" style={{ textDecoration: 'none' }} className="flex items-center gap-2 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                    <Lock size={12} /> Aviso de Privacidad
                                </Link>
                                <Link href="/licencias" style={{ textDecoration: 'none' }} className="flex items-center gap-2 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                    <Music size={12} /> Acuerdos de Licencia
                                </Link>
                            </div>
                        } />

                        <div className="flex-1 min-w-0">
                            <LegalSection id="intro" num="1" title="Aceptación y Partes" icon={<FileText size={14} />} theme="blue">
                                <p>Bienvenido a <LegalHighlight>Tianguis Beats</LegalHighlight>, una tienda de beats en línea operada bajo la legislación de los <LegalHighlight>Estados Unidos Mexicanos</LegalHighlight>. Estos Términos de Servicio regulan la relación jurídica entre Tianguis Beats y cualquier persona que acceda, navegue, compre o venda en la plataforma.</p>
                                <p>Al hacer clic en <LegalHighlight>"Acepto los Términos"</LegalHighlight> o al completar cualquier compra, el Usuario manifiesta su consentimiento expreso con la totalidad de este documento. Si el Usuario no está de acuerdo, debe abstenerse de utilizar la Plataforma.</p>
                                <p>Tianguis Beats opera con apego a la <LegalHighlight>LFDA, LFPC, LFPDPPP</LegalHighlight> y demás legislación federal mexicana aplicable.</p>
                            </LegalSection>

                            <LegalSection id="propiedad" num="2" title="Propiedad Intelectual y Derechos de Autor" icon={<Book size={14} />} theme="blue">
                                <p>Un beat es una <LegalHighlight>obra musical original</LegalHighlight> que goza de protección jurídica automática desde el momento de su fijación, conforme al Art. 5 de la LFDA.</p>
                                <p><LegalHighlight>Derechos Morales (Art. 18–23 LFDA) — Irrenunciables:</LegalHighlight></p>
                                <ul className="space-y-2 ml-2">
                                    <LegalBullet>El Productor conserva el derecho moral sobre su obra en todo momento.</LegalBullet>
                                    <LegalBullet>Ninguna licencia transfiere la autoría intelectual ni elimina el derecho de crédito del Productor.</LegalBullet>
                                    <LegalBullet>El Artista está obligado a acreditar al Productor: <em>"Prod. [Nombre] / Tianguis Beats"</em></LegalBullet>
                                </ul>
                                <p><LegalHighlight>Reparto de Composición — 50/50 Split:</LegalHighlight></p>
                                <p>Los derechos de composición se dividen: <LegalHighlight>50% para el Productor</LegalHighlight> (música) y <LegalHighlight>50% para el Artista</LegalHighlight> (letra).</p>
                            </LegalSection>

                            <LegalSection id="licencias" num="3" title="Estructura de Licencias y Derechos" icon={<Music size={14} />} theme="blue">
                                <p>Tianguis Beats ofrece cinco modalidades de licencia con alcances claramente diferenciados. No se realizan actualizaciones retroactivas ni reembolsos.</p>
                                <div className="overflow-x-auto -mx-2 mt-4">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                {['Plan','Formato','Tipo','Streams','Uso','Vigencia'].map(h => (
                                                    <th key={h} className="px-3 py-3 text-left font-black uppercase tracking-widest text-[9px] text-muted/50">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {licenseTable.map((row, i) => (
                                                <tr key={i} className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                                                    <td className="px-3 py-3 font-black text-[11px]" style={{ color: row.color }}>{row.plan}</td>
                                                    <td className="px-3 py-3 text-muted/70 text-[11px]">{row.fmt}</td>
                                                    <td className="px-3 py-3 text-muted/70 text-[11px]">{row.tipo}</td>
                                                    <td className="px-3 py-3 text-muted/70 text-[11px]">{row.streams}</td>
                                                    <td className="px-3 py-3 text-muted/70 text-[11px]">{row.uso}</td>
                                                    <td className="px-3 py-3 text-muted/70 text-[11px]">{row.vigencia}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <LegalAlert color="amber"><strong>Importante:</strong> Al alcanzar el límite de reproducciones del plan, la licencia expira automáticamente. La explotación más allá del límite constituye infracción bajo el Art. 231 LFDA.</LegalAlert>
                            </LegalSection>

                            <LegalSection id="exclusiva" num="4" title="Licencia Exclusiva y Safe Harbor" icon={<Shield size={14} />} theme="blue">
                                <p>La <LegalHighlight>Licencia Exclusiva</LegalHighlight> otorga los derechos de explotación más amplios disponibles. Una vez formalizada, el beat se marca como <strong>SOLD</strong> y se retira del catálogo para nuevas compras.</p>
                                <p><LegalHighlight>Cláusula Safe Harbor:</LegalHighlight> La venta de la Licencia Exclusiva está sujeta a todos los contratos de licencia no exclusiva otorgados previamente. El Comprador Exclusivo no puede impugnar esta cláusula.</p>
                            </LegalSection>

                            <LegalSection id="conducts" num="5" title="Obligaciones del Usuario" icon={<Users size={14} />} theme="blue">
                                <ul className="space-y-2 ml-2">
                                    <LegalBullet>Proporcionar información veraz y actualizarla.</LegalBullet>
                                    <LegalBullet>Utilizar el beat únicamente dentro de los límites del plan adquirido.</LegalBullet>
                                    <LegalBullet>Incluir el crédito del Productor en todas las publicaciones.</LegalBullet>
                                    <LegalBullet>No reproducir, redistribuir, sublicenciar ni vender el archivo a terceros.</LegalBullet>
                                    <LegalBullet>No comprometer la seguridad técnica de la Plataforma.</LegalBullet>
                                </ul>
                            </LegalSection>

                            <LegalSection id="samples" num="6" title="Garantía de Originalidad y Samples" icon={<AlertCircle size={14} />} theme="blue">
                                <p>Cada Productor garantiza que su obra es original o cuenta con todas las licencias necesarias para los samples incluidos.</p>
                                <LegalAlert color="rose">Si un Artista es demandado por un sample no autorizado en un beat de Tianguis Beats, el Productor responsable podrá ser sujeto al <strong>saneamiento por evicción</strong>, incluyendo devolución del precio e indemnización por daños.</LegalAlert>
                            </LegalSection>

                            <LegalSection id="pagos" num="7" title="Pagos, Precios y Política de No Reembolso" icon={<CreditCard size={14} />} theme="blue">
                                <p>Todos los precios se muestran en <LegalHighlight>Pesos Mexicanos (MXN)</LegalHighlight>. Los pagos se procesan a través de <LegalHighlight>Stripe</LegalHighlight> (PCI DSS). Tianguis Beats no almacena datos financieros sensibles.</p>
                                <LegalAlert color="amber"><strong>Política de No Reembolso:</strong> Todas las ventas son definitivas una vez que el enlace de descarga ha sido activado. Excepción: archivo corrupto reportado dentro de 72 horas a soporte@tianguisbeats.com.</LegalAlert>
                            </LegalSection>

                            <LegalSection id="stems" num="8" title="Restricciones de Uso de Stems" icon={<Lock size={14} />} theme="blue">
                                <p>Los Stems otorgan derecho de arreglo para la canción licenciada. Está prohibido:</p>
                                <ul className="space-y-2 ml-2">
                                    <LegalBullet>Extraer sonidos para librerías propias o de terceros.</LegalBullet>
                                    <LegalBullet>Revender o sublicenciar los Stems como archivos independientes.</LegalBullet>
                                    <LegalBullet>Usarlos para crear obras distintas a la canción licenciada.</LegalBullet>
                                </ul>
                            </LegalSection>

                            <LegalSection id="contentid" num="9" title="Prohibición de Registro en Content ID" icon={<Ban size={14} />} theme="blue">
                                <LegalAlert color="rose"><strong>Prohibido:</strong> Registrar el beat en YouTube Content ID, Meta Rights Manager, DistroKid Block o equivalentes. Aplica incluso para la Licencia Exclusiva sin acuerdo escrito previo con Tianguis Beats.</LegalAlert>
                            </LegalSection>

                            <LegalSection id="responsabilidad" num="10" title="Limitación de Responsabilidad" icon={<AlertCircle size={14} />} theme="blue">
                                <p>Tianguis Beats no se hace responsable por: interrupciones del servicio, uso indebido del contenido, pérdida de archivos por parte del Artista, resultados comerciales ni cambios en plataformas de streaming.</p>
                                <p>La responsabilidad total de Tianguis Beats estará limitada al <LegalHighlight>monto pagado por el Usuario en la transacción específica</LegalHighlight>.</p>
                            </LegalSection>

                            <LegalSection id="jurisdiccion" num="11" title="Jurisdicción y Ley Aplicable" icon={<Scale size={14} />} theme="blue">
                                <p>Estos Términos se rigen por las leyes de los <LegalHighlight>Estados Unidos Mexicanos</LegalHighlight>. Para controversias, las partes se someten a los <LegalHighlight>Tribunales Federales de la Ciudad de México</LegalHighlight>. Antes de acudir a instancias judiciales, las partes intentarán resolver la disputa amigablemente durante mínimo <LegalHighlight>30 días naturales</LegalHighlight>.</p>
                            </LegalSection>

                            <LegalSection id="contacto" num="12" title="Contacto y Disputas" icon={<ExternalLink size={14} />} theme="blue">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { label: 'Soporte General', email: 'soporte@tianguisbeats.com' },
                                        { label: 'Asuntos Legales', email: 'legal@tianguisbeats.com' },
                                        { label: 'Privacidad (ARCO)', email: 'privacidad@tianguisbeats.com' },
                                        { label: 'Facturación / SAT', email: 'contacto@tianguisbeats.com' },
                                    ].map((c, i) => (
                                        <div key={i} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 hover:border-blue-500/30 transition-all group">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted/50 mb-1">{c.label}</p>
                                            <a href={`mailto:${c.email}`} style={{ textDecoration: 'none' }} className="text-blue-400 font-bold text-sm hover:text-blue-300 transition-colors">{c.email}</a>
                                        </div>
                                    ))}
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
