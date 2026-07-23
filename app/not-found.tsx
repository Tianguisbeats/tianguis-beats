import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Home, Search } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Página no encontrada',
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32">
                <p className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-500 to-cyan-400">404</p>
                <h1 className="mt-4 text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                    No encontramos esta página
                </h1>
                <p className="mt-3 max-w-md text-sm text-muted/70">
                    El beat, sound kit o página que buscas ya no existe o cambió de dirección.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-accent text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
                        <Home size={14} /> Ir al inicio
                    </Link>
                    <Link href="/beats/catalog" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:border-accent/40 transition-colors">
                        <Search size={14} /> Explorar beats
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}
