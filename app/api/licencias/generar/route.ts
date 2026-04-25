import { NextRequest, NextResponse } from 'next/server';
import { renderContractToBuffer } from '@/lib/PDFgenerarContratos';
import { fetchLicenseDetails } from '@/lib/license-utils';
import { obtenerSupabaseAdmin, crearClienteUsuario } from '@/lib/supabase-admin';

/**
 * API Route: Generar Licencia PDF (V4)
 * Refactorizada para usar el motor centralizado de licencias.
 */
export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = obtenerSupabaseAdmin();

        // --- VERIFICACIÓN DE SESIÓN (SEGURIDAD CRÍTICA) ---
        const supabaseClient = crearClienteUsuario(req.headers.get('Authorization'));
        if (!supabaseClient) {
            return NextResponse.json({ error: 'No autorizado. Se requiere inicio de sesión.' }, { status: 401 });
        }
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Sesión inválida o expirada.' }, { status: 401 });
        }
        // --------------------------------------------------

        const body = await req.json();
        const { orderId, transactionId, beatId } = body;

        if (!orderId && !transactionId) {
            return NextResponse.json({ error: 'Faltan parámetros id (pago o transacción)' }, { status: 400 });
        }

        let query = supabaseAdmin.from('transacciones').select('*');

        if (transactionId) {
            query = query.eq('id', transactionId);
        } else if (orderId) {
            query = query.or(`orden_pedido.eq.${orderId},pago_id.eq.${orderId}`);
            if (beatId) {
                query = query.eq('producto_id', beatId);
            }
        }

        const { data: tx, error: txError } = await query.limit(1).maybeSingle();

        if (txError || !tx) {
            return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
        }

        // Verificar que el usuario sea el dueño de la orden o el productor
        if (tx.comprador_id !== user.id && tx.vendedor_id !== user.id && tx.productor_id !== user.id) {
            console.warn(`[API Licencias] Intento de acceso no autorizado. Usuario: ${user.id}, Tx: ${tx.id}`);
            return NextResponse.json({ error: 'No tienes permiso para ver esta licencia' }, { status: 403 });
        }

        // 1. Obtener detalles de la licencia usando el utility centralizado
        const licenseDetails = await fetchLicenseDetails(supabaseAdmin, tx);
        
        if (!licenseDetails) {
            return NextResponse.json({ error: 'No se pudieron recuperar los detalles de la licencia' }, { status: 500 });
        }

        // 2. Generar el PDF
        const pdfBuffer = await renderContractToBuffer(licenseDetails);

        // 3. Responder con el archivo
        const filename = licenseDetails.pdfName || `Tianguis_Beats_Contrato_${orderId || tx.id}.pdf`;
        
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('Error al generar PDF de licencia:', error);
        return NextResponse.json({ error: 'Error interno al generar el PDF' }, { status: 500 });
    }
}
