import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Cargando...</p>
        </div>
    );
}
