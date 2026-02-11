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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        flex items-center gap-4 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border
                        animate-in slide-in-from-top-4 fade-in duration-300
                        ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400' :
                            toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400' :
                                toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400'}
                    `}
                >
                    <div className={`
                        shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                        ${toast.type === 'success' ? 'bg-emerald-500/20' :
                            toast.type === 'error' ? 'bg-red-500/20' :
                                toast.type === 'warning' ? 'bg-amber-500/20' :
                                    'bg-blue-500/20'}
                    `}>
                        {toast.type === 'success' && <CheckCircle2 size={20} />}
                        {toast.type === 'error' && <AlertCircle size={20} />}
                        {toast.type === 'warning' && <AlertTriangle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                    </div>

                    <p className="flex-1 text-[11px] font-black uppercase tracking-widest leading-relaxed">
                        {toast.message}
                    </p>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
