import { jsPDF } from 'jspdf';
import { generateLicenseText, LicenseType } from './licenses';

interface LicenseExportParams {
    type: LicenseType;
    producerName: string;
    buyerName: string;
    productName: string;
    purchaseDate: string;
    amount: number;
    orderId: string;
}

/**
 * Genera y descarga un PDF de la licencia.
 */
export const downloadLicensePDF = (params: LicenseExportParams) => {
    const doc = new jsPDF();

    // Configuración estética
    doc.setFillColor(15, 15, 20); // Tema oscuro que coincide con la app
    doc.rect(0, 0, 210, 297, 'F');

    // Encabezado
    doc.setTextColor(167, 139, 250); // Accent color
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('TIANGUIS BEATS', 20, 30);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('CERTIFICADO OFICIAL DE LICENCIA COMERCIAL', 20, 38);

    doc.setDrawColor(167, 139, 250, 0.2);
    doc.line(20, 45, 190, 45);

    // Contenido
    const licenseText = generateLicenseText(params.type, {
        producerName: params.producerName,
        buyerName: params.buyerName,
        productName: params.productName,
        purchaseDate: params.purchaseDate,
        amount: params.amount.toString(),
        orderId: params.orderId
    });

    doc.setFontSize(11);
    doc.setTextColor(200, 200, 200);

    const splitText = doc.splitTextToSize(licenseText, 170);

    let y = 60;
    const pageHeight = 297;
    const marginBottom = 30;

    for (let i = 0; i < splitText.length; i++) {
        if (y > pageHeight - marginBottom) {
            // Generar pie de página en la hoja actual
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Identificador de Verificación: ${params.orderId.toUpperCase()}-${Date.now()}`, 20, pageHeight - 15);

            // Nueva página
            doc.addPage();
            doc.setFillColor(15, 15, 20); // Mantener fondo oscuro
            doc.rect(0, 0, 210, 297, 'F');

            y = 25; // Resetear posición Y
            doc.setFontSize(11);
            doc.setTextColor(200, 200, 200);
        }

        doc.text(splitText[i], 20, y);
        y += 6; // Altura de línea
    }

    // Pie de página en la última hoja
    if (y < pageHeight - marginBottom) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Este documento es una representación digital del contrato oficial celebrado entre las partes.', 20, y + 15);
        doc.text(`Identificador de Verificación: ${params.orderId.toUpperCase()}-${Date.now()}`, 20, y + 20);
    }

    // Guardar
    doc.save(`Licencia_${params.productName.replace(/[^a-zA-Z0-9]/g, '_')}_TB.pdf`);
};
