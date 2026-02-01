"use client";

import React from 'react';
import { X, Music, Check, ShoppingCart, ShieldCheck, Zap, Layers, Crown } from 'lucide-react';
import { Beat } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface LicenseSelectionModalProps {
    beat: Beat | any;
    isOpen: boolean;
    onClose: () => void;
}

export default function LicenseSelectionModal({ beat, isOpen, onClose }: LicenseSelectionModalProps) {
    const { addItem } = useCart();
    const [selectedType, setSelectedType] = React.useState<'MP3' | 'WAV' | 'STEMS' | 'ILIMITADA'>('MP3');

    if (!isOpen) return null;

    const licenses = [
        {
            id: 'MP3',
            name: 'Licencia MP3',
            price: beat.price_mp3 || beat.price_mxn || 299,
            features: ['MP3 de alta calidad (320kbps)', 'Hasta 10,000 reproducciones', 'Uso en plataformas digitales'],
            icon: <Music size={20} />,
            active: true
        },
        {
            id: 'WAV',
            name: 'Licencia WAV',
            price: beat.price_wav || Math.ceil((beat.price_mxn || 299) * 1.5),
            features: ['Archivos WAV + MP3', 'Uso comercial ilimitado', 'Calidad de estudio'],
            icon: <Zap size={20} />,
            active: true // In the future, check if producer enabled it
        },
        {
            id: 'STEMS',
            name: 'Licencia STEMS',
            price: beat.price_stems || Math.ceil((beat.price_mxn || 299) * 2.5),
            features: ['Pistas separadas (Stems)', 'Control total sobre la mezcla', 'Ideal para ingeniería Pro'],
            icon: <Layers size={20} />,
            active: true
        },
        {
            id: 'ILIMITADA',
            name: 'Licencia EXCLUSIVA',
            price: beat.exclusive_price_mxn || 2999,
            features: ['Propiedad total del beat', 'Retirado de la tienda', 'Contrato de transferencia legal'],
            icon: <Crown size={20} />,
            active: true
        }
    ];

    const handleAddToCart = () => {
        const license = licenses.find(l => l.id === selectedType);
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
        // Option to redirect to cart
        window.location.href = '/cart';
    };

    const currentLicense = licenses.find(l => l.id === selectedType);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col md:flex-row">
                    {/* Beat Info Sidebar */}
                    <div className="md:w-1/3 bg-slate-50 p-10 flex flex-col items-center border-r border-slate-100">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-xl mb-6">
                            {beat.portadabeat_url ? (
                                <img src={beat.portadabeat_url} className="w-full h-full object-cover" alt={beat.title} />
                            ) : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                    <Music size={40} />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-black uppercase text-center tracking-tight mb-2 line-clamp-2">{beat.title}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">
                            {(beat.producer as any)?.artistic_name || beat.producer_username || 'Producer'}
                        </p>

                        <div className="flex flex-wrap justify-center gap-2">
                            <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-bold text-slate-500 uppercase">{beat.bpm} BPM</span>
                            <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-bold text-slate-500 uppercase">{beat.musical_key}</span>
                        </div>
                    </div>

                    {/* License Selection Area */}
                    <div className="flex-1 p-10">
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Elige tu Licencia</h2>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {licenses.map((lic) => (
                                <button
                                    key={lic.id}
                                    onClick={() => setSelectedType(lic.id as any)}
                                    className={`relative p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between h-24 ${selectedType === lic.id ? 'border-blue-600 bg-blue-50/10 shadow-lg shadow-blue-600/5' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className={`${selectedType === lic.id ? 'text-blue-600' : 'text-slate-400'}`}>
                                            {lic.icon}
                                        </div>
                                        {selectedType === lic.id && (
                                            <div className="bg-blue-600 text-white rounded-full p-0.5">
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${selectedType === lic.id ? 'text-blue-600' : 'text-slate-400'}`}>{lic.name}</p>
                                        <p className="text-sm font-black text-slate-900">${lic.price} MXN</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Current Selection Features */}
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Incluye en esta licencia:</h4>
                            <ul className="space-y-2">
                                {currentLicense?.features.map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                                        <div className="bg-blue-100 text-blue-600 rounded-full p-0.5">
                                            <Check size={8} strokeWidth={4} />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 group"
                        >
                            <ShoppingCart size={18} className="group-hover:translate-x-1 transition-transform" />
                            Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
