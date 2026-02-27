import React from 'react';

export default function LoadingTianguis() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center bg-background w-full">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-lg shadow-accent/20" />
                <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent animate-pulse">Cargando Tianguis</p>
                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest mt-2">Sintonizando frecuencias...</p>
                </div>
            </div>
        </div>
    );
}
