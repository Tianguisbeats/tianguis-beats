/* eslint-disable */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, renderToStream } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Registrar Fuentes
// Usaremos Helvetica como fallback rápido, pero registramos OpenSans o Montserrat para simular el look
Font.register({
    family: 'Montserrat',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNF3Lw.ttf' }, // Normal
        { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNF3Lw.ttf', fontWeight: 'bold' } // Bold
    ]
});

Font.register({
    family: 'GreatVibes',
    src: 'https://fonts.gstatic.com/s/greatvibes/v15/RWm0oL3q3SjcWBRRVsl2GAFPKLw.ttf' // Script Font para firma
});

// Estilos Premium del PDF
const styles = StyleSheet.create({
    page: {
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 50,
        fontFamily: 'Montserrat',
        backgroundColor: '#FAFAFA', // Light theme default para impresiones
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
        opacity: 0.03, // Muy sutil
    },
    watermarkText: {
        fontSize: 100,
        color: '#000000',
        transform: 'rotate(-45deg)',
        fontFamily: 'Montserrat',
        fontWeight: 'bold',
        opacity: 0.05,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB', // Acento Azul Primario
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
        color: '#111827',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    txId: {
        fontSize: 9,
        color: '#6B7280',
        fontFamily: 'Courier', // Look de ID tecnico
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
        fontWeight: 'bold',
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
        fontWeight: 'bold',
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
        fontWeight: 'bold',
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
        fontWeight: 'bold',
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
        whiteSpace: 'nowrap',
    },
    qrCode: {
        width: 70,
        height: 70,
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
        fontSize: 9,
        color: '#6B7280',
        textAlign: 'center',
    },
    scriptSignature: {
        fontFamily: 'GreatVibes',
        fontSize: 24,
        color: '#2563EB',
        marginBottom: -10,
    },
    privacyNoticeContainer: {
        marginTop: 40,
        borderTopWidth: 0.5,
        borderTopColor: '#D1D5DB',
        paddingTop: 10,
    },
    privacyNoticeTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    privacyNoticeText: {
        fontSize: 7,
        color: '#9CA3AF',
        lineHeight: 1.4,
        textAlign: 'justify',
    }
});

// Tipos de Datos
export interface ContractData {
    orderId: string;
    transactionDate: string;
    licenseType: string;
    productName: string;
    price: string;

    // Producer (Licensor)
    producerName: string;
    producerEmail: string;

    // Buyer (Licensee)
    buyerName: string;
    buyerEmail: string;

    // Template Config
    isCustomText: boolean;
    customText?: string;
    incluir_clausulas_pro?: boolean;
    limits?: {
        streams: string;
        copies: string;
        videos: string;
        radio: string;
    };
}

// Generador de Hash
const generateHash = (data: string) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

// Componente del PDF
const ContractDocument = ({ data, qrBase64 }: { data: ContractData, qrBase64: string }) => {
    const securityHash = generateHash(`${data.orderId}-${data.buyerEmail}-${data.transactionDate}`);
    const logoUrl = "https://tianguisbeats.com/logo-navbar.png"; // Usar el logo oficial (Asegurarse que sea accesible)

    // Función para procesar texto experto y cambiar variables por valores reales
    const processCustomText = (text: string) => {
        if (!text) return "";
        return text
            .replace(/{ARTISTA}/g, data.buyerName || 'El Artista')
            .replace(/{PRODUCTOR}/g, data.producerName || 'El Productor')
            .replace(/{BEAT}/g, data.productName || 'La Obra Musical')
            .replace(/{FECHA}/g, data.transactionDate);
    };

    return (
        <Document
            title={`Licencia_${data.productName}_${data.orderId}.pdf`}
            author="Tianguis Beats Certificator"
            subject={`Contrato de Licencia Comercial: ${data.licenseType.toUpperCase()}`}
        >
            <Page size="LETTER" style={styles.page}>

                {/* Marca de Agua */}
                <View style={styles.watermarkContainer}>
                    <Text style={styles.watermarkText}>TIANGUIS</Text>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Image src={logoUrl} style={styles.logo} />
                    <View style={styles.headerTextRight}>
                        <Text style={styles.docTitle}>Certificado de Licencia</Text>
                        <Text style={styles.txId}>TIPO: {data.licenseType.toUpperCase()}</Text>
                        <Text style={styles.txId}>ID TRANSACCIÓN: {data.orderId}</Text>
                        <Text style={styles.txId}>FECHA EFECTIVA: {data.transactionDate}</Text>
                    </View>
                </View>

                {/* Parties */}
                <View style={styles.partiesContainer}>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyTitle}>Licenciante (Productor)</Text>
                        <Text style={styles.partyInfo}>{data.producerName}</Text>
                        <Text style={styles.partyInfo}>{data.producerEmail || 'Suscrito a la plataforma'}</Text>
                    </View>
                    <View style={styles.partyColumn}>
                        <Text style={styles.partyTitle}>Licenciatario (Artista/Cliente)</Text>
                        <Text style={styles.partyInfo}>{data.buyerName}</Text>
                        <Text style={styles.partyInfo}>{data.buyerEmail}</Text>
                    </View>
                </View>

                {/* Objeto del Contrato */}
                <Text style={styles.sectionTitle}>1. Objeto del Contrato</Text>
                <Text style={styles.bodyText}>
                    Este documento certifica que {data.producerName} (el "Licenciante") otorga a {data.buyerName} (el "Licenciatario") los derechos de uso sobre la obra instrumental titulada "{data.productName}" bajo los términos específicos de una licencia {data.licenseType.toUpperCase()}.
                </Text>

                {/* Términos de Explotación */}
                <Text style={styles.sectionTitle}>2. Términos de Explotación y Límites Comerciales</Text>

                {data.isCustomText && data.customText ? (
                    // Modo Experto (Texto Completo)
                    <Text style={styles.bodyText}>
                        {processCustomText(data.customText)}
                    </Text>
                ) : (
                    // Modo Fácil (Límites)
                    <View>
                        <Text style={styles.bodyText}>
                            El Licenciatario tiene derecho a explotar comercialmente la nueva canción ("Nueva Obra") que contenga instrumental sujeto a las siguientes limitaciones máximas permitidas por esta licencia:
                        </Text>

                        <View style={styles.limitsContainer}>
                            <View style={styles.limitRow}>
                                <Text style={styles.limitLabel}>🔊 Streams de Audio (Ej. Spotify):</Text>
                                <Text style={styles.limitValue}>{data.limits?.streams || 'No definido'}</Text>
                            </View>
                            <View style={styles.limitRow}>
                                <Text style={styles.limitLabel}>💿 Distribución / Copias Físicas:</Text>
                                <Text style={styles.limitValue}>{data.limits?.copies || 'No definido'}</Text>
                            </View>
                            <View style={styles.limitRow}>
                                <Text style={styles.limitLabel}>🎬 Videos Musicales / Monetizados:</Text>
                                <Text style={styles.limitValue}>{data.limits?.videos || 'No definido'}</Text>
                            </View>
                            <View style={styles.limitRow}>
                                <Text style={styles.limitLabel}>📻 Estaciones de Radio:</Text>
                                <Text style={styles.limitValue}>{data.limits?.radio || 'No definido'}</Text>
                            </View>
                        </View>

                        {/* Restricciones Fijas (Protección Tianguis Beats por Defecto) */}
                        <Text style={styles.sectionTitle}>3. Restricciones Indispensables</Text>
                        <Text style={styles.bodyText}>
                            • STRICTAMENTE PROHIBIDO (CONTENT ID): A menos que se trate de una Licencia Exclusiva que indique explícitamente lo contrario, el Licenciatario NO debe registrar la Nueva Obra en sistemas de identificación de contenido (YouTube Content ID, etc.) para evitar reclamaciones a otros licenciatarios legales.
                            {"\n\n"}
                            • DERECHOS DE AUTOR: El Licenciante retiene el Copyright 100% sobre el máster instrumental. La venta de sublicencias del ritmo aislado está prohibida.
                            {"\n\n"}
                            • CRÉDITOS: Es obligatorio proporcionar crédito verbal o por escrito al Licenciante en todos los formatos comerciales bajo la nomenclatura "(Prod. by {data.producerName})".
                        </Text>
                    </View>
                )}

                {/* Firmas Digitales */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 }}>
                    <View style={styles.signatureContainer}>
                        <Text style={styles.scriptSignature}>{data.producerName}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>FIRMA DIGITAL DEL PRODUCTOR</Text>
                    </View>

                    <View style={styles.signatureContainer}>
                        <Text style={[styles.scriptSignature, { color: '#6B7280' }]}>Tianguis Verified</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>SELLO DE AUTENTICIDAD TIANGUIS</Text>
                    </View>
                </View>

                {/* Cláusulas Pro (Si están habilitadas) */}
                {data.incluir_clausulas_pro && (
                    <View break>
                        <Text style={styles.sectionTitle}>Adéndum: Cláusulas de Protección Pro</Text>
                        <View style={styles.bodyText}>
                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>• Publishing (50/50):</Text>
                            <Text style={{ marginBottom: 10 }}>El Productor retiene el cincuenta por ciento (50%) de la propiedad de la composición musical (Publishing). El Licenciatario se compromete a registrar la obra en su sociedad de gestión de derechos (ej. SACM, ASCAP, BMI) listando al Productor con su nombre legal y número IPI correspondiente.</Text>

                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>• Control de Content ID:</Text>
                            <Text style={{ marginBottom: 10 }}>En licencias NO exclusivas, el Licenciatario tiene prohibido registrar la canción en sistemas de 'Content ID' o 'Fingerprinting' (como YouTube Content ID). El Productor mantiene el derecho exclusivo de gestionar la huella digital del beat para evitar reclamos injustos a otros licenciatarios.</Text>

                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>• Derechos de Sincronización (Cine, TV y Publicidad):</Text>
                            <Text style={{ marginBottom: 10 }}>Esta licencia no incluye derechos de sincronización para medios visuales de alto presupuesto (Cine, TV, Videojuegos o Publicidad Nacional). En caso de una oportunidad de sincronización, el Licenciatario y el Productor deberán negociar un contrato por separado, dividiendo las ganancias del 'Master' y 'Sync' al cincuenta por ciento (50%) cada uno.</Text>

                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>• Crédito Obligatorio:</Text>
                            <Text style={{ marginBottom: 10 }}>El Licenciatario deberá otorgar crédito de producción en todas las plataformas (Spotify, YouTube, Apple Music) y material físico. El formato obligatorio es: 'Producido por {data.producerName}'. La omisión del crédito se considerará un incumplimiento del contrato.</Text>

                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>• Garantía de Muestras (Samples):</Text>
                            <Text style={{ marginBottom: 10 }}>El Productor garantiza que el beat original no contiene samples no autorizados. Sin embargo, el Licenciatario es el único responsable por cualquier material adicional (voces, samples, arreglos) que añada a la obra. El Licenciatario indemnizará al Productor ante cualquier reclamo legal derivado del contenido añadido por el Artista.</Text>
                        </View>
                    </View>
                )}

                {/* Certificado de Autenticidad (Sello final) */}
                <View style={styles.sealContainer}>
                    <Text style={styles.sealTitle}>CERTIFICADO DE AUTENTICIDAD DIGITAL - TIANGUIS BEATS</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ width: '60%' }}>
                            <Text style={styles.sealText}>ID de Transacción: {data.orderId}</Text>
                            <Text style={styles.sealText}>Hash de Seguridad: {securityHash.slice(0, 32)}...</Text>
                            <Text style={styles.sealText}>Fecha de Validación: {data.transactionDate}</Text>
                            <Text style={[styles.sealText, { fontWeight: 'bold', marginTop: 4, color: '#059669' }]}>ESTADO: VALIDADO Y REGISTRADO</Text>
                        </View>
                        <View style={{ width: '35%' }}>
                            {qrBase64 && <Image src={qrBase64} style={{ width: 40, height: 40, alignSelf: 'flex-end' }} />}
                        </View>
                    </View>
                    <Text style={[styles.sealText, { fontSize: 6, opacity: 0.7 }]}>
                        Este documento ha sido generado automáticamente por la plataforma Tianguis Beats. Los términos aquí estipulados son legalmente vinculantes. Cualquier alteración manual invalidará automáticamente la licencia.
                    </Text>
                </View>

                {/* Aviso de Privacidad Final */}
                <View style={styles.privacyNoticeContainer}>
                    <Text style={styles.privacyNoticeTitle}>AVISO DE PRIVACIDAD Y PROTECCIÓN DE DATOS</Text>
                    <Text style={styles.privacyNoticeText}>
                        Los datos personales recabados en este instrumento, tales como nombre, seudónimo, correo electrónico y detalles de la transacción, son tratados de forma estrictamente confidencial por Tianguis Beats y las partes involucradas. Estos datos tienen como única finalidad la formalización legal de la licencia y la gestión de derechos de autor ante las sociedades de gestión correspondientes. Tianguis Beats no almacena información sensible de tarjetas de crédito, la cual es procesada exclusivamente por pasarelas de pago certificadas (Stripe/PayPal). Para ejercer sus derechos de Acceso, Rectificación, Cancelación u Oposición (ARCO), por favor consulte nuestro Aviso de Privacidad integral en tianguisbeats.com/privacidad.
                    </Text>
                </View>

                {/* Footer Fijo */}
                <View style={styles.footer} fixed>
                    <Text style={styles.hashText}>Firma Centralizada: {securityHash}</Text>
                    <Text style={[styles.hashText, { textAlign: 'right' }]}>Página 1 de 2</Text>
                </View>

            </Page>
        </Document>
    );
};


// Interfaz principal para invocar en el Webhook / API Node
export const renderContractToBuffer = async (data: ContractData): Promise<Buffer> => {
    // 1. Generar Código QR (Apuntando a la validación de recibo o solo encriptando metadata)
    const qrContent = `Verificador TianguisBeats\nID: ${data.orderId}\nTipo: ${data.licenseType}\nComprador: ${data.buyerEmail}`;
    const qrBase64 = await QRCode.toDataURL(qrContent, { errorCorrectionLevel: 'H' });

    // 2. Renderizar a un Stream Nativo (Sincrónico/Promesa compatible en NextJS App Router Server)
    const pdfStream = await renderToStream(<ContractDocument data={data} qrBase64={qrBase64} />);

    // 3. Convertir Stream a Buffer para subir a Supabase Storage
    const chunks: any[] = [];
    for await (const chunk of pdfStream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};
