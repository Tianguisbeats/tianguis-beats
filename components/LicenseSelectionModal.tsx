"use client";

import React from 'react';
import { X, Music, Check, ShoppingCart, ShieldCheck, Zap, Layers, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Beat } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';

interface LicenseSelectionModalProps {
    beat: Beat | any;
    isOpen: boolean;
    onClose: () => void;
}

export default function LicenseSelectionModal({ beat, isOpen, onClose }: LicenseSelectionModalProps) {
    const router = useRouter();
    const { addItem } = useCart();

    // Define all possible licenses
    const allLicenses = [
        {
            id: 'MP3',
            name: 'Licencia MP3',
            price: beat.price_mxn || 299,
            features: [
                'Archivo MP3 de alta calidad (320kbps)',
                'Derechos de streaming (hasta 10k)',
                'Uso básico en videos de YouTube',
                'Perfecto para maquetas y demos'
            ],
            icon: <Music size={20} />,
            color: 'accent',
            isActive: beat.is_mp3_active !== false
        },
        {
            id: 'WAV',
            name: 'Licencia WAV',
            price: beat.price_wav_mxn || Math.ceil((beat.price_mxn || 299) * 2),
            features: [
                'Archivos WAV + MP3 incluidos',
                'Uso comercial extendido offline/online',
                'Derechos de streaming (hasta 50k)',
                'Calidad de estudio profesional'
            ],
            icon: <Zap size={20} />,
            color: 'emerald',
            isActive: beat.is_wav_active
        },
        {
            id: 'STEMS',
            name: 'Licencia STEMS',
            price: beat.price_stems_mxn || Math.ceil((beat.price_mxn || 299) * 3),
            features: [
                'Pistas separadas (Audio Stems)',
                'Control total sobre la mezcla final',
                'Streaming ilimitado permitido',
                'Ideal para ingeniería de sonido Pro'
            ],
            icon: <Layers size={20} />,
            color: 'purple',
            isActive: beat.is_stems_active
        },
        {
            id: 'ILIMITADA',
            name: 'Licencia EXCLUSIVA',
            price: beat.exclusive_price_mxn || 5000,
            features: [
                'Propiedad total y exclusiva del beat',
                'El beat se retira de la tienda tras compra',
                'Uso comercial ilimitado en todo el mundo',
                'Contrato de transferencia legal incluido'
            ],
            icon: <Crown size={20} />,
            color: 'amber',
            isActive: beat.is_exclusive_active
        }
    ];

    // Filter only active licenses
    const activeLicenses = beat.is_sold ? [] : allLicenses.filter(l => l.isActive);

    const [selectedType, setSelectedType] = React.useState<string>('');
    const [producerInfo, setProducerInfo] = React.useState<any>(null);

    // Initial state for selected type
    React.useEffect(() => {
        if (activeLicenses.length > 0 && !selectedType) {
            setSelectedType(activeLicenses[0].id);
        }
    }, [activeLicenses]);

    // Fetch producer info if missing
    React.useEffect(() => {
        if (isOpen && beat.producer_id) {
            const fetchProducer = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('artistic_name, username, foto_perfil, is_verified, is_founder')
                    .eq('id', beat.producer_id)
                    .single();
                if (data) setProducerInfo(data);
            };
            fetchProducer();
        }
    }, [isOpen, beat.producer_id]);

    if (!isOpen) return null;

    const handleAddToCart = () => {
        const license = allLicenses.find(l => l.id === selectedType);
        if (!license) return;

        addItem({
            id: `${beat.id}-${selectedType}`,
            type: 'beat',
            name: `${beat.title} [${selectedType}]`,
            price: license.price,
            image: beat.portadabeat_url || undefined,
            subtitle: `Prod. by ${producerInfo?.artistic_name || beat.producer_artistic_name || beat.producer_username || 'Tianguis Producer'}`,
            metadata: {
                licenseType: selectedType.toLowerCase(),
                beatId: beat.id,
                producer_id: beat.producer_id,
                producer_name: producerInfo?.artistic_name || beat.producer_artistic_name,
                mp3_url: beat.mp3_url,
                wav_url: beat.wav_url,
                stems_url: beat.stems_url
            }
        });

        onClose();
        router.push('/cart');
    };

    const currentLicense: any = allLicenses.find(l => l.id === selectedType) || (activeLicenses.length > 0 ? activeLicenses[0] : allLicenses[0]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-slate-950 w-full max-w-5xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in slide-in-from-bottom-12 duration-700 border border-white/10 flex flex-col lg:flex-row min-h-[600px]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-black dark:hover:bg-white dark:hover:text-black rounded-full transition-all z-50 group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>

                {/* LEFT PANEL: Specs & Producer Info */}
                <div className="lg:w-[40%] bg-slate-50 dark:bg-slate-900 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/5 order-2 lg:order-1">
                    <div className="space-y-10">
                        {/* Producer Card */}
                        <div className="flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                {producerInfo?.foto_perfil || beat.producer_foto_perfil ? (
                                    <img src={producerInfo?.foto_perfil || beat.producer_foto_perfil} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Music size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-heading font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                    {producerInfo?.artistic_name || beat.producer_artistic_name || 'Tianguis Producer'}
                                    {(producerInfo?.is_verified || beat.producer_is_verified) && (
                                        <img src="/verified-badge.png" className="w-4 h-4 object-contain shrink-0" alt="V" />
                                    )}
                                    {(producerInfo?.is_founder || beat.producer_is_founder) && (
                                        <Crown size={14} className="text-amber-500 shrink-0" fill="currentColor" />
                                    )}
                                </h4>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest truncate">
                                    @{producerInfo?.username || beat.producer_username || 'producer'}
                                </p>
                            </div>
                        </div>

                        {/* Beat Artwork & Specs */}
                        <div className="space-y-6">
                            <div className="aspect-square w-full rounded-3xl overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-xl border border-white/10 group">
                                {beat.portadabeat_url || beat.portada_url ? (
                                    <img src={beat.portadabeat_url || beat.portada_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-10">
                                        <Music size={80} />
                                    </div>
                                )}
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">
                                {beat.title}
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                <SpecItem label="Género" value={beat.genre} />
                                <SpecItem label="BPM" value={`${beat.bpm} BPM`} />
                                <SpecItem label="Nota" value={beat.musical_key} />
                                <SpecItem label="Escala" value={beat.musical_scale} />
                                <SpecItem label="Mood" value={beat.mood} />
                                <SpecItem label="Beat Type" value={Array.isArray(beat.beat_types) ? beat.beat_types[0] : (beat.beat_types || 'Original')} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3 text-slate-400 dark:text-slate-500">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tianguis Safe Checkout</span>
                    </div>
                </div>

                {/* RIGHT PANEL: License Selection */}
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-between order-1 lg:order-2 bg-white dark:bg-slate-950">
                    <div className="space-y-10">
                        <header>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 italic">Licencias Disponibles</h2>
                            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Escala tu sonido al siguiente nivel</p>
                        </header>

                        {/* Interactive List */}
                        <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {allLicenses.filter(l => l.isActive).map((lic) => {
                                const isSelected = selectedType === lic.id;
                                return (
                                    <button
                                        key={lic.id}
                                        onClick={() => setSelectedType(lic.id)}
                                        className={`w-full group px-6 py-5 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between ${isSelected
                                                ? 'bg-accent/5 border-accent shadow-2xl shadow-accent/10 scale-[1.02]'
                                                : 'border-slate-100 dark:border-white/5 hover:border-accent/40 bg-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-accent text-white rotate-6' : 'bg-slate-100 dark:bg-white/5 text-muted'
                                                }`}>
                                                {lic.icon}
                                            </div>
                                            <div>
                                                <h5 className={`font-black uppercase tracking-widest text-[11px] ${isSelected ? 'text-accent' : 'text-slate-900 dark:text-white'}`}>
                                                    {lic.name}
                                                </h5>
                                                <p className="text-[10px] font-bold text-muted">Contrato profesional</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] font-black text-muted opacity-50">MXN</span>
                                                <p className={`text-2xl font-black italic ${isSelected ? 'text-accent' : 'text-slate-900 dark:text-white'}`}>
                                                    ${lic.price}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dynamic Feature Box */}
                        {currentLicense && (
                            <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                <h6 className="text-[10px] font-black uppercase text-accent tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Zap size={14} fill="currentColor" /> Beneficios de la licencia {currentLicense.id}:
                                </h6>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentLicense.features.map((f: string, i: number) => (
                                        <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button
                            onClick={handleAddToCart}
                            disabled={!selectedType || beat.is_sold}
                            className={`flex-1 flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] transition-all duration-300 active:scale-95 shadow-2xl ${beat.is_sold
                                    ? 'bg-red-500/10 text-red-500 cursor-not-allowed border border-red-500/20 shadow-none'
                                    : 'bg-accent text-white hover:bg-black dark:hover:bg-white dark:hover:text-black shadow-accent/30'
                                }`}
                        >
                            {beat.is_sold ? (
                                <>AGOTADO / SOLD OUT</>
                            ) : (
                                <>
                                    <ShoppingCart size={20} />
                                    Añadir al Carrito
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpecItem({ label, value }: { label: string; value: string | number }) {
    if (!value) return null;
    return (
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1 leading-none">{label}</p>
            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{value}</p>
        </div>
    );
}
