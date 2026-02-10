import React from 'react';
import { Check, ShoppingCart } from 'lucide-react';

interface LicenseProps {
    type: 'MP3' | 'WAV' | 'STEMS' | 'ILIMITADA';
    price: number;
    features: string[];
    active: boolean;
    onSelect: () => void;
    selected?: boolean;
    isSold?: boolean;
}

export default function LicenseCard({ type, price, features, active, onSelect, selected, isSold }: LicenseProps) {
    if (!active) return null;

    return (
        <div
            onClick={!isSold ? onSelect : undefined}
            className={`relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 group
                ${isSold
                    ? 'bg-background border-dashed border-border opacity-60 cursor-not-allowed'
                    : selected
                        ? 'bg-foreground text-background border-foreground shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] scale-[1.02] cursor-pointer'
                        : 'bg-card border-border/50 text-foreground hover:border-accent hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                }
            `}
        >
            {isSold && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rotate-[-12deg]">
                    <div className="bg-red-500 text-white font-black px-8 py-2 rounded-xl text-2xl uppercase tracking-[0.2em] shadow-2xl border-4 border-white/20">
                        Vendido
                    </div>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none mb-1">{type} License</h3>
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${selected ? 'opacity-60' : 'text-muted'}`}>Uso Comercial</p>
                </div>
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-500 ${selected ? 'bg-accent text-white rotate-0' : 'bg-slate-100 text-slate-300 -rotate-12 group-hover:rotate-0 group-hover:bg-accent/10 group-hover:text-accent'}`}>
                    <Check size={18} className={selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                </div>
            </div>

            <div className="mb-8">
                <span className="text-4xl font-black">${price}</span>
                <span className={`text-[10px] ml-2 font-black uppercase tracking-widest ${selected ? 'opacity-60' : 'text-muted'}`}>MXN</span>
            </div>

            <ul className="space-y-4 mb-4">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-[11px] font-bold">
                        <Check size={14} className={`shrink-0 mt-0.5 ${selected ? 'text-accent' : 'text-accent'}`} />
                        <span className="leading-tight uppercase tracking-tight opacity-90">{feature}</span>
                    </li>
                ))}
            </ul>

            {/* Recommended Badge */}
            {type === 'WAV' && !selected && (
                <div className="absolute -top-3 left-10 bg-accent text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                    Más popular
                </div>
            )}
        </div>
    );
}
