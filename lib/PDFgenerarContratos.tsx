import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, renderToStream } from '@react-pdf/renderer';
import crypto from 'crypto';
import path from 'path';

/**
 * NOTA DE ESTABILIDAD:
 * Hemos desactivado el registro de fuentes externas (Montserrat, GreatVibes) para evitar errores 
 * de red "Unknown font format" que ocurren en entornos de servidor (como Vercel) cuando 
 * las fuentes de Google no se descargan correctamente o cambian su formato.
 * 
 * Usamos las fuentes estándar de PDF (Helvetica, Courier, Times) que están integradas 
 * en el motor y garantizan que el PDF se genere SIEMPRE sin dependencias externas.
 */

// Estilos Premium del PDF
const styles = StyleSheet.create({
    page: {
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 50,
        fontFamily: 'Helvetica',
        backgroundColor: '#FAFAFA',
    },
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1,
        opacity: 0.03,
    },
    watermarkText: {
        fontSize: 100,
        color: '#000000',
        transform: 'rotate(-45deg)',
        fontFamily: 'Helvetica-Bold',
        opacity: 0.05,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB',
        paddingBottom: 15,
    },
    logo: {
        width: 140,
        marginBottom: 5,
    },
    headerTextRight: {
        textAlign: 'right',
    },
    docTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    txId: {
        fontSize: 9,
        color: '#6B7280',
        fontFamily: 'Courier',
    },
    partiesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        backgroundColor: '#F3F4F6',
        padding: 15,
        borderRadius: 8,
    },
    partyColumn: {
        width: '45%',
    },
    partyTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#2563EB',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    partyInfo: {
        fontSize: 11,
        color: '#1F2937',
        marginBottom: 3,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        marginTop: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 5,
    },
    bodyText: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#374151',
        textAlign: 'justify',
    },
    limitsContainer: {
        marginTop: 15,
        marginBottom: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    limitRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    limitLabel: {
        width: 200,
        fontSize: 10,
        color: '#6B7280',
    },
    limitValue: {
        flex: 1,
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 50,
        right: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 15,
    },
    sealContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 10,
        borderRadius: 4,
        marginTop: 10,
    },
    sealTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#111827',
        marginBottom: 4,
        textAlign: 'center',
    },
    sealText: {
        fontSize: 7,
        color: '#374151',
        lineHeight: 1.4,
    },
    hashText: {
        fontSize: 7,
        color: '#9CA3AF',
        fontFamily: 'Courier',
    },
    signatureContainer: {
        marginTop: 30,
        width: 200,
        alignItems: 'center',
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#111827',
        width: '100%',
        marginBottom: 5,
    },
    signatureText: {
        fontSize: 8,
        color: '#6B7280',
        textAlign: 'center',
    },
    scriptSignature: {
        fontFamily: 'Times-Italic',
        fontSize: 24,
        color: '#2563EB',
        marginBottom: -10,
    }
});

export interface ContractData {
    orderId: string;
    transactionDate: string;
    licenseType: string;
    productName: string;
    price: string;
    producerName: string;
    producerEmail: string;
    buyerName: string;
    buyerEmail: string;
    isCustomText: boolean;
    customText?: string;
    pdfSettings?: {
        fontSize: number;
        paddingTop: number;
        paddingHorizontal: number;
    };
    incluir_clausulas_pro?: boolean;
    limits?: {
        streams: string;
        copies: string;
        videos: string;
        radio: string;
    };
    // Adiciones para factura (Nota de Venta)
    metodoPago?: string;
    subtotal?: string;
    descuento?: string;
    total?: string;
    compradorId?: string;
}

const generateHash = (data: string) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

const ContractDocument = ({ data }: { data: ContractData }) => {
    const securityHash = generateHash(`${data.orderId}-${data.buyerEmail}-${data.transactionDate}`);
    const logoUrl = "https://tianguisbeats.com/logo-navbar.png";

    const processCustomText = (text: string) => {
        if (!text) return "";
        return text
            .replace(/{ARTISTA}/g, data.buyerName || 'El Artista')
            .replace(/{PRODUCTOR}/g, data.producerName || 'El Productor')
            .replace(/{BEAT}/g, data.productName || 'La Obra Musical')
            .replace(/{FECHA}/g, data.transactionDate)
            .replace(/\[ID_ORDEN\]/g, data.orderId)
            .replace(/\[FECHA_COMPRA\]/g, data.transactionDate)
            .replace(/\[NOMBRE_DEL_BEAT\]/g, data.productName)
            .replace(/\[NOMBRE_DEL_SOUNDKIT\]/g, data.productName)
            .replace(/\[NOMBRE_COMPLETO_PRODUCTOR\]/g, data.producerName)
            .replace(/\[NOMBRE_ARTISTICO_PRODUCTOR\]/g, data.producerName)
            .replace(/\[NOMBRE_COMPLETO_COMPRADOR\]/g, data.buyerName)
            .replace(/\[LISTA_DE_ARCHIVOS\]/g, 'MP3, WAV o TRACKOUTS (Según disponibilidad)');
    };

    if (data.isCustomText) {
        return (
            <Document title={`Licencia_${data.productName}_${data.orderId}.pdf`}>
                <Page size="A4" style={[styles.page, { padding: 0 }]}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <Image src={path.join(process.cwd(), 'public', 'hoja_membretada.png')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />
                        <View style={{
                            paddingTop: `${data.pdfSettings?.paddingTop || 27}%`,
                            paddingLeft: `${data.pdfSettings?.paddingHorizontal || 10}%`,
                            paddingRight: `${(data.pdfSettings?.paddingHorizontal || 10) + 8}%`, 
                        }}>
                            <Text style={{
                                fontSize: data.pdfSettings?.fontSize || 10,
                                fontFamily: 'Helvetica',
                                lineHeight: 1.5,
                                color: '#111827'
                            }}>
                                {processCustomText(data.customText || '')}
                            </Text>
                        </View>
                    </View>
                </Page>
            </Document>
        );
    }

    return (
        <Document title={`Licencia_${data.productName}_${data.orderId}.pdf`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.watermarkContainer}>
                    <Text style={styles.watermarkText}>TIANGUIS</Text>
                </View>
                <View style={styles.header}>
                    <Image src={logoUrl} style={styles.logo} />
                    <View style={styles.headerTextRight}>
                        <Text style={styles.docTitle}>Certificado de Licencia</Text>
                        <Text style={styles.txId}>TIPO: {data.licenseType.toUpperCase()}</Text>
                        <Text style={styles.txId}>ID TRANSACCIÓN: {data.orderId}</Text>
                        <Text style={styles.txId}>FECHA EFECTIVA: {data.transactionDate}</Text>
                    </View>
                </View>
                <View style={styles.partiesContainer}>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyTitle}>Licenciante (Productor)</Text>
                        <Text style={styles.partyInfo}>{data.producerName}</Text>
                        <Text style={styles.partyInfo}>{data.producerEmail}</Text>
                    </View>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyTitle}>Licenciatario (Artista/Cliente)</Text>
                        <Text style={styles.partyInfo}>{data.buyerName}</Text>
                        <Text style={styles.partyInfo}>{data.buyerEmail}</Text>
                    </View>
                </View>
                <Text style={styles.sectionTitle}>1. Objeto del Contrato</Text>
                <Text style={styles.bodyText}>
                    Este documento certifica que {data.producerName} otorga a {data.buyerName} los derechos de uso sobre la obra instrumental titulada "{data.productName}" bajo los términos de una licencia {data.licenseType.toUpperCase()}.
                </Text>
                <Text style={styles.sectionTitle}>2. Términos de Explotación</Text>
                <View style={styles.limitsContainer}>
                    <View style={styles.limitRow}><Text style={styles.limitLabel}>🔊 Streams de Audio:</Text><Text style={styles.limitValue}>{data.limits?.streams || 'No definido'}</Text></View>
                    <View style={styles.limitRow}><Text style={styles.limitLabel}>💿 Distribución:</Text><Text style={styles.limitValue}>{data.limits?.copies || 'No definido'}</Text></View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 }}>
                    <View style={styles.signatureContainer}>
                        <Text style={styles.scriptSignature}>{data.producerName}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>FIRMA PRODUCTOR</Text>
                    </View>
                    <View style={styles.signatureContainer}>
                        <Text style={[styles.scriptSignature, { color: '#6B7280' }]}>Tianguis Verified</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>SELLO TIANGUIS</Text>
                    </View>
                </View>
                <View style={styles.footer} fixed>
                    <Text style={styles.hashText}>Hash Segueidad: {securityHash}</Text>
                    <Text style={[styles.hashText, { textAlign: 'right' }]}>Página 1</Text>
                </View>
            </Page>
        </Document>
    );
};

// --- DOCUMENTO DE NOTA DE VENTA (FACTURA SIMPLIFICADA) ---
const InvoiceDocument = ({ data }: { data: ContractData }) => {
    const securityHash = generateHash(`${data.orderId}-${data.buyerEmail}-${data.transactionDate}`);
    const logoUrl = "https://tianguisbeats.com/logo-navbar.png";

    return (
        <Document title={`Nota_Venta_${data.productName}_${data.orderId}.pdf`}>
            <Page size="A4" style={[styles.page, { padding: 0 }]}>
                {/* Fondo con Hoja Membretada */}
                <Image 
                    src={path.join(process.cwd(), 'public', 'hoja_membretada.png')} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} 
                />

                <View style={{ paddingTop: '22%', paddingHorizontal: '12%', flex: 1 }}>
                    {/* Header Factura */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 15 }}>
                        <View>
                            <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#111827', textTransform: 'uppercase' }}>Nota de Venta</Text>
                            <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 5 }}>NÚMERO DE PEDIDO: #{data.orderId.toUpperCase()}</Text>
                        </View>
                        <View style={{ textAlign: 'right' }}>
                            <Text style={{ fontSize: 10, color: '#1F2937' }}>Fecha de Emisión</Text>
                            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#2563EB' }}>{data.transactionDate}</Text>
                        </View>
                    </View>

                    {/* Información de las Partes */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
                        <View style={{ width: '48%' }}>
                            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 }}>Vendedor</Text>
                            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827' }}>{data.producerName}</Text>
                            <Text style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>{data.producerEmail}</Text>
                            <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 5 }}>Socio Verificado de Tianguis Beats</Text>
                        </View>
                        <View style={{ width: '48%', textAlign: 'right' }}>
                            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 }}>Cliente / Comprador</Text>
                            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827' }}>{data.buyerName || 'Cliente Anónimo'}</Text>
                            <Text style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>{data.buyerEmail}</Text>
                        </View>
                    </View>

                    {/* Detalle del Producto */}
                    <View style={{ marginBottom: 40 }}>
                        <View style={{ backgroundColor: '#111827', padding: 10, flexDirection: 'row', borderRadius: 4 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 3 }}>PRODUCTO / LICENCIA</Text>
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1, textAlign: 'right' }}>PRECIO</Text>
                        </View>
                        <View style={{ padding: 12, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                            <View style={{ flex: 3 }}>
                                <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827' }}>{data.productName}</Text>
                                <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>Licencia: {data.licenseType.toUpperCase()}</Text>
                            </View>
                            <Text style={{ flex: 1, fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827', textAlign: 'right' }}>{data.price}</Text>
                        </View>
                    </View>

                    {/* Totales */}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 40 }}>
                        <View style={{ width: '40%', gap: 6 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 10, color: '#6B7280' }}>Subtotal</Text>
                                <Text style={{ fontSize: 10, color: '#111827', fontFamily: 'Helvetica-Bold' }}>{data.price}</Text>
                            </View>
                            {data.descuento && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 10, color: '#6B7280' }}>Descuento</Text>
                                    <Text style={{ fontSize: 10, color: '#EF4444', fontFamily: 'Helvetica-Bold' }}>-{data.descuento}</Text>
                                </View>
                            )}
                            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827' }}>Total (MXN)</Text>
                                <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#2563EB' }}>{data.total || data.price}</Text>
                            </View>
                            <Text style={{ fontSize: 8, color: '#9CA3AF', textAlign: 'right', marginTop: 4 }}>
                                Pago realizado vía {data.metodoPago || 'Tarjeta o Stripe'}
                            </Text>
                        </View>
                    </View>

                    {/* Sello de Seguridad */}
                    <View style={{ position: 'absolute', bottom: '15%', left: '12%', right: '12%', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 3 }}>Comprobante Digital Verificado</Text>
                        <Text style={{ fontSize: 8, color: '#6B7280', lineHeight: 1.4 }}>
                            Este recibo confirma una transacción segura dentro de la plataforma Tianguis Beats.
                        </Text>
                        <Text style={{ fontSize: 7, color: '#D1D5DB', marginTop: 8, fontFamily: 'Courier' }}>HASH: {securityHash}</Text>
                    </View>
                </View>

                {/* Footer del PDF */}
                <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#111827', fontFamily: 'Helvetica-Bold' }}>Tianguis Beats Inc.</Text>
                    <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>www.tianguisbeats.com | La plataforma #1 de Beats en México</Text>
                </View>
            </Page>
        </Document>
    );
};

export const renderContractToBuffer = async (datos: ContractData): Promise<Buffer> => {
    const flujo_pdf = await renderToStream(<ContractDocument data={datos} />);
    const fragmentos_pdf: any[] = [];
    for await (const fragmento of flujo_pdf) { fragmentos_pdf.push(fragmento); }
    return Buffer.concat(fragmentos_pdf);
};

export const renderInvoiceToBuffer = async (datos: ContractData): Promise<Buffer> => {
    const flujo_pdf = await renderToStream(<InvoiceDocument data={datos} />);
    
    const fragmentos_pdf: any[] = [];
    for await (const fragmento of flujo_pdf) { 
        fragmentos_pdf.push(fragmento); 
    }
    
    return Buffer.concat(fragmentos_pdf);
};
