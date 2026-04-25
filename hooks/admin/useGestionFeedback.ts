import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook de gestión de quejas y sugerencias para el panel admin.
 *
 * Encapsula:
 *   - Carga de feedback con join manual a perfiles (no hay FK explícita).
 *   - Actualización de estado (pendiente/leído/resuelto).
 *   - Conteo memoizado de pendientes.
 */

interface OpcionesGestionFeedback {
    onError?: (mensaje: string) => void;
    onExito?: (mensaje: string) => void;
}

export function useGestionFeedback(opts: OpcionesGestionFeedback = {}) {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const optsRef = useRef(opts);

    useEffect(() => {
        optsRef.current = opts;
    }, [opts]);

    const fetchFeedbacks = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('quejas_y_sugerencias')
                .select('*')
                .order('fecha_creacion', { ascending: false });

            if (error) throw error;

            // Join manual: la tabla no tiene FK explícita a perfiles.
            const userIds = [...new Set((data || []).map(d => d.usuario_id).filter(Boolean))];
            let profilesMap: Record<string, any> = {};

            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('perfiles')
                    .select('id, nombre_artistico, nombre_usuario, foto_perfil')
                    .in('id', userIds as string[]);

                if (profiles) {
                    profiles.forEach((p: any) => { profilesMap[p.id] = p; });
                }
            }

            const merged = (data || []).map(item => ({
                ...item,
                perfiles: item.usuario_id ? (profilesMap[item.usuario_id] || null) : null,
            }));

            setFeedbacks(merged);
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al cargar feedback');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks]);

    const handleUpdateStatus = useCallback(async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('quejas_y_sugerencias')
            .update({ estado: newStatus })
            .eq('id', id);

        if (error) {
            optsRef.current.onError?.('Error al actualizar estado');
            return;
        }
        setFeedbacks(prev => prev.map(f => (f.id === id ? { ...f, estado: newStatus } : f)));
        optsRef.current.onExito?.('Estado actualizado');
    }, []);

    const pendientes = useMemo(
        () => feedbacks.filter(f => (f.estado || 'pendiente') === 'pendiente'),
        [feedbacks]
    );

    return {
        feedbacks,
        pendientes,
        loading,
        handleUpdateStatus,
        refetch: fetchFeedbacks,
    };
}
