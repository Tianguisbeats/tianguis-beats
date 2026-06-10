/**
 * TIANGUIS BEATS — Envío de correos transaccionales (Server-Side)
 *
 * Usa la API REST de Resend (https://resend.com) directamente con fetch,
 * sin dependencias extra. Para activarlo en producción:
 *   1. Crear cuenta en Resend y verificar el dominio tianguisbeats.com.
 *   2. Agregar las variables de entorno:
 *        RESEND_API_KEY = re_xxxxxxxx
 *        EMAIL_FROM     = "Tianguis Beats <notificaciones@tianguisbeats.com>"
 *
 * Si RESEND_API_KEY no está configurada, las funciones NO fallan: simplemente
 * registran el correo en consola y devuelven { enviado: false }. Así el resto
 * de la app sigue funcionando aunque el email aún no esté activado.
 */

const REMITENTE_POR_DEFECTO = 'Tianguis Beats <notificaciones@tianguisbeats.com>';

export interface ResultadoCorreo {
    enviado: boolean;
    motivo?: string;
    id?: string;
}

interface ParametrosCorreo {
    para: string;
    asunto: string;
    html: string;
    texto?: string;
}

/**
 * Envía un correo transaccional. Nunca lanza: ante cualquier problema
 * devuelve { enviado: false, motivo }. Pensado para usarse como
 * "fire-and-forget" desde rutas API sin arriesgar el flujo principal.
 */
export async function enviarCorreoTransaccional({ para, asunto, html, texto }: ParametrosCorreo): Promise<ResultadoCorreo> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const remitente = process.env.EMAIL_FROM?.trim() || REMITENTE_POR_DEFECTO;

    if (!apiKey) {
        console.log(`[EMAIL] (desactivado: falta RESEND_API_KEY) Para: ${para} | Asunto: ${asunto}`);
        return { enviado: false, motivo: 'RESEND_API_KEY no configurada' };
    }
    if (!para || !para.includes('@')) {
        return { enviado: false, motivo: 'Destinatario inválido' };
    }

    try {
        const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: remitente,
                to: [para],
                subject: asunto,
                html,
                ...(texto ? { text: texto } : {}),
            }),
        });

        if (!resp.ok) {
            const detalle = await resp.text().catch(() => '');
            console.error(`[EMAIL] Resend respondió ${resp.status}: ${detalle}`);
            return { enviado: false, motivo: `Resend ${resp.status}` };
        }

        const data = await resp.json().catch(() => ({}));
        return { enviado: true, id: data?.id };
    } catch (err: any) {
        console.error('[EMAIL] Error enviando correo:', err?.message || err);
        return { enviado: false, motivo: 'Excepción de red' };
    }
}

/**
 * Envuelve el contenido en una plantilla HTML simple y consistente con la marca.
 */
export function plantillaCorreo(opciones: {
    titulo: string;
    cuerpoHtml: string;
    textoBoton?: string;
    urlBoton?: string;
}): string {
    const { titulo, cuerpoHtml, textoBoton, urlBoton } = opciones;
    const boton = textoBoton && urlBoton
        ? `<a href="${urlBoton}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:800;padding:14px 28px;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;font-size:13px;margin-top:8px">${textoBoton}</a>`
        : '';

    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border-radius:24px;padding:40px 32px">
      <div style="font-weight:900;font-size:20px;letter-spacing:-0.5px;color:#0a0a0a;margin-bottom:24px">
        TIANGUIS <span style="color:#f97316">BEATS</span>
      </div>
      <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;color:#0a0a0a">${titulo}</h1>
      <div style="font-size:15px;line-height:1.6;color:#3a3a3a">${cuerpoHtml}</div>
      ${boton}
    </div>
    <p style="text-align:center;color:#666;font-size:12px;margin-top:24px">
      Recibiste este correo porque tienes actividad en Tianguis Beats.
    </p>
  </div>
</body></html>`;
}
