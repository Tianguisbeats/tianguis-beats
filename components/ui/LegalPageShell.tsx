"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────
   ABSTRACT BACKGROUND: triángulos, polígonos, cuadros rotados,
   pentágonos, diamantes, líneas. Opacidad muy ligera.
   Variante de color por página.
───────────────────────────────────────────────────────────────── */
export type LegalTheme = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

const THEME_MAP: Record<LegalTheme, { a: string; b: string; c: string; glow: string; badge: string }> = {
    blue:    { a: '#3b82f6', b: '#60a5fa', c: '#1d4ed8', glow: 'rgba(59,130,246,0.12)',  badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    violet:  { a: '#a855f7', b: '#c084fc', c: '#7c3aed', glow: 'rgba(168,85,247,0.12)', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    emerald: { a: '#10b981', b: '#34d399', c: '#059669', glow: 'rgba(16,185,129,0.12)', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    amber:   { a: '#f59e0b', b: '#fbbf24', c: '#d97706', glow: 'rgba(245,158,11,0.10)',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    rose:    { a: '#f43f5e', b: '#fb7185', c: '#be123c', glow: 'rgba(244,63,94,0.10)',   badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

export function AbstractLegalBg({ theme = 'blue' }: { theme?: LegalTheme }) {
    const t = THEME_MAP[theme];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
            {/* Large polygon top-left */}
            <div className="absolute -top-20 -left-20 w-[440px] h-[440px] opacity-[0.045] dark:opacity-[0.07]"
                style={{ background: `linear-gradient(135deg, ${t.a}, ${t.c})`, clipPath: 'polygon(0 0,75% 0,100% 25%,100% 100%,25% 100%,0 75%)' }} />
            {/* Triangle top-right */}
            <div className="absolute -top-10 right-[10%] w-[180px] h-[180px] opacity-[0.04] dark:opacity-[0.065]"
                style={{ background: t.b, clipPath: 'polygon(50% 0%,100% 100%,0% 100%)' }} />
            {/* Rotated square center-right */}
            <div className="absolute top-[20%] right-[15%] w-[130px] h-[130px] opacity-[0.025] dark:opacity-[0.045] rotate-[22deg]"
                style={{ background: t.a }} />
            {/* Small diamond top-center */}
            <div className="absolute top-[8%] left-[45%] w-[60px] h-[60px] opacity-[0.04] dark:opacity-[0.07] rotate-45"
                style={{ background: t.b }} />
            {/* Pentagon center-left */}
            <div className="absolute top-[45%] -left-10 w-[200px] h-[200px] opacity-[0.025] dark:opacity-[0.05]"
                style={{ background: t.a, clipPath: 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)' }} />
            {/* Hexagon bottom-right */}
            <div className="absolute bottom-[8%] right-[5%] w-[160px] h-[160px] opacity-[0.03] dark:opacity-[0.055]"
                style={{ background: `linear-gradient(180deg,${t.b},${t.c})`, clipPath: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)' }} />
            {/* Small triangle bottom-left */}
            <div className="absolute bottom-16 left-[8%] w-[90px] h-[90px] opacity-[0.035] dark:opacity-[0.06]"
                style={{ background: t.a, clipPath: 'polygon(50% 0%,100% 100%,0% 100%)' }} />
            {/* Large glow blob top-right */}
            <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full blur-[140px]"
                style={{ background: t.glow }} />
            {/* Medium glow blob bottom-left */}
            <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full blur-[120px]"
                style={{ background: t.glow }} />
            {/* Diagonal seam lines */}
            <div className="absolute top-0 left-[30%] w-px h-full bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent rotate-[10deg] origin-top" />
            <div className="absolute top-0 right-[25%] w-px h-full bg-gradient-to-b from-white/[0.06] via-transparent to-transparent rotate-[-6deg] origin-top" />
            <div className="absolute top-[38%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>
    );
}

/* Floating animated badge pill */
export function LegalBadge({ label, theme = 'blue' }: { label: string; theme?: LegalTheme }) {
    const t = THEME_MAP[theme];
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border mb-6 ${t.badge}`}
        >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
            {label}
        </motion.div>
    );
}

/* Section wrapper with hover glow */
export function LegalSection({ id, num, title, icon, children, theme = 'blue' }: {
    id: string; num: string; title: string; icon: React.ReactNode; children: React.ReactNode; theme?: LegalTheme;
}) {
    const t = THEME_MAP[theme];
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="scroll-mt-28 group relative rounded-[2rem] p-7 mb-6 border border-white/[0.06] bg-white/[0.025] backdrop-blur-sm hover:border-white/[0.12] transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl"
        >
            {/* Top glow line on hover */}
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${t.a}, transparent)` }} />
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-[11px] shadow-lg"
                    style={{ background: `${t.a}18`, color: t.a, border: `1px solid ${t.a}30` }}>
                    {icon || num}
                </div>
                <h2 className="text-base md:text-lg font-black text-foreground uppercase tracking-tight leading-tight">{title}</h2>
            </div>
            <div className="space-y-4 text-muted/80 leading-relaxed text-[14px] relative z-10">{children}</div>
        </motion.section>
    );
}

/* Bullet point */
export function LegalBullet({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex gap-3 items-start">
            <div className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400/60" />
            <span>{children}</span>
        </li>
    );
}

/* Highlight text */
export function LegalHighlight({ children }: { children: React.ReactNode }) {
    return <span className="font-bold text-foreground">{children}</span>;
}

/* Alert box */
export function LegalAlert({ children, color = 'amber' }: { children: React.ReactNode; color?: 'amber' | 'rose' | 'blue' }) {
    const cls = {
        amber: 'bg-amber-500/8 border-amber-500/25 text-amber-500',
        rose:  'bg-rose-500/8 border-rose-500/25 text-rose-500',
        blue:  'bg-blue-500/8 border-blue-500/25 text-blue-400',
    }[color];
    return (
        <div className={`rounded-2xl p-4 text-sm font-medium border ${cls}`}>{children}</div>
    );
}

/* External link */
export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }} className="font-bold hover:opacity-80 transition-opacity">{children}</Link>;
}

/* Sidebar nav wrapper */
export function LegalSidebar({ sections, theme = 'blue', extras }: {
    sections: { id: string; title: string; icon: React.ReactNode }[];
    theme?: LegalTheme;
    extras?: React.ReactNode;
}) {
    const t = THEME_MAP[theme];
    return (
        <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 rounded-[2rem] p-6 border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm shadow-xl">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] mb-5" style={{ color: t.a }}>Contenido</p>
                <nav className="space-y-1">
                    {sections.map(s => (
                        <a key={s.id} href={`#${s.id}`} style={{ textDecoration: 'none' }}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-bold text-muted/60 hover:text-foreground hover:bg-white/[0.04] transition-all group">
                            <span className="text-muted/25 group-hover:text-foreground/50 transition-colors shrink-0">{s.icon}</span>
                            {s.title}
                        </a>
                    ))}
                </nav>
                {extras && <div className="mt-5 pt-5 border-t border-white/[0.06]">{extras}</div>}
            </div>
        </aside>
    );
}

/* Page shell wrapper */
export function LegalPageShell({ children, theme = 'blue' }: { children: React.ReactNode; theme?: LegalTheme }) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 relative overflow-hidden">
            <AbstractLegalBg theme={theme} />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
            </div>
            <div className="relative z-10">{children}</div>
        </div>
    );
}
