import { createClient } from '@supabase/supabase-js';

export function getDefaultSpanishText(type: string, beatTitle: string, prodNombre: string, prodArtistico: string) {
    if (type === 'gratis' || type === 'free') {
        return `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA GRATUITA (USO NO COMERCIAL)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], quienes de mutuo acuerdo se someten a las siguientes cláusulas.
* 2. LA OBRA: El Vendedor otorga una licencia de uso limitado sobre la obra musical titulada: [NOMBRE_DEL_BEAT] en versión MP3 con etiquetas de voz.
* 3. CONCESIÓN DE USO NO COMERCIAL: Se otorga al Comprador el derecho no exclusivo y no comercial de utilizar el Beat únicamente para fines de evaluación, creación de demos o promoción en redes sociales sin monetización activa.
* 4. RESTRICCIONES CRÍTICAS: Esta licencia no permite la distribución en plataformas de streaming como Spotify o Apple Music. El Comprador tiene prohibido registrar cualquier obra que contenga este Beat en sistemas de huella digital o Content ID. Es obligatorio incluir el crédito: Prod. por [NOMBRE_ARTISTICO_PRODUCTOR]
* 5. VIGENCIA Y CONVERSIÓN: Esta licencia tiene una vigencia de 1 año. Para cualquier uso comercial o distribución en tiendas digitales, el Comprador deberá adquirir una Licencia Básica, Pro o Premium en tianguisbeats.com.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`;
    }

    if (type === 'basica' || type === 'basic') {
        return `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA BASICA (USO COMERCIAL ilimitado)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], quienes de mutuo acuerdo se someten a las siguientes cláusulas.
* 2. LA OBRA: El Vendedor otorga una licencia de uso comercial limitado sobre la obra musical titulada: [NOMBRE_DEL_BEAT] entregada únicamente en formato de audio MP3 con etiquetas de voz eliminadas.
* 3. CONCESIÓN DE USO COMERCIAL: Se otorga al Comprador el derecho no exclusivo de distribuir y monetizar una (1) nueva canción derivada bajo los siguientes límites: hasta 50,000 reproducciones totales en plataformas digitales, hasta 5,000 copias digitales o físicas, uso en YouTube y Redes Sociales sin monetización de Content ID, y presentaciones en vivo.
* 4. RESTRICCIONES CRÍTICAS: El Comprador tiene estrictamente prohibido registrar la obra en sistemas de huella digital o Content ID. Es obligatorio incluir el crédito: Prod. por [NOMBRE_ARTISTICO_PRODUCTOR] / en todos los lanzamientos.
* 5. VIGENCIA Y PROPIEDAD: Esta licencia tiene una vigencia de 2 años. El Productor retiene el 100% de la propiedad de la composición original y el 50% de los derechos de autor (Publishing) de la nueva obra. Al expirar el tiempo o alcanzar los límites de ventas, el Comprador deberá renovar en tianguisbeats.com.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`;
    }

    if (type === 'pro') {
        return `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA PRO (USO COMERCIAL AMPLIADO)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], quienes de mutuo acuerdo se someten a las siguientes cláusulas.
* 2. LA OBRA: El Vendedor otorga una licencia de uso comercial ampliado sobre la obra musical titulada: [NOMBRE_DEL_BEAT] entregada en formatos de alta calidad MP3 y WAV (24 bits).
* 3. CONCESIÓN DE USO COMERCIAL: Se otorga al Comprador el derecho no exclusivo de distribuir y monetizar una (1) nueva canción derivada bajo los siguientes términos: transmisiones de audio (Streaming) ilimitadas, hasta 10,000 copias digitales o físicas, uso en YouTube y Redes Sociales sin monetización de Content ID, y presentaciones en vivo con fines de lucro.
* 4. RESTRICCIONES CRÍTICAS: El Comprador tiene estrictamente prohibido registrar la obra en sistemas de huella digital o Content ID. Es obligatorio incluir el crédito: Prod. por [NOMBRE_ARTISTICO_PRODUCTOR] / en todos los lanzamientos.
* 5. VIGENCIA Y PROPIEDAD: Esta licencia tiene una vigencia de 2 años. El Productor retiene el 100% de la propiedad de la composición original y el 50% de los derechos de autor (Publishing) de la nueva obra. Al expirar el tiempo o alcanzar los límites de ventas, el Comprador deberá renovar en tianguisbeats.com.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`;
    }

    if (type === 'premium' || type === 'ilimitada' || type === 'unlimited') {
        return `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA PREMIUM (USO COMERCIAL ILIMITADO)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], quienes de mutuo acuerdo se someten a las siguientes cláusulas.
* 2. LA OBRA: El Vendedor otorga una licencia de uso comercial ilimitado sobre la obra musical titulada: [NOMBRE_DEL_BEAT] entregada en los siguientes formatos: [LISTA_DE_ARCHIVOS] para mezcla profesional.
* 3. CONCESIÓN DE USO COMERCIAL: Se otorga al Comprador el derecho no exclusivo de distribuir y monetizar una (1) nueva canción derivada de forma Ilimitada. Esto incluye transmisiones de audio (Streaming) sin límite, ventas digitales o físicas ilimitadas, uso en videos para Redes Sociales y presentaciones en vivo con fines de lucro.
* 4. RESTRICCIONES CRÍTICAS: El Comprador tiene estrictamente prohibido registrar la obra en sistemas de huella digital o Content ID. Es obligatorio incluir el crédito: Prod. por [NOMBRE_ARTISTICO_PRODUCTOR] / en todos los lanzamientos.
* 5. VIGENCIA Y PROPIEDAD: Esta licencia tiene una vigencia de X años (o permanente según tu configuración). El Productor retiene el 100% de la propiedad de la composición original y el 50% de los derechos de autor (Publishing) de la nueva obra.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`;
    }

    if (type === 'exclusiva' || type === 'exclusive' || type === 'exclusivaestandar' || type === 'exclusiva_estandar') {
        return `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA EXCLUSIVA ESTANDAR  (TRANSFERENCIA DE DERECHOS)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], formalizando la transferencia de derechos de uso exclusivo de la obra.
* 2. LA OBRA: El Vendedor otorga la propiedad exclusiva de uso sobre la obra musical titulada: [NOMBRE_DEL_BEAT] entregada en formatos de alta calidad MP3, WAV. El Vendedor se compromete a retirar la obra de la venta pública tras esta transacción.
* 3. CONCESIÓN DE EXCLUSIVIDAD: Se otorga al Comprador el derecho exclusivo e ilimitado de distribuir, monetizar y transformar la obra de forma global. Esto incluye streaming ilimitado, ventas físicas/digitales ilimitadas, uso en cualquier medio audiovisual y presentaciones en vivo con fines de lucro sin restricciones de tiempo.
* 4. RESTRICCIONES Y CRÉDITOS: El Comprador tiene permitido el registro en sistemas de Content ID únicamente para la canción derivada. Es obligatorio incluir el crédito: Prod. por [NOMBRE_ARTISTICO_PRODUCTOR] / en todos los lanzamientos comerciales y plataformas.
* 5. PROPIEDAD Y PUBLISHING: El Productor retiene el 100% de la propiedad de la composición original (derecho moral) y el 50% de los derechos de autor (Publishing) de la nueva obra. El Comprador posee los derechos de explotación comercial exclusiva sobre el máster final.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`;
    }

    if (type === 'exclusiva_premium' || type === 'exclusive_premium' || type === 'exclusivapremium') {
        return `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA EXCLUSIVA PREMIUM  (TRANSFERENCIA DE DERECHOS)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], formalizando la transferencia de derechos de uso exclusivo de la obra.
* 2. LA OBRA: El Vendedor otorga la propiedad exclusiva de uso sobre la obra musical titulada: [NOMBRE_DEL_BEAT] entregada en formatos de alta calidad MP3, WAV y pistas individuales por separado (Stems/Tracks). El Vendedor se compromete a retirar la obra de la venta pública tras esta transacción.
* 3. CONCESIÓN DE EXCLUSIVIDAD: Se otorga al Comprador el derecho exclusivo e ilimitado de distribuir, monetizar y transformar la obra de forma global. Esto incluye streaming ilimitado, ventas físicas/digitales ilimitadas, uso en cualquier medio audiovisual y presentaciones en vivo con fines de lucro sin restricciones de tiempo.
* 4. RESTRICCIONES Y CRÉDITOS: El Comprador tiene permitido el registro en sistemas de Content ID únicamente para la canción derivada. Es obligatorio incluir el crédito: Prod. por [NOMBRE_ARTISTICO_PRODUCTOR] / en todos los lanzamientos comerciales y plataformas.
* 5. PROPIEDAD Y PUBLISHING: El Productor retiene el 100% de la propiedad de la composición original (derecho moral) y el 50% de los derechos de autor (Publishing) de la nueva obra. El Comprador posee los derechos de explotación comercial exclusiva sobre el máster final.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`;
    }

    if (type === 'soundkits' || type === 'sound_kit' || type === 'soundkit') {
        return `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA DE LIBRERÍA DE SONIDOS (SOUND KIT)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], respecto al uso de muestras y sonidos digitales.
* 2. LA OBRA: El Vendedor otorga una licencia de uso sobre la librería de sonidos titulada: [NOMBRE_DEL_SOUNDKIT] entregada en formato digital comprimido conteniendo muestras de audio (Samples/Loops) y/o ajustes preestablecidos (Presets).
* 3. CONCESIÓN DE USO ROYALTY-FREE: Se otorga al Comprador el derecho no exclusivo, perpetuo y global para utilizar los sonidos contenidos en el kit para la creación de nuevas obras musicales. El Comprador puede comercializar sus producciones creadas con estos sonidos sin pagar regalías adicionales al Productor original.
* 4. RESTRICCIONES DE PROPIEDAD: Queda estrictamente prohibida la redistribución, re-venta, sub-licencia o intercambio de los archivos de audio individuales contenidos en este kit. El Comprador no puede reclamar la propiedad exclusiva de los sonidos ni venderlos como parte de otra librería de sonidos competidora.
* 5. CRÉDITOS Y RESPONSABILIDAD: Aunque el uso es Royalty-Free, se agradece el crédito al Productor [NOMBRE_ARTISTICO_PRODUCTOR] en las obras creadas. El Vendedor no se hace responsable por el mal uso de estos sonidos en obras que infrinjan derechos de terceros.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`;
    }

    return `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA ${type.toUpperCase()}

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR].`;
}

export async function fetchLicenseDetails(supabase: any, tx: any) {
    // PRIORIDAD: producto_uuid (es el UUID real de Supabase) -> producto_id (fallback)
    const beatId = tx.producto_uuid || tx.producto_id;
    const rawLicenseType = (tx.tipo_licencia || 'basica').toLowerCase();
    
    let cleanBeatId = beatId;
    if (beatId && beatId.includes('-')) {
        const uuidMatch = beatId.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (uuidMatch) {
            cleanBeatId = uuidMatch[1];
        }
    }

    // 1. Obtener datos del producto
    let { data: beat } = await supabase
        .from('beats')
        .select('titulo, productor_id, archivo_wav_url, archivo_stems_url, perfiles:productor_id(nombre_completo, nombre_artistico, nombre_usuario, correo)')
        .eq('id', cleanBeatId)
        .maybeSingle();

    let isKit = false;
    if (!beat) {
        const { data: kit } = await supabase
            .from('kits_sonido')
            .select('titulo, productor_id, perfiles:productor_id(nombre_completo, nombre_artistico, nombre_usuario, correo)')
            .eq('id', cleanBeatId)
            .single();

        if (kit) {
            isKit = true;
            beat = {
                titulo: (kit as any).titulo,
                productor_id: (kit as any).productor_id,
                perfiles: (kit as any).perfiles
            };
        }
    }

    if (!beat) return null;

    const productorData = Array.isArray(beat.perfiles) ? beat.perfiles[0] : beat.perfiles;
    const nombreProductor = productorData?.nombre_completo || productorData?.nombre_artistico || productorData?.nombre_usuario || 'Productor Tianguis';
    const nombreArtisticoProductor = productorData?.nombre_artistico || productorData?.nombre_usuario || 'Tianguis Beats';
    const emailProductor = productorData?.correo || productorData?.email || '';

    // 2. Datos del comprador y fecha
    const fechaCompra = new Date(tx.fecha_creacion).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    
    let nombreComprador = 'Cliente Verificado';
    let emailComprador = '';

    if (tx.comprador_id) {
        const { data: compradorData } = await supabase
            .from('perfiles')
            .select('nombre_completo, nombre_usuario, correo')
            .eq('id', tx.comprador_id)
            .maybeSingle();
        if (compradorData) {
            nombreComprador = compradorData.nombre_completo || compradorData.nombre_usuario || nombreComprador;
            emailComprador = compradorData.correo || emailComprador;
        }
    }

    // 3. Obtener plantilla
    const { data: licencia } = await supabase
        .from('licencias')
        .select('*')
        .eq('productor_id', beat.productor_id)
        .maybeSingle();

    const colMap: Record<string, string> = {
        'gratis': 'licencia_gratis',
        'free': 'licencia_gratis',
        'basica': 'licencia_basica',
        'basic': 'licencia_basica',
        'mp3': 'licencia_basica',
        'pro': 'licencia_pro',
        'premium': 'licencia_premium',
        'exclusiva': 'licencia_exclusiva_estandar',
        'exclusive': 'licencia_exclusiva_estandar',
        'exclusivaestandar': 'licencia_exclusiva_estandar',
        'exclusiva_estandar': 'licencia_exclusiva_estandar',
        'exclusivapremium': 'licencia_exclusiva_premium',
        'exclusiva_premium': 'licencia_exclusiva_premium',
        'exclusive_premium': 'licencia_exclusiva_premium',
        'ilimitada': 'licencia_premium',
        'unlimited': 'licencia_premium',
        'soundkits': 'licencia_soundkits',
        'sound_kit': 'licencia_soundkits',
        'soundkit': 'licencia_soundkits',
        'libreria de sonidos': 'licencia_soundkits',
        'libreria': 'licencia_soundkits'
    };

    let normalizedType = rawLicenseType.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
    
    // Si es un kit, ignoramos el tipo de licencia de la transacción y forzamos soundkit
    if (isKit) {
        normalizedType = 'soundkit';
    }

    const dbCol = colMap[normalizedType] || 'licencia_basica';
    let textoLegal = licencia ? licencia[dbCol] : null;

    if (!textoLegal) {
        textoLegal = getDefaultSpanishText(normalizedType, beat.titulo, nombreProductor, nombreArtisticoProductor);
    }

    // VALORES DE ORO PARA FORMATEADO PDF (Estandarizado con Previsualización)
    let pdfSettings = { fontSize: 10, paddingTop: 27, paddingHorizontal: 10 };
    const settingsMatch = textoLegal.match(/^<!-- SETTINGS: (.+?) -->\n/);
    if (settingsMatch) {
        try {
            pdfSettings = { ...pdfSettings, ...JSON.parse(settingsMatch[1]) };
            textoLegal = textoLegal.replace(/^<!-- SETTINGS: .+? -->\n/, '');
        } catch (e) {}
    }

    // Determinar lista de archivos real
    let listaArchivos = "MP3 (Alta Fidelidad)";
    
    if (isKit) {
        listaArchivos = "Kit de Sonidos (Archivo ZIP)";
    } else if (beat.archivo_stems_url) {
        listaArchivos = "MP3, WAV y TRACKOUTS (STEMS)";
    } else if (beat.archivo_wav_url) {
        listaArchivos = "MP3 y WAV (Alta definición)";
    }

    const textoProcesado = textoLegal
        .replace(/\[ID_ORDEN\]/g, tx.orden_pedido || tx.pago_id || tx.id)
        .replace(/\[FECHA_COMPRA\]/g, fechaCompra)
        .replace(/\[NOMBRE_DEL_BEAT\]/g, beat.titulo)
        .replace(/\[NOMBRE_DEL_SOUNDKIT\]/g, beat.titulo)
        .replace(/\[NOMBRE_COMPLETO_PRODUCTOR\]/g, nombreProductor)
        .replace(/\[NOMBRE_ARTISTICO_PRODUCTOR\]/g, nombreArtisticoProductor)
        .replace(/\[NOMBRE_COMPLETO_COMPRADOR\]/g, nombreComprador)
        .replace(/\[LISTA_DE_ARCHIVOS\]/g, listaArchivos);

    const normalizedFileName = (beat.titulo || tx.nombre_producto || 'Producto')
        .replace(/[\\/:"*?<>|]/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    
    // Mapeo inverso para etiquetas legibles en el nombre del archivo (Sin acentos para evitar %XX)
    const labelMap: Record<string, string> = {
        'licencia_gratis': 'Gratis',
        'licencia_basica': 'Basica',
        'licencia_pro': 'Pro',
        'licencia_premium': 'Premium',
        'licencia_exclusiva': 'Exclusiva',
        'licencia_soundkits': 'Soundkit'
    };
    const licenseLabel = labelMap[dbCol] || 'Basica';

    const pdfName = isKit 
        ? `Tianguis Beats - ${normalizedFileName} - Soundkit.pdf`
        : `Tianguis Beats - ${normalizedFileName} - Licencia ${licenseLabel}.pdf`;

    return {
        orderId: tx.orden_pedido || tx.pago_id || tx.id,
        transactionDate: fechaCompra,
        licenseType: isKit ? 'SOUND KIT' : normalizedType.toUpperCase(),
        productName: beat.titulo,
        pdfName: pdfName, // Agregado para usar en las APIs
        price: tx.precio_total?.toString() || '0.00',
        producerName: nombreProductor,
        producerEmail: emailProductor,
        buyerName: nombreComprador,
        buyerEmail: emailComprador,
        isCustomText: true,
        customText: textoProcesado,
        pdfSettings
    };
}

export function getLicenseColor(license: string): string {
    const type = (license || '').toLowerCase().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
    
    if (type.includes('gratis') || type.includes('free')) return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    if (type.includes('basica') || type.includes('basic')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (type.includes('pro')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (type.includes('premium') || type.includes('ilimitada') || type.includes('unlimited')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (type.includes('exclusiva_premium') || type.includes('exclusivapremium')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (type.includes('exclusiva') || type.includes('exclusive')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (type.includes('soundkit') || type.includes('kit')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-foreground/5 text-muted border-border';
}
