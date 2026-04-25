export const LICENSE_PREVIEW_TYPES = [
    { key: 'gratis', label: 'Licencia Gratis', color: 'slate' },
    { key: 'basica', label: 'Licencia Básica', color: 'emerald' },
    { key: 'pro', label: 'Licencia Pro', color: 'blue' },
    { key: 'premium', label: 'Licencia Premium', color: 'rose' },
    { key: 'exclusiva', label: 'Exclusiva Estándar', color: 'purple' },
    { key: 'exclusiva_premium', label: 'Exclusiva Premium', color: 'rose' },
    { key: 'soundkits', label: 'Contrato Sound Kit', color: 'amber' },
] as const;

interface OpcionesLicensePreview {
    onInfo?: (mensaje: string) => void;
    onError?: (mensaje: string) => void;
    onExito?: (mensaje: string) => void;
}

export function useLicensePreview(opts: OpcionesLicensePreview = {}) {
    const handleDownloadPreview = async (type: string) => {
        try {
            opts.onInfo?.(`Generando previsualización de ${type}...`);

            const { getDefaultSpanishText } = await import('@/lib/license-utils');
            const { default: jsPDF } = await import('jspdf');

            const mockData = {
                beatTitle: '[NOMBRE_DEL_BEAT]',
                prodNombre: '[NOMBRE_COMPLETO_PRODUCTOR]',
                prodArtistico: '[NOMBRE_ARTISTICO_PRODUCTOR]',
            };

            const fullText = getDefaultSpanishText(type, mockData.beatTitle, mockData.prodNombre, mockData.prodArtistico);
            const doc = new jsPDF();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            const splitText = doc.splitTextToSize(fullText, 180);

            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text('TIANGUIS BEATS - PREVISUALIZACIÓN DE CONTRATO', 15, 15);
            doc.setFontSize(8);
            doc.text(`TIPO DE CONTRATO: ${type.toUpperCase()}`, 15, 22);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(splitText, 15, 45);

            doc.save(`PREVIEW_${type.toUpperCase()}_v2.pdf`);
            opts.onExito?.('Previsualización descargada');
        } catch (e) {
            console.error(e);
            opts.onError?.('Error al generar vista previa');
        }
    };

    return {
        licenseTypes: LICENSE_PREVIEW_TYPES,
        handleDownloadPreview,
    };
}
