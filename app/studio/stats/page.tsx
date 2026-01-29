"use client";

import React from 'react';
import { BarChart, Activity, Heart, Play } from 'lucide-react';

export default function StudioStatsPage() {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">Estadísticas</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tu impacto en números</p>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400">Últimos 30 días</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                    <div className="flex items-center gap-3 mb-4 text-blue-600">
                        <Play size={20} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Plays</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter block mb-2">0</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sin cambios</span>
                </div>

                <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                        <Heart size={20} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Likes</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter block mb-2">0</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sin cambios</span>
                </div>

                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                    <div className="flex items-center gap-3 mb-4 text-emerald-600">
                        <Activity size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Conversión</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter block mb-2">0%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">De visitas a ventas</span>
                </div>
            </div>

            <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 opacity-50">
                <BarChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-sm">Gráficas detalladas próximamente...</p>
            </div>
        </div>
    );
}
