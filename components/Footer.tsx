import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white py-8 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center transform -rotate-6 shadow-md shadow-slate-200 overflow-hidden">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1 invert" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tighter leading-none text-xs">TianguisBeats</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Plataforma Digital</span>
                    </div>
                </div>

                <div className="flex gap-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <Link href="/terms" className="hover:text-blue-600 transition-colors">Términos</Link>
                    <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacidad</Link>
                    <Link href="/help" className="hover:text-blue-600 transition-colors">Ayuda</Link>
                </div>

                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-[0.2em]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    ORGULLOSAMENTE HECHO EN NEZA 🇲🇽
                </div>
            </div>
        </footer>
    );
}
