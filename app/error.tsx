"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-6">
                <AlertTriangle size={22} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                Algo salió mal
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted/70">
                Ocurrió un error inesperado al cargar esta página. Puedes intentar de nuevo o volver al inicio.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-full bg-accent text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                    <RotateCcw size={14} /> Reintentar
                </button>
                <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:border-accent/40 transition-colors">
                    <Home size={14} /> Ir al inicio
                </Link>
            </div>
        </div>
    );
}
