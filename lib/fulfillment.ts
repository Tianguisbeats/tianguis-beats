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

function extractStoragePath(input: string): string {
    if (!input) return '';
    // Si no es una URL, ya es un path relativo
    if (!input.startsWith('http')) return input;

    try {
        // Las URLs de Supabase siguen el patrón: .../storage/v1/object/[public|authenticated|sign]/[bucket]/[path...]
        const storageToken = '/storage/v1/object/';
        const index = input.indexOf(storageToken);

        if (index !== -1) {
            const afterObject = input.substring(index + storageToken.length);
            const pathParts = afterObject.split('/');

            // pathParts[0] = 'public' | 'authenticated' | 'sign'
            // pathParts[1] = bucket_name
            // pathParts[2...] = the actual file path
            if (pathParts.length > 2) {
                return pathParts.slice(2).join('/');
            }
        }

        // Fallback antiguo por si acaso
        const publicParts = input.split('/storage/v1/object/public/');
        if (publicParts.length > 1) {
            const pathWithBucket = publicParts[1];
            const firstSlash = pathWithBucket.indexOf('/');
            return pathWithBucket.substring(firstSlash + 1);
        }
    } catch (e) {
        console.error("[Fulfillment] Error parsing storage path:", e);
    }
    return input;
}

/**
 * Genera una URL firmada para un archivo específico.
 */
async function getDownloadUrl(
    bucket: string,
    path: string,
    expiresIn: number = 86400
): Promise<string | null> {
    try {
        const cleanPath = extractStoragePath(path);
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .createSignedUrl(cleanPath, expiresIn);

        if (error) {
            console.error(`[Fulfillment] Error al generar URL firmada en ${bucket} para ${cleanPath}:`, error.message);
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
export async function getBeatFulfillmentLinks(item: any, licenseType: string) {
    const links: { label: string, url: string }[] = [];
    const type = licenseType.toLowerCase();

    // Extraer URLs de los metadatos o del objeto ítem
    const files = {
        sample: item.archivo_muestra_url || item.metadata?.archivo_muestra_url || item.metadata?.muestra_url,
        mp3: item.mp3_url || item.archivo_mp3_url || item.metadata?.archivo_mp3_url || item.metadata?.mp3_url,
        wav: item.wav_url || item.archivo_wav_url || item.metadata?.archivo_wav_url || item.metadata?.wav_url,
        stems: item.stems_url || item.archivo_stems_url || item.metadata?.archivo_stems_url || item.metadata?.stems_url
    };

    // Lógica por tipo de licencia:
    // 1. FREE / GRATIS: Solo muestra (tagged)
    if (type === 'free' || type === 'gratis') {
        if (files.sample) {
            const previewUrl = await getDownloadUrl('muestras_beats', files.sample);
            if (previewUrl) links.push({ label: 'Archivo de Muestra (Tagged)', url: previewUrl });
        }
        return links;
    }

    // 2. BÁSICA (MP3): Solo MP3 de alta calidad
    if (type === 'mp3' || type === 'básica' || type === 'basica' || type === 'basic') {
        if (files.mp3) {
            const mp3Url = await getDownloadUrl('beats_mp3', files.mp3);
            if (mp3Url) links.push({ label: 'Archivo MP3 (Alta Calidad)', url: mp3Url });
        }
        return links;
    }

    // 3. PRO (WAV): Solo WAV
    if (type === 'pro') {
        if (files.wav) {
            const wavUrl = await getDownloadUrl('beats_wav', files.wav);
            if (wavUrl) links.push({ label: 'Archivo WAV (Masterizado)', url: wavUrl });
        }
        return links;
    }

    // 4. PREMIUM / ILIMITADA / EXCLUSIVA: Todos los archivos disponibles
    const isHighTier = ['premium', 'ilimitada', 'unlimited', 'exclusiva', 'exclusive'].includes(type);
    if (isHighTier) {
        if (files.mp3) {
            const mp3Url = await getDownloadUrl('beats_mp3', files.mp3);
            if (mp3Url) links.push({ label: 'Archivo MP3 (Alta Calidad)', url: mp3Url });
        }
        if (files.wav) {
            const wavUrl = await getDownloadUrl('beats_wav', files.wav);
            if (wavUrl) links.push({ label: 'Archivo WAV (Masterizado)', url: wavUrl });
        }
        if (files.stems) {
            const stemsUrl = await getDownloadUrl('beats_stems', files.stems);
            if (stemsUrl) links.push({ label: 'ZIP de los STEMS (Pistas)', url: stemsUrl });
        }
    }

    return links;
}

/**
 * Genera el enlace de descarga para un Sound Kit.
 */
export async function getSoundKitFulfillmentLink(kit: any) {
    const filePath = kit.url_archivo || kit.archivo_url || kit.file_url || kit.metadata?.archivo_url || kit.metadata?.file_url;
    if (!filePath) return null;

    const url = await getDownloadUrl('archivos_kits_sonido', filePath);
    if (url) {
        return { label: `Descargar ${kit.name || kit.title || 'Sound Kit'}`, url };
    }

    return null;
}
