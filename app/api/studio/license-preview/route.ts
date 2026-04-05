import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderContractToBuffer, ContractData } from '@/lib/PDFgenerarContratos';

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase admin env vars not configured');
    return createClient(url, key);
};

/**
 * API Route: Generar Previsualización Oficial de Licencia
 * Permite al productor descargar un demo del contrato PDF 
 * tal cual se entregará al comprador, con datos de prueba.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, type, settings, name } = body;

        const supabaseAdmin = getSupabaseAdmin();
        const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '');

        // Mock data para el contrato de prueba
        const previewData: ContractData = {
            orderId: `DEMO-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            transactionDate: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
            licenseType: type || 'Licencia Estándar',
            productName: 'Mi Obra Maestra (Beat Demo)',
            price: '$999.00 MXN',
            producerName: name || 'Productor Tianguis',
            producerEmail: 'productor@tianguisbeats.com',
            buyerName: 'Comprador de Prueba',
            buyerEmail: 'cliente@ejemplo.com',
            isCustomText: true,
            customText: text,
            pdfSettings: settings || { fontSize: 10, paddingTop: 27, paddingHorizontal: 10 }
        };

        const pdfBuffer = await renderContractToBuffer(previewData);

        const filename = `PREVIEW_TIANGUIS_${type.toUpperCase()}.pdf`;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('Error en license-preview:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
