import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, renderToStream, Font } from '@react-pdf/renderer';
import crypto from 'crypto';
import path from 'path';

/**
 * PDFgenerarVentas.tsx
 * Recibo de Venta (Versión V.F - Final con Cupones)
 */

const styles = StyleSheet.create({
    page: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingHorizontal: 0,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        zIndex: -1,
    },
    container: {
        paddingTop: 160,
        paddingLeft: 60,
        paddingRight: 100,
        paddingBottom: 150,
        flex: 1,
    },
    headerInfoBlock: {
        position: 'absolute',
        top: 100,
        right: 100,
        textAlign: 'right',
        width: 300,
    },
    orderLabel: {
        fontSize: 10,
        color: '#64748B',
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    orderValue: {
        fontSize: 13,
        color: '#0F172A',
        fontFamily: 'Helvetica-Bold',
        marginTop: 2,
    },
    dateLabel: {
        fontSize: 8,
        color: '#64748B',
        textTransform: 'uppercase',
        marginTop: 8,
        fontFamily: 'Helvetica-Bold',
    },
    dateValue: {
        fontSize: 10,
        color: '#334155',
        marginTop: 2,
    },
    partiesCol: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        marginBottom: 35,
    },
    partyBox: {
        width: '46%',
    },
    sectionLabel: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#475569',
        textTransform: 'uppercase',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 3,
    },
    realName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
    },
    artisticName: {
        fontSize: 9,
        color: '#2563EB',
        fontFamily: 'Helvetica-Bold',
        marginTop: 2,
    },
    email: {
        fontSize: 9,
        color: '#64748B',
        marginTop: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#0F172A',
        paddingBottom: 6,
        marginBottom: 8,
        marginTop: 10,
    },
    tableHeaderText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    colConcept: { flex: 3 },
    colImport: { flex: 1, textAlign: 'right' },
    prodTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
    },
    prodSub: {
        fontSize: 8,
        color: '#64748B',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    priceVal: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
    },
    totalsArea: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    totalsSubBox: {
        width: '40%',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    summaryLabel: {
        fontSize: 9,
        color: '#64748B',
    },
    summaryVal: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
    },
    finalTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#2563EB',
    },
    finalTotalLabel: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
        textTransform: 'uppercase',
    },
    finalTotalVal: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#2563EB',
    },
    stripeProcess: {
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'right',
        marginTop: 6,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 60,
        right: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 15,
    },
    footerInfo: {
        flex: 1,
    },
    footerMainTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#0F172A',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    footerText: {
        fontSize: 8,
        color: '#64748B',
        lineHeight: 1.3,
    },
    securityHash: {
        fontSize: 5,
        fontFamily: 'Courier',
        color: '#CBD5E1',
        marginTop: 8,
    },
    stripeIdSub: {
        fontSize: 7,
        fontFamily: 'Courier',
        color: '#94A3B8',
        marginTop: 2,
    }
});

export interface SalesNoteItem {
    name: string;
    type: string;
    license?: string;
    priceUnit?: string;
    price: string;
    discount?: string;
}

export interface SalesNoteData {
    orderId: string;
    stripeId?: string;
    transactionDate: string;
    items: SalesNoteItem[];
    subtotal: string;
    descuento?: string;
    couponCode?: string;
    total: string;
    metodoPago?: string;
    sellerRealName: string;
    sellerArtisticName: string;
    sellerEmail: string;
    buyerRealName: string;
    buyerArtisticName?: string;
    buyerEmail: string;
}

const generateHash = (data: string) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};
const SalesNoteDocument = ({ data }: { data: SalesNoteData }) => {
    const securityHash = generateHash(`${data.orderId}-${data.buyerEmail}-${data.transactionDate}`);

    return (
        <Document title={`${data.orderId} - Tianguis Beats - Recibo.pdf`}>
            <Page size="A4" style={styles.page}>
                <Image 
                    src={path.join(process.cwd(), 'public', 'hoja_ventas.png')} 
                    style={styles.background} 
                    fixed
                />

                <View style={styles.container}>
                    {/* Encabezado Superior Derecho - Solo en primera página */}
                    <View style={styles.headerInfoBlock}>
                        <Text style={styles.orderLabel}>ID de Orden</Text>
                        <Text style={styles.orderValue}>{data.orderId.toUpperCase()}</Text>
                        <Text style={styles.dateLabel}>Fecha de Emisión</Text>
                        <Text style={styles.dateValue}>{data.transactionDate}</Text>
                    </View>

                    {/* Vendedor / Comprador - Solo en primera página */}
                    <View style={styles.partiesCol}>
                        <View style={styles.partyBox}>
                            <Text style={styles.sectionLabel}>Vendedor</Text>
                            <Text style={styles.realName}>{data.sellerRealName}</Text>
                            <Text style={styles.artisticName}>{data.sellerArtisticName}</Text>
                            <Text style={styles.email}>{data.sellerEmail}</Text>
                        </View>
                        <View style={[styles.partyBox, { textAlign: 'right' }]}>
                            <Text style={styles.sectionLabel}>Comprador</Text>
                            <Text style={styles.realName}>{data.buyerRealName}</Text>
                            {data.buyerArtisticName && (
                                <Text style={styles.artisticName}>{data.buyerArtisticName}</Text>
                            )}
                            <Text style={styles.email}>{data.buyerEmail}</Text>
                        </View>
                    </View>

                    {/* Tabla de Productos */}
                    <View wrap={true}>
                        <View style={styles.tableHeader} fixed>
                            <Text style={[styles.tableHeaderText, styles.colConcept]}>Productos</Text>
                            <Text style={[styles.tableHeaderText, styles.colImport]}>Importe Unit.</Text>
                        </View>
                        {data.items.map((item, index) => (
                            <View key={index} style={styles.tableRow} wrap={false}>
                                <View style={styles.colConcept}>
                                    <View>
                                        <Text style={styles.prodTitle}>{item.name}</Text>
                                        <Text style={styles.prodSub}>
                                            {item.type} {item.license ? `• Licencia ${item.license}` : ''}
                                        </Text>
                                    </View>
                                    {data.couponCode && (
                                        <Text style={{ fontSize: 7, color: '#3b82f6', fontFamily: 'Helvetica-Bold', marginTop: 4 }}>
                                            Cupón aplicado: {data.couponCode}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.colImport}>
                                    {item.priceUnit && item.discount && (
                                        <Text style={{ fontSize: 7, color: '#94A3B8', textDecoration: 'line-through', marginBottom: 2 }}>
                                            {item.priceUnit}
                                        </Text>
                                    )}
                                    <Text style={styles.priceVal}>{item.price}</Text>
                                    {item.discount && (
                                        <Text style={{ fontSize: 7, color: '#DC2626', fontFamily: 'Helvetica-Bold', marginTop: 2 }}>
                                            - {item.discount}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Área de Totales - Solo en la última página automáticamente al final de la tabla */}
                    <View style={styles.totalsArea} wrap={false}>
                        <View style={styles.totalsSubBox}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryVal}>{data.subtotal}</Text>
                            </View>
                            {data.descuento && (
                                <View style={styles.summaryRow}>
                                    <View>
                                        <Text style={styles.summaryLabel}>Descuento</Text>
                                        {data.couponCode && (
                                            <Text style={{ fontSize: 7, color: '#DC2626', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' }}>
                                                ({data.couponCode})
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={[styles.summaryVal, { color: '#DC2626' }]}>-{data.descuento}</Text>
                                </View>
                            )}
                            <View style={[styles.finalTotalRow, { alignItems: 'center' }]}>
                                <Text style={[styles.finalTotalLabel, { marginRight: 25 }]}>Total Pagado</Text>
                                <Text style={[styles.finalTotalVal, { fontSize: 18 }]}>  {data.total}</Text>
                            </View>
                            <Text style={styles.stripeProcess}>Procesado vía Stripe</Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer} wrap={false}>
                        <View style={styles.footerInfo}>
                            <Text style={styles.footerMainTitle}>Comprobante de Transacción Digital • Tianguis Beats</Text>
                            <Text style={styles.footerText}>
                                Este documento certifica la legalidad de la transacción y la transferencia de derechos según los términos de uso de la plataforma.
                            </Text>
                            {data.stripeId && (
                                <Text style={styles.stripeIdSub}>REF_STRIPE_ID: {data.stripeId}</Text>
                            )}
                            <Text style={styles.securityHash}>AUTH_BLOCK_HASH: {securityHash}</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};


export const renderSalesNoteToBuffer = async (datos: SalesNoteData): Promise<Buffer> => {
    const flujo_pdf = await renderToStream(<SalesNoteDocument data={datos} />);
    const fragmentos_pdf: any[] = [];
    for await (const fragmento of flujo_pdf) { fragmentos_pdf.push(fragmento); }
    return Buffer.concat(fragmentos_pdf);
};
