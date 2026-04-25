import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OpcionesGestionBeats {
    onError?: (mensaje: string) => void;
}

export function useGestionBeats(opts: OpcionesGestionBeats = {}) {
    const [beats, setBeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const optsRef = useRef(opts);

    useEffect(() => {
        optsRef.current = opts;
    }, [opts]);

    const fetchBeats = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('beats')
                .select(`*, perfiles:productor_id (nombre_usuario, nombre_artistico)`)
                .order('fecha_creacion', { ascending: false });
            if (error) throw error;
            setBeats(data || []);
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al cargar beats');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchBeats();
    }, [fetchBeats]);

    return {
        beats,
        loading,
        refetch: fetchBeats,
    };
}
