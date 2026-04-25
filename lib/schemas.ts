import { z } from 'zod';

/**
 * TIANGUIS BEATS — Esquemas Zod (Validación Centralizada)
 *
 * Una sola fuente de verdad para validar entradas:
 *   - APIs server-side (parsear req.json() y rechazar al instante)
 *   - Formularios cliente (vía react-hook-form + zodResolver)
 *
 * Mensajes de error EN ESPAÑOL — se muestran directamente al usuario.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const uuid = z.string().uuid({ message: 'Identificador inválido' });
const precioMxn = z.number({ message: 'Debe ser un número' })
    .nonnegative({ message: 'No puede ser negativo' })
    .max(999_999, { message: 'Excede el máximo permitido' });

// ─────────────────────────────────────────────────────────────────────────────
// COMENTARIOS / MURO
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaComentarioNuevo = z.object({
    perfil_id: uuid.optional(),
    beat_id: uuid.optional(),
    parent_id: uuid.optional().nullable(),
    contenido: z.string()
        .trim()
        .min(1, { message: 'El comentario no puede estar vacío' })
        .max(1000, { message: 'Máximo 1000 caracteres' }),
}).refine(
    data => !!data.perfil_id || !!data.beat_id,
    { message: 'Falta destino del comentario (perfil o beat)' }
);

export const esquemaAlternarLike = z.object({
    comentario_id: uuid,
});

// ─────────────────────────────────────────────────────────────────────────────
// BEATS / UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaBeatNuevo = z.object({
    titulo: z.string().trim().min(2, { message: 'Mínimo 2 caracteres' }).max(120),
    genero: z.string().trim().max(60).optional().nullable(),
    subgenero: z.string().trim().max(60).optional().nullable(),
    bpm: z.number().int().min(20).max(300).optional().nullable(),
    tono_escala: z.string().trim().max(20).optional().nullable(),
    descripcion: z.string().trim().max(2000).optional().nullable(),
    vibras: z.string().trim().max(200).optional().nullable(),
    moods: z.array(z.string().max(40)).max(10).optional(),
    instrumentos: z.array(z.string().max(40)).max(20).optional(),
    tipos_beat: z.array(z.string().max(40)).max(10).optional(),
    artista_referencia: z.string().trim().max(120).optional().nullable(),

    // Precios (todos en MXN, no negativos)
    precio_gratis_mxn: precioMxn.optional(),
    precio_basica_mxn: precioMxn.optional(),
    precio_pro_mxn: precioMxn.optional(),
    precio_premium_mxn: precioMxn.optional(),
    precio_exclusiva_estandar_mxn: precioMxn.optional(),
    precio_exclusiva_premium_mxn: precioMxn.optional(),

    // Banderas de licencia
    es_gratis_activa: z.boolean().optional(),
    es_basica_activa: z.boolean().optional(),
    es_mp3_activa: z.boolean().optional(),
    es_pro_activa: z.boolean().optional(),
    es_premium_activa: z.boolean().optional(),
    es_exclusiva_estandar_activa: z.boolean().optional(),
    es_exclusiva_premium_activa: z.boolean().optional(),

    es_publico: z.boolean().optional(),

    // URLs (relativas a bucket o absolutas)
    portada_url: z.string().max(500).optional().nullable(),
    archivo_mp3_url: z.string().max(500).optional().nullable(),
    archivo_muestra_url: z.string().max(500).optional().nullable(),
    archivo_wav_url: z.string().max(500).optional().nullable(),
    archivo_stems_url: z.string().max(500).optional().nullable(),
}).refine(
    // Si una licencia paga está activa, su precio debe ser > 0
    d => !d.es_basica_activa || (d.precio_basica_mxn ?? 0) > 0,
    { message: 'Activaste licencia Básica pero el precio es 0', path: ['precio_basica_mxn'] }
).refine(
    d => !d.es_pro_activa || (d.precio_pro_mxn ?? 0) > 0,
    { message: 'Activaste licencia Pro pero el precio es 0', path: ['precio_pro_mxn'] }
).refine(
    d => !d.es_premium_activa || (d.precio_premium_mxn ?? 0) > 0,
    { message: 'Activaste licencia Premium pero el precio es 0', path: ['precio_premium_mxn'] }
).refine(
    d => !d.es_exclusiva_estandar_activa || (d.precio_exclusiva_estandar_mxn ?? 0) > 0,
    { message: 'Activaste Exclusiva Estándar pero el precio es 0', path: ['precio_exclusiva_estandar_mxn'] }
).refine(
    d => !d.es_exclusiva_premium_activa || (d.precio_exclusiva_premium_mxn ?? 0) > 0,
    { message: 'Activaste Exclusiva Premium pero el precio es 0', path: ['precio_exclusiva_premium_mxn'] }
);

export type BeatNuevo = z.infer<typeof esquemaBeatNuevo>;

// ─────────────────────────────────────────────────────────────────────────────
// PERFIL
// ─────────────────────────────────────────────────────────────────────────────

const urlSocialOpcional = z.string().trim().url({ message: 'URL inválida' }).max(500).optional().or(z.literal(''));

export const esquemaActualizarPerfil = z.object({
    nombre_artistico: z.string().trim().max(60).optional().nullable(),
    biografia: z.string().trim().max(500).optional().nullable(),
    pais: z.string().trim().max(60).optional().nullable(),
    enlaces_sociales: z.object({
        instagram: urlSocialOpcional,
        youtube: urlSocialOpcional,
        twitter: urlSocialOpcional,
        tiktok: urlSocialOpcional,
        spotify: urlSocialOpcional,
        applemusic: urlSocialOpcional,
        tidal: urlSocialOpcional,
        amazon: urlSocialOpcional,
    }).partial().optional(),
    colaboraciones_abiertas: z.boolean().optional(),
    texto_cta: z.string().trim().max(120).optional().nullable(),
    url_cta: urlSocialOpcional,
    video_destacado_url: urlSocialOpcional,
});

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaIdentificadorOrden = z.string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{4,64}$/, { message: 'Formato de ID inválido' });

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Parsear con respuesta uniforme para APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parsea un payload con un esquema. Devuelve `{ok:true, data}` o
 * `{ok:false, status, error, detalles}` (con códigos para JSON response).
 */
export function parsearOEnviarError<T extends z.ZodTypeAny>(
    esquema: T,
    payload: unknown
): { ok: true; data: z.infer<T> } | { ok: false; status: number; error: string; detalles: any } {
    const r = esquema.safeParse(payload);
    if (r.success) return { ok: true, data: r.data };

    const detalles = r.error.issues.map(i => ({
        campo: i.path.join('.'),
        mensaje: i.message,
    }));

    return {
        ok: false,
        status: 400,
        error: detalles[0]?.mensaje || 'Datos inválidos',
        detalles,
    };
}
