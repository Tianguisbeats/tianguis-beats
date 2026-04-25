import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * TIANGUIS BEATS — Hook de gestión de usuarios para el panel admin
 *
 * Encapsula:
 *   - Carga de la lista de perfiles (paginada a 100)
 *   - Estado del usuario seleccionado y formulario de edición
 *   - Detección de cambios (hasChanges)
 *   - Guardado server-side
 *   - Filtro por término de búsqueda
 *
 * Mantiene la UI de UserManager como componente puro.
 */

export interface PerfilEditable {
    nivel_suscripcion: string;
    fecha_inicio_suscripcion: string;
    fecha_termino_suscripcion: string;
    esta_verificado: boolean;
    es_admin: boolean;
    es_soporte: boolean;
}

/** Convierte una fecha (ISO o YYYY-MM-DD) a 'YYYY-MM-DD' para inputs `<input type=date>`. */
export function formatearFechaSegura(dateStr: any): string {
    try {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

interface OpcionesGestionUsuarios {
    onError?: (mensaje: string) => void;
    onExito?: (mensaje: string) => void;
}

export function useGestionUsuarios(opts: OpcionesGestionUsuarios = {}) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editForm, setEditForm] = useState<PerfilEditable | null>(null);
    const [saving, setSaving] = useState(false);
    const optsRef = useRef(opts);

    useEffect(() => {
        optsRef.current = opts;
    }, [opts]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .order('fecha_creacion', { ascending: false })
                .limit(100);

            if (error) {
                // Fallback sin orden si la columna fecha_creacion falla
                const { data: retryData } = await supabase.from('perfiles').select('*').limit(100);
                setUsers(retryData || []);
            } else {
                setUsers(data || []);
            }
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al cargar usuarios');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Inicializar formulario al seleccionar un usuario
    useEffect(() => {
        if (selectedUser) {
            setEditForm({
                nivel_suscripcion: selectedUser.nivel_suscripcion || 'free',
                fecha_inicio_suscripcion: formatearFechaSegura(selectedUser.fecha_inicio_suscripcion),
                fecha_termino_suscripcion: formatearFechaSegura(selectedUser.fecha_termino_suscripcion),
                esta_verificado: !!selectedUser.esta_verificado,
                es_admin: !!selectedUser.es_admin,
                es_soporte: !!selectedUser.es_soporte,
            });
        } else {
            setEditForm(null);
        }
    }, [selectedUser]);

    const hasChanges = useMemo(() => {
        if (!selectedUser || !editForm) return false;
        return (
            editForm.nivel_suscripcion !== (selectedUser.nivel_suscripcion || 'free') ||
            editForm.fecha_inicio_suscripcion !== formatearFechaSegura(selectedUser.fecha_inicio_suscripcion) ||
            editForm.fecha_termino_suscripcion !== formatearFechaSegura(selectedUser.fecha_termino_suscripcion) ||
            editForm.esta_verificado !== (selectedUser.esta_verificado || false) ||
            editForm.es_admin !== (selectedUser.es_admin || false) ||
            editForm.es_soporte !== (selectedUser.es_soporte || false)
        );
    }, [selectedUser, editForm]);

    const handleSave = useCallback(async () => {
        if (!selectedUser || !editForm) return;
        setSaving(true);
        try {
            const payload = {
                nivel_suscripcion: editForm.nivel_suscripcion,
                fecha_inicio_suscripcion: editForm.fecha_inicio_suscripcion
                    ? new Date(editForm.fecha_inicio_suscripcion).toISOString()
                    : null,
                fecha_termino_suscripcion: editForm.fecha_termino_suscripcion
                    ? new Date(editForm.fecha_termino_suscripcion).toISOString()
                    : null,
                esta_verificado: editForm.esta_verificado,
                es_admin: editForm.es_admin,
                es_soporte: editForm.es_soporte,
            };

            const { error } = await supabase.from('perfiles').update(payload).eq('id', selectedUser.id);
            if (error) throw error;

            const updatedUser = { ...selectedUser, ...payload };
            setUsers(prev => prev.map(u => (u.id === selectedUser.id ? updatedUser : u)));
            setSelectedUser(null);
            optsRef.current.onExito?.('Cambios guardados correctamente');
        } catch (err: any) {
            optsRef.current.onError?.(err?.message || 'Error al guardar cambios');
        }
        setSaving(false);
    }, [selectedUser, editForm]);

    const filteredUsers = useMemo(() => {
        const q = searchTerm.toLowerCase();
        if (!q) return users;
        return users.filter(u =>
            u.nombre_usuario?.toLowerCase().includes(q) ||
            u.nombre_artistico?.toLowerCase().includes(q) ||
            u.correo?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
    }, [users, searchTerm]);

    return {
        // Datos
        users,
        filteredUsers,
        loading,
        // Búsqueda
        searchTerm,
        setSearchTerm,
        // Selección/edición
        selectedUser,
        setSelectedUser,
        editForm,
        setEditForm,
        // Estado y acciones
        hasChanges,
        saving,
        handleSave,
        refetch: fetchUsers,
    };
}
