export async function generarComprobanteAdminPDF(order: any) {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TIANGUIS BEATS', 15, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprobante Administrativo de Pago', 140, 20);
    doc.text(new Date().toLocaleDateString('es-MX'), 140, 28);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalles de la Transacción', 15, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID de Orden: ${order.orden_pedido || order.id}`, 15, 65);
    doc.text(`Fecha: ${new Date(order.created_at).toLocaleString()}`, 15, 72);
    doc.text(`Estado: Pago Verificado (${order.payment_method})`, 15, 79);

    doc.setFont('helvetica', 'bold');
    doc.text('Comprador:', 120, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(order.comprador?.nombre_artistico || order.comprador?.nombre_usuario || 'Cliente', 120, 72);
    doc.text(order.comprador?.correo || 'Sin correo', 120, 79);

    const tableBody = order.items.map((item: any) => [
        item.name,
        item.product_type.toUpperCase(),
        `$${Number(item.price).toFixed(2)} ${order.currency}`,
    ]);

    autoTable(doc, {
        startY: 95,
        head: [['Descripción', 'Tipo', 'Monto']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { font: 'helvetica', fontSize: 10 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Total: $${order.total_amount.toFixed(2)} ${order.currency}`, 140, finalY + 15);

    doc.save(`Pedido_${order.orden_pedido || order.id.slice(0, 8)}.pdf`);
}
