import { supabase } from '@/lib/supabase';

interface DownloadLicenseParams {
    orderId: string;
    licenseType: string;
    beatId: string;
    buyerName: string;
    buyerEmail: string;
    productName: string; // Utilizado para el nombre del archivo descargado
    transactionId?: string; // ID específico de la transacción del item
}

export const downloadLicensePDF = async (params: DownloadLicenseParams) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/licencias/generar', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                orderId: params.orderId,
                transactionId: params.transactionId,
                licenseType: params.licenseType,
                beatId: params.beatId,
                buyerName: params.buyerName,
                buyerEmail: params.buyerEmail
            }),
        });

        if (!response.ok) {
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en el servidor de licencias');
            } else {
                // Si es HTML o texto, es un error de Next.js (500)
                throw new Error("El generador de licencias está temporalmente fuera de línea. Reporta este error al soporte técnico.");
            }
        }

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = '';

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        if (!filename) {
            const cleanName = params.productName.trim();
            const normType = params.licenseType.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
            
            if (normType === 'soundkit' || normType === 'sound_kit' || normType === 'soundkits') {
                filename = `Tianguis Beats - ${cleanName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')} - Soundkit.pdf`;
            } else {
                let licenseLabel = 'Basica';
                if (normType.includes('gratis') || normType.includes('free')) licenseLabel = 'Gratis';
                else if (normType.includes('pro')) licenseLabel = 'Pro';
                else if (normType.includes('premium') || normType.includes('ilimitada')) licenseLabel = 'Premium';
                else if (normType.includes('exclusiv')) licenseLabel = 'Exclusiva';

                filename = `Tianguis Beats - ${cleanName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')} - Licencia ${licenseLabel}.pdf`;
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
    } catch (error) {
        console.error('Error al descargar el PDF del contrato:', error);
        throw error;
    }
};

