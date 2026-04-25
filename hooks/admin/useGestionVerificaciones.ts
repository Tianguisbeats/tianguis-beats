import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type AccionVerificacion = {
    requestId: string;
    userId: string;
    status: 'approved' | 'rejected' | 'reviewed';
};

interface OpcionesGestionVerificaciones {
    onError?: (mensaje: string) => void;
    onExito?: (mensaje: string) => void;
}

export function useGestionVerificaciones(opts: OpcionesGestionVerificaciones = {}) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState<AccionVerificacion | null>(null);
    const [selectedHistoryReq, setSelectedHistoryReq] = useState<any>(null);
    const optsRef = useRef(opts);

    useEffect(() => {
        optsRef.current = opts;
    }, [opts]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('solicitudes_verificacion')
                .select(`*, perfiles: user_id(nombre_usuario, foto_perfil, correo, fecha_creacion)`)
                .order('fecha_creacion', { ascending: false });

            if (error) {
                const { data: retryData } = await supabase
                    .from('solicitudes_verificacion')
                    .select(`*, perfiles: user_id(nombre_usuario, foto_perfil, correo, fecha_creacion)`)
                    .eq('estado', 'pendiente');
                setRequests(retryData || []);
            } else {
                setRequests(data || []);
            }
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al cargar verificaciones');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleDeleteHistoryReq = useCallback(async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta solicitud de verificación del historial? Esta acción no se puede deshacer.')) return;
        try {
            const { error } = await supabase.from('solicitudes_verificacion').delete().eq('id', id);
            if (error) throw error;
            setRequests(prev => prev.filter(r => r.id !== id));
            setSelectedHistoryReq(null);
            optsRef.current.onExito?.('Solicitud eliminada correctamente');
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al eliminar la solicitud');
        }
    }, []);

    const handleDecision = useCallback(async () => {
        if (!confirmAction) return;
        const { requestId, userId, status } = confirmAction;
        setConfirmAction(null);

        try {
            const nextEstado = status === 'approved' ? 'aprobado' : status === 'rejected' ? 'rechazado' : 'revisado';
            const { error: reqError } = await supabase
                .from('solicitudes_verificacion')
                .update({ estado: nextEstado })
                .eq('id', requestId);

            if (reqError) throw reqError;

            if (status === 'approved') {
                const { error: profileError } = await supabase
                    .from('perfiles')
                    .update({
                        esta_verificado: true,
                        boletin_activo: true,
                    })
                    .eq('id', userId);

                if (profileError) throw profileError;
            }

            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: nextEstado } : r));
            optsRef.current.onExito?.(`Solicitud ${status === 'approved' ? 'Aprobada ✅' : status === 'rejected' ? 'Rechazada ❌' : 'Marcada como Revisada 👁️'}`);
        } catch (error: any) {
            optsRef.current.onError?.(error?.message || 'Error al procesar la decisión. Verifica los permisos de la base de datos.');
        }
    }, [confirmAction]);

    const handleRevert = useCallback(async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('solicitudes_verificacion')
                .update({ estado: 'pendiente' })
                .eq('id', requestId);

            if (error) throw error;

            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: 'pendiente' } : r));
            optsRef.current.onExito?.('Solicitud devuelta a Pendientes');
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al revertir');
        }
    }, []);

    return {
        requests,
        loading,
        confirmAction,
        setConfirmAction,
        selectedHistoryReq,
        setSelectedHistoryReq,
        handleDeleteHistoryReq,
        handleDecision,
        handleRevert,
        refetch: fetchRequests,
    };
}
