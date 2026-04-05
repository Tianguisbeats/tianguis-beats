"use client";

import React from 'react';
import { X, Music, Check, ShoppingCart, ShieldCheck, Zap, Layers, Crown, FileText, Package, CreditCard, Scale, AlertCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Beat } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useCurrency } from '@/context/CurrencyContext';
import { LICENSE_PLANS, LicensePlan, LicensePlanId } from '@/lib/licensePlans';

interface LicenseSelectionModalProps {
    beat: Beat | any;
    isOpen: boolean;
    onClose: () => void;
}

const PLAN_ICON: Record<LicensePlanId, React.ReactNode> = {
    Gratis: <FileText size={20} />,
    Básica: <FileText size={20} />,
    Pro: <Zap size={20} />,
    Premium: <Package size={20} />,
    Exclusiva: <Crown size={20} />,
    'Exclusiva Premium': <Crown size={20} />,
};

const PLAN_COLOR_CLASSES: Record<string, { ring: string; text: string; bg: string }> = {
    muted: { ring: 'border-border', text: 'text-muted', bg: 'bg-foreground/5' },
    blue: { ring: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/5' },
    indigo: { ring: 'border-indigo-500', text: 'text-indigo-500', bg: 'bg-indigo-500/5' },
    emerald: { ring: 'border-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/5' },
    rose: { ring: 'border-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/5' },
    purple: { ring: 'border-purple-500', text: 'text-purple-500', bg: 'bg-purple-500/5' },
};

export default function LicenseSelectionModal({ beat, isOpen, onClose }: LicenseSelectionModalProps) {
    const router = useRouter();
    const { addItem, isInCart, setIsCartOpen } = useCart();
    const { showToast } = useToast();
    const { formatPrice } = useCurrency();

    // Map beat prices from DB onto the canonical plan list
    const livePrices: Record<LicensePlanId, number> = {
        Gratis: 0,
        Básica: beat.precio_basica_mxn ?? 299,
        Pro: beat.precio_pro_mxn ?? 599,
        Premium: beat.precio_premium_mxn ?? 999,
        Exclusiva: beat.precio_exclusiva_estandar_mxn ?? 4999,
        'Exclusiva Premium': beat.precio_exclusiva_premium_mxn ?? 9999,
    };

    const isActive: Record<LicensePlanId, boolean> = {
        Gratis: false, // No se vende, es descarga directa
        Básica: beat.es_mp3_activa !== false,
        Pro: beat.es_pro_activa !== false,
        Premium: beat.es_premium_activa !== false,
        Exclusiva: beat.es_exclusiva_estandar_activa !== false && !beat.esta_vendido,
        'Exclusiva Premium': beat.es_exclusiva_premium_activa !== false && !beat.esta_vendido,
    };

    // Plans shown in modal (no Gratis, only active ones)
    const availablePlans: LicensePlan[] = LICENSE_PLANS.filter(
        p => p.id !== 'Gratis' && isActive[p.id]
    );

    const [selectedId, setSelectedId] = React.useState<LicensePlanId | ''>('');
    const [producerInfo, setProducerInfo] = React.useState<any>(null);
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (availablePlans.length > 0 && !selectedId) {
            setSelectedId(availablePlans[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availablePlans.length]);

    React.useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            const prodId = beat.productor_id;
            if (prodId) {
                const { data } = await supabase
                    .from('perfiles')
                    .select('nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador')
                    .eq('id', prodId)
                    .single();
                if (data) setProducerInfo(data);
            }
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) setCurrentUserId(session.user.id);
        };
        fetchData();
    }, [isOpen, beat.productor_id]);

    if (!isOpen) return null;

    const currentPlan = LICENSE_PLANS.find(p => p.id === selectedId) ?? availablePlans[0];
    const colorCls = PLAN_COLOR_CLASSES[currentPlan?.color ?? 'muted'];

    const handleAddToCart = () => {
        if (!currentPlan) return;
        const price = livePrices[currentPlan.id];

        const wasAdded = addItem({
            id: `${beat.id}-${currentPlan.id}`,
            type: 'beat',
            name: `${beat.titulo || beat.title} [${currentPlan.id}]`,
            price,
            image: beat.portada_url ?? undefined,
            subtitle: `Prod. by ${beat.productor_nombre_artistico ?? beat.productor_nombre_usuario}`,
            metadata: {
                licenseType: currentPlan.id,
                beatId: beat.id,
                productor_id: beat.productor_id,
                producer_name: beat.productor_nombre_artistico ?? beat.productor_nombre_usuario,
                mp3_url: beat.archivo_muestra_url ?? beat.archivo_mp3_url,
                wav_url: beat.archivo_wav_url,
                stems_url: beat.archivo_stems_url,
            }
        });

        if (wasAdded) {
            setIsCartOpen(true);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/95 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />

            <div className="relative bg-card w-full max-w-5xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in slide-in-from-bottom-12 duration-700 border border-white/10 flex flex-col lg:flex-row min-h-[600px]">

                {/* Close */}
                <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-muted/10 text-muted hover:bg-foreground hover:text-background rounded-full transition-all z-50 group">
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>

                {/* ── LEFT PANEL: Beat Info ── */}
                <div className="lg:w-[40%] bg-background p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border order-2 lg:order-1">
                    <div className="space-y-6">
                        {/* Art */}
                        <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-muted/10 shadow-xl border border-white/10 group">
                            {beat.portada_url ? (
                                <Image src={beat.portada_url} fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt={beat.titulo} sizes="(max-width: 768px) 100vw, 50vw" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-10"><Music size={80} /></div>
                            )}
                        </div>

                        <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">{beat.titulo}</h3>

                        {/* Producer row */}
                        <div className="flex items-center gap-4 p-4 rounded-3xl bg-card border border-border">
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-muted/10 shrink-0">
                                {(producerInfo?.foto_perfil || beat.productor_foto_perfil) ? (
                                    <Image src={producerInfo?.foto_perfil || beat.productor_foto_perfil} fill className="object-cover" alt="Producer" sizes="32px" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted"><Music size={24} /></div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-foreground flex items-center gap-2 truncate">
                                    {producerInfo?.nombre_artistico || beat.productor_nombre_artistico || 'Productor'}
                                    {(producerInfo?.esta_verificado || beat.productor_esta_verificado) && (
                                        <span className="bg-blue-500 text-white rounded-full p-0.5"><Check size={8} strokeWidth={4} /></span>
                                    )}
                                    {(producerInfo?.es_fundador || beat.productor_es_fundador) && (
                                        <Crown size={14} className="text-amber-500" fill="currentColor" />
                                    )}
                                </h4>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest truncate">
                                    @{producerInfo?.nombre_usuario || beat.productor_nombre_usuario || 'tianguis'}
                                </p>
                            </div>
                        </div>

                        {/* Beat specs */}
                        <div className="grid grid-cols-2 gap-2">
                            <SpecItem label="Género" value={beat.genero} />
                            <SpecItem label="BPM" value={`${beat.bpm} BPM`} />
                            <SpecItem label="Tono / Escala" value={beat.tono_escala} />
                            <SpecItem label="Mood" value={beat.vibras} />
                            <SpecItem label="Tipo" value={Array.isArray(beat.tipos_beat) ? beat.tipos_beat[0] : (beat.tipos_beat || 'Original')} />
                        </div>
                    </div>

                    {/* Trust footer */}
                    <div className="mt-8 space-y-3">
                        <div className="flex items-center gap-3 text-muted">
                            <ShieldCheck size={16} className="text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tianguis Safe Checkout · Stripe PCI DSS</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted">
                            <Scale size={16} className="text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                Licencias bajo LFDA México ·{' '}
                                <Link href="/licencias" target="_blank" className="text-accent hover:underline">
                                    Ver contratos completos
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL: License Selection ── */}
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-between order-1 lg:order-2 bg-card">
                    <div className="space-y-8">
                        <header>
                            <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-1">Elige tu Licencia</h2>
                            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Contrato legal inmediato · Ley Federal del Derecho de Autor</p>
                        </header>

                        {/* Plan selector */}
                        <div className="grid gap-3 max-h-[380px] overflow-y-auto px-1 custom-scrollbar py-1">
                            {availablePlans.map((plan) => {
                                const isSelected = selectedId === plan.id;
                                const cls = PLAN_COLOR_CLASSES[plan.color];
                                const price = livePrices[plan.id];
                                return (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedId(plan.id)}
                                        className={`w-full px-5 py-4 rounded-[1.75rem] border-2 transition-all text-left flex items-center justify-between ${isSelected
                                            ? `${cls.bg} ${cls.ring} shadow-lg scale-[1.01]`
                                            : 'border-border hover:border-accent/40 bg-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isSelected ? `bg-gradient-to-br from-foreground/10 to-foreground/5 ${cls.text}` : 'bg-muted/10 text-muted'}`}>
                                                {PLAN_ICON[plan.id]}
                                            </div>
                                            <div>
                                                <h5 className={`font-black uppercase tracking-widest text-[11px] ${isSelected ? cls.text : 'text-foreground'}`}>
                                                    {plan.name}
                                                </h5>
                                                <p className="text-[9px] font-bold text-muted">{plan.formato}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p className={`text-xl font-black ${isSelected ? cls.text : 'text-foreground'}`}>
                                                {formatPrice(price)}
                                            </p>
                                            <p className="text-[8px] font-black text-muted uppercase tracking-widest">{plan.streams}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected plan features */}
                        {currentPlan && (
                            <div className={`p-6 rounded-[2rem] border animate-in fade-in slide-in-from-top-4 duration-500 ${colorCls.bg} ${colorCls.ring}`}>
                                <h6 className={`text-[9px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${colorCls.text}`}>
                                    <Zap size={12} fill="currentColor" /> Incluye con la licencia {currentPlan.id}:
                                </h6>
                                <ul className="grid grid-cols-1 gap-2">
                                    {currentPlan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-[11px] font-bold text-foreground">
                                            <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={9} strokeWidth={4} />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* Special negotiation note for Exclusiva Estándar */}
                                {currentPlan.id === 'Exclusiva' && (
                                    <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-start gap-2 text-[9px] font-bold text-purple-500/70">
                                        <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                        Para negociaciones especiales (Content ID / Sincronización en TV o cine), contacta directamente al productor o escribe a{' '}
                                        <a href="mailto:legal@tianguisbeats.com" className="underline">legal@tianguisbeats.com</a>
                                    </div>
                                )}

                                {/* Special negotiation note for Exclusiva Premium */}
                                {currentPlan.id === 'Exclusiva Premium' && (
                                    <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-start gap-2 text-[9px] font-bold text-rose-500/70">
                                        <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                        Para negociaciones especiales (Content ID / Sincronización en TV o cine), contacta directamente al productor o escribe a{' '}
                                        <a href="mailto:legal@tianguisbeats.com" className="underline">legal@tianguisbeats.com</a>
                                    </div>
                                )}

                                <Link href="/licencias" target="_blank" className={`mt-4 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${colorCls.text} hover:underline`}>
                                    <ExternalLink size={10} /> Leer contrato completo en /licencias
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Add to Cart */}
                    <div className="mt-8">
                        <button
                            onClick={handleAddToCart}
                            disabled={!selectedId || beat.esta_vendido || beat.is_sold}
                            className={`w-full flex items-center justify-center gap-4 py-5 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] transition-all duration-300 active:scale-95 shadow-2xl ${beat.esta_vendido || beat.is_sold
                                ? 'bg-red-500/10 text-red-500 cursor-not-allowed border border-red-500/20 shadow-none'
                                : 'bg-accent text-white hover:bg-foreground hover:text-background shadow-accent/30'
                                }`}
                        >
                            {beat.esta_vendido || beat.is_sold ? (
                                <>AGOTADO / SOLD OUT</>
                            ) : (
                                <>
                                    <ShoppingCart size={18} />
                                    Añadir al Carrito
                                </>
                            )}
                        </button>
                        <p className="text-[8px] font-bold text-muted text-center mt-3 uppercase tracking-widest opacity-50">
                            Al comprar aceptas los <Link href="/terms" target="_blank" className="underline hover:text-accent">Términos de Servicio</Link> y el <Link href="/licencias" target="_blank" className="underline hover:text-accent">Acuerdo de Licencia</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpecItem({ label, value }: { label: string; value: string | number }) {
    if (!value) return null;
    return (
        <div className="p-3 rounded-2xl bg-card border border-border">
            <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1 leading-none">{label}</p>
            <p className="text-[11px] font-black text-foreground truncate">{value}</p>
        </div>
    );
}
