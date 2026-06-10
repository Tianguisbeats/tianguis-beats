import { NextResponse } from 'next/server';
import { obtenerSupabaseAdmin, obtenerUsuarioDesdeRequest } from '@/lib/supabase-admin';
import { enviarCorreoTransaccional, plantillaCorreo } from '@/lib/email';

/**
 * Envía un correo a la CONTRAPARTE cuando hay un movimiento en una negociación
 * (Mesa de Negociación). Complementa la notificación en tiempo real (campana).
 *
 * Body: { ofertaId: string }
 *
 * La dirección del aviso se infiere de quién hace la petición:
 *   - Si es el COMPRADOR → acaba de crear/renegociar → se avisa al PRODUCTOR.
 *   - Si es el PRODUCTOR → aceptó/rechazó/contraofertó → se avisa al COMPRADOR.
 *
 * Es "best-effort": si el email no está configurado o falla, responde 200 igual
 * (la negociación nunca depende de que el correo se envíe).
 */
export async function POST(req: Request) {
    try {
        const usuario = await obtenerUsuarioDesdeRequest(req);
        if (!usuario) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { ofertaId } = await req.json();
        if (!ofertaId) {
            return NextResponse.json({ error: 'Falta ofertaId' }, { status: 400 });
        }

        const supabase = obtenerSupabaseAdmin();
        const { data: oferta } = await supabase
            .from('ofertas_exclusivas')
            .select('id, beat_id, productor_id, comprador_id, monto_ofertado, estado')
            .eq('id', ofertaId)
            .single();

        if (!oferta) {
            return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
        }

        // Solo las partes de la negociación pueden disparar el aviso
        if (usuario.id !== oferta.productor_id && usuario.id !== oferta.comprador_id) {
            return NextResponse.json({ error: 'No autorizado para esta oferta' }, { status: 403 });
        }

        const esComprador = usuario.id === oferta.comprador_id;
        const idDestinatario = esComprador ? oferta.productor_id : oferta.comprador_id;

        // Datos para armar el correo: email + nombres + título del beat
        const [{ data: destinatario }, { data: actor }, { data: beat }] = await Promise.all([
            supabase.from('perfiles').select('correo, nombre_artistico, nombre_usuario').eq('id', idDestinatario).single(),
            supabase.from('perfiles').select('nombre_artistico, nombre_usuario').eq('id', usuario.id).single(),
            supabase.from('beats').select('titulo').eq('id', oferta.beat_id).single(),
        ]);

        if (!destinatario?.correo) {
            return NextResponse.json({ ok: true, enviado: false, motivo: 'Destinatario sin correo' });
        }

        const nombreActor = actor?.nombre_artistico || actor?.nombre_usuario || (esComprador ? 'Un comprador' : 'El productor');
        const tituloBeat = beat?.titulo || 'tu beat';
        const monto = `$${Math.round(Number(oferta.monto_ofertado)).toLocaleString('es-MX')} MXN`;
        const baseUrl = (process.env.NEXT_PUBLIC_URL || 'https://tianguisbeats.com').replace(/\/$/, '');
        const urlBoton = `${baseUrl}/studio/cupones-ofertas`;

        let asunto: string;
        let titulo: string;
        let cuerpoHtml: string;

        if (esComprador) {
            // El comprador creó o renegoció → avisar al productor
            asunto = `🤝 Nueva oferta por "${tituloBeat}"`;
            titulo = 'Tienes una oferta de negociación';
            cuerpoHtml = `<strong>${nombreActor}</strong> quiere negociar la licencia exclusiva de <strong>"${tituloBeat}"</strong> y ofrece <strong>${monto}</strong>.<br><br>Entra a tu mesa de negociación para aceptar, rechazar o contraofertar.`;
        } else {
            // El productor respondió → avisar al comprador, según el estado
            if (oferta.estado === 'aceptada') {
                asunto = `✅ ${nombreActor} aceptó tu oferta por "${tituloBeat}"`;
                titulo = '¡Tu oferta fue aceptada!';
                cuerpoHtml = `<strong>${nombreActor}</strong> aceptó tu oferta de <strong>${monto}</strong> por la licencia exclusiva de <strong>"${tituloBeat}"</strong>.<br><br>La oferta tiene 48 horas de validez. Completa tu compra antes de que expire.`;
            } else if (oferta.estado === 'rechazada') {
                asunto = `Tu oferta por "${tituloBeat}" fue rechazada`;
                titulo = 'Tu oferta fue rechazada';
                cuerpoHtml = `<strong>${nombreActor}</strong> rechazó tu oferta por <strong>"${tituloBeat}"</strong>.<br><br>Puedes enviar una nueva propuesta desde tu mesa de negociación.`;
            } else {
                asunto = `🔁 ${nombreActor} te contraofertó por "${tituloBeat}"`;
                titulo = 'Recibiste una contraoferta';
                cuerpoHtml = `<strong>${nombreActor}</strong> te envió una contraoferta de <strong>${monto}</strong> por la licencia exclusiva de <strong>"${tituloBeat}"</strong>.<br><br>Entra a responder: acepta o envía una nueva propuesta.`;
            }
        }

        const html = plantillaCorreo({ titulo, cuerpoHtml, textoBoton: 'Ver negociación', urlBoton });
        const resultado = await enviarCorreoTransaccional({ para: destinatario.correo, asunto, html });

        return NextResponse.json({ ok: true, enviado: resultado.enviado, motivo: resultado.motivo });
    } catch (err: any) {
        console.error('[NEGOCIACION/NOTIFICAR] Error:', err?.message || err);
        // Best-effort: nunca propagamos el error al flujo de negociación
        return NextResponse.json({ ok: false, enviado: false }, { status: 200 });
    }
}
