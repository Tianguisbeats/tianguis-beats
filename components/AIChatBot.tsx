"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, BrainCircuit, Sparkles, User, Bot } from 'lucide-react';

interface Message {
    role: 'user' | 'bot';
    content: string;
}

export default function AIChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: '¡Qué onda! Soy Tianguis AI. ¿Buscas algún beat en especial o tienes dudas sobre la plataforma?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Escuchar evento global para abrir el chat (desde el Centro de Ayuda por ejemplo)
    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, []);

    // Auto-scroll al final de los mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: userMsg }]
                })
            });

            const data = await response.json();

            if (data.text) {
                setMessages(prev => [...prev, { role: 'bot', content: data.text }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: 'Lo siento carnal, tuve un pequeño error. ¿Me lo repites?' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', content: 'No tengo conexión ahorita, intenta en un momento.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] font-sans">
            {/* Botón Flotante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-900 rotate-90' : 'bg-blue-600 animate-bounce-slow'}`}
            >
                {isOpen ? <X className="text-white" size={28} /> : <BrainCircuit className="text-white" size={28} />}

                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                )}
            </button>

            {/* Ventana de Chat */}
            <div className={`absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col transition-all duration-500 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none translate-y-10'}`}>

                {/* Header */}
                <div className="p-6 bg-slate-900 rounded-t-[2.5rem] flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-xs uppercase tracking-widest">Tianguis AI</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">En línea</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar custom-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="bg-slate-50 p-4 rounded-3xl rounded-tl-none flex items-center gap-1">
                                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 pt-0">
                    <div className="bg-slate-50 rounded-2xl p-2 flex items-center transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600/10">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe tu mensaje..."
                            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading}
                            className={`p-3 rounded-xl transition-all ${isLoading ? 'text-slate-300' : 'bg-blue-600 text-white hover:bg-slate-900 shadow-lg shadow-blue-500/20'}`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
