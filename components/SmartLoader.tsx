"use client";

import React, { useState, useEffect } from 'react';

interface SmartLoaderProps {
    onComplete?: () => void;
}

export default function SmartLoader({ onComplete }: SmartLoaderProps) {
    const [loadingTexts, setLoadingTexts] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const texts = [
        "Iniciando algoritmos de red...",
        "Analizando espectro de frecuencias...",
        "Normalizando base de datos de beats...",
        "Optimizando flujo de señales (DSP)...",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingTexts((prev) => {
                if (prev >= texts.length - 1) {
                    setTimeout(() => {
                        setIsVisible(false);
                        onComplete?.();
                    }, 800);
                    return prev;
                }
                return prev + 1;
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo Animation */}
                <div className="mb-8">
                    <div className="relative">
                        {/* Outer ring */}
                        <div className="w-24 h-24 border-4 border-blue-500/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                        {/* Inner ring */}
                        <div className="absolute inset-2 w-20 h-20 border-4 border-cyan-500/30 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                        {/* Center dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Tianguis Beats</h2>
                    <div className="h-8 overflow-hidden">
                        <p
                            key={loadingTexts}
                            className="text-sm font-medium text-blue-400"
                            style={{ animation: 'fadeIn 0.5s ease-out forwards' }}
                        >
                            {texts[loadingTexts]}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-64 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${((loadingTexts + 1) / texts.length) * 100}%` }}
                    />
                </div>
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
