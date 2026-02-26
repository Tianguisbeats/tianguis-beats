import { supabase } from './supabase';

/**
 * TIANGUIS BEATS - Servicio de Cumplimiento (Fulfillment)
 * v1.0 - 2026-02-09
 * Maneja la generación de enlaces de descarga seguros y temporales.
 */

type FileBucket =
    | 'beats-mp3-alta-calidad'
    | 'beats-wav'
    | 'beats-stems'
    | 'sound-kits';

/**
 * Genera una URL firmada para un archivo específico.
 * @param bucket El bucket de almacenamiento
 * @param path La ruta del archivo dentro del bucket
 * @param expiresIn Tiempo de expiración en segundos (default 24h)
 */
async function getDownloadUrl(
    bucket: FileBucket,
    path: string,
    expiresIn: number = 86400
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) {
            console.error(`[Fulfillment] Error al generar URL firmada para ${path}:`, error.message);
            return null;
        }

        return data.signedUrl;
    } catch (err) {
        console.error(`[Fulfillment] Error inesperado:`, err);
        return null;
    }
}

/**
 * Obtiene todos los enlaces de descarga correspondientes a una licencia de beat.
 */
export async function getBeatFulfillmentLinks(beat: { mp3_url?: string; wav_url?: string; stems_url?: string }, licenseType: string) {
    const links: { label: string, url: string }[] = [];
    const type = licenseType.toLowerCase();

    // Siempre incluimos el MP3 para todas las licencias
    if (beat.mp3_url) {
        const mp3Url = await getDownloadUrl('beats_mp3' as any, beat.mp3_url);
        if (mp3Url) links.push({ label: 'Archivo MP3 (Alta Calidad)', url: mp3Url });
    }

    // WAV para Pro, Premium, Ilimitada y Exclusiva
    const allowsWav = ['pro', 'premium', 'ilimitada', 'unlimited', 'exclusiva', 'exclusive'].includes(type);
    if (allowsWav && beat.wav_url) {
        const wavUrl = await getDownloadUrl('beats_wav' as any, beat.wav_url);
        if (wavUrl) links.push({ label: 'Archivo WAV (Masterizado)', url: wavUrl });
    }

    // STEMS solo para Ilimitada y Exclusiva
    const allowsStems = ['ilimitada', 'unlimited', 'exclusiva', 'exclusive'].includes(type);
    if (allowsStems && beat.stems_url) {
        const stemsUrl = await getDownloadUrl('beats_stems' as any, beat.stems_url);
        if (stemsUrl) links.push({ label: 'Trackouts / Stems (Pistas)', url: stemsUrl });
    }

    return links;
}

/**
 * Genera el enlace de descarga para un Sound Kit.
 */
export async function getSoundKitFulfillmentLink(kit: { title?: string; file_url?: string }) {
    if (!kit.file_url) return null;

    const url = await getDownloadUrl('archivos_kits_sonido' as any, kit.file_url);
    if (url) {
        return { label: `Descargar ${kit.title}`, url };
    }

    return null;
}
