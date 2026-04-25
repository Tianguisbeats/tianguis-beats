import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * TIANGUIS BEATS — Cliente Supabase Admin (Server-Side ÚNICAMENTE)
 *
 * Este cliente usa la SERVICE_ROLE_KEY y bypassa todas las políticas RLS.
 * NUNCA importarlo desde código que se ejecute en el navegador.
 *
 * Patrón Singleton: una sola instancia por proceso para evitar abrir
 * múltiples conexiones al pool de PostgREST.
 */

let _instancia: SupabaseClient | null = null;

/**
 * Devuelve el cliente admin singleton.
 * Lanza si las variables de entorno no están configuradas.
 */
export function obtenerSupabaseAdmin(): SupabaseClient {
    if (_instancia) return _instancia;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !roleKey) {
        throw new Error('[SupabaseAdmin] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    }

    _instancia = createClient(url, roleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return _instancia;
}

/**
 * Crea un cliente Supabase autenticado con el JWT del usuario que viene
 * en el header Authorization. Útil para validar la sesión del cliente
 * antes de operar con el cliente admin.
 *
 * @param authHeader Valor del header Authorization (con o sin "Bearer ").
 */
export function crearClienteUsuario(authHeader: string | null | undefined): SupabaseClient | null {
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anonKey) return null;

    return createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

/**
 * Atajo: valida el token y devuelve el usuario autenticado o null.
 */
export async function obtenerUsuarioDesdeRequest(req: Request): Promise<{ id: string; email?: string } | null> {
    const cliente = crearClienteUsuario(req.headers.get('Authorization'));
    if (!cliente) return null;
    const { data: { user }, error } = await cliente.auth.getUser();
    if (error || !user) return null;
    return { id: user.id, email: user.email };
}
