import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OpcionesGestionControles {
    onError?: (mensaje: string) => void;
    onExito?: (mensaje: string) => void;
}

export function useGestionControles(opts: OpcionesGestionControles = {}) {
    const [controls, setControls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bannerTexto, setBannerTexto] = useState('');
    const [savingBanner, setSavingBanner] = useState(false);
    const optsRef = useRef(opts);

    useEffect(() => {
        optsRef.current = opts;
    }, [opts]);

    const fetchControls = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('configuracion_global')
                .select('*')
                .order('clave', { ascending: true });
            if (error) throw error;

            const bannerRow = data?.find((c: any) => c.clave === 'banner_texto');
            if (bannerRow) setBannerTexto(bannerRow.valor || '');
            setControls((data || []).filter((c: any) => c.clave !== 'banner_texto'));
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al cargar controles');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchControls();
    }, [fetchControls]);

    const saveBannerTexto = useCallback(async () => {
        setSavingBanner(true);
        try {
            const { data: existing } = await supabase
                .from('configuracion_global')
                .select('id')
                .eq('clave', 'banner_texto')
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('configuracion_global')
                    .update({ valor: bannerTexto, ultima_actualizacion: new Date().toISOString() })
                    .eq('clave', 'banner_texto');
            } else {
                await supabase
                    .from('configuracion_global')
                    .insert({ clave: 'banner_texto', valor: bannerTexto, ultima_actualizacion: new Date().toISOString() });
            }
            optsRef.current.onExito?.('Texto del banner guardado ✅');
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al guardar el banner');
        }
        setSavingBanner(false);
    }, [bannerTexto]);

    const toggleControl = useCallback(async (id: string, clave: string, currentVal: boolean) => {
        try {
            const { error } = await supabase
                .from('configuracion_global')
                .update({ valor: !currentVal, ultima_actualizacion: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            setControls(prev => prev.map(c => c.id === id ? { ...c, valor: !currentVal } : c));
            optsRef.current.onExito?.(`${clave.replace(/_/g, ' ').toUpperCase()} ${!currentVal ? 'Activado ✅' : 'Desactivado ❌'}`);
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al actualizar control');
        }
    }, []);

    return {
        controls,
        loading,
        bannerTexto,
        setBannerTexto,
        savingBanner,
        saveBannerTexto,
        toggleControl,
        refetch: fetchControls,
    };
}
