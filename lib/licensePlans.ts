/**
 * 📜 FUENTE DE VERDAD CANÓNICA DE LICENCIAS — Tianguis Beats
 * Basado en la Ley Federal del Derecho de Autor (LFDA) · México
 * Este archivo se usa en: LicenseSelectionModal, LicenseCard, /licencias page
 * NO modificar sin actualizar también /app/licencias/page.tsx
 */

export type LicensePlanId = 'Gratis' | 'Básica' | 'Pro' | 'Premium' | 'Exclusiva' | 'Exclusiva Premium';

export interface LicensePlan {
    id: LicensePlanId;
    name: string;             // Display name in UI
    subtitle: string;         // Short subtitle
    formato: string;          // Archivos entregados
    tipo: 'No Exclusiva' | 'Exclusiva';
    comercial: boolean;
    vigencia: string;
    streams: string;
    streamsLimit: number | null; // null = unlimited
    radio: boolean;
    videoMusical: boolean;
    stems: boolean;
    wav: boolean;
    livePerf: boolean;
    creditoObligatorio: boolean;
    contentIdProhibido: boolean;
    color: string;           // Tailwind color name for theming
    features: string[];      // Short bullet list shown in modal
    clauses: string[];       // Full legal clauses (from /licencias page)
}

export const LICENSE_PLANS: LicensePlan[] = [
    {
        id: 'Gratis',
        name: 'Licencia Gratis',
        subtitle: 'Evaluación y Uso Promocional',
        formato: 'MP3 con marca de agua (Tag)',
        tipo: 'No Exclusiva',
        comercial: false,
        vigencia: '1 año desde la descarga',
        streams: 'Hasta 5,000 reproducciones',
        streamsLimit: 5000,
        radio: false,
        videoMusical: false,
        stems: false,
        wav: false,
        livePerf: false,
        creditoObligatorio: true,
        contentIdProhibido: true,
        color: 'muted',
        features: [
            'MP3 con Tag de muestra (marca de agua)',
            'Hasta 5,000 reproducciones acumuladas',
            'Uso exclusivamente promocional y no comercial',
            'Válida por 1 año desde la descarga',
            'Crédito obligatorio: Prod. [Productor] / Tianguis Beats',
        ],
        clauses: [
            'Solo uso demostrativo / maquetación / promocional NO comercial.',
            'Prohibida toda monetización en streaming, ventas digitales o sincronización.',
            'El MP3 incluye marca de agua (tag). No puede usarse en producción final.',
            'Crédito obligatorio: "Prod. [Nombre del Productor] / Tianguis Beats".',
            'El incumplimiento constituye infracción bajo el Art. 231 LFDA.',
        ],
    },
    {
        id: 'Básica',
        name: 'Licencia Básica',
        subtitle: 'Distribución Comercial Limitada',
        formato: 'MP3 Alta Calidad (320kbps)',
        tipo: 'No Exclusiva',
        comercial: true,
        vigencia: '2 a 5 años desde la compra',
        streams: 'Hasta 50,000 reproducciones',
        streamsLimit: 50000,
        radio: false,
        videoMusical: false,
        stems: false,
        wav: false,
        livePerf: false,
        creditoObligatorio: true,
        contentIdProhibido: true,
        color: 'blue',
        features: [
            'MP3 Alta Calidad (320 kbps) · Sin Tag',
            'Hasta 50,000 reproducciones · 5,000 ventas digitales',
            'Distribución en Spotify, Apple Music, plataformas digitales',
            'Vigencia: 2 a 5 años desde la compra',
            'Crédito obligatorio: Prod. [Productor] / Tianguis Beats',
        ],
        clauses: [
            'Distribución comercial en plataformas digitales hasta 50,000 streams o 5,000 unidades vendidas.',
            'Al alcanzar el límite, la licencia expira automáticamente y deberá actualizarse a un plan superior.',
            'No incluye derechos de radio, sincronización en TV/cine/publicidad ni uso en presentaciones masivas (+500 personas).',
            'El Artista deberá registrar el corte ante SACM/SOMEXFON con el reparto 50/50 con el Productor.',
            'Crédito obligatorio en todos los lanzamientos: "Prod. [Nombre del Productor] / Tianguis Beats".',
        ],
    },
    {
        id: 'Pro',
        name: 'Licencia Pro',
        subtitle: 'Uso Profesional y Radio',
        formato: 'WAV (Estudio) + MP3 Alta Calidad',
        tipo: 'No Exclusiva',
        comercial: true,
        vigencia: '5 a 10 años desde la compra',
        streams: 'Hasta 500,000 reproducciones',
        streamsLimit: 500000,
        radio: true,
        videoMusical: true,
        stems: false,
        wav: true,
        livePerf: true,
        creditoObligatorio: true,
        contentIdProhibido: true,
        color: 'indigo',
        features: [
            'WAV de Estudio + MP3 Alta Calidad · Sin Tag',
            'Hasta 500,000 reproducciones acumuladas',
            'Radio (AM/FM), Video Musical comercial, Presentaciones en vivo',
            'Vigencia: 5 a 10 años desde la compra',
            'Crédito obligatorio: Prod. [Productor] / Tianguis Beats',
        ],
        clauses: [
            'Incluye todos los derechos de la Licencia Básica.',
            'Autoriza transmisión en radio (AM/FM) y plataformas de radio digital hasta 500,000 streams.',
            'Permite uso en videos musicales comerciales (YouTube y similares).',
            'Permite presentaciones en vivo sin límite de aforo.',
            'El WAV es para mezcla/masterización del corte licenciado; no puede fragmentarse para otros usos.',
            'Crédito obligatorio: "Prod. [Nombre del Productor] / Tianguis Beats".',
        ],
    },
    {
        id: 'Premium',
        name: 'Licencia Premium',
        subtitle: 'Derechos Comerciales Ilimitados (No Exclusiva)',
        formato: 'Stems (Pistas separadas) + WAV + MP3',
        tipo: 'No Exclusiva',
        comercial: true,
        vigencia: 'Perpetua',
        streams: 'Ilimitadas',
        streamsLimit: null,
        radio: true,
        videoMusical: true,
        stems: true,
        wav: true,
        livePerf: true,
        creditoObligatorio: true,
        contentIdProhibido: true,
        color: 'rose',
        features: [
            'Stems (pistas separadas) + WAV + MP3 · Sin Tag',
            'Reproducciones y uso ILIMITADOS · Vigencia Perpetua',
            'Radio, Video Musical, Presentaciones en vivo sin restricciones',
            'El Productor puede seguir vendiendo esta licencia a otros artistas',
            'Crédito obligatorio: Prod. [Productor] / Tianguis Beats',
        ],
        clauses: [
            'Incluye todos los derechos de las Licencias Básica y Pro, con streams ilimitados y vigencia perpetua.',
            'Los Stems se autorizan ÚNICAMENTE para mezcla del corte licenciado. Prohibido extraer sonidos individuales para otras obras o librerías.',
            'El Productor puede vender esta misma licencia Premium a otros Artistas; esta licencia NO es exclusiva.',
            'Prohibido el registro en sistemas Content ID (YouTube, Meta, etc.) sin acuerdo escrito previo.',
            'Crédito obligatorio en todos los lanzamientos: "Prod. [Nombre del Productor] / Tianguis Beats".',
        ],
    },
    {
        id: 'Exclusiva',
        name: 'Exclusiva Estándar',
        subtitle: 'Exclusividad Total · WAV + MP3',
        formato: 'WAV (Estudio) + MP3 Alta Calidad',
        tipo: 'Exclusiva',
        comercial: true,
        vigencia: 'Perpetua · Sin límites',
        streams: 'Sin límite',
        streamsLimit: null,
        radio: true,
        videoMusical: true,
        stems: false,
        wav: true,
        livePerf: true,
        creditoObligatorio: true,
        contentIdProhibido: true,
        color: 'purple',
        features: [
            'WAV de Estudio + MP3 Alta Calidad · Sin Stems',
            'Propiedad exclusiva del Máster (grabación final)',
            'Beat retirado del catálogo y marcado como SOLD',
            'Uso ilimitado · Vigencia Perpetua',
            'Cláusula Safe Harbor: respeta licencias previas no exclusivas',
            'Crédito obligatorio: Prod. [Productor] / Tianguis Beats',
        ],
        clauses: [
            'Otorga los derechos de explotación exclusivos sobre el máster conforme al Art. 30 LFDA.',
            'Entrega en formatos de alta calidad MP3 y WAV. El Vendedor se compromete a retirar la obra de la venta pública tras esta transacción.',
            'Derecho exclusivo e ilimitado de distribuir, monetizar y transformar la obra de forma global (streaming, ventas físicas/digitales, sincronización).',
            'Registro en Content ID permitido únicamente para la canción derivada. Crédito obligatorio: "Prod. por [Nombre del Productor]".',
            'El Productor retiene el 100% de la propiedad moral y el 50% de los derechos de autor (Publishing).',
            'La presente licencia se rige por la Ley Federal del Derecho de Autor de México.',
        ],
    },
    {
        id: 'Exclusiva Premium',
        name: 'Exclusiva',
        subtitle: 'Propiedad Total · WAV + MP3 + Stems',
        formato: 'Stems (Pistas separadas) + WAV + MP3',
        tipo: 'Exclusiva',
        comercial: true,
        vigencia: 'Perpetua · Sin límites',
        streams: 'Sin límite',
        streamsLimit: null,
        radio: true,
        videoMusical: true,
        stems: true,
        wav: true,
        livePerf: true,
        creditoObligatorio: true,
        contentIdProhibido: true,
        color: 'rose',
        features: [
            'Stems (pistas separadas) + WAV + MP3 · Paquete Completo',
            'Propiedad exclusiva del Máster + control total de mezcla',
            'Beat retirado del catálogo y marcado como SOLD',
            'Uso ilimitado · Vigencia Perpetua',
            'Cláusula Safe Harbor: respeta licencias previas no exclusivas',
            'Crédito obligatorio: Prod. [Productor] / Tianguis Beats',
        ],
        clauses: [
            'Otorga los derechos de explotación más amplios. Licencia onerosa y por escrito conforme al Art. 30 LFDA.',
            'Entrega en formatos de alta calidad MP3, WAV y pistas individuales por separado (Stems/Tracks) para mezcla profesional.',
            'Derecho exclusivo e ilimitado de distribuir, monetizar y transformar la obra de forma global (streaming, ventas físicas/digitales, sincronización).',
            'Registro en Content ID permitido únicamente para la canción derivada. Crédito obligatorio: "Prod. por [Nombre del Productor]".',
            'El Productor retiene el 100% de la propiedad moral y el 50% de los derechos de autor (Publishing).',
            'La presente licencia se rige por la Ley Federal del Derecho de Autor de México.',
        ],
    },
];

/** Helper: get a plan by ID */
export const getLicensePlan = (id: LicensePlanId | string): LicensePlan | undefined =>
    LICENSE_PLANS.find(p => p.id === id);

/** Plans that are commercially available (non-free, purchasable) */
export const PURCHASABLE_PLANS: LicensePlanId[] = ['Básica', 'Pro', 'Premium', 'Exclusiva', 'Exclusiva Premium'];

// ─────────────────────────────────────────────────
// 🎛️ SOUND KIT LICENSE — Licencia de Sound Kit
// ─────────────────────────────────────────────────

export interface SoundKitLicense {
    tipo: string;
    subtipo: string;
    titulo: string;
    formatos: string[];
    allows: string[];
    prohibitions: string[];
    clauses: string[];
    color: string;
}

export const SOUND_KIT_LICENSE: SoundKitLicense = {
    tipo: 'Sound Kit',
    subtipo: 'Licencia de Uso en Producción Musical (Royalty-Free)',
    titulo: 'Sound Kit — Licencia Estándar de Producción',
    formatos: ['ZIP con Samples (WAV/MP3)', 'Presets (.xrp, .nki, .fxp, etc.)', 'MIDI Loops', 'One-Shots', 'Drum Loops'],
    allows: [
        'Usar los sonidos en producciones musicales propias (beats, tracks, canciones).',
        'Distribuir y monetizar las canciones resultantes en plataformas de streaming (Spotify, Apple Music, YouTube, etc.).',
        'Usar en presentaciones en vivo y sincronización en video.',
        'Uso ilimitado en producciones propias sin reporte de regalías.',
        'Compatible con todas las licencias de beats (Básica, Pro, Premium, Exclusiva).',
    ],
    prohibitions: [
        'Está PROHIBIDO redistribuir, revender o compartir los archivos del Sound Kit tal como fueron adquiridos.',
        'Está PROHIBIDO incluir los samples, loops o presets del Kit en otro Sound Kit, sample pack, librería de sonidos o producto similar que se venda o distribuya a terceros.',
        'Está PROHIBIDO usar los sonidos como base principal de otro beat que se venda como obra independiente sin transformación creativa significativa.',
        'El comprador no adquiere los derechos de autor del diseño sonoro original; solo la licencia de uso en producción.',
        'Prohibido el registro de los loops, samples o one-shots en sistemas de Content ID de forma individual.',
    ],
    clauses: [
        'La presente licencia es de tipo "Royalty-Free de Producción", lo que significa que el comprador paga una sola vez y puede usar los sonidos en producciones propias sin pagar regalías adicionales.',
        'La licencia de un Sound Kit es personal e intransferible. No puede cederse, sublicenciarse ni venderse a terceros.',
        'El creador del Sound Kit retiene los derechos de autor sobre el diseño sonoro original (Art. 5 LFDA). El comprador adquiere únicamente la licencia de uso descrita en este documento.',
        'Los archivos del Kit son herramientas creativas. El comprador es responsable de agregar originalidad creativa en las producciones resultantes para que constituyan obras derivadas protegibles.',
        'Tianguis Beats actúa como intermediario entre el creador del Sound Kit y el comprador. El creador garantiza que el Kit es de autoría original o cuenta con las licencias de terceros necesarias (samples de plataformas como Splice, Looperman, etc.).',
        'En caso de disputa sobre la originalidad del contenido de un Sound Kit, el creador es el único responsable conforme al Art. 231 LFDA.',
        'Para negociaciones especiales o uso en publicidad nacional/internacional de gran alcance, contacta al creador del Sound Kit o escribe a legal@tianguisbeats.com.',
    ],
    color: 'orange',
};
