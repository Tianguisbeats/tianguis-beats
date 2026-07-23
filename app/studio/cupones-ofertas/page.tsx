"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus, Edit3, Trash2, Ticket, Percent, Calendar,
    CheckCircle2, XCircle, Loader2, Users, HardDrive,
    ArrowUpRight, Info, Search, Filter, Hash, CreditCard,
    DollarSign, BarChart3, ChevronRight, X, User, Clock,
    Target, ChevronDown, CheckCircle, ShieldCheck, Mail, Zap, Trash,
    MessageCircle, Check, ArrowRight, Music, AlertCircle, Send, Package, ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import Switch from '@/components/ui/Switch';
import LoadingTianguis from '@/components/LoadingTianguis';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos reflejando el nuevo esquema DB de Cupones
type Coupon = {
    id: string;
    codigo: string;
    porcentaje_descuento: number;
    usos_maximos: number | null;
    usos_actuales: number;
    fecha_expiracion: string | null;
    es_activo: boolean;
    aplica_a: 'todos' | 'beats' | 'sound_kits' | 'servicios' | 'suscripciones';
    nivel_objetivo: 'todos' | 'gratis' | 'pro' | 'premium';
    productor_id: string;
    id_cupon_stripe?: string | null;
    texto_descuento?: string | null;
};

type BulkDeal = {
    id: string;
    productor_id: string;
    venta_minima: number;
    beats_gratis: number;
    es_activa: boolean;
};

type Offer = {
    id: string;
    monto_ofertado: number;
    estado: 'pendiente' | 'aceptada' | 'rechazada' | 'comprada';
    fecha_creacion: string;
    fecha_actualizacion?: string;
    fecha_expiracion?: string;
    mensaje_comprador?: string;
    historial_chat?: Array<{ sender: string, text: string, timestamp: string }>;
    beats: { titulo: string; portada_url: string };
    comprador: { nombre_usuario: string; nombre_artistico: string; foto_perfil: string };
    productor?: { nombre_usuario: string; nombre_artistico: string; foto_perfil: string };
};

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTier, setUserTier] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'cupones' | 'bulk' | 'negociacion'>('cupones');
    const [bulkDeals, setBulkDeals] = useState<BulkDeal[]>([]);
    const [offers_selling, setOffersSelling] = useState<Offer[]>([]);
    const [offers_buying, setOffersBuying] = useState<Offer[]>([]);
    const [processingOfferId, setProcessingOfferId] = useState<string | null>(null);
    const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
    const [newAmountDrafts, setNewAmountDrafts] = useState<Record<string, number>>({});
    const [updatingAmount, setUpdatingAmount] = useState<string | null>(null);
    const [negotiationType, setNegotiationType] = useState<'ventas' | 'compras'>('ventas');
    const { showToast } = useToast();

    // Bulk deal form state — edits are local until "Guardar" is clicked
    const [editingBulkId, setEditingBulkId] = useState<string | null>(null);
    const [bulkForm, setBulkForm] = useState<{ venta_minima: number; beats_gratis: number }>({ venta_minima: 2, beats_gratis: 1 });
    const [showNewBulkForm, setShowNewBulkForm] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon> | null>(null);
    const [originalCoupon, setOriginalCoupon] = useState<Partial<Coupon> | null>(null);
    const [saving, setSaving] = useState(false);
    const [couponUses, setCouponUses] = useState<any[]>([]);
    const [loadingUses, setLoadingUses] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Tier
        const { data: profile } = await supabase.from('perfiles').select('nivel_suscripcion').eq('id', user.id).single();
        setUserTier(profile?.nivel_suscripcion?.toLowerCase()?.trim() || 'free');

        // Get Coupons
        const { data: couponsData, error } = await supabase
            .from('cupones')
            .select('*')
            .eq('productor_id', user.id)
            .order('fecha_creacion', { ascending: false });

        if (couponsData) {
            setCoupons(couponsData as Coupon[]);
        }

        // Get Bulk Deals
        const { data: bulkData } = await supabase
            .from('ofertas_volumen')
            .select('*')
            .eq('productor_id', user.id)
            .order('venta_minima', { ascending: true });

        if (bulkData) setBulkDeals(bulkData as BulkDeal[]);

        // Get Offers Selling (Negotiations as Producer)
        const { data: sellingData } = await supabase
            .from('ofertas_exclusivas')
            .select(`
                *,
                beats (titulo, portada_url),
                comprador:comprador_id (nombre_usuario, nombre_artistico, foto_perfil)
            `)
            .eq('productor_id', user.id)
            .order('fecha_creacion', { ascending: false });

        if (sellingData) setOffersSelling(sellingData as any[]);

        // Get Offers Buying (Negotiations as Buyer)
        const { data: buyingData } = await supabase
            .from('ofertas_exclusivas')
            .select(`
                *,
                beats (titulo, portada_url),
                productor:productor_id (nombre_usuario, nombre_artistico, foto_perfil)
            `)
            .eq('comprador_id', user.id)
            .order('fecha_creacion', { ascending: false });

        if (buyingData) setOffersBuying(buyingData as any[]);

        setLoading(false);
    };

    // Dispara el correo a la contraparte (best-effort, no bloquea ni rompe nada).
    // La ruta API decide a quién avisar según quién hace la petición.
    const notificarNegociacionPorEmail = async (ofertaId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await fetch('/api/negociacion/notificar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ ofertaId }),
            });
        } catch {
            // Silencioso: el correo es secundario, la notificación en vivo ya llegó.
        }
    };

    const handleOfferAction = async (id: string, action: 'aceptada' | 'rechazada') => {
        setProcessingOfferId(id);
        try {
            const { error } = await supabase
                .from('ofertas_exclusivas')
                .update({ 
                    estado: action,
                    fecha_actualizacion: new Date().toISOString(),
                    fecha_expiracion: action === 'aceptada' ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null
                })
                .eq('id', id);

            if (error) throw error;

            notificarNegociacionPorEmail(id);
            showToast(`Oferta ${action === 'aceptada' ? 'aceptada' : 'rechazada'}`, "success");
            fetchData();
        } catch (err: any) {
            showToast(err.message || "Error al procesar", "error");
        } finally {
            setProcessingOfferId(null);
        }
    };

    const handleSendMessage = async (offerId: string, role: 'productor' | 'comprador') => {
        const text = chatDrafts[offerId]?.trim();
        if (!text) return;

        const allOffers = [...offers_selling, ...offers_buying];
        const offer = allOffers.find(o => o.id === offerId);
        if (!offer) return;

        const newMessage = {
            sender: role,
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
            if (role === 'productor') {
                setOffersSelling(prev => prev.map(o => o.id === offerId ? { ...o, historial_chat: nextHistory } : o));
            } else {
                setOffersBuying(prev => prev.map(o => o.id === offerId ? { ...o, historial_chat: nextHistory } : o));
            }
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

            notificarNegociacionPorEmail(offerId);
            showToast("Contraoferta enviada", "success");
            fetchData();
            setNewAmountDrafts(prev => ({ ...prev, [offerId]: 0 }));
        } catch (err: any) {
            showToast("Hubo un error al reenviar la oferta", "error");
        } finally {
            setUpdatingAmount(null);
        }
    };

    // Contraoferta del PRODUCTOR: responde con un monto distinto y deja la oferta
    // en 'pendiente' para que el comprador decida. La policy oe_update ya permite
    // al productor actualizar monto y estado de sus ofertas.
    const handleCounterOffer = async (offerId: string) => {
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
                    estado: 'pendiente',
                    fecha_actualizacion: new Date().toISOString(),
                })
                .eq('id', offerId);

            if (error) throw error;

            notificarNegociacionPorEmail(offerId);
            showToast("Contraoferta enviada al comprador", "success");
            fetchData();
            setNewAmountDrafts(prev => ({ ...prev, [offerId]: 0 }));
        } catch (err: any) {
            showToast(err.message || "Error al enviar la contraoferta", "error");
        } finally {
            setUpdatingAmount(null);
        }
    };

    const handleSaveBulkDeal = async (deal: Partial<BulkDeal>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Validación de reglas de la oferta por volumen (coincide con el CHECK de la BD)
        const ventaMinima = Number(deal.venta_minima);
        const beatsGratis = Number(deal.beats_gratis);
        if (!Number.isInteger(ventaMinima) || ventaMinima < 2) {
            showToast("La compra mínima debe ser un entero ≥ 2", "error");
            return;
        }
        if (!Number.isInteger(beatsGratis) || beatsGratis < 1) {
            showToast("Los beats gratis deben ser un entero ≥ 1", "error");
            return;
        }
        if (beatsGratis >= ventaMinima) {
            showToast("Los beats gratis deben ser menos que la compra mínima", "error");
            return;
        }

        setSaving(true);
        try {
            const payload = { ...deal, productor_id: user.id };
            let error;
            if (deal.id) {
                const { error: err } = await supabase.from('ofertas_volumen').update(payload).eq('id', deal.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('ofertas_volumen').insert(payload);
                error = err;
            }

            if (error) throw error;
            showToast("Oferta por volumen actualizada", "success");
            fetchData();
        } catch (err: any) {
            showToast(err.message || "Error al guardar oferta bulk", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBulkDeal = async (id: string) => {
        if (!confirm("¿Eliminar esta oferta por volumen?")) return;
        const { error } = await supabase.from('ofertas_volumen').delete().eq('id', id);
        if (!error) {
            showToast("Oferta eliminada", "success");
            fetchData();
        }
    };

    const fetchUsage = async (couponId: string) => {
        setLoadingUses(true);
        try {
            const { data, error } = await supabase
                .from('usos_cupones')
                .select(`
                    id,
                    fecha_uso,
                    usuario_id,
                    perfiles:usuario_id (
                        nombre_artistico,
                        nombre_usuario,
                        foto_perfil
                    )
                `)
                .eq('cupon_id', couponId)
                .order('fecha_uso', { ascending: false });

            if (data) setCouponUses(data);
        } catch (err) {
            console.error("Error fetching usage:", err);
        }
        setLoadingUses(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !currentCoupon) return;

        setSaving(true);
        try {
            const payload: any = {
                productor_id: user.id,
                codigo: currentCoupon.codigo?.toUpperCase().trim(),
                porcentaje_descuento: Number(currentCoupon.porcentaje_descuento),
                usos_maximos: currentCoupon.usos_maximos ? Number(currentCoupon.usos_maximos) : null,
                fecha_expiracion: currentCoupon.fecha_expiracion || null,
                aplica_a: currentCoupon.aplica_a || 'todos',
                nivel_objetivo: currentCoupon.nivel_objetivo || 'todos',
                es_activo: currentCoupon.id ? currentCoupon.es_activo : true,
                id_cupon_stripe: currentCoupon.aplica_a === 'suscripciones' ? (currentCoupon.id_cupon_stripe || null) : null,
                texto_descuento: currentCoupon.texto_descuento || null
            };

            if (!payload.codigo) {
                showToast("Por favor ingresa un código para el cupón", "error");
                setSaving(false);
                return;
            }

            let error;
            if (currentCoupon.id) {
                const { error: err } = await supabase.from('cupones').update(payload).eq('id', currentCoupon.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('cupones').insert(payload);
                error = err;
            }

            if (error) {
                if (error.code === '23505') {
                    throw new Error("Este código de cupón ya existe. Por favor usa uno diferente.");
                }
                throw error;
            }

            showToast(currentCoupon.id ? "Cupón actualizado con éxito" : "Cupón creado y publicado exitosamente", "success");
            setIsEditing(false);
            setCurrentCoupon(null);
            fetchData();
        } catch (err: any) {
            console.error("Error saving coupon:", err);
            showToast(err.message || "Error al procesar el cupón", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este cupón? Esta acción no se puede deshacer.")) return;

        const { error } = await supabase.from('cupones').delete().eq('id', id);
        if (error) {
            showToast("Error al eliminar", "error");
        } else {
            showToast("Cupón eliminado", "success");
            fetchData();
        }
    };

    const toggleStatus = async (id: string, current: boolean) => {
        const { error } = await supabase.from('cupones').update({ es_activo: !current }).eq('id', id);
        if (!error) {
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, es_activo: !current } : c));
        }
    };

    if (loading) return <LoadingTianguis />;

    if (userTier === 'free') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-5 md:p-8 bg-slate-50 dark:bg-card/10 rounded-2xl md:rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-border/50">
                <div className="bg-accent/10 p-8 rounded-[2.5rem] mb-8 text-accent animate-bounce-slow">
                    <Ticket size={64} strokeWidth={1} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter mb-4">Marketing <span className="text-accent">Potenciado</span></h1>
                <p className="text-slate-600 dark:text-muted max-w-md mb-12 font-medium leading-relaxed uppercase text-[10px] tracking-widest">
                    Crea cupones de descuento, segmenta a tus seguidores y dispara tus ventas. Exclusivo para miembros
                    <span className="text-slate-900 dark:text-foreground font-black mx-1">PRO</span> y <span className="text-accent font-black mx-1">PREMIUM</span>.
                </p>
                <Link href="/pricing" className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">
                    Mejorar Mi Plan <ArrowUpRight size={16} className="inline ml-2" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-20">
            {/* Header Elite: Architecture Style */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Marketing Engine v2.0</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-3 md:mb-4">
                            <span className="opacity-40">Cupones</span> <br />
                            <span className="text-blue-500 relative inline-block">
                                y Ofertas.
                                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                            </span>
                        </h1>
                        <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-[0.4em] opacity-60 ml-1">
                            Panel de conversión y lealtad
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="hidden xl:flex items-center gap-8 pr-8 border-r border-slate-200 dark:border-border/50">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-muted mb-1">Impacto Total</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-foreground tabular-nums">1.2M <span className="text-accent text-xs">MXN</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-muted mb-1">Cupones Activos</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-foreground tabular-nums">{coupons.filter(c => c.es_activo).length}</p>
                        </div>
                    </div>
                    {activeTab === 'cupones' && (
                        <button
                            onClick={() => { const newCp: Partial<Coupon> = { aplica_a: 'todos', nivel_objetivo: 'todos', es_activo: true }; setCurrentCoupon(newCp); setOriginalCoupon(newCp); setIsEditing(true); }}
                            className="group relative overflow-hidden bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-3"
                        >
                            <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <Plus size={18} strokeWidth={3} className="relative z-10 group-hover:text-white" />
                            <span className="relative z-10 group-hover:text-white pb-[1px]">Nuevo Cupón</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-10 border-b border-slate-200 dark:border-white/5 pb-0">
                <button 
                    onClick={() => setActiveTab('cupones')}
                    className={`pb-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'cupones' ? 'text-blue-500' : 'text-slate-400 hover:text-foreground'}`}
                >
                    Cupones y Ofertas
                    {activeTab === 'cupones' && <motion.div layoutId="activeTabMark" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
                </button>
                <button 
                    onClick={() => setActiveTab('bulk')}
                    className={`pb-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'bulk' ? 'text-emerald-500' : 'text-slate-400 hover:text-foreground'}`}
                >
                    Ofertas por Volumen (2x1, 3x2...)
                    {activeTab === 'bulk' && <motion.div layoutId="activeTabMark" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-full" />}
                </button>
                <button 
                    onClick={() => setActiveTab('negociacion')}
                    className={`pb-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'negociacion' ? 'text-amber-500' : 'text-slate-400 hover:text-foreground'}`}
                >
                    Mesa de Negociación
                    {activeTab === 'negociacion' && <motion.div layoutId="activeTabMark" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full" />}
                </button>
            </div>

            {activeTab === 'cupones' ? (
                <>
                    {/* Coupons Grid Content - (Already existing below, wrapped in this conditional) */}

            {/* Coupons Grid */}
            {coupons.length === 0 && !isEditing ? (
                <div className="py-20 md:py-40 text-center bg-foreground/[0.02] border border-border rounded-2xl md:rounded-[4rem] relative overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-accent">
                            <Ticket size={40} strokeWidth={1.5} className="rotate-12" />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter mb-4">Sin cupones</h3>
                        <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-[0.4em] max-w-sm mx-auto mb-12 opacity-50 leading-loose">
                            Crea tu primera estrategia de descuentos para incentivar las ventas de tus instrumentales y Sound Kits.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-10">
                    {coupons.map(coupon => {
                        const usagePercent = coupon.usos_maximos ? (coupon.usos_actuales / coupon.usos_maximos) * 100 : 0;
                        const isExpired = coupon.fecha_expiracion && new Date(coupon.fecha_expiracion) < new Date();

                        // Configuración de colores por Aplica A
                        const tierConfig = {
                            todos: { color: 'blue', label: 'Todos los Productos', bg: 'bg-blue-100 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-600 dark:text-blue-500' },
                            beats: { color: 'emerald', label: 'Solo Beats', bg: 'bg-emerald-100 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-500' },
                            sound_kits: { color: 'amber', label: 'Solo Sound Kits', bg: 'bg-amber-100 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-500' },
                            servicios: { color: 'purple', label: 'Solo Servicios', bg: 'bg-purple-100 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', text: 'text-purple-600 dark:text-purple-500' },
                            suscripciones: { color: 'slate', label: 'Suscripciones', bg: 'bg-slate-100 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-500/20', text: 'text-slate-600 dark:text-slate-500' }
                        }[coupon.aplica_a] || { color: 'accent', label: 'Unknown', bg: 'bg-accent/10', border: 'border-accent/20', text: 'text-accent' };

                        return (
                            <div key={coupon.id} className={`group relative bg-card border border-border rounded-[2.5rem] p-8 transition-all duration-700 hover:border-accent/40 hover:-translate-y-1 overflow-hidden ${(!coupon.es_activo || isExpired) && 'opacity-60 grayscale'}`}>

                                {/* Estética de Ticket: Recortes laterales */}
                                <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-slate-50 dark:bg-[#050508] border-r border-slate-200 dark:border-white/5 -translate-y-1/2 z-20" />
                                <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-slate-50 dark:bg-[#050508] border-l border-slate-200 dark:border-white/5 -translate-y-1/2 z-20" />

                                {/* Línea punteada de ticket */}
                                <div className="absolute bottom-[100px] left-8 right-8 h-px border-t border-dashed border-slate-300 dark:border-white/10 z-10" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="font-black text-3xl text-slate-900 dark:text-foreground tracking-[-0.05em] uppercase font-mono leading-none">{coupon.codigo}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${coupon.es_activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] opacity-60 dark:opacity-40">EXP: {coupon.fecha_expiracion ? new Date(coupon.fecha_expiracion).toLocaleDateString() : '∞'}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 ${tierConfig.bg} ${tierConfig.border} border ${tierConfig.text} rounded-xl text-base font-black tracking-widest uppercase`}>
                                                -{coupon.porcentaje_descuento}%
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-1 relative overflow-hidden group/item">
                                                <div className={`absolute top-0 right-0 w-8 h-8 ${tierConfig.bg} blur-xl opacity-0 group-hover/item:opacity-100 transition-opacity`} />
                                                <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] opacity-80 dark:opacity-50 text-center sm:text-left">Nivel Objetivo</p>
                                                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-900 dark:text-foreground">
                                                    <Users size={12} className={tierConfig.text} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                                        {coupon.nivel_objetivo === 'todos' ? 'Para todos' : coupon.nivel_objetivo === 'gratis' ? 'Usuarios Free' : `Usuarios ${coupon.nivel_objetivo}`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-1 relative overflow-hidden group/item">
                                                <div className={`absolute top-0 right-0 w-8 h-8 ${tierConfig.bg} blur-xl opacity-0 group-hover/item:opacity-100 transition-opacity`} />
                                                <p className="text-[8px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] opacity-80 dark:opacity-50 text-center sm:text-left">Aplicable a</p>
                                                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-900 dark:text-foreground">
                                                    <HardDrive size={12} className={tierConfig.text} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                                        {coupon.aplica_a === 'todos' ? 'Todos los productos' : coupon.aplica_a === 'beats' ? 'Solo Beats' :'Solo Sound Kits'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Usage Metrics */}
                                        <div className="bg-slate-100/50 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/10 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-xl font-black text-slate-900 dark:text-foreground tabular-nums">{coupon.usos_actuales}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 dark:text-muted uppercase tracking-widest opacity-80 dark:opacity-40">Usos realizados</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-900 dark:text-foreground tabular-nums">
                                                        {coupon.usos_maximos ? `${Math.round(usagePercent)}%` : '∞'}
                                                    </p>
                                                </div>
                                            </div>
                                            {coupon.usos_maximos && (
                                                <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ease-out ${usagePercent > 90 ? 'bg-rose-500' : `${tierConfig.bg.replace('/10', '').replace('bg-', 'bg-')}`}`}
                                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer (Alineado debajo de la línea punteada) */}
                                    <div className="mt-12 pt-0 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                active={coupon.es_activo}
                                                onChange={() => toggleStatus(coupon.id, coupon.es_activo)}
                                                activeColor="bg-emerald-500"
                                            />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${coupon.es_activo ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {coupon.es_activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setCurrentCoupon(coupon);
                                                    setOriginalCoupon(coupon);
                                                    setIsEditing(true);
                                                    fetchUsage(coupon.id);
                                                }}
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-accent hover:text-white transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
                                            >
                                                <Edit3 size={14} /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-400 hover:bg-rose-100 transition-all flex items-center justify-center flex-shrink-0 active:scale-95"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            </>
            ) : activeTab === 'bulk' ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Bulk Header */}
                    <div className="relative group overflow-hidden bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />

                        <div className="relative z-10 space-y-4 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-500">Estrategia de Volumen</h3>
                            </div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest max-w-xl leading-loose opacity-60">
                                Las ofertas bulk incentivan la compra masiva. Configura reglas donde, al comprar cierta cantidad de beats, el sistema descuente automáticamente los más económicos de la orden.
                            </p>
                        </div>
                        
                        <button
                            onClick={() => { setBulkForm({ venta_minima: 2, beats_gratis: 1 }); setShowNewBulkForm(true); }}
                            className="relative z-10 px-8 py-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-emerald-500/20 group/btn"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                            Nueva Regla
                        </button>
                    </div>

                    {/* ── FORM NUEVA REGLA BULK ── */}
                    <AnimatePresence>
                        {showNewBulkForm && (
                            <motion.div
                                initial={{ opacity: 0, y: -16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                className="bg-card border-2 border-emerald-500/30 rounded-[2.5rem] p-8 space-y-8"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-black uppercase tracking-tighter text-emerald-500">Nueva Oferta por Volumen</h4>
                                    <button onClick={() => setShowNewBulkForm(false)} className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-muted hover:text-foreground transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Presets rápidos */}
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3">Presets Rápidos</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[{ label: '2 × 1', vm: 2, bg: 1 }, { label: '3 × 2', vm: 3, bg: 1 }, { label: '4 × 3', vm: 4, bg: 1 }, { label: '5 × 3', vm: 5, bg: 2 }, { label: '10 × 7', vm: 10, bg: 3 }].map(p => (
                                            <button
                                                key={p.label}
                                                onClick={() => setBulkForm({ venta_minima: p.vm, beats_gratis: p.bg })}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bulkForm.venta_minima === p.vm && bulkForm.beats_gratis === p.bg ? 'bg-emerald-500 text-white' : 'bg-foreground/[0.05] border border-border text-muted hover:border-emerald-500/30 hover:text-foreground'}`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-muted">Beats mínimos para activar</label>
                                        <div className="bg-foreground/[0.03] border border-border rounded-2xl p-4 flex items-center gap-3">
                                            <Music size={16} className="text-muted shrink-0" />
                                            <input
                                                type="number"
                                                min={2} max={20}
                                                value={bulkForm.venta_minima}
                                                onChange={e => setBulkForm(f => ({ ...f, venta_minima: Math.max(2, parseInt(e.target.value) || 2) }))}
                                                className="w-full bg-transparent font-black text-2xl text-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-muted">Beats que se regalan</label>
                                        <div className="bg-foreground/[0.03] border border-border rounded-2xl p-4 flex items-center gap-3">
                                            <Zap size={16} className="text-emerald-500 shrink-0" />
                                            <input
                                                type="number"
                                                min={1} max={bulkForm.venta_minima - 1}
                                                value={bulkForm.beats_gratis}
                                                onChange={e => setBulkForm(f => ({ ...f, beats_gratis: Math.max(1, Math.min(f.venta_minima - 1, parseInt(e.target.value) || 1)) }))}
                                                className="w-full bg-transparent font-black text-2xl text-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 mb-1">Vista previa de la oferta</p>
                                    <p className="text-2xl font-black text-emerald-500 uppercase tracking-tighter">
                                        {bulkForm.venta_minima} × {bulkForm.venta_minima - bulkForm.beats_gratis}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted mt-1">
                                        Lleva {bulkForm.venta_minima} beats, paga solo {bulkForm.venta_minima - bulkForm.beats_gratis} — el/los {bulkForm.beats_gratis} más baratos son gratis
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={async () => {
                                            await handleSaveBulkDeal({ venta_minima: bulkForm.venta_minima, beats_gratis: bulkForm.beats_gratis, es_activa: true });
                                            setShowNewBulkForm(false);
                                        }}
                                        disabled={saving}
                                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        Guardar Regla
                                    </button>
                                    <button onClick={() => setShowNewBulkForm(false)} className="px-6 py-4 rounded-2xl border border-border text-muted font-black text-[10px] uppercase tracking-widest hover:border-foreground/30 hover:text-foreground transition-all">
                                        Cancelar
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── REGLAS EXISTENTES ── */}
                    {bulkDeals.length === 0 && !showNewBulkForm ? (
                        <div className="py-24 text-center bg-foreground/[0.01] border border-dashed border-border rounded-[3rem]">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-emerald-500">
                                <Zap size={28} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted opacity-40">Sin reglas configuradas</p>
                            <p className="text-[9px] font-bold text-muted opacity-25 mt-2 uppercase tracking-widest">Haz clic en "Nueva Regla" para comenzar</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {bulkDeals.map(deal => (
                                <div key={deal.id} className={`group relative bg-card border border-border rounded-[2.5rem] p-8 transition-all hover:border-emerald-500/30 ${!deal.es_activa && 'opacity-50 grayscale'}`}>
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${deal.es_activa ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                <p className="text-[8px] font-black uppercase tracking-widest text-muted">{deal.es_activa ? 'Activa' : 'Inactiva'}</p>
                                            </div>
                                            <h4 className="text-5xl font-black uppercase tracking-tighter">
                                                {deal.venta_minima}<span className="text-emerald-500">×</span>{deal.venta_minima - deal.beats_gratis}
                                            </h4>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteBulkDeal(deal.id)}
                                            className="w-10 h-10 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center active:scale-90"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="bg-foreground/[0.03] rounded-2xl p-4 border border-border/50">
                                                <p className="text-[7px] font-black uppercase tracking-widest text-muted mb-1">Compra mín.</p>
                                                <p className="text-3xl font-black text-foreground">{deal.venta_minima}</p>
                                            </div>
                                            <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
                                                <p className="text-[7px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Se regalan</p>
                                                <p className="text-3xl font-black text-emerald-500">{deal.beats_gratis}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-foreground/[0.02] rounded-2xl border border-border/50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted">Activar oferta</p>
                                            <Switch
                                                active={deal.es_activa}
                                                onChange={() => handleSaveBulkDeal({ ...deal, es_activa: !deal.es_activa })}
                                                activeColor="bg-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-border/40">
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-relaxed">
                                            Lleva <span className="text-foreground font-black">{deal.venta_minima}</span> beats de tu catálogo y paga solo <span className="text-emerald-500 font-black">{deal.venta_minima - deal.beats_gratis}</span>. Los {deal.beats_gratis} más baratos son gratis.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Negotiations Header */}
                    <div className="relative group overflow-hidden bg-amber-500/5 border border-amber-500/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                        <div className="relative z-10 space-y-4 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                                    <MessageCircle size={24} />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-amber-500">Mesa de Negociación</h3>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <button 
                                    onClick={() => setNegotiationType('ventas')}
                                    className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${negotiationType === 'ventas' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-foreground/5 text-muted hover:bg-foreground/10'}`}
                                >
                                    Propuestas Recibidas (Ventas)
                                </button>
                                <button 
                                    onClick={() => setNegotiationType('compras')}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${negotiationType === 'compras' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-foreground/5 text-muted hover:bg-foreground/10'}`}
                                >
                                    Mis Ofertas (Compras)
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/[0.03] border border-border rounded-2xl px-6 py-4 relative z-10">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-muted uppercase tracking-widest opacity-40">Pendientes</p>
                                <p className="text-xl font-black text-amber-500">
                                    {negotiationType === 'ventas' ? offers_selling.filter(o => o.estado === 'pendiente').length : offers_buying.filter(o => o.estado === 'pendiente').length}
                                </p>
                            </div>
                            <div className="w-px h-8 bg-border mx-2" />
                            <div className="text-right">
                                <p className="text-[9px] font-black text-muted uppercase tracking-widest opacity-40">Totales</p>
                                <p className="text-xl font-black">
                                    {negotiationType === 'ventas' ? offers_selling.length : offers_buying.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {(negotiationType === 'ventas' ? offers_selling : offers_buying).length === 0 ? (
                        <div className="py-24 text-center bg-foreground/[0.01] border border-dashed border-border rounded-[3rem]">
                            <div className="w-20 h-20 bg-muted/5 rounded-full flex items-center justify-center mx-auto mb-6 text-muted/20">
                                <DollarSign size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted opacity-30">No hay ofertas en esta categoría</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {(negotiationType === 'ventas' ? offers_selling : offers_buying).map((offer) => {
                                const person = negotiationType === 'ventas' ? offer.comprador : offer.productor;

                                return (
                                    <motion.div 
                                        key={offer.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/[0.02] hover:bg-white/[0.04] border border-border rounded-[2.5rem] p-8 transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] blur-[60px] rounded-full pointer-events-none" />
                                        
                                        <div className="flex flex-col lg:flex-row items-center gap-10">
                                            {/* Beat Info */}
                                            <div className="flex items-center gap-6 w-full lg:w-1/3">
                                                <div className="relative w-20 h-20 bg-black/40 rounded-2xl overflow-hidden border border-border shadow-xl shrink-0">
                                                    {offer.beats?.portada_url ? (
                                                        <Image src={offer.beats.portada_url} alt="Cover" fill sizes="80px" className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted"><Music size={24} /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-[13px] font-black uppercase tracking-tight text-foreground line-clamp-1">{offer.beats?.titulo}</h4>
                                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Licencia Exclusiva</p>
                                                    <div className="flex items-center gap-2 mt-2 opacity-50">
                                                        <Clock size={12} />
                                                        <span className="text-[9px] font-bold uppercase">{new Date(offer.fecha_creacion).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Counterparty Info */}
                                            <div className="flex items-center gap-4 w-full lg:w-1/4 pb-6 lg:pb-0 border-b lg:border-b-0 lg:border-l border-border lg:pl-10">
                                                <div className="relative w-12 h-12 bg-white/5 rounded-full overflow-hidden border border-border">
                                                    {person?.foto_perfil ? (
                                                        <Image src={person.foto_perfil} alt="User" fill sizes="48px" className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted"><User size={20} /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1">{negotiationType === 'ventas' ? 'Comprador' : 'Productor'}</p>
                                                    <h5 className="text-[12px] font-black uppercase">{person?.nombre_artistico || person?.nombre_usuario || 'Usuario'}</h5>
                                                </div>
                                            </div>

                                        {/* Offer Amount */}
                                        <div className="flex flex-col items-center lg:items-end flex-1">
                                            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1">Monto Ofertado</p>
                                            <h2 className="text-4xl font-black tracking-tighter text-amber-500">${offer.monto_ofertado}</h2>
                                            <p className="text-[10px] font-bold text-muted uppercase mt-1">MXN</p>
                                        </div>

                                        {/* Actions Wrapper */}
                                        <div className="flex flex-col gap-3 min-w-[180px]">
                                            <div className={`px-8 py-3.5 rounded-2xl text-center text-[10px] font-black uppercase tracking-[0.2em] border flex items-center justify-center gap-2 ${
                                                offer.estado === 'aceptada' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                                                offer.estado === 'rechazada' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 
                                                'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                            }`}>
                                                {offer.estado === 'aceptada' ? <Check size={12} /> : offer.estado === 'rechazada' ? <X size={12} /> : <Clock size={12} />}
                                                {offer.estado}
                                            </div>
                                            {negotiationType === 'compras' && offer.estado === 'aceptada' && (
                                                <Link href={`/${offer.productor?.nombre_usuario}`} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all text-center flex items-center justify-center gap-2">
                                                    <ShoppingBag size={14} /> Ir al Catálogo
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mini Chat & Actions */}
                                    <div className="mt-8 pt-8 border-t border-border grid lg:grid-cols-2 gap-10">
                                        {/* Chat side */}
                                        <div className="bg-foreground/[0.02] border border-border rounded-2xl overflow-hidden flex flex-col h-[300px]">
                                            <div className="bg-foreground/[0.03] p-3 border-b border-border text-center">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted">Historial de Mensajes</p>
                                            </div>
                                            <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                                                {(!offer.historial_chat || offer.historial_chat.length === 0) ? (
                                                    <div className="flex-1 flex items-center justify-center text-center opacity-30">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted">Sin mensajes aún.</p>
                                                    </div>
                                                ) : (
                                                    offer.historial_chat.map((msg: any, i: number) => {
                                                        const isMe = msg.sender === (negotiationType === 'ventas' ? 'productor' : 'comprador');
                                                        return (
                                                            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium ${isMe ? (negotiationType === 'ventas' ? 'bg-amber-500' : 'bg-blue-600') + ' text-white rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}>
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
                                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage(offer.id, negotiationType === 'ventas' ? 'productor' : 'comprador')}
                                                    className="flex-1 bg-foreground/[0.03] border border-border rounded-xl px-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-amber-500/50"
                                                />
                                                <button 
                                                    onClick={() => handleSendMessage(offer.id, negotiationType === 'ventas' ? 'productor' : 'comprador')}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all ${negotiationType === 'ventas' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Status & Context Actions side */}
                                        <div className="flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-2">Información del Trato</p>
                                                    <div className="flex justify-between items-baseline">
                                                        <p className="text-3xl font-black text-foreground">${offer.monto_ofertado} <span className="text-xs">MXN</span></p>
                                                        <p className="text-[10px] font-bold text-muted uppercase">Monto Actual</p>
                                                    </div>
                                                    {offer.mensaje_comprador && (
                                                            <p className="mt-4 text-[11px] font-medium text-muted leading-relaxed italic opacity-70">
                                                                "{offer.mensaje_comprador}"
                                                            </p>
                                                    )}
                                                </div>

                                                {/* Buyer-specific counter-offer UI */}
                                                {negotiationType === 'compras' && offer.estado === 'rechazada' && (
                                                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 mt-2">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-3 flex items-center gap-1.5">
                                                            <AlertCircle size={12} /> La oferta fue rechazada. ¿Intentar otro monto?
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
                                                                className="px-6 bg-foreground text-background font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                                            >
                                                                {updatingAmount === offer.id ? '...' : 'Re-enviar'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3 mt-6">
                                                {negotiationType === 'ventas' && offer.estado === 'pendiente' ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button
                                                                onClick={() => handleOfferAction(offer.id, 'aceptada')}
                                                                disabled={processingOfferId === offer.id}
                                                                className="px-6 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                                            >
                                                                {processingOfferId === offer.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                                Aceptar Oferta
                                                            </button>
                                                            <button
                                                                onClick={() => handleOfferAction(offer.id, 'rechazada')}
                                                                disabled={processingOfferId === offer.id}
                                                                className="px-6 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                {processingOfferId === offer.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                        {/* Contraoferta: responde con tu propio monto y la pelota vuelve al comprador */}
                                                        <div className="flex gap-2 items-center pt-1">
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-black">$</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Tu contraoferta"
                                                                    value={newAmountDrafts[offer.id] || ''}
                                                                    onChange={e => setNewAmountDrafts(prev => ({ ...prev, [offer.id]: Number(e.target.value) }))}
                                                                    className="w-full bg-card border border-border rounded-xl py-3 pl-8 pr-4 text-xs font-black uppercase tracking-widest focus:outline-none"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleCounterOffer(offer.id)}
                                                                disabled={updatingAmount === offer.id}
                                                                className="px-6 py-3 bg-foreground text-background font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                                            >
                                                                {updatingAmount === offer.id ? '...' : <><Send size={12} /> Contraofertar</>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`w-full py-4 rounded-2xl text-center text-[11px] font-black uppercase tracking-[0.3em] border flex items-center justify-center gap-3 ${
                                                        offer.estado === 'aceptada' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 
                                                        offer.estado === 'rechazada' ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' : 
                                                        'bg-amber-500/5 border-amber-500/20 text-amber-500'
                                                    }`}>
                                                        {offer.estado === 'aceptada' ? <ShieldCheck size={18} /> : offer.estado === 'rechazada' ? <AlertCircle size={18} /> : <Clock size={18} />}
                                                        Oferta {offer.estado}
                                                    </div>
                                                )}
                                                <p className="text-[8px] font-bold text-muted text-center uppercase tracking-widest opacity-40">
                                                    ID: {offer.id.split('-')[0]}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )})}
                        </div>
                    )}
                </div>
            )}

            {/* Editing Modal Elite: Market Engine Style */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-white/5 dark:bg-black/5" onClick={() => { setIsEditing(false); setCurrentCoupon(null); setOriginalCoupon(null); setCouponUses([]); }} />

                    <div className="relative bg-white dark:bg-[#08080a] border border-border dark:border-white/10 w-full max-w-4xl rounded-[3.5rem] p-8 md:p-12 overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col md:flex-row gap-10 shadow-2xl shadow-black/20">
                        {/* Environmental Glow */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />

                        {/* Close button - Red style as requested */}
                        <button
                            onClick={() => { setIsEditing(false); setCurrentCoupon(null); setOriginalCoupon(null); setCouponUses([]); }}
                            className="absolute top-8 right-8 w-12 h-12 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-full flex items-center justify-center text-foreground dark:text-white hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all active:scale-90 z-20"
                        >
                            <X size={20} />
                        </button>

                        {/* Left Side: Form */}
                        <div className="flex-1 space-y-8 relative z-10 overflow-y-auto pr-4 custom-scrollbar">
                            <header className="mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Market Engine</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground dark:text-white leading-none">
                                    {currentCoupon?.id ? 'Editar' : 'Crear'} <br />
                                    <span className="text-accent underline decoration-accent/10 underline-offset-8">Cupón.</span>
                                </h2>
                            </header>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Código Promocional</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                                <Ticket size={18} />
                                            </div>
                                            <input
                                                required
                                                value={currentCoupon?.codigo || ''}
                                                onChange={e => setCurrentCoupon({ ...currentCoupon, codigo: e.target.value.toUpperCase() })}
                                                placeholder="EJ. VERANO50"
                                                className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all uppercase tracking-[0.2em] placeholder:text-muted/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Descuento (%)</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                                <Percent size={18} />
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                required
                                                value={currentCoupon?.porcentaje_descuento || ''}
                                                onChange={e => setCurrentCoupon({ ...currentCoupon, porcentaje_descuento: parseInt(e.target.value) })}
                                                className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-12 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all tabular-nums"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1 text-accent">Texto Promo (Opcional)</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                                <Info size={16} />
                                            </div>
                                            <input
                                                value={currentCoupon?.texto_descuento || ''}
                                                onChange={e => setCurrentCoupon({ ...currentCoupon, texto_descuento: e.target.value })}
                                                placeholder="EJ. ENVÍO GRATIS"
                                                className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-[10px] outline-none focus:border-accent transition-all uppercase tracking-widest placeholder:opacity-20"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Uso Límite</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                                <Users size={18} />
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={currentCoupon?.usos_maximos || ''}
                                                onChange={e => setCurrentCoupon({ ...currentCoupon, usos_maximos: e.target.value ? Number(e.target.value) : null })}
                                                placeholder="Vacío = Ilimitado"
                                                className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-12 font-bold text-foreground dark:text-white text-sm outline-none focus:border-accent transition-all tabular-nums placeholder:text-muted/40"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Segmento Objetivo</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                                <Target size={18} />
                                            </div>
                                            <select
                                                value={currentCoupon?.nivel_objetivo || 'todos'}
                                                onChange={e => setCurrentCoupon({ ...currentCoupon, nivel_objetivo: e.target.value as any })}
                                                className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-[10px] outline-none focus:border-accent transition-all uppercase tracking-widest appearance-none cursor-pointer"
                                            >
                                                <option value="todos">Para Todos</option>
                                                <option value="gratis">Solo Usuarios FREE</option>
                                                <option value="pro">Solo Usuarios PRO</option>
                                                <option value="premium">Solo Usuarios PREMIUM</option>
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-muted/30 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1 text-center block">Tipo de Producto</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'todos', label: 'Todos' },
                                                { id: 'beats', label: 'Beats' },
                                                { id: 'sound_kits', label: 'Sound Kits' }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setCurrentCoupon({ ...currentCoupon, aplica_a: type.id as any })}
                                                    className={`px-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${currentCoupon?.aplica_a === type.id
                                                        ? 'border-accent bg-accent text-white'
                                                        : 'border-border dark:border-white/5 bg-foreground/5 dark:bg-white/5 text-muted hover:border-accent/30'}`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {currentCoupon?.aplica_a === 'suscripciones' && (
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">Stripe Promotion ID (Opcional)</label>
                                            <div className="relative group">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors">
                                                    <CreditCard size={18} />
                                                </div>
                                                <input
                                                    value={currentCoupon?.id_cupon_stripe || ''}
                                                    onChange={e => setCurrentCoupon({ ...currentCoupon, id_cupon_stripe: e.target.value })}
                                                    placeholder="promo_..."
                                                    className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-[10px] outline-none focus:border-accent transition-all placeholder:text-muted/20"
                                                />
                                            </div>
                                            <p className="text-[8px] font-bold text-muted uppercase tracking-wider ml-1 mt-1">Este ID es necesario para que Stripe aplique el descuento en suscripciones.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 ml-1">
                                        Fecha de Expiración <span className="text-muted/40 lowercase ml-2 font-bold">(vacío no expira)</span>
                                    </label>
                                    <div
                                        className="relative group cursor-pointer"
                                        onClick={(e) => {
                                            const input = (e.currentTarget as HTMLElement).querySelector('input');
                                            if (input && 'showPicker' in input) {
                                                try { input.showPicker(); } catch (e) { console.error(e); }
                                            }
                                        }}
                                    >
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-accent transition-colors pointer-events-none z-10">
                                            <Calendar size={18} />
                                        </div>
                                        <input
                                            type="datetime-local"
                                            value={currentCoupon?.fecha_expiracion ? currentCoupon.fecha_expiracion.slice(0, 16) : ''}
                                            onChange={e => setCurrentCoupon({ ...currentCoupon, fecha_expiracion: e.target.value })}
                                            className="w-full h-14 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl pl-14 pr-6 font-bold text-foreground dark:text-white text-[10px] outline-none focus:border-accent transition-all cursor-pointer relative z-0 [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-6 bg-accent/5 border border-accent/20 rounded-2xl">
                                    <ShieldCheck size={20} className="text-accent" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/80 leading-relaxed">
                                        Asegúrate de que tus términos de promoción sean claros para tus clientes antes de activar este código.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full h-16 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 active:scale-95 group/btn mt-8"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : (currentCoupon?.id ? <CheckCircle2 size={16} /> : <Plus size={16} />)}
                                    {saving ? 'PROCESANDO...' : (currentCoupon?.id ? 'Guardar Cambios' : 'Desplegar Cupón')}
                                </button>
                            </form>
                        </div>

                        {/* Right Side: Usage History */}
                        {currentCoupon?.id && (
                            <div className="flex-1 bg-slate-50 dark:bg-[#08080a] border border-border dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20">
                                            <BarChart3 size={20} />
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-foreground dark:text-white">Uso del Cupón</h3>
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{currentCoupon.usos_actuales} TOTAL</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {loadingUses ? (
                                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" /></div>
                                    ) : couponUses.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                            <Clock size={32} className="text-muted/20" />
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted max-w-[180px]">Este cupón aún no ha sido utilizado.</p>
                                        </div>
                                    ) : (
                                        couponUses.map((use, idx) => (
                                            <div key={idx} className="bg-white dark:bg-white/5 border border-border dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
                                                <div className="relative w-16 h-16 shrink-0 bg-white rounded-2xl flex items-center justify-center border border-border p-1.5">
                                                    {use.perfiles?.foto_perfil ? (
                                                        <Image src={use.perfiles.foto_perfil} fill sizes="64px" className="object-cover" alt="User" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-white">{use.perfiles?.nombre_artistico?.[0] || '?'}</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-[10px] font-black text-foreground dark:text-white truncate uppercase tracking-tight">{use.perfiles?.nombre_artistico || 'Usuario Desconocido'}</p>
                                                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-60">@{use.perfiles?.nombre_usuario || '...'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black tabular-nums text-foreground dark:text-white">
                                                        {new Date(use.fecha_uso).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-[7px] font-bold text-muted uppercase tracking-[0.2em]">{new Date(use.fecha_uso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-border">
                                    <div className="flex items-center gap-3 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                                        <Mail size={16} className="text-orange-500/60" />
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-orange-500/80 leading-relaxed">
                                            Data estratégica para tus campañas.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
