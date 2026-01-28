import React from 'react';
import { Check, ShoppingCart } from 'lucide-react';

interface LicenseProps {
    type: 'MP3' | 'WAV' | 'STEMS' | 'ILIMITADA';
    price: number;
    features: string[];
    active: boolean;
    onSelect: () => void;
    selected?: boolean;
}

export default function LicenseCard({ type, price, features, active, onSelect, selected }: LicenseProps) {
    if (!active) return null;

    return (
        <div
            onClick={onSelect}
            className={`relative p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 group
        ${selected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105'
                    : 'bg-white border-slate-100 text-slate-900 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1'
                }
      `}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className={`font-black text-lg uppercase tracking-tight ${selected ? 'text-white' : 'text-slate-900'}`}>{type} License</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selected ? 'text-blue-400' : 'text-slate-400'}`}>Licencia No-Exclusiva</p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${selected ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                    {selected && <Check size={14} className="text-white" />}
                </div>
            </div>

            <div className="mb-6">
                <span className="text-3xl font-black">${price}</span>
                <span className={`text-xs ml-1 font-bold ${selected ? 'text-slate-400' : 'text-slate-400'}`}>MXN</span>
            </div>

            <ul className="space-y-3 mb-8">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs font-bold opacity-80">
                        <Check size={14} className={`shrink-0 mt-0.5 ${selected ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className="leading-tight">{feature}</span>
                    </li>
                ))}
            </ul>

            <button className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-colors
        ${selected
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }
      `}>
                <ShoppingCart size={14} />
                {selected ? 'Añadir al carrito' : 'Seleccionar'}
            </button>

            {/* Recommended Badge (Optional logic) */}
            {type === 'WAV' && !selected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    Más Popular
                </div>
            )}
        </div>
    );
}
