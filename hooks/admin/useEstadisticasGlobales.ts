import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface EstadisticasGlobales {
    totalSales: number;
    totalUsers: number;
    totalBeats: number;
    pendingVerifications: number;
    pendingFeedback: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    totalCoupons: number;
}

interface OpcionesEstadisticasGlobales {
    onError?: (mensaje: string) => void;
}

const EMPTY_STATS: EstadisticasGlobales = {
    totalSales: 0,
    totalUsers: 0,
    totalBeats: 0,
    pendingVerifications: 0,
    pendingFeedback: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    totalCoupons: 0,
};

export function useEstadisticasGlobales(opts: OpcionesEstadisticasGlobales = {}) {
    const [stats, setStats] = useState<EstadisticasGlobales>(EMPTY_STATS);
    const [loading, setLoading] = useState(true);
    const optsRef = useRef(opts);

    useEffect(() => {
        optsRef.current = opts;
    }, [opts]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const [sales, users, beats, verifs, feedback, coupons] = await Promise.all([
                supabase.from('transacciones').select('precio, precio_total, fecha_creacion'),
                supabase.from('perfiles').select('id', { count: 'exact', head: true }),
                supabase.from('beats').select('id', { count: 'exact', head: true }),
                supabase.from('solicitudes_verificacion').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('quejas_y_sugerencias').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('cupones').select('id', { count: 'exact', head: true }).eq('es_activo', true),
            ]);

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const salesRows = sales.data || [];
            const totalSales = salesRows.reduce((acc, s) => acc + (Number(s.precio_total || s.precio || 0)), 0);
            const monthlyRevenue = salesRows
                .filter(s => s.fecha_creacion && new Date(s.fecha_creacion) >= startOfMonth)
                .reduce((acc, s) => acc + (Number(s.precio_total || s.precio || 0)), 0);

            setStats({
                totalSales: Number(totalSales) || 0,
                totalUsers: Number(users.count) || 0,
                totalBeats: Number(beats.count) || 0,
                pendingVerifications: Number(verifs.count) || 0,
                pendingFeedback: Number(feedback.count) || 0,
                monthlyRevenue: Number(monthlyRevenue) || 0,
                activeSubscriptions: 0,
                totalCoupons: Number(coupons.count) || 0,
            });
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al cargar estadísticas');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        refetch: fetchStats,
    };
}
