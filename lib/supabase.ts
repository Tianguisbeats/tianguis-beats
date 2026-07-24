import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase único para toda la aplicación.
 * Maneja la conexión con la base de datos y la autenticación.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("[Supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Cliente público de Supabase para código de navegador.
 * Las variables son obligatorias para fallar temprano si el entorno está mal configurado.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // Mantiene la sesión iniciada al recargar
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

/**
 * supabase.auth.getUser() puede quedarse esperando para siempre si la
 * recuperación de sesión de supabase-js se traba en una recarga completa
 * (la librería no aplica ningún timeout a su lock interno). Esta versión
 * cae a `null` tras `timeoutMs` en vez de colgar la pantalla de carga.
 */
export async function getUserSafe(timeoutMs = 8000) {
    try {
        const result = await Promise.race([
            supabase.auth.getUser(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
        ]);
        return result?.data?.user ?? null;
    } catch {
        return null;
    }
}
