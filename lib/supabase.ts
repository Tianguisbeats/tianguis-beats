import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase único para toda la aplicación.
 * Maneja la conexión con la base de datos y la autenticación.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase] Error: Faltan variables de entorno.");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
    auth: {
        persistSession: true, // Mantiene la sesión iniciada al recargar
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});
