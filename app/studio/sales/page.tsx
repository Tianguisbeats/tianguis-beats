"use client";

import React from 'react';
import { DollarSign, Lock } from 'lucide-react';

export default function StudioSalesPage() {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">Ventas e Ingresos</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestiona tus ganancias</p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 relative">
                    <DollarSign size={40} className="text-slate-300" />
                    <div className="absolute top-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                        <Lock size={12} />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Próximamente</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                    Estamos construyendo una pasarela de pagos segura para que recibas el 100% de tus ventas directamente a tu cuenta bancaria.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    En desarrollo
                </div>
            </div>
        </div>
    );
}
