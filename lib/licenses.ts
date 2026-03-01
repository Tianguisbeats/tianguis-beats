export type LicenseType = 'basic' | 'premium' | 'unlimited' | 'exclusive' | 'soundkit' | 'service';

/**
 * Interfaz que define los datos requeridos para generar una licencia.
 */
interface LicenseData {
    producerName: string;
    buyerName: string;
    productName: string; // Renombrado de beatTitle para ser más genérico
    purchaseDate: string;
    amount: string;
    orderId?: string;
}

/**
 * Genera el texto completo del contrato de licencia basado en el tipo y los datos de compra.
 * 
 * @param {LicenseType} type - El tipo de licencia.
 * @param {LicenseData} data - Los datos del productor, comprador y transacción.
 * @returns {string} El texto formateado del contrato de licencia.
 */
export const generateLicenseText = (type: LicenseType, data: LicenseData): string => {
    const { producerName, buyerName, productName, purchaseDate, amount, orderId } = data;
    const header = `TIANGUIS BEATS - CERTIFICADO DE LICENCIA\n` +
        `======================================================\n\n` +
        `ID DE PEDIDO / RECIBO: ${orderId || 'N/A'}\n` +
        `FECHA EFECTIVA: ${purchaseDate}\n` +
        `PRODUCTOR / LICENCIANTE: ${producerName}\n` +
        `ARTISTA / LICENCIATARIO: ${buyerName}\n` +
        `OBRA MUSICAL / INSTRUMENTAL: "${productName}"\n` +
        `TARIFA ABONADA: $${amount} MXN\n\n`;

    const commonIntro = `Este Acuerdo de Licencia (el "Acuerdo") es celebrado por y entre ${producerName} (el "Productor") y ${buyerName} (el "Licenciatario"), y establece los términos del uso de la obra instrumental titulada "${productName}" (la "Obra" o "Beat").\n\n`;

    switch (type) {
        case 'basic':
            return header + commonIntro +
                `1. TIPO DE LICENCIA: LICENCIA BÁSICA (MP3)\n` +
                `En consideración del pago de la Tarifa, el Productor otorga al Licenciatario el derecho no exclusivo, intransferible y mundial para usar el Beat en la creación de una (1) Nueva Canción final.\n\n` +
                `2. FORMATO DE ENTREGA\n` +
                `El Productor entregará un archivo de alta calidad en formato MP3.\n\n` +
                `3. PERMISOS Y LÍMITES DE EXPLOTACIÓN\n` +
                `   - Distribución Física/Digital (Ventas/Descargas): Hasta 2,000 copias.\n` +
                `   - Streams de Audio Monetizados (Spotify, Apple Music, etc.): Hasta 500,000 streams.\n` +
                `   - Streams de Video Monetizados: Hasta 1 stream de video musical en plataformas.\n` +
                `   - Videos Promocionales/Sincronización: Permitido usar la Nueva Canción en un (1) Trabajo Audiovisual (Video Musical) de máximo 5 minutos en YouTube/Vevo.\n` +
                `   - Presentaciones en Vivo: Ilimitadas para eventos sin fines de lucro; restringidas para conciertos a gran escala comerciales.\n` +
                `   - Radiodifusión: Permitida en hasta 2 estaciones de radio terrestre/satelital.\n\n` +
                `4. RESTRICCIONES ESTRICTAS DE USO\n` +
                `   - PROHIBIDO EL CONTENT ID: El Licenciatario NO puede registrar la Nueva Canción en ningún sistema de huella digital o identificación de contenido (ej. YouTube Content ID, TuneCore CD, etc.) bajo ninguna circunstancia. El Productor retiene el derecho exclusivo del Content ID de la obra instrumental.\n` +
                `   - Prohibido transferir, sublicenciar, revender o regalar el Beat en su forma instrumental aislada original.\n` +
                `   - El Beat no se puede usar como "samples" sueltos para otros beats.\n\n` +
                `5. PROPIEDAD, REGALÍAS Y CRÉDITOS\n` +
                `   - Propiedad: El Productor retiene el 100% de la propiedad y los derechos de autor (Copyright) sobre el master instrumental y la composición original. El Licenciatario sólo posee los derechos de las vocales/letras que agregue.\n` +
                `   - Publicación (Publishing): El Productor ("Writer") retiene el 50% de la participación de escritor (Writer's Share) de la composición generada en la Nueva Canción y el 100% del Publisher's Share.\n` +
                `   - Créditos Obligatorios: En cualquier lanzamiento o publicación, se deberá acreditar visual e irrevocablemente al Productor como "(Producido por ${producerName})".\n\n` +
                `6. PLAZO\n` +
                `El plazo de esta licencia es de diez (10) años a partir de la Fecha Efectiva.\n`;

        case 'premium':
            return header + commonIntro +
                `1. TIPO DE LICENCIA: LICENCIA PRO (WAV + MP3)\n` +
                `En consideración del pago de la Tarifa, el Productor otorga al Licenciatario el derecho no exclusivo, intransferible y mundial para usar el Beat en la creación de una (1) Nueva Canción final.\n\n` +
                `2. FORMATO DE ENTREGA\n` +
                `El Productor entregará archivos de alta calidad en formato MP3 y WAV integral.\n\n` +
                `3. PERMISOS Y LÍMITES DE EXPLOTACIÓN\n` +
                `   - Distribución Física/Digital (Ventas/Descargas): Hasta 5,000 copias.\n` +
                `   - Streams de Audio Monetizados (Spotify, Apple Music, etc.): Hasta 500,000 streams monetizados y streams no monetizados ilimitados.\n` +
                `   - Streams de Video Monetizados: Hasta 1 stream de video musical en plataformas.\n` +
                `   - Videos Promocionales/Sincronización: Permitido en un (1) Video Musical promocional para YouTube o similar.\n` +
                `   - Presentaciones en Vivo: Ilimitadas sin fines de lucro, y limitadas (hasta $2,000 USD de ganancias) para fines de lucro.\n` +
                `   - Radiodifusión: Permitida en hasta 2 estaciones de radio terrestre/satelital.\n\n` +
                `4. RESTRICCIONES ESTRICTAS DE USO\n` +
                `   - PROHIBIDO EL CONTENT ID: El Licenciatario NO puede registrar la Nueva Canción en sistemas de identificación de contenido (ej. YouTube Content ID). Incurrir en esto provocará la revocación inmediata de la licencia.\n` +
                `   - Prohibido transferir, sublicenciar, revender o compartir el instrumental original de manera directa.\n\n` +
                `5. PROPIEDAD Y CRÉDITOS\n` +
                `   - Propiedad: El Productor conserva el 100% de los derechos de la obra fonográfica instrumental subyacente. El Licenciatario se responsabiliza de los lyrics/vocales que integre.\n` +
                `   - Publicación (Publishing): 50% Writer's Share para ${producerName} y 50% Writer's Share para ${buyerName}. El Productor posee el 100% del Publisher's Share subyacente de la música.\n` +
                `   - Créditos: Toda publicación debe citar "Producido por ${producerName}".\n\n` +
                `6. PLAZO\n` +
                `El plazo de esta licencia será de diez (10) años.\n`;

        case 'unlimited':
            return header + commonIntro +
                `1. TIPO DE LICENCIA: LICENCIA PREMIUM (STEMS SEPARADOS)\n` +
                `En consideración del pago de la Tarifa, el Productor otorga al Licenciatario el derecho no exclusivo para explotar comercialmente la Nueva Canción, SIN LÍMITES de regalías o alcance, amparado por las siguientes estipulaciones.\n\n` +
                `2. FORMATO DE ENTREGA\n` +
                `El Productor entregará MP3, WAV y "Trackouts" (Stems Separados) del Beat.\n\n` +
                `3. PERMISOS Y EXPANSIÓN COMERCIAL\n` +
                `   - Distribución Comercial: Ilimitada. Copias físicas y descargas ilimitadas.\n` +
                `   - Estaciones de Radio: Rotación Ilimitada en radio y satélite.\n` +
                `   - Plataformas de Streaming (Spotify, Apple Music, Tidal, etc.): Streams monetizados ilimitados.\n` +
                `   - Presentaciones y Shows en Vivo: Ganancias ilimitadas sin restricciones adicionales.\n` +
                `   - Videos / Sincronización: Ilimitada cantidad de videos musicales comerciales usando la obra finalizada.\n\n` +
                `4. RESTRICCIONES PERMANENTES\n` +
                `   - CONTENT ID: Aunque es una licencia ilimitada, SIGUE ESTANDO PROHIBIDO ingresar el tema a Content ID para evitar reclamos cruzados con otros usuarios de las versiones premium o básicas del Beat.\n` +
                `   - Naturaleza de Re-Venta: La Obra (Instrumental) no puede ser subida o vendida de manera aislada ("stand-alone").\n\n` +
                `5. SPLITS LEGALES\n` +
                `   - Composición/Publishing: Se mantiene un split del 50/50 en la porción de composición melódica aportada por el Productor y el letrista. El letrista posee su propia distribución de voces al 100%.\n` +
                `   - Créditos: Atribución permanente a "${producerName}" en metadata y portadas.\n\n` +
                `6. PLAZO\n` +
                `Esta licencia dura diez (10) años, garantizando una extensión de derechos comerciales a lo largo de este periodo vitalicio en la explotación independiente.\n`;

        case 'exclusive':
            return header + commonIntro +
                `1. TIPO DE CONTRATO: LICENCIA EXCLUSIVA A PERPETUIDAD\n` +
                `Este instrumento certifica la VENTA TOTAL EXCLUSIVA y la cesión de todos los derechos de explotación sobre el Master de la Obra (Beat) del Productor a favor de ${buyerName} (el "Cesionario" o "Licenciatario").\n\n` +
                `2. OBLIGACIONES DE RETIRO DEL MERCADO\n` +
                `A partir de la ejecución y pago, el Productor garantiza remover inmediatamente el Beat de toda tienda digital (Tianguis Beats, BeatStars, YouTube, etc.) para evitar ventas futuras. Adjudicaciones previas no exclusivas hacia terceros (Basic/Premium/Unlimited) segurán siendo legalmente respetadas, y el Comprador Exclusivo acepta esto.\n\n` +
                `3. PERMISOS ABSOLUTOS DE EXPLOTACIÓN\n` +
                `El Licenciatario es Libre de utilizar la nueva pista creada para:\n` +
                `   - Streams ilimitados, radio ilimitada, Sync ilimitado (TV, Cine, Netflix etc).\n` +
                `   - Es posible REGISTRAR EN CONTENT ID únicamente de manera cautelosa garantizando "whitelisting" a licenciantes previos, en la medida de lo técnicamente posible (la mala praxis será responsabilidad del Licenciatario).\n` +
                `   - Master final: El Licenciatario es dueño absoluto del Master Grabado (Nueva Canción).\n\n` +
                `4. DERECHOS DE AUTOR (PUBLISHING)\n` +
                `   - Conservación de Regalías Concurrentes: A pesar de ser una cesión Exclusiva del Master, el Productor reteniene el 50% de la cuota de Autoría ("Writer's Share") subyacente por la música compuesta.\n` +
                `   - Créditos de Producción: Obligatoriamente, ${producerName} será acreditado como "Productor Principal" o "Producido por" de manera irrevocable.\n\n` +
                `5. PLAZO\n` +
                `El plazo de esta venta y cesión es a Perpetuidad, bajo todas las jurisdicciones de manera Internacional.\n`;

        case 'soundkit':
            return header +
                `Este Acuerdo certifica que ${buyerName} adquirió una Licencia Libre de Regalías (Royalty-Free) sobre el producto o Drum Kit titulado "${productName}", el cual fue diseñado y empaquetado por ${producerName}.\n\n` +
                `1. DERECHOS DE USO CREATIVO\n` +
                `Todos los audios (drums, loops, oneshots o presets) proporcionados en el archivo pueden ser usados libre e ilimitadamente en construcciones de Beats, tracks, remixes y proyectos de medios comerciales sin límite alguno. Las obras creadas con dichos sonidos le pertenecerán enteramente a usted y no estará obligado a compartir regalías con Tianguis Beats ni con el creador del kit.\n\n` +
                `2. RESTRICCIONES DE PIRATERÍA O RE-EMPAQUETADO\n` +
                `   - Queda estrictamente PROHIBIDO re-empaquetar, comerciar, lucrar o redistribuir estos sonidos puros originados en el kit, bajo cualquier otra marca o nombre.\n` +
                `   - Revender directamente fragmentos crudos descargados de este Sound Kit como si fuesen creaciones suyas, en medios como Splice, Loopmasters o librerías homólogas es un acto de infracción de piratería y propiedad penalizada.\n\n` +
                `3. POLÍTICA DE DEVOLUCIÓN\n` +
                `Al ser bienes de distribución estrictamente digital en descarga directa y de dominio perenne sobre el material (intangible software-based items), esta licencia no faculta reclamaciones de devolución económica ("Non-Refundable").\n\n` +
                `El comprador acuerda apegarse integralmente a los términos por su aceptación y descarga.\n`;

        default:
            return header + `\nLicencia o documento comercial no especificado explícitamente. Contacte al soporte.`;
    }
};
