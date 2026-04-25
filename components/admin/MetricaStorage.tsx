"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * MetricaStorage — calcula el storage total que ocupa un usuario
 * sumando todos los buckets que contienen su carpeta `username/`.
 *
 * Cambios vs implementación anterior (admin/page.tsx StorageMetric):
 *   - Paralelización con Promise.all (antes era loop secuencial = N+1).
 *   - Lista de buckets corregida: usa `archivos_kits_sonido` (el bucket
 *     real) y agrega `muestra_soundkit`. Antes referenciaba `kits_sonido`
 *     que no existe en el storage.
 */

const BUCKETS_POR_USUARIO = [
    'fotos_perfil',
    'fotos_portada',
    'portadas_beats',
    'muestras_beats',
    'beats_mp3',
    'beats_wav',
    'beats_stems',
    'portadas_kits_sonido',
    'archivos_kits_sonido',
    'muestra_soundkit',
] as const;

interface Props {
    username: string;
}

export function MetricaStorage({ username }: Props) {
    const [totalMB, setTotalMB] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calcular = async () => {
            if (!username) return;
            setLoading(true);
            try {
                // Una llamada por bucket EN PARALELO. Antes era for-of con await (secuencial).
                const resultados = await Promise.all(
                    BUCKETS_POR_USUARIO.map(bucket =>
                        supabase.storage.from(bucket).list(username)
                            .then(r => r.data || [])
                            .catch(() => [])
                    )
                );

                const totalBytes = resultados
                    .flat()
                    .reduce((acc, file: any) => acc + (file?.metadata?.size || 0), 0);

                setTotalMB(totalBytes / (1024 * 1024));
            } catch (err) {
                console.error('[MetricaStorage] Error:', err);
            }
            setLoading(false);
        };

        calcular();
    }, [username]);

    return (
        <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20">
            <p className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">Almacenamiento Usado</p>
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                {loading ? (
                    <Loader2 size={12} className="animate-spin text-accent" />
                ) : (
                    `${totalMB?.toFixed(2) || '0.00'} MB`
                )}
                <span className="text-[10px] text-muted-foreground font-normal lowercase tracking-normal">
                    (en buckets de storage)
                </span>
            </div>
        </div>
    );
}
