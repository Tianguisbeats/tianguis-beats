"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, BrainCircuit, Sparkles, User, Bot, ChevronRight, Music, CreditCard, ShieldCheck } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface Message {
    role: 'user' | 'bot';
    content: string;
    options?: Option[];
}

interface Option {
    label: string;
    action: () => void;
    icon?: React.ReactNode;
}

export default function AIChatBot() {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Rutas permitidas: Home, Explorar (/beats), Perfiles (/[username]), Planes (/pricing)
    const allowedPaths = ['/', '/beats', '/pricing'];
    const isProfilePath = pathname && !allowedPaths.includes(pathname) && pathname.split('/').length === 2 && !pathname.includes('.');
    const isPricingPath = pathname?.startsWith('/pricing');

    const isVisible = pathname === '/' || pathname === '/beats' || isPricingPath || isProfilePath;

    // Árbol de Lógica
    const showMenuPrincipal = () => {
        setMessages(prev => [...prev, {
            role: 'bot',
            content: '¿En qué puedo ayudarte hoy carnal?',
            options: [
                { label: '🔍 Buscar Beats', action: handleBuscarBeats, icon: <Music size={12} /> },
                { label: '📜 Licencias', action: handleLicencias, icon: <CreditCard size={12} /> },
                { label: '💎 Planes', action: handlePlanes, icon: <ShieldCheck size={12} /> },
                { label: '⚙️ Soporte', action: handleSoporte, icon: <ChevronRight size={12} /> }
            ]
        }]);
    };

    const handleBuscarBeats = () => {
        setMessages(prev => [...prev,
        { role: 'user', content: 'Buscar Beats' },
        {
            role: 'bot',
            content: '¿Qué género buscas?',
            options: [
                { label: 'Trap', action: () => router.push('/beats?genre=Trap') },
                { label: 'Reggaeton', action: () => router.push('/beats?genre=Reggaeton') },
                { label: 'Corridos', action: () => router.push('/beats?genre=Corridos') }
            ]
        }
        ]);
    };

    const handleLicencias = () => {
        setMessages(prev => [...prev,
        { role: 'user', content: 'Licencias' },
        {
            role: 'bot',
            content: 'Manejamos MP3, WAV y STEMS. ¿Quieres ver los detalles?',
            options: [
                { label: 'Ver más', action: () => router.push('/help') },
                { label: 'Menú', action: showMenuPrincipal }
            ]
        }
        ]);
    };

    const handlePlanes = () => {
        setMessages(prev => [...prev,
        { role: 'user', content: 'Planes' },
        {
            role: 'bot',
            content: 'Tenemos planes FREE, PRO y PREMIUM. ¿Quieres ver precios?',
            options: [
                { label: 'Ver Planes', action: () => router.push('/pricing') },
                { label: 'Menú', action: showMenuPrincipal }
            ]
        }
        ]);
    };

    const handleSoporte = () => {
        setMessages(prev => [...prev,
        { role: 'user', content: 'Soporte' },
        {
            role: 'bot',
            content: 'Para ayuda técnica, ve a nuestro Centro de Apoyo.',
            options: [
                { label: 'Ir a Ayuda', action: () => router.push('/help') }
            ]
        }
        ]);
    };

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { role: 'bot', content: '¡Hola! Soy Tianguis AI.' }
            ]);
            setTimeout(showMenuPrincipal, 600);
        }
    }, []);

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans pointer-events-none">
            {/* Botón Flotante Más Pequeño y Sutil */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-900' : 'bg-blue-600'}`}
            >
                {isOpen ? <X className="text-white" size={20} /> : <BrainCircuit className="text-white" size={20} />}
            </button>

            {/* Ventana de Chat Más Compacta */}
            <div className={`pointer-events-auto absolute bottom-16 right-0 w-[300px] md:w-[320px] h-[450px] bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col transition-all duration-500 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none translate-y-10'}`}>

                {/* Header Compacto */}
                <div className="p-4 bg-slate-900 rounded-t-[2rem] flex items-center gap-3 text-white">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 className="font-black text-[9px] uppercase tracking-widest leading-none">Tianguis Helper</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Activo</span>
                        </div>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={i} className="space-y-2">
                            <div className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                </div>
                                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[12px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none'}`}>
                                    {msg.content}
                                </div>
                            </div>

                            {msg.options && (
                                <div className="flex flex-col gap-1.5 pl-8 pr-2">
                                    {msg.options.map((opt, j) => (
                                        <button
                                            key={j}
                                            onClick={opt.action}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all text-[11px] font-bold text-slate-500 hover:text-blue-600 text-left"
                                        >
                                            <span className="flex items-center gap-2">
                                                {opt.icon}
                                                {opt.label}
                                            </span>
                                            <ChevronRight size={12} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer con Leyenda */}
                <div className="p-4 pt-1 flex justify-center border-t border-slate-50">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 flex items-center gap-1.5">
                        <Sparkles size={10} className="text-blue-300" />
                        Potenciado por IA
                    </span>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
