"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    filters?: any;
}

export default function AIChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy tu A&R Virtual. ¿En qué puedo ayudarte hoy? Cuéntame qué tipo de beat buscas o pregúntame sobre nuestros planes.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
            });

            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply,
                filters: data.intent === 'search' ? data.filters : null
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Perdón, tuve un problema de conexión. Inténtalo de nuevo.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-ai-chat', handleOpen);
        return () => window.removeEventListener('open-ai-chat', handleOpen);
    }, []);

    const applyFilters = (filters: any) => {
        const params = new URLSearchParams();
        if (filters.genre) params.set('genre', filters.genre);
        if (filters.mood) params.set('mood', filters.mood);
        if (filters.bpm) params.set('bpm', filters.bpm.toString());
        if (filters.reference_artist) params.set('artist', filters.reference_artist);

        router.push(`/beats?${params.toString()}`);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-24 right-8 z-[100]">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 md:w-96 h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-xs">A&R Virtual</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">En línea</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-900 border border-slate-100 rounded-tl-none shadow-sm'
                                    }`}>
                                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>

                                    {msg.filters && (
                                        <button
                                            onClick={() => applyFilters(msg.filters)}
                                            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all group"
                                        >
                                            <Play size={12} fill="currentColor" />
                                            Ver Resultados
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-3">
                                    <Loader2 className="animate-spin text-blue-600" size={16} />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analizando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribe tu mensaje..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-6 pr-14 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                            />
                            <button
                                onClick={handleSend}
                                className="absolute right-2 top-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all shadow-lg shadow-blue-600/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-blue-600 text-white shadow-blue-600/30'
                    }`}
            >
                {isOpen ? <X size={20} /> : <div className="relative"><Sparkles size={20} /><div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div></div>}
            </button>
        </div>
    );
}
