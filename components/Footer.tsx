import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-background py-8 border-t border-border mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center transform -rotate-6 shadow-xl overflow-hidden group hover:rotate-0 transition-transform duration-300">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1.5 dark:invert" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-foreground uppercase tracking-tighter leading-none text-sm">TianguisBeats</span>
                        <span className="text-[8px] font-black text-muted uppercase tracking-widest mt-1">Plataforma Digital</span>
                    </div>
                </div>

                <div className="flex gap-8 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                    <Link href="/terms" className="hover:text-accent transition-colors">Términos</Link>
                    <Link href="/privacy" className="hover:text-accent transition-colors">Privacidad</Link>
                    <Link href="/help" className="hover:text-accent transition-colors">Ayuda</Link>
                </div>

                <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-card border border-border text-muted text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    ORGULLOSAMENTE HECHO EN NEZA 🇲🇽
                </div>
            </div>
        </footer>
    );
}
