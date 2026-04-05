"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Youtube } from 'lucide-react';

/* TikTok icon (not in lucide) */
function TikTokIcon({ size = 15 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18.77a6.738 6.738 0 01-10.86 5.39c-1.51-1.32-2.42-3.39-2.22-5.41.22-3.41 3.13-6.41 6.54-6.35.15.01.31.01.46.04v4.01c-.18-.04-.37-.06-.56-.06a2.71 2.71 0 00-2.3 1.34 2.791 2.791 0 00.35 3.32c.76.75 2.05.86 2.92.2a2.81 2.81 0 001.03-2.18c.01-4.07-.01-14.66-.01-18.74v-.004z"/>
        </svg>
    );
}

const legalLinks = [
    { label: 'Términos',   href: '/terms' },
    { label: 'Privacidad', href: '/privacy' },
    { label: 'Licencias',  href: '/licencias' },
    { label: 'Ayuda',      href: '/help' },
    { label: 'Quejas',     href: '/quejas-y-sugerencias' },
];

const socials = [
    { icon: <Instagram size={16} />, href: 'https://www.instagram.com/tianguisbeats/', label: 'Instagram' },
    { icon: <Youtube    size={16} />, href: 'https://www.youtube.com/@tianguisbeats',  label: 'YouTube' },
    { icon: <TikTokIcon size={16} />, href: 'https://www.tiktok.com/@tianguisbeats',   label: 'TikTok' },
];

export default function Footer({ minimal = false }: { minimal?: boolean }) {
    return (
        <footer className="relative mt-auto border-t border-white/[0.06] overflow-hidden">
            {/* Subtle gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-36 md:pb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

                    {/* ── Left: Logo + tagline ── */}
                    <div className="flex flex-col items-center sm:items-start">
                        <Link href="/" style={{ textDecoration: 'none' }} className="flex items-center gap-2.5 group">
                            <div className="w-8 h-8 flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                                <img src="/logo.png" alt="Tianguis Beats" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-heading font-black text-base tracking-tight uppercase leading-tight">
                                <span className="text-foreground/60 dark:text-white/60">TIANGUIS</span>
                                <span className="text-blue-500"> BEATS</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                            {/* Empty space to align with the text part of the logo if needed, but the user said "empieza igual que tianguis beats" */}
                            <div className="w-8 sm:block hidden" /> 
                            <p className="text-[9px] text-foreground/40 dark:text-white/30 font-black tracking-[0.2em] uppercase font-heading">
                                Plataforma #1 de Beats en México
                            </p>
                        </div>
                    </div>

                    {/* ── Center: Legal links ── */}
                    <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
                        {legalLinks.map(l => (
                            <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}
                                className="text-[9px] font-black text-foreground/50 dark:text-white/40 hover:text-blue-500 dark:hover:text-white/80 tracking-wider transition-colors duration-200 uppercase font-heading">
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    {/* ── Right: Socials + Neza badge ── */}
                    <div className="flex flex-col items-center sm:items-end gap-3">
                        <div className="flex items-center gap-3">
                            {socials.map(s => (
                                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                                    style={{ textDecoration: 'none' }}
                                    className="w-8 h-8 rounded-full border border-foreground/10 dark:border-white/[0.08] bg-foreground/[0.02] dark:bg-white/[0.04] flex items-center justify-center text-foreground/40 dark:text-white/35 hover:text-blue-500 dark:hover:text-white/80 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all duration-200 hover:scale-110 active:scale-95">
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                        <p className="text-[8px] font-black text-foreground/40 dark:text-white/40 tracking-[0.2em] uppercase font-heading">
                            Orgullosamente hecho en Neza 🇲🇽
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
