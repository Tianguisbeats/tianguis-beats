import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { renderContractToBuffer } from '@/lib/PDFgenerarContratos';
import { fetchLicenseDetails } from '@/lib/license-utils';

/**
 * TIANGUIS BEATS - Advanced Secure Download Engine v3.2 (ESPAÑOL)
 * - REAL Streaming ZIP generation (Non-blocking)
 * - Automatic renaming: [Beat] - [License].ext
 * - Download tracking & IP logging (Columnas en español)
 * - Support for Tianguis ID (orderId)
 */

function toAscii(str: string): string {
    return str.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
        .replace(/[^\x00-\x7F]/g, "_"); // Reemplaza cualquier otro no-ASCII con guion bajo
}

function extractStoragePath(input: string, bucketName: string): string {
    if (!input) return '';
    if (!input.startsWith('http')) return input;

    try {
        const url = new URL(input);
        const pathname = url.pathname;
        const storageRegex = /\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/]+)\/(.+)/;
        const match = pathname.match(storageRegex);
        if (match) return decodeURIComponent(match[2]);
    } catch (e) {
        console.error('[Download API] Error parsing storage URL:', e);
    }

    const bucketMarker = `/${bucketName}/`;
    const idx = input.indexOf(bucketMarker);
    if (idx !== -1) return decodeURIComponent(input.substring(idx + bucketMarker.length));

    return decodeURIComponent(input);
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const txId = searchParams.get('txId');
    const orderId = searchParams.get('orderId');

    if (!txId && !orderId) {
        return NextResponse.json({ error: 'Faltan parámetros de identificación' }, { status: 400 });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const supabaseClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Obtener transacciones validando pago
        let query = supabaseAdmin.from('transacciones').select('*');
        if (orderId) query = query.eq('orden_pedido', orderId);
        else query = query.eq('id', txId);

        const { data: transactions, error: txError } = await query
            .eq('comprador_id', user.id)
            .in('estado_pago', ['paid', 'pagado', 'succeeded', 'completed', 'completado']);

        if (txError || !transactions || transactions.length === 0) {
            console.error('[Download API] Error finding transactions:', { txId, orderId, error: txError });
            return NextResponse.json({ error: 'Orden no encontrada o no ha sido pagada' }, { status: 404 });
        }

        const filesToDownload: { bucket: string, path: string, productName: string }[] = [];
        
        // Iterar sobre todos los items de la orden (soporta descargas múltiples en un solo ZIP)
        for (const txItem of transactions) {
            const txIdForLoop = txItem.id;
            let product: any = null;
            let kit: any = null;
            const tipoProducto = (txItem.tipo_producto || '').toLowerCase();

            if (tipoProducto === 'beat') {
                const beatId = txItem.producto_uuid || txItem.producto_id;
                const uuidMatch = beatId?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                const finalId = uuidMatch ? uuidMatch[1] : beatId;
                const { data } = await supabaseAdmin.from('beats').select('*').eq('id', finalId).maybeSingle();
                product = data;
            } else if (['sound_kit', 'soundkit', 'kit_sonido'].includes(tipoProducto)) {
                const kitId = txItem.producto_uuid || txItem.producto_id;
                const uuidMatch = kitId?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                const finalId = uuidMatch ? uuidMatch[1] : kitId;
                const { data } = await supabaseAdmin.from('kits_sonido').select('*').eq('id', finalId).maybeSingle();
                kit = data;
            }

            if (!product && !kit) continue;

            let licenseTypeStr = (txItem.tipo_licencia || '').toLowerCase().trim();
            const normalizedLicense = licenseTypeStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            const isFree = /gratis|free|demo/i.test(normalizedLicense);
            const isPro = /pro/i.test(normalizedLicense) && !/premium/i.test(normalizedLicense);
            const isPremium = /premium/i.test(normalizedLicense);
            const isExclusiva = /exclusiv/i.test(normalizedLicense);
            const isIlimitada = /ilimitad|unlimited/i.test(normalizedLicense);

            if (tipoProducto === 'beat' && product) {
                if (isFree && product.archivo_muestra_url) {
                    filesToDownload.push({ bucket: 'muestras_beats', path: extractStoragePath(product.archivo_muestra_url, 'muestras_beats'), productName: product.titulo });
                } else if (!isFree) {
                    if (product.archivo_mp3_url) filesToDownload.push({ bucket: 'beats_mp3', path: extractStoragePath(product.archivo_mp3_url, 'beats_mp3'), productName: product.titulo });
                    if ((isPro || isPremium || isIlimitada || isExclusiva) && product.archivo_wav_url) 
                        filesToDownload.push({ bucket: 'beats_wav', path: extractStoragePath(product.archivo_wav_url, 'beats_wav'), productName: product.titulo });
                    if ((isPremium || isIlimitada || isExclusiva) && product.archivo_stems_url) 
                        filesToDownload.push({ bucket: 'beats_stems', path: extractStoragePath(product.archivo_stems_url, 'beats_stems'), productName: product.titulo });
                }
            } else if (kit?.url_archivo) {
                filesToDownload.push({ bucket: 'archivos_kits_sonido', path: extractStoragePath(kit.url_archivo, 'archivos_kits_sonido'), productName: kit.titulo });
            }

            // Registrar descarga para este item
            try {
                const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
                await supabaseAdmin.from('transacciones').update({
                    conteo_descargas: (txItem.conteo_descargas || 0) + 1,
                    ultima_descarga_at: new Date().toISOString(),
                    ip_descarga: ip
                }).eq('id', txItem.id);
            } catch (err) {}
        }

        const mainTx = transactions[0];
        const mainProduct:any = null; // We'll look it up if needed for name
        const mainLicense = (mainTx.tipo_licencia || 'DOWNLOAD').toUpperCase();

        if (filesToDownload.length === 0) {
            console.error('[Download API] No files found for items:', { orderId, txId });
            return NextResponse.json({ error: 'No hay archivos disponibles en el servidor para este nivel de licencia' }, { status: 404 });
        }

        // 4. Preparar REAL STREAM con TransformStream

        // --- DESCARGA DIRECTA PARA BÁSICA Y GRATIS (SI ES SOLO 1 ARCHIVO) ---
        if (filesToDownload.length === 1) {
            const singleFile = filesToDownload[0];
            const { data, error } = await supabaseAdmin.storage.from(singleFile.bucket).download(singleFile.path);

            if (error || !data) {
                console.error(`[Download API] Failed to download single file ${singleFile.path}:`, error);
                return NextResponse.json({ error: 'Error al obtener el archivo del servidor' }, { status: 500 });
            }

            const extension = singleFile.path.split('.').pop();
            const rawFilename = `TIANGUIS BEATS - ${singleFile.productName || 'Archivo'} - ${mainLicense}.${extension}`;
            const asciiFilename = toAscii(rawFilename);
            const encodedFilename = encodeURIComponent(rawFilename);

            return new NextResponse(data, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${asciiFilename.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`,
                    'Cache-Control': 'no-cache',
                }
            });
        }

        // --- DESCARGA EN ZIP PARA LICENCIAS SUPERIORES O KITS ---
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('data', chunk => writer.write(chunk));
        archive.on('end', () => writer.close());
        archive.on('error', err => {
            console.error('[Download API] Archiver error:', err);
            writer.abort(err);
        });

        // Proceso de empaquetado asíncrono
        (async () => {
            try {
                for (const file of filesToDownload) {
                    const { data, error } = await supabaseAdmin.storage.from(file.bucket).download(file.path);
                    if (error || !data) {
                        console.error(`[Download API] Failed to download ${file.path} from ${file.bucket}:`, error);
                        continue;
                    }
                    const extension = file.path.split('.').pop();
                    const cleanLabel = `Tianguis Beats - ${file.productName || 'Archivo'}.${extension}`;
                    archive.append(Buffer.from(await data.arrayBuffer()), { name: cleanLabel });
                }

                // Generar e incluir Licencia PDF dinámicamente
                try {
                    const licenseDetails = await fetchLicenseDetails(supabaseAdmin, mainTx);
                    if (licenseDetails) {
                        const pdfBuffer = await renderContractToBuffer(licenseDetails);
                        const pdfName = licenseDetails.pdfName || `LICENCIA_CONTRACTUAL_${toAscii(licenseDetails.productName || 'TIANGUIS')}_${mainTx.orden_pedido || mainTx.id.slice(-8)}.pdf`;
                        archive.append(pdfBuffer, { name: pdfName });
                    }
                } catch (pdfErr) {
                    console.error('[Download API] Error appending license PDF to ZIP:', pdfErr);
                }

                await archive.finalize();
            } catch (err) {
                console.error('[Download API] Stream internal error:', err);
                archive.destroy(err as Error);
            }
        })();

        const rawZipFilename = `Tianguis Beats - ${mainTx.orden_pedido || 'Pedido'} - ${mainLicense}.zip`;
        const asciiZipFilename = toAscii(rawZipFilename);
        const encodedZipFilename = encodeURIComponent(rawZipFilename);

        return new NextResponse(readable, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${asciiZipFilename.replace(/"/g, '')}"; filename*=UTF-8''${encodedZipFilename}`,
                'Cache-Control': 'no-cache',
            }
        });

    } catch (err: any) {
        console.error('[Download API] Global Error:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
