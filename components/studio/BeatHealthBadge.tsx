"use client";

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { diagnosticarBeat, BeatHealthInput } from '@/lib/beatHealth';

// Badge de salud para una tarjeta de beat. Muestra un punto de color y, al
// pasar el cursor / tocar, la lista de avisos accionables.
export default function BeatHealthBadge({ beat }: { beat: BeatHealthInput }) {
    const [open, setOpen] = useState(false);
    const issues = diagnosticarBeat(beat);

    const critico = issues.some((i) => i.severity === 'critico');
    const hayIssues = issues.length > 0;

    const cfg = !hayIssues
        ? { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 size={12} />, label: 'Óptimo' }
        : critico
        ? { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: <AlertTriangle size={12} />, label: `${issues.length} ${issues.length === 1 ? 'crítico' : 'avisos'}` }
        : { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: <Info size={12} />, label: `${issues.length} ${issues.length === 1 ? 'aviso' : 'avisos'}` };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => hayIssues && setOpen((o) => !o)}
                onMouseEnter={() => hayIssues && setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${cfg.color} ${hayIssues ? 'cursor-pointer' : 'cursor-default'}`}
            >
                {cfg.icon} {cfg.label}
            </button>

            {open && hayIssues && (
                <div className="absolute z-30 top-full right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3 text-left">
                    {issues.map((i) => (
                        <div key={i.id} className="flex gap-2.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${i.severity === 'critico' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{i.label}</p>
                                <p className="text-[10px] text-muted font-medium leading-snug mt-0.5">{i.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
