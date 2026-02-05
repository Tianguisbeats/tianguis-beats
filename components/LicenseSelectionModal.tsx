"use client";

import React from 'react';
import { X, Music, Check, ShoppingCart, ShieldCheck, Zap, Layers, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Beat } from '@/lib/types';
import { useCart } from '@/context/CartContext';

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
            features: ['MP3 de alta calidad (HQ)', 'Hasta 10,000 reproducciones', 'Uso en plataformas digitales'],
            icon: <Music size={20} />,
            color: 'blue',
            isActive: beat.is_mp3_active !== false // Default true if not specified
        },
        {
            id: 'WAV',
            name: 'Licencia WAV',
            price: beat.price_wav_mxn || Math.ceil((beat.price_mxn || 299) * 2),
            features: ['Archivos WAV + MP3', 'Uso comercial ilimitado', 'Calidad de estudio profesional'],
            icon: <Zap size={20} />,
            color: 'emerald',
            isActive: beat.is_wav_active
        },
        {
            id: 'STEMS',
            name: 'Licencia STEMS',
            price: beat.price_stems_mxn || Math.ceil((beat.price_mxn || 299) * 3),
            features: ['Pistas separadas (Stems)', 'Control total sobre la mezcla', 'Ideal para ingeniería Pro'],
            icon: <Layers size={20} />,
            color: 'purple',
            isActive: beat.is_stems_active
        },
        {
            id: 'ILIMITADA',
            name: 'Licencia EXCLUSIVA',
            price: beat.exclusive_price_mxn || 5000,
            features: ['Propiedad total del beat', 'Retirado de la tienda', 'Contrato de transferencia legal'],
            icon: <Crown size={20} />,
            color: 'amber',
            isActive: beat.is_exclusive_active
        }
    ];

    // Filter only active licenses
    const activeLicenses = allLicenses.filter(l => l.isActive);

    // Default to the first active license
    const [selectedType, setSelectedType] = React.useState<string>(activeLicenses[0]?.id || 'MP3');

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
            subtitle: `Prod. by ${beat.producer_artistic_name || beat.producer_username || 'Tianguis Producer'}`,
            metadata: { license: selectedType, beatId: beat.id }
        });

        onClose();
        router.push('/cart');
    };

    const colorMap: any = {
        blue: {
            border: 'border-blue-500',
            bg: 'bg-blue-50/30',
            bgSolid: 'bg-blue-500',
            text: 'text-blue-600',
            shadow: 'shadow-blue-500/20',
            hover: 'hover:bg-blue-600'
        },
        emerald: {
            border: 'border-emerald-500',
            bg: 'bg-emerald-50/30',
            bgSolid: 'bg-emerald-500',
            text: 'text-emerald-600',
            shadow: 'shadow-emerald-500/20',
            hover: 'hover:bg-emerald-600'
        },
        purple: {
            border: 'border-purple-500',
            bg: 'bg-purple-50/30',
            bgSolid: 'bg-purple-500',
            text: 'text-purple-600',
            shadow: 'shadow-purple-500/20',
            hover: 'hover:bg-purple-600'
        },
        amber: {
            border: 'border-amber-500',
            bg: 'bg-amber-50/30',
            bgSolid: 'bg-amber-500',
            text: 'text-amber-600',
            shadow: 'shadow-amber-500/20',
            hover: 'hover:bg-amber-600'
        }
    };

    const currentLicense: any = allLicenses.find(l => l.id === selectedType) || allLicenses[0];
    const activeColor = colorMap[currentLicense.color] || colorMap.blue;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-3 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all z-20 group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>

                <div className="flex flex-col lg:flex-row h-full">
                    {/* Visual Section */}
                    <div className="lg:w-[40%] bg-slate-900 p-12 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-30">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="w-56 h-56 mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500 border-4 border-white/10">
                                {beat.portadabeat_url ? (
                                    <img src={beat.portadabeat_url} className="w-full h-full object-cover" alt={beat.title} />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                                        <Music size={64} />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-3xl font-black text-white text-center tracking-tight mb-2 leading-tight">{beat.title}</h3>
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em]">
                                    {beat.producer_artistic_name || 'Tianguis Producer'}
                                </p>
                                {beat.producer_is_verified && (
                                    <div className="bg-blue-500 text-white rounded-full p-0.5"><Check size={6} strokeWidth={4} /></div>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-4 mt-12">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ritmo</p>
                                <p className="text-sm font-black text-white">{beat.bpm} BPM</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Nota</p>
                                <p className="text-sm font-black text-white">{beat.musical_key} {beat.musical_scale}</p>
                            </div>
                        </div>
                    </div>

                    {/* Interaction Section */}
                    <div className="flex-1 p-12 bg-white">
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">LICENCIAS DISPONIBLES</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selecciona el uso que le darás a tu beat</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mb-10">
                            {allLicenses.map((lic) => {
                                const licColor = colorMap[lic.color];
                                return (
                                    <button
                                        key={lic.id}
                                        disabled={!lic.isActive}
                                        onClick={() => setSelectedType(lic.id)}
                                        className={`relative p-5 rounded-3xl border-2 transition-all text-left flex flex-col justify-between group ${selectedType === lic.id
                                                ? `${licColor.border} ${licColor.bg} shadow-xl shadow-slate-200`
                                                : !lic.isActive
                                                    ? 'border-slate-50 bg-slate-50 opacity-40 grayscale cursor-not-allowed'
                                                    : 'border-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${selectedType === lic.id
                                                    ? `${licColor.bgSolid} text-white`
                                                    : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {lic.icon}
                                            </div>
                                            {selectedType === lic.id && (
                                                <div className={`${licColor.bgSolid} text-white rounded-full p-1 shadow-lg`}>
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedType === lic.id ? licColor.text : 'text-slate-400'
                                                }`}>{lic.name}</p>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-xl font-black text-slate-900">${lic.price}</p>
                                                <span className="text-[9px] font-bold text-slate-400">MXN</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feature List */}
                        <div className={`rounded-3xl p-8 mb-10 transition-colors duration-500 ${activeColor.bg} border ${activeColor.border}`}>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                                <ShieldCheck size={14} className={activeColor.text} />
                                Ventajas de esta licencia:
                            </h4>
                            <ul className="grid sm:grid-cols-1 gap-4">
                                {currentLicense?.features.map((feat: string, i: number) => (
                                    <li key={i} className="flex items-center gap-4 text-[11px] font-bold text-slate-700">
                                        <div className={`rounded-full p-1 ${activeColor.bgSolid} text-white`}>
                                            <Check size={8} strokeWidth={4} />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={!currentLicense}
                            className={`w-full py-6 rounded-2xl font-black uppercase text-[12px] tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 group active:scale-95 ${currentLicense
                                    ? `bg-slate-900 text-white ${activeColor.hover} shadow-slate-900/10`
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                            Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
