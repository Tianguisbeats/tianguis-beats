import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy (antes "middleware") — cabeceras de seguridad.
 *
 * Next.js 16 renombró la convención `middleware` a `proxy`. Añade cabeceras HTTP
 * de endurecimiento a todas las respuestas. NO hace verificación de sesión en el
 * borde: la app guarda la sesión de Supabase en localStorage (no en cookies),
 * así que aquí no se puede leer. La protección de /studio/* se mantiene por
 * redirección del cliente + RLS en la base de datos. Para auth real en el borde
 * habría que migrar a @supabase/ssr (sesiones por cookie) — cambio aparte.
 *
 * No se incluye Content-Security-Policy a propósito: configurarla mal rompe
 * scripts/estilos (Stripe, Supabase, fuentes). Se puede añadir después con
 * pruebas dedicadas.
 */
export function proxy(_req: NextRequest) {
    const res = NextResponse.next();

    // Evita que el navegador "adivine" el tipo de archivo (anti MIME-sniffing).
    res.headers.set('X-Content-Type-Options', 'nosniff');
    // Solo permitir enmarcar la página desde el mismo origen (anti clickjacking).
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    // No filtrar la URL completa como referer hacia otros sitios.
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Desactivar APIs del navegador que la app no usa.
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    // Forzar HTTPS en visitas futuras (1 año, incluye subdominios).
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    return res;
}

export const config = {
    // Aplica a todo menos a estáticos de Next, imágenes y favicon.
    matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|favicon.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp3|wav|woff2?)$).*)'],
};
