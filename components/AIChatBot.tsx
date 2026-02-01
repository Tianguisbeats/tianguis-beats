"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, BrainCircuit, Sparkles, User, Bot, ChevronRight, Music, CreditCard, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Árbol de Lógica y Respuestas
    const showMenuPrincipal = () => {
        setMessages(prev => [...prev, {
            role: 'bot',
            content: '¿En qué puedo ayudarte hoy carnal? Selecciona una opción:',
            options: [
                { label: '🔍 Buscar Beats', action: handleBuscarBeats, icon: <Music size={14} /> },
                { label: '📜 Licencias', action: handleLicencias, icon: <CreditCard size={14} /> },
                { label: '💎 Planes Pro/Premium', action: handlePlanes, icon: <ShieldCheck size={14} /> },
                { label: '⚙️ Soporte Técnico', action: handleSoporte, icon: <ChevronRight size={14} /> }
            ]
        }]);
    };

    const handleBuscarBeats = () => {
        setMessages(prev => [...prev,
        { role: 'user', content: 'Quiero buscar beats' },
        {
            role: 'bot',
            content: '¡Excelente elección! ¿Qué género estás buscando para tu próximo hit?',
            options: [
                { label: 'Trap', action: () => router.push('/beats?genre=Trap') },
                { label: 'Reggaeton', action: () => router.push('/beats?genre=Reggaeton') },
                { label: 'Corridos', action: () => router.push('/beats?genre=Corridos') },
                { label: 'Todos los Beats', action: () => router.push('/beats') }
            ]
        }
        ]);
    };

    const handleLicencias = () => {
        setMessages(prev => [...prev,
        { role: 'user', content: 'Información sobre licencias' },
        {
            role: 'bot',
            content: 'Manejamos 3 tipos principales:\n\n1. **MP3**: Ideal para demos.\n2. **WAV**: Calidad profesional para grabaciones.\n3. **STEMS**: Archivos separados para mezcla total.\n\n¿Quieres ver los detalles de cada una?',
            options: [
                { label: 'Ver Licencias Detalladas', action: () => router.push('/help') },
                { label: 'Volver al Menú', action: showMenuPrincipal }
            ]
        }
        ]);
    };

    const handlePlanes = () => {
        setMessages(prev => [...prev,
        { role: 'user', content: 'Planes para productores' },
        {
            role: 'bot',
            content: 'Tenemos planes que se adaptan a tu nivel:\n\n- **FREE**: Empieza a subir tus beats.\n- **PRO**: Más espacio y mejores comisiones.\n- **PREMIUM**: Destacados y sin límites.\n\n¿Te gustaría ver los precios?',
            options: [
                { label: 'Ver Planes', action: () => router.push('/pricing') },
                { label: 'Menú Principal', action: showMenuPrincipal }
            ]
        }
        ]);
    };

    const handleSoporte = () => {
        setMessages(prev => [...prev,
        { role: 'user', content: 'Necesito soporte técnico' },
        {
            role: 'bot',
            content: 'Para ayuda técnica o problemas con tus compras, te recomiendo visitar nuestro centro de ayuda avanzado o contactar al equipo directo.',
            options: [
                { label: 'Ir a Ayuda', action: () => router.push('/help') },
                { label: 'Menú Anterior', action: showMenuPrincipal }
            ]
        }
        ]);
    };


    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { role: 'bot', content: '¡Qué onda! Soy el asistente de Tianguis Beats. Estoy aquí para que tu flujo sea más rápido.' }
            ]);
            setTimeout(showMenuPrincipal, 800);
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

    return (
        <div className="fixed bottom-8 right-8 z-[100] font-sans">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-900 rotate-90' : 'bg-blue-600'}`}
            >
                {isOpen ? <X className="text-white" size={28} /> : <BrainCircuit className="text-white" size={28} />}
            </button>

            <div className={`absolute bottom-20 right-0 w-[350px] md:w-[380px] h-[520px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col transition-all duration-500 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none translate-y-10'}`}>

                <div className="p-6 bg-slate-900 rounded-t-[2.5rem] flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-[10px] uppercase tracking-widest">Tianguis Support</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lógica de Respuesta</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={i} className="space-y-3">
                            <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none'}`}>
                                    {msg.content}
                                </div>
                            </div>

                            {msg.options && (
                                <div className="flex flex-col gap-2 pl-10 pr-4">
                                    {msg.options.map((opt, j) => (
                                        <button
                                            key={j}
                                            onClick={opt.action}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all text-xs font-bold text-slate-600 hover:text-blue-600 text-left group"
                                        >
                                            <span className="flex items-center gap-2">
                                                {opt.icon}
                                                {opt.label}
                                            </span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
