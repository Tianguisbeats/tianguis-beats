"use client";

import React from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

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
                        flex items-center gap-4 p-4 rounded-3xl shadow-2xl backdrop-blur-2xl border
                        animate-in slide-in-from-right-8 fade-in duration-500
                        ${toast.type === 'success' ? 'bg-[#0a0a0a]/90 border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]' :
                            toast.type === 'error' ? 'bg-[#0a0a0a]/90 border-red-500/30 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]' :
                                toast.type === 'warning' ? 'bg-[#0a0a0a]/90 border-amber-500/30 shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]' :
                                    'bg-[#0a0a0a]/90 border-blue-500/30 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]'}
                    `}
                >
                    <div className={`
                        shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                        ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                            toast.type === 'error' ? 'bg-red-500/10 text-red-500' :
                                toast.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-blue-500/10 text-blue-500'}
                    `}>
                        {toast.type === 'success' && <CheckCircle2 size={20} />}
                        {toast.type === 'error' && <AlertCircle size={20} />}
                        {toast.type === 'warning' && <AlertTriangle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                    </div>

                    <p className="flex-1 text-[10px] font-black uppercase tracking-widest leading-relaxed text-white/90">
                        {toast.message}
                    </p>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
