import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase único para toda la aplicación.
 * Maneja la conexión con la base de datos y la autenticación.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn("[Supabase] Advertencia: Faltan variables de entorno en el cliente público.");
    }
}

/**
 * Exportamos el cliente instanciado de forma segura.
 * Si las variables faltan durante el build, proporcionamos un fallback 
 * para evitar que la aplicación crashee al importar este módulo.
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true, // Mantiene la sesión iniciada al recargar
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
    : createClient("https://placeholder-url.supabase.co", "placeholder-key", {
        auth: { persistSession: false },
    });
