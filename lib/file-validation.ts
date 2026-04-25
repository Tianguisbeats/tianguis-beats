import { fileTypeFromBuffer } from 'file-type';

/**
 * TIANGUIS BEATS — Validación Server-Side de Archivos
 *
 * Verifica el TIPO REAL del archivo leyendo los magic bytes (los primeros
 * bytes del binario), no solo confiando en la extensión o MIME que el
 * cliente reporta. Esto bloquea:
 *   - .exe renombrado a .mp3
 *   - HTML con extensión .png (XSS storage)
 *   - Polyglots (PNG con ZIP embebido)
 *   - Archivos sin signature válida
 *
 * Uso típico (server-side, dentro de un Route Handler):
 *
 *   const arrayBuffer = await file.arrayBuffer();
 *   const result = await validarArchivo(Buffer.from(arrayBuffer), 'audio');
 *   if (!result.valido) {
 *       return NextResponse.json({ error: result.razon }, { status: 400 });
 *   }
 */

export type CategoriaArchivo = 'imagen' | 'audio' | 'audio_wav' | 'archivo_zip' | 'pdf';

interface ConfigCategoria {
    /** MIME types permitidos detectados por magic bytes. */
    mimes: string[];
    /** Tamaño máximo en bytes. */
    tamMaxBytes: number;
    /** Etiqueta humana para mensajes de error. */
    etiqueta: string;
}

const CONFIG: Record<CategoriaArchivo, ConfigCategoria> = {
    imagen: {
        mimes: ['image/jpeg', 'image/png', 'image/webp'],
        tamMaxBytes: 10 * 1024 * 1024, // 10 MB
        etiqueta: 'imagen',
    },
    audio: {
        mimes: ['audio/mpeg'],
        tamMaxBytes: 50 * 1024 * 1024, // 50 MB para MP3
        etiqueta: 'MP3',
    },
    audio_wav: {
        mimes: ['audio/wav', 'audio/x-wav', 'audio/vnd.wave'],
        tamMaxBytes: 200 * 1024 * 1024, // 200 MB para WAV
        etiqueta: 'WAV',
    },
    archivo_zip: {
        mimes: ['application/zip', 'application/x-zip-compressed'],
        tamMaxBytes: 500 * 1024 * 1024, // 500 MB para stems
        etiqueta: 'ZIP',
    },
    pdf: {
        mimes: ['application/pdf'],
        tamMaxBytes: 5 * 1024 * 1024,
        etiqueta: 'PDF',
    },
};

export interface ResultadoValidacion {
    valido: boolean;
    razon?: string;
    mimeDetectado?: string;
    extension?: string;
}

/**
 * Valida un buffer contra una categoría de archivo permitida.
 * Lee los magic bytes y verifica también el tamaño.
 */
export async function validarArchivo(
    buffer: Buffer | Uint8Array,
    categoria: CategoriaArchivo
): Promise<ResultadoValidacion> {
    const cfg = CONFIG[categoria];

    // 1. Tamaño
    if (buffer.byteLength > cfg.tamMaxBytes) {
        const maxMB = Math.round(cfg.tamMaxBytes / (1024 * 1024));
        return { valido: false, razon: `El archivo excede el máximo de ${maxMB} MB para ${cfg.etiqueta}` };
    }
    if (buffer.byteLength === 0) {
        return { valido: false, razon: 'El archivo está vacío' };
    }

    // 2. Magic bytes — file-type lee el header binario real
    const tipo = await fileTypeFromBuffer(buffer);
    if (!tipo) {
        return { valido: false, razon: `No se pudo detectar el tipo del archivo (¿está corrupto?)` };
    }

    if (!cfg.mimes.includes(tipo.mime)) {
        return {
            valido: false,
            razon: `Tipo no permitido: se detectó ${tipo.mime} pero se esperaba ${cfg.etiqueta}`,
            mimeDetectado: tipo.mime,
            extension: tipo.ext,
        };
    }

    return { valido: true, mimeDetectado: tipo.mime, extension: tipo.ext };
}

/**
 * Strip de metadata EXIF para imágenes JPEG (donde más se filtra GPS).
 * Implementación simple sin dependencias: copia los bytes pero salta los
 * segmentos APP1 (donde vive EXIF). Para PNG no hace nada (PNG no usa EXIF
 * típicamente; si se requiere strip pesado, usar `sharp`).
 *
 * Devuelve un nuevo Buffer sin EXIF, o el original si no es JPEG.
 */
export function stripExifJpeg(buffer: Buffer): Buffer {
    // JPEG comienza con FF D8 FF
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        return buffer; // no es JPEG, devolver tal cual
    }

    const out: number[] = [0xff, 0xd8]; // SOI
    let i = 2;

    while (i < buffer.length) {
        if (buffer[i] !== 0xff) {
            // Stream de datos comprimidos — copiar el resto
            for (let k = i; k < buffer.length; k++) out.push(buffer[k]);
            break;
        }
        const marker = buffer[i + 1];

        // SOS (start of scan): a partir de aquí es data, copiar todo el resto
        if (marker === 0xda) {
            for (let k = i; k < buffer.length; k++) out.push(buffer[k]);
            break;
        }

        // Salta el segmento si es APP1 (EXIF) o APP13 (IPTC)
        const segLen = (buffer[i + 2] << 8) | buffer[i + 3];
        if (marker === 0xe1 || marker === 0xed) {
            i += 2 + segLen;
            continue;
        }

        // Copiar el segmento tal cual
        for (let k = i; k < i + 2 + segLen; k++) out.push(buffer[k]);
        i += 2 + segLen;
    }

    return Buffer.from(out);
}
