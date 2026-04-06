"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Clock, ShieldCheck, Check, Send, X, AlertCircle, ShoppingBag, Music, User } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Switch from '@/components/ui/Switch';
import LoadingTianguis from '@/components/LoadingTianguis';
import { motion, AnimatePresence } from 'framer-motion';

type Offer = {
    id: string;
    monto_ofertado: number;
    estado: 'pendiente' | 'aceptada' | 'rechazada' | 'comprada';
    fecha_creacion: string;
    fecha_expiracion?: string;
    historial_chat: Array<{ sender: string, text: string, timestamp: string }>;
    beats: { id: string; titulo: string; portada_url: string };
    productor: { nombre_usuario: string; nombre_artistico: string; foto_perfil: string };
};

export default function MisOfertasPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
    const [newAmountDrafts, setNewAmountDrafts] = useState<Record<string, number>>({});
    const [updatingAmount, setUpdatingAmount] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { data } = await supabase
                .from('ofertas_exclusivas')
                .select(`
                    *,
                    beats (id, titulo, portada_url),
                    productor:productor_id (nombre_usuario, nombre_artistico, foto_perfil)
                `)
                .eq('comprador_id', user.id)
                .order('fecha_creacion', { ascending: false });

            if (data) setOffers(data as Offer[]);
        } catch (err) {
            console.error("Error fetching offers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (offerId: string) => {
        const text = chatDrafts[offerId]?.trim();
        if (!text) return;

        const offer = offers.find(o => o.id === offerId);
        if (!offer) return;

        const newMessage = {
            sender: 'comprador',
            text,
            timestamp: new Date().toISOString()
        };

        const nextHistory = [...(offer.historial_chat || []), newMessage];

        const { error } = await supabase
            .from('ofertas_exclusivas')
            .update({ historial_chat: nextHistory })
            .eq('id', offerId);

        if (error) {
            showToast("Error al enviar el mensaje", "error");
        } else {
            setOffers(prev => prev.map(o => o.id === offerId ? { ...o, historial_chat: nextHistory } : o));
            setChatDrafts(prev => ({ ...prev, [offerId]: '' }));
        }
    };

    const handleReSubmitOffer = async (offerId: string) => {
        const newAmount = newAmountDrafts[offerId];
        if (!newAmount || newAmount <= 0) {
            showToast("Ingresa un monto válido mayor a 0", "error");
            return;
        }

        setUpdatingAmount(offerId);
        try {
            const { error } = await supabase
                .from('ofertas_exclusivas')
                .update({ 
                    monto_ofertado: newAmount, 
                    estado: 'pendiente' 
                })
                .eq('id', offerId);

            if (error) throw error;

            showToast("Contraoferta enviada", "success");
            setOffers(prev => prev.map(o => o.id === offerId ? { ...o, monto_ofertado: newAmount, estado: 'pendiente' } : o));
            setNewAmountDrafts(prev => ({ ...prev, [offerId]: 0 }));
        } catch (err: any) {
            showToast("Hubo un error al reenviar la oferta", "error");
        } finally {
            setUpdatingAmount(null);
        }
    };

    if (loading) return <LoadingTianguis />;

    const activeOffers = offers.filter(o => o.estado !== 'comprada');

    return (
        <main className="relative z-10 pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-2">Mi Studio</p>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                        <span className="opacity-40">Tus</span> <br />
                        <span className="text-blue-500 relative inline-block">
                            Ofertas
                            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent/10 border border-accent/20 text-accent rounded-xl flex items-center justify-center shrink-0">
                            <MessageCircle size={18} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">Ofertas Activas</p>
                            <span className="text-xl font-black text-foreground tracking-tighter">{activeOffers.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {activeOffers.length === 0 ? (
                <div className="py-24 text-center bg-card border border-border rounded-[4rem] flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-accent/5 border border-accent/10 rounded-[2.5rem] flex items-center justify-center text-muted">
                        <ShoppingBag size={40} className="opacity-20" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">No has hecho ofertas</h3>
                        <p className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] mt-2 max-w-[280px] mx-auto opacity-50">
                            Cuando ofrezcas un precio por una licencia exclusiva, aparecerá aquí para que negocies.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {activeOffers.map(offer => (
                        <div key={offer.id} className="bg-card border border-border rounded-[2.5rem] p-6 lg:p-8 flex flex-col h-full hover:border-accent/30 transition-all duration-300 relative overflow-hidden group">
                            {offer.estado === 'aceptada' && <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />}
                            {offer.estado === 'rechazada' && <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />}
                            {offer.estado === 'pendiente' && <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />}

                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-black/40 rounded-xl overflow-hidden shrink-0 border border-border">
                                        {offer.beats?.portada_url ? (
                                            <img src={offer.beats.portada_url} alt="Cover" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted"><Music size={20} /></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-black uppercase tracking-tight text-foreground line-clamp-1">{offer.beats?.titulo}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Licencia Exclusiva</span>
                                            <span className="w-1 h-1 bg-muted rounded-full" />
                                            <span className="text-[9px] font-black uppercase text-muted tracking-widest">{offer.productor?.nombre_artistico}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Monto Ofertado</p>
                                    <p className="text-2xl font-black text-foreground tracking-tighter tabular-nums">${offer.monto_ofertado} <span className="text-[10px]">MXN</span></p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-lg text-[10px] font-black uppercase tracking-widest
                                    ${offer.estado === 'aceptada' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                      offer.estado === 'rechazada' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                      'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {offer.estado === 'aceptada' ? <Check size={12} /> : offer.estado === 'rechazada' ? <X size={12} /> : <Clock size={12} />}
                                    Estado: {offer.estado}
                                </div>
                                {offer.estado === 'aceptada' && offer.fecha_expiracion && (
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 flex items-center gap-1">
                                        Expira: {new Date(offer.fecha_expiracion).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            {/* Chat Logic */}
                            <div className="flex-1 bg-foreground/[0.02] border border-border rounded-2xl overflow-hidden flex flex-col mb-4 min-h-[250px]">
                                <div className="bg-foreground/[0.03] p-3 border-b border-border text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Mini Chat de Negociación</p>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                                    {(!offer.historial_chat || offer.historial_chat.length === 0) ? (
                                        <div className="flex-1 flex items-center justify-center text-center opacity-30">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Aún no hay mensajes. Rompe el hielo.</p>
                                        </div>
                                    ) : (
                                        offer.historial_chat.map((msg, i) => {
                                            const isMe = msg.sender === 'comprador';
                                            return (
                                                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}>
                                                        {msg.text}
                                                    </div>
                                                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest mt-1 opacity-60">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                                <div className="p-3 border-t border-border bg-card flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Escribe un mensaje..."
                                        value={chatDrafts[offer.id] || ''}
                                        onChange={e => setChatDrafts(prev => ({...prev, [offer.id]: e.target.value}))}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage(offer.id)}
                                        className="flex-1 bg-foreground/[0.03] border border-border rounded-xl px-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-blue-500/50"
                                    />
                                    <button 
                                        onClick={() => handleSendMessage(offer.id)}
                                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Acciones si fue rechazada */}
                            {offer.estado === 'rechazada' && (
                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 mt-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-3 flex items-center gap-1.5">
                                        <AlertCircle size={12} />
                                        La oferta fue rechazada. ¿Quieres intentar otro monto?
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-black">$</span>
                                            <input 
                                                type="number" 
                                                placeholder="Nuevo monto"
                                                value={newAmountDrafts[offer.id] || ''}
                                                onChange={e => setNewAmountDrafts(prev => ({...prev, [offer.id]: Number(e.target.value)}))}
                                                className="w-full bg-card border border-border rounded-xl py-3 pl-8 pr-4 text-xs font-black uppercase tracking-widest focus:outline-none"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleReSubmitOffer(offer.id)}
                                            disabled={updatingAmount === offer.id}
                                            className="px-6 bg-foreground text-background font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            {updatingAmount === offer.id ? '...' : 'Enviar Of.'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Acciones si fue aceptada */}
                            {offer.estado === 'aceptada' && (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 mt-2 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">¡Oferta Aceptada!</p>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-4">Añade el beat a tu carrito y el descuento se aplicará automáticamente.</p>
                                    <button 
                                        className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={14} />
                                        Ir al Cátalogo 
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
