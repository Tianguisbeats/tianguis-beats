import React from 'react';
import { Music } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white py-16 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center transform -rotate-6 shadow-xl shadow-slate-200 overflow-hidden">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1 invert" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tighter leading-none">TianguisBeats</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Plataforma Digital</span>
                    </div>
                </div>

                <div className="flex gap-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <a href="#" className="hover:text-blue-600 transition-colors">Términos</a>
                    <a href="#" className="hover:text-blue-600 transition-colors">Privacidad</a>
                    <a href="#" className="hover:text-blue-600 transition-colors">Ayuda</a>
                </div>

                <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Orgullosamente Hecho en Neza 🇲🇽
                </div>
            </div>
        </footer>
    );
}
