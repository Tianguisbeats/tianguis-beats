"use client";

import React from 'react';
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: number) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none md:p-0">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        flex items-center gap-4 p-4 rounded-3xl shadow-3xl backdrop-blur-3xl border
                        animate-in slide-in-from-right-8 fade-in duration-500
                        ${toast.type === 'success' ? 'bg-black/60 border-emerald-500/50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]' :
                            toast.type === 'error' ? 'bg-black/60 border-red-500/50 shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)]' :
                                toast.type === 'warning' ? 'bg-black/60 border-amber-500/50 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]' :
                                    'bg-black/60 border-blue-500/50 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]'}
                    `}
                >
                    <div className={`
                        shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
                        ${toast.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                            toast.type === 'error' ? 'bg-red-500 text-white shadow-red-500/20' :
                                toast.type === 'warning' ? 'bg-amber-500 text-white shadow-amber-500/20' :
                                    'bg-blue-500 text-white shadow-blue-500/20'}
                    `}>
                        {toast.type === 'success' && <CheckCircle2 size={24} strokeWidth={3} />}
                        {toast.type === 'error' && <XCircle size={24} strokeWidth={3} />}
                        {toast.type === 'warning' && <AlertTriangle size={24} strokeWidth={3} />}
                        {toast.type === 'info' && <Info size={24} strokeWidth={3} />}
                    </div>

                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                            {toast.type === 'success' ? 'Éxito' :
                                toast.type === 'error' ? 'Error' :
                                    toast.type === 'warning' ? 'Advertencia' : 'Información'}
                        </p>
                        <p className="text-sm font-bold leading-snug text-white">
                            {toast.message}
                        </p>
                    </div>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
