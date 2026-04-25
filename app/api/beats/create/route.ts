import { NextRequest, NextResponse } from 'next/server';
import { obtenerSupabaseAdmin, obtenerUsuarioDesdeRequest } from '@/lib/supabase-admin';
import { aplicarLimite } from '@/lib/rate-limit';
import { esquemaBeatNuevo, parsearOEnviarError } from '@/lib/schemas';

/**
 * POST /api/beats/create
 *
 * Endpoint server-side para insertar un beat con validación completa.
 * Funciona como complemento al trigger Postgres `validar_beat_antes_insertar`:
 * el trigger es la última línea de defensa, este endpoint da errores
 * más amigables y validación de zod antes de tocar la BD.
 *
 * Reglas:
 *   - Requiere sesión activa.
 *   - productor_id se toma del JWT, NUNCA del body (anti-spoof).
 *   - El tier de suscripción del productor debe permitir las licencias
 *     activadas (mismo check que el trigger, pero antes de la query).
 *   - Si una licencia paga está activa, su precio debe ser > 0.
 *   - Rate limit: 30 beats por hora por usuario (anti-spam).
 */
export async function POST(req: NextRequest) {
    // 1. Autenticación
    const usuario = await obtenerUsuarioDesdeRequest(req);
    if (!usuario) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Rate limit (por usuario)
    const lim = aplicarLimite(req, {
        id: 'beats-create',
        max: 30,
        ventanaMs: 60 * 60 * 1000,
        sufijo: usuario.id,
    });
    if (!lim.permitido && lim.respuesta) {
        return NextResponse.json(lim.respuesta.body, { status: lim.respuesta.status, headers: lim.respuesta.headers });
    }

    // 3. Validación del payload con zod
    let payload: any;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const r = parsearOEnviarError(esquemaBeatNuevo, payload);
    if (!r.ok) {
        return NextResponse.json({ error: r.error, detalles: r.detalles }, { status: r.status });
    }
    const datos = r.data;

    // 4. Verificar tier de suscripción del productor (defensa contra bypass del trigger)
    const supabaseAdmin = obtenerSupabaseAdmin();
    const { data: perfil, error: perfilErr } = await supabaseAdmin
        .from('perfiles')
        .select('id, nivel_suscripcion')
        .eq('id', usuario.id)
        .single();

    if (perfilErr || !perfil) {
        return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    const tier = (perfil.nivel_suscripcion || 'free').toLowerCase();
    const intentaPagas =
        datos.es_pro_activa ||
        datos.es_premium_activa ||
        datos.es_exclusiva_estandar_activa ||
        datos.es_exclusiva_premium_activa;

    if (tier === 'free' && intentaPagas) {
        return NextResponse.json({
            error: 'Tu plan Free no permite vender licencias Pro, Premium o Exclusivas. Activa Pro o Premium en /pricing.',
        }, { status: 403 });
    }

    if (datos.es_exclusiva_premium_activa && tier !== 'premium') {
        return NextResponse.json({
            error: 'Solo productores Premium pueden vender la licencia Exclusiva Premium.',
        }, { status: 403 });
    }

    // 5. Insert del beat — productor_id desde la sesión, NUNCA del body
    const { data: beatNuevo, error: insertErr } = await supabaseAdmin
        .from('beats')
        .insert({
            ...datos,
            productor_id: usuario.id, // ← clave: tomado del JWT
        })
        .select('id, titulo, fecha_creacion')
        .single();

    if (insertErr) {
        // Errores del trigger Postgres llegan aquí con mensajes en español
        return NextResponse.json({
            error: insertErr.message || 'Error al crear el beat',
        }, { status: 400 });
    }

    return NextResponse.json({ ok: true, beat: beatNuevo }, { status: 201 });
}
