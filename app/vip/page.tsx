"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function VIPPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirigir a la página de planes premium
        router.replace('/pricing');
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Redirigiendo al VIP...</p>
            </div>
        </div>
    );
}
