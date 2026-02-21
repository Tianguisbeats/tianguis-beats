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

    // Siempre incluimos el MP3 de alta calidad (si existe)
    if (beat.mp3_url) {
        const mp3Url = await getDownloadUrl('beats-mp3-alta-calidad', beat.mp3_url);
        if (mp3Url) links.push({ label: 'Archivo MP3 (Alta Calidad)', url: mp3Url });
    }

    // WAV para Premium, Ilimitada y Exclusiva
    if (['premium', 'unlimited', 'exclusive'].includes(licenseType) && beat.wav_url) {
        const wavUrl = await getDownloadUrl('beats-wav', beat.wav_url);
        if (wavUrl) links.push({ label: 'Archivo WAV (Masterizado)', url: wavUrl });
    }

    // STEMS para Ilimitada y Exclusiva
    if (['unlimited', 'exclusive'].includes(licenseType) && beat.stems_url) {
        const stemsUrl = await getDownloadUrl('beats-stems', beat.stems_url);
        if (stemsUrl) links.push({ label: 'Trackouts / Stems (Pistas)', url: stemsUrl });
    }

    return links;
}

/**
 * Genera el enlace de descarga para un Sound Kit.
 */
export async function getSoundKitFulfillmentLink(kit: { title?: string; file_url?: string }) {
    if (!kit.file_url) return null;

    const url = await getDownloadUrl('sound-kits', kit.file_url);
    if (url) {
        return { label: `Descargar ${kit.title}`, url };
    }

    return null;
}
