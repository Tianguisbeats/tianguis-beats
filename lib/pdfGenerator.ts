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

    // Dividir texto para que quepa en el PDF
    const splitText = doc.splitTextToSize(licenseText, 170);
    doc.text(splitText, 20, 60);

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Este documento es una representación digital del contrato aceptado al momento de la compra.', 20, 275);
    doc.text(`Identificador de Verificación: ${params.orderId.toUpperCase()}-${Date.now()}`, 20, 280);

    // Guardar
    doc.save(`Licencia_${params.productName.replace(/\s+/g, '_')}.pdf`);
};
