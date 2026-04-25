/**
 * TIANGUIS BEATS — Rate Limiter
 *
 * Implementación in-memory (sliding window) suficiente para una sola
 * instancia serverless. Para multi-región o alto volumen, sustituir
 * `bucket` por @upstash/redis manteniendo la misma firma.
 *
 * Uso típico:
 *   const lim = await aplicarLimite(req, { id: 'verify', max: 30, ventanaMs: 60_000 });
 *   if (!lim.permitido) return new Response(...lim.respuesta);
 */

type Ventana = { conteo: number; expira: number };

const bucket = new Map<string, Ventana>();
const MAX_CLAVES = 10_000;  // Tope para evitar memory leak

/** Cliente IP desde headers comunes detrás de proxies (Vercel, Cloudflare). */
export function obtenerIp(req: Request): string {
    const h = req.headers;
    return (
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        h.get('x-real-ip') ||
        h.get('cf-connecting-ip') ||
        '127.0.0.1'
    );
}

export interface OpcionesLimite {
    /** Identificador del endpoint o acción (verify, login, comentario, etc.). */
    id: string;
    /** Máximo de peticiones permitidas en la ventana. */
    max: number;
    /** Tamaño de la ventana en milisegundos. */
    ventanaMs: number;
    /** Llave adicional opcional (p. ej. user_id) para gatear por sesión. */
    sufijo?: string;
}

export interface ResultadoLimite {
    permitido: boolean;
    restantes: number;
    expiraEn: number;  // segundos hasta reset
    respuesta?: { status: number; body: any; headers: Record<string, string> };
}

/**
 * Aplica rate limiting basado en IP + (opcional) sufijo (e.g. user id).
 * Retorna respuesta lista para devolver con NextResponse.
 */
export function aplicarLimite(req: Request, opts: OpcionesLimite): ResultadoLimite {
    const ip = obtenerIp(req);
    const clave = `${opts.id}:${ip}${opts.sufijo ? `:${opts.sufijo}` : ''}`;
    const ahora = Date.now();

    // Limpieza barata: si excede el tope, purgar entradas vencidas.
    if (bucket.size > MAX_CLAVES) {
        for (const [k, v] of bucket) {
            if (v.expira <= ahora) bucket.delete(k);
        }
    }

    let actual = bucket.get(clave);
    if (!actual || actual.expira <= ahora) {
        actual = { conteo: 0, expira: ahora + opts.ventanaMs };
    }

    actual.conteo += 1;
    bucket.set(clave, actual);

    const restantes = Math.max(0, opts.max - actual.conteo);
    const expiraEnSeg = Math.ceil((actual.expira - ahora) / 1000);

    if (actual.conteo > opts.max) {
        return {
            permitido: false,
            restantes: 0,
            expiraEn: expiraEnSeg,
            respuesta: {
                status: 429,
                body: { error: `Demasiadas solicitudes. Intenta de nuevo en ${expiraEnSeg}s.` },
                headers: {
                    'Retry-After': String(expiraEnSeg),
                    'X-RateLimit-Limit': String(opts.max),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.floor(actual.expira / 1000)),
                },
            },
        };
    }

    return { permitido: true, restantes, expiraEn: expiraEnSeg };
}
