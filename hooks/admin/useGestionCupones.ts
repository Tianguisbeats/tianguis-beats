import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface FormCuponAdmin {
    codigo: string;
    porcentaje_descuento: number;
    usos_maximos: string | number;
    fecha_expiracion: string;
    nivel_objetivo: string;
    es_activo: boolean;
    id_cupon_stripe: string;
    texto_descuento: string;
}

interface OpcionesGestionCupones {
    onError?: (mensaje: string) => void;
    onExito?: (mensaje: string) => void;
}

const FORM_CUPON_DEFAULT: FormCuponAdmin = {
    codigo: '',
    porcentaje_descuento: 20,
    usos_maximos: '',
    fecha_expiracion: '',
    nivel_objetivo: 'todos',
    es_activo: true,
    id_cupon_stripe: '',
    texto_descuento: '',
};

export function useGestionCupones(opts: OpcionesGestionCupones = {}) {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isStripeOnly, setIsStripeOnly] = useState(false);
    const [formCoupon, setFormCoupon] = useState<FormCuponAdmin>(FORM_CUPON_DEFAULT);
    const optsRef = useRef(opts);

    useEffect(() => {
        optsRef.current = opts;
    }, [opts]);

    const resetForm = useCallback(() => {
        setFormCoupon(FORM_CUPON_DEFAULT);
    }, []);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('cupones')
                .select('*')
                .is('productor_id', null)
                .order('fecha_creacion', { ascending: false });
            if (error) throw error;
            setCoupons(data || []);
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al cargar cupones');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleAction = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                codigo: formCoupon.codigo.toUpperCase(),
                porcentaje_descuento: formCoupon.porcentaje_descuento,
                usos_maximos: formCoupon.usos_maximos ? parseInt(formCoupon.usos_maximos as string) : null,
                fecha_expiracion: formCoupon.fecha_expiracion || null,
                nivel_objetivo: formCoupon.nivel_objetivo,
                es_activo: formCoupon.es_activo,
                id_cupon_stripe: formCoupon.id_cupon_stripe || null,
                texto_descuento: formCoupon.texto_descuento || null,
                aplica_a: 'suscripciones',
            };

            if (editingId) {
                const { error } = await supabase.from('cupones').update(payload).eq('id', editingId);
                if (error) throw error;
                optsRef.current.onExito?.('Cupón actualizado');
            } else {
                const { error } = await supabase.from('cupones').insert([payload]);
                if (error) throw error;
                optsRef.current.onExito?.('Cupón creado');
            }
            setShowModal(false);
            setEditingId(null);
            setIsStripeOnly(false);
            resetForm();
            fetchCoupons();
        } catch (error: any) {
            optsRef.current.onError?.(error?.message || 'Error al guardar cupón');
        }
    }, [editingId, fetchCoupons, formCoupon, resetForm]);

    const handleDelete = useCallback(async (id: string) => {
        const { error } = await supabase.from('cupones').delete().eq('id', id);
        if (error) {
            optsRef.current.onError?.('Error al eliminar');
        } else {
            optsRef.current.onExito?.('Cupón eliminado definitivamente');
            fetchCoupons();
        }
        setConfirmDeleteId(null);
    }, [fetchCoupons]);

    const toggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
        const { error } = await supabase.from('cupones').update({ es_activo: !currentStatus }).eq('id', id);
        if (error) {
            optsRef.current.onError?.('Error al actualizar cupón');
            return;
        }
        setCoupons(prev => prev.map(cp => cp.id === id ? { ...cp, es_activo: !currentStatus } : cp));
    }, []);

    const openCreateModal = useCallback(() => {
        setEditingId(null);
        setIsStripeOnly(false);
        resetForm();
        setShowModal(true);
    }, [resetForm]);

    const openStripeOnlyModal = useCallback(() => {
        setEditingId(null);
        setIsStripeOnly(true);
        setFormCoupon({
            ...FORM_CUPON_DEFAULT,
            porcentaje_descuento: 100,
        });
        setShowModal(true);
    }, []);

    const openEditModal = useCallback((cp: any) => {
        setEditingId(cp.id);
        setFormCoupon({
            codigo: cp.codigo,
            porcentaje_descuento: cp.porcentaje_descuento,
            usos_maximos: cp.usos_maximos || '',
            fecha_expiracion: cp.fecha_expiracion ? cp.fecha_expiracion.split('.')[0] : '',
            nivel_objetivo: cp.nivel_objetivo || 'todos',
            es_activo: cp.es_activo,
            id_cupon_stripe: cp.id_cupon_stripe || '',
            texto_descuento: cp.texto_descuento || '',
        });
        setIsStripeOnly(!!cp.id_cupon_stripe);
        setShowModal(true);
    }, []);

    return {
        coupons,
        loading,
        showModal,
        setShowModal,
        editingId,
        confirmDeleteId,
        setConfirmDeleteId,
        isStripeOnly,
        formCoupon,
        setFormCoupon,
        handleAction,
        handleDelete,
        toggleStatus,
        openCreateModal,
        openStripeOnlyModal,
        openEditModal,
        refetch: fetchCoupons,
    };
}
