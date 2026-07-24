"use client";

import React, { useState, useEffect } from 'react';
import { supabase, getUserSafe } from '@/lib/supabase';
import {
    FileText, Settings, ShieldCheck, FileKey, Crown, Zap,
    Package, AlignLeft, Info, Music, Check, X, Layers,
    ChevronRight, RotateCcw, AlertCircle, Download
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import LoadingTianguis from '@/components/LoadingTianguis';

export type ContractType = 'gratis' | 'basica' | 'pro' | 'premium' | 'exclusiva' | 'exclusiva_premium' | 'soundkits';

const CONTRACT_TYPES = [
    {
        id: 'gratis' as ContractType,
        db_col: 'licencia_gratis',
        name: 'Licencia Gratis',
        tier: 'GRATIS',
        description: 'Licencia estándar para uso no comercial.',
        detalles: {
            archivos: 'MP3 (con Tag de Voz)',
            streams: 'Hasta 5,000 (Sin monetización)',
            ventas: 'Prohibida la venta corporativa',
            video: '1 Video (No musical)',
            radio: 'No permitido',
            presentaciones: 'Sin fines de lucro',
            monetizacion: 'Desactivada'
        },
        icon: <FileText size={22} />,
        color: 'text-slate-400',
        iconBg: 'bg-slate-400/10',
        borderColor: 'border-slate-400/20',
        glowColor: '',
        accentLine: 'via-slate-400',
        badgeBg: 'bg-slate-400/10 text-slate-400',
    },
    {
        id: 'basica' as ContractType,
        db_col: 'licencia_basica',
        name: 'Licencia Básica',
        tier: 'BÁSICA',
        description: 'Distribución básica para nuevos lanzamientos.',
        detalles: {
            archivos: 'MP3 (Sin Tag)',
            streams: 'Hasta 10,000',
            ventas: 'Hasta 2,000 copias',
            video: '1 Video Musical',
            radio: 'No permitido',
            presentaciones: 'Sin fines de lucro',
            monetizacion: 'Desactivada'
        },
        icon: <Music size={22} />,
        color: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        glowColor: '',
        accentLine: 'via-emerald-500',
        badgeBg: 'bg-emerald-500/10 text-emerald-400',
    },
    {
        id: 'pro' as ContractType,
        db_col: 'licencia_pro',
        name: 'Licencia Pro',
        tier: 'PRO',
        description: 'Mejor calidad y mayor alcance de streams.',
        detalles: {
            archivos: 'WAV + MP3 (Sin Tag)',
            streams: 'Hasta 100,000',
            ventas: 'Hasta 5,000 copias',
            video: '2 Videos Musicales',
            radio: 'Permitido (2 estaciones)',
            presentaciones: 'Hasta 5 pagadas',
            monetizacion: 'Permitida'
        },
        icon: <ShieldCheck size={22} />,
        color: 'text-blue-400',
        iconBg: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        glowColor: '',
        accentLine: 'via-blue-500',
        badgeBg: 'bg-blue-500/10 text-blue-400',
    },
    {
        id: 'premium' as ContractType,
        db_col: 'licencia_premium',
        name: 'Licencia Premium',
        tier: 'PREMIUM',
        description: 'Control total con archivos por separado (Stems).',
        detalles: {
            archivos: 'WAV + STEMS + MP3',
            streams: 'Ilimitados',
            ventas: 'Ilimitadas',
            video: 'Videos Ilimitados',
            radio: 'Estaciones Ilimitadas',
            presentaciones: 'Ilimitadas',
            monetizacion: 'Permitida'
        },
        icon: <Layers size={22} />,
        color: 'text-amber-400',
        iconBg: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        glowColor: '',
        accentLine: 'via-amber-500',
        badgeBg: 'bg-amber-500/10 text-amber-400',
    },
    {
        id: 'exclusiva' as ContractType,
        db_col: 'licencia_exclusiva_estandar',
        name: 'Exclusiva Estándar',
        tier: 'EXCLUSIVA',
        description: 'Exclusividad total. WAV + MP3 sin stems.',
        detalles: {
            archivos: 'WAV + MP3 (Sin Stems)',
            streams: 'Ilimitados',
            ventas: 'Ilimitadas',
            video: 'Videos Ilimitados',
            radio: 'Ilimitado',
            presentaciones: 'Ilimitadas',
            monetizacion: 'Content ID Permitido'
        },
        icon: <Crown size={22} />,
        color: 'text-purple-400',
        iconBg: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        glowColor: '',
        accentLine: 'via-purple-500',
        badgeBg: 'bg-purple-500/10 text-purple-400',
    },
    {
        id: 'exclusiva_premium' as ContractType,
        db_col: 'licencia_exclusiva_premium',
        name: 'Exclusiva Premium',
        tier: 'EXCL. PREMIUM',
        description: 'Exclusividad total + Stems para mezcla profesional.',
        detalles: {
            archivos: 'WAV + STEMS + MP3',
            streams: 'Ilimitados',
            ventas: 'Ilimitadas',
            video: 'Videos Ilimitados',
            radio: 'Ilimitado',
            presentaciones: 'Ilimitadas',
            monetizacion: 'Content ID Permitido'
        },
        icon: <Crown size={22} />,
        color: 'text-rose-400',
        iconBg: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        glowColor: '',
        accentLine: 'via-rose-500',
        badgeBg: 'bg-rose-500/10 text-rose-400',
    },
    {
        id: 'soundkits' as ContractType,
        db_col: 'licencia_soundkits',
        name: 'Licencia Sound Kit',
        tier: 'SOUND KITS',
        description: 'Uso comercial libre de regalías para productores.',
        detalles: {
            archivos: 'WAV 24-bit',
            streams: 'Ilimitados',
            ventas: 'Ilimitadas',
            video: 'N/A',
            radio: 'N/A',
            presentaciones: 'N/A',
            monetizacion: 'Royalty Free'
        },
        icon: <Package size={22} />,
        color: 'text-orange-400',
        iconBg: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        glowColor: '',
        accentLine: 'via-orange-500',
        badgeBg: 'bg-orange-500/10 text-orange-400',
    }
];

export default function ContractsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<Record<string, any>>({});
    const [activeModal, setActiveModal] = useState<{
        isOpen: boolean;
        type: ContractType | null;
        mode: 'editar' | 'detalles';
    }>({ isOpen: false, type: null, mode: 'editar' });

    const [expertFormData, setExpertFormData] = useState<{ texto_legal: string, settings?: { fontSize: number, paddingTop: number, paddingHorizontal: number } }>({ texto_legal: '' });
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const insertTag = (tag: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = expertFormData.texto_legal;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const newText = before + tag + after;
        setExpertFormData(prev => ({ ...prev, texto_legal: newText }));
        
        // Return focus and set selection
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + tag.length;
            }
        }, 10);
    };

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        try {
            const user = await getUserSafe();
            if (!user) return;
            const { data, error } = await supabase.from('licencias').select('*').eq('productor_id', user.id).single();
            if (error && error.code !== 'PGRST116') { console.warn('Error al cargar licencias:', error.message); setLoading(false); return; }
            setTemplates(data || {});
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const openModal = (type: ContractType, mode: 'editar' | 'detalles') => {
        const contractInfo = CONTRACT_TYPES.find(ct => ct.id === type);
        const dbCol = contractInfo?.db_col || '';
        let existingText = templates[dbCol] || getDefaultLegalText(type);
        
        let settings = { fontSize: 10, paddingTop: 27, paddingHorizontal: 10 };
        
        // Parse settings if present in the text
        const settingsMatch = existingText.match(/^<!-- SETTINGS: (.+?) -->\n/);
        if (settingsMatch) {
            try {
                settings = { ...settings, ...JSON.parse(settingsMatch[1]) };
                existingText = existingText.replace(/^<!-- SETTINGS: .+? -->\n/, '');
            } catch (e) {
                console.error("Error parsing settings", e);
            }
        }
        
        setExpertFormData({ texto_legal: existingText, settings });
        setActiveModal({ isOpen: true, type, mode });
    };

    const getDefaultLegalText = (type: ContractType) => {
        const defaults: Record<string, string> = {
            gratis: `ID DE TRANSACCIÓN: [ID_ORDEN]
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
ID ÚNICO DE LICENCIA: [ID_ORDEN]`,
            basica: `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA BASICA (USO COMERCIAL ilimitado)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], quienes de mutuo acuerdo se someten a las siguientes cláusulas.
* 2. LA OBRA: El Vendedor otorga una licencia de uso comercial limitado sobre la obra musical titulada: [NOMBRE_DEL_BEAT] entregada en los siguientes formatos: [LISTA_DE_ARCHIVOS].
* 3. CONCESIÓN DE USO COMERCIAL: Se otorga al Comprador el derecho no exclusivo de distribuir y monetizar una (1) nueva canción derivada bajo los siguientes límites: hasta 50,000 reproducciones totales en plataformas digitales, hasta 5,000 copias digitales o físicas, uso en YouTube y Redes Sociales sin monetización de Content ID, y presentaciones en vivo.
* 4. RESTRICCIONES CRÍTICAS: El Comprador tiene estrictamente prohibido registrar la obra en sistemas de huella digital o Content ID. Es obligatorio incluir el crédito: Prod. por [NOMBRE_ARTISTICO_PRODUCTOR] / en todos los lanzamientos.
* 5. VIGENCIA Y PROPIEDAD: Esta licencia tiene una vigencia de 2 años. El Productor retiene el 100% de la propiedad de la composición original y el 50% de los derechos de autor (Publishing) de la nueva obra. Al expirar el tiempo o alcanzar los límites de ventas, el Comprador deberá renovar en tianguisbeats.com.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`,
            pro: `ID DE TRANSACCIÓN: [ID_ORDEN]
FECHA DE EMISIÓN: [FECHA_COMPRA]

MODALIDAD: LICENCIA PRO (USO COMERCIAL AMPLIADO)

* 1. LAS PARTES: El presente acuerdo se celebra entre el Vendedor Tianguis Beats, en representación del Productor [NOMBRE_COMPLETO_PRODUCTOR], y el Comprador [NOMBRE_COMPLETO_COMPRADOR], quienes de mutuo acuerdo se someten a las siguientes cláusulas.
* 2. LA OBRA: El Vendedor otorga una licencia de uso comercial ampliado sobre la obra musical titulada: [NOMBRE_DEL_BEAT] entregada en los siguientes formatos: [LISTA_DE_ARCHIVOS].
* 3. CONCESIÓN DE USO COMERCIAL: Se otorga al Comprador el derecho no exclusivo de distribuir y monetizar una (1) nueva canción derivada bajo los siguientes términos: transmisiones de audio (Streaming) ilimitadas, hasta 10,000 copias digitales o físicas, uso en YouTube y Redes Sociales sin monetización de Content ID, y presentaciones en vivo con fines de lucro.
* 4. RESTRICCIONES CRÍTICAS: El Comprador tiene estrictamente prohibido registrar la obra en sistemas de huella digital o Content ID. Es obligatorio incluir el crédito: Prod. por [NOMBRE_ARTISTICO_PRODUCTOR] / en todos los lanzamientos.
* 5. VIGENCIA Y PROPIEDAD: Esta licencia tiene una vigencia de 2 años. El Productor retiene el 100% de la propiedad de la composición original y el 50% de los derechos de autor (Publishing) de la nueva obra. Al expirar el tiempo o alcanzar los límites de ventas, el Comprador deberá renovar en tianguisbeats.com.
* 6. JURISDICCIÓN: Este acuerdo se rige por la Ley Federal del Derecho de Autor de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.

VALIDACIÓN DIGITAL DE LICENCIA

POR EL VENDEDOR: Tianguis Beats Licencia emitida y validada automáticamente por el sistema de control de derechos de autor de tianguisbeats.com

POR EL COMPRADOR: Aceptado digitalmente mediante el proceso de descarga en Tianguis Beats.

NOMBRE: [NOMBRE_COMPLETO_COMPRADOR]
ID ÚNICO DE LICENCIA: [ID_ORDEN]`,
            premium: `ID DE TRANSACCIÓN: [ID_ORDEN]
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
ID ÚNICO DE LICENCIA: [ID_ORDEN]`,
            exclusiva: `ID DE TRANSACCIÓN: [ID_ORDEN]
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
ID ÚNICO DE LICENCIA: [ID_ORDEN]`,
            exclusiva_premium: `ID DE TRANSACCIÓN: [ID_ORDEN]
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
ID ÚNICO DE LICENCIA: [ID_ORDEN]`,
            soundkits: `ID DE TRANSACCIÓN: [ID_ORDEN]
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
ID ÚNICO DE LICENCIA: [ID_ORDEN]`,
        };
        return defaults[type] || '';
    };

    const handleResetTemplate = () => {
        if (!activeModal.type) return;
        const defaultText = getDefaultLegalText(activeModal.type);
        const defaultSettings = { fontSize: 10, paddingTop: 27, paddingHorizontal: 10 };
        setExpertFormData({ texto_legal: defaultText, settings: defaultSettings });
        showToast("Plantilla restablecida a los valores originales", "success");
    };


    const handleDownloadPreview = async () => {
        if (!activeModal.type) return;
        try {
            const res = await fetch('/api/studio/license-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: expertFormData.texto_legal, 
                    type: activeModal.type,
                    settings: expertFormData.settings,
                    name: templates.productor_nombre_completo || templates.productor_nombre_usuario
                })
            });
            if (!res.ok) throw new Error("Error al generar el demo");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Demo_Tianguis_${activeModal.type.toUpperCase()}_v${Date.now().toString().slice(-4)}.pdf`;
            a.click();
            showToast("Demo oficial generado con éxito", "success");
        } catch (error: any) {
            console.error(error);
            showToast("Error al generar el demo: " + error.message, "error");
        }
    };

    const handleSaveTemplate = async () => {
        if (!activeModal.type) return;
        try {
            const user = await getUserSafe();
            if (!user) throw new Error("No autenticado");
            
            const contractInfo = CONTRACT_TYPES.find(ct => ct.id === activeModal.type);
            const dbCol = contractInfo?.db_col || '';
            const isSoundKit = activeModal.type === 'soundkits';
            const isExempted = activeModal.type === 'gratis' || activeModal.type === 'soundkits';
            const nameTag = isSoundKit ? '[NOMBRE_DEL_SOUNDKIT]' : '[NOMBRE_DEL_BEAT]';
            const requiredVars = ['[ID_ORDEN]', '[FECHA_COMPRA]', nameTag, '[NOMBRE_COMPLETO_PRODUCTOR]', '[NOMBRE_ARTISTICO_PRODUCTOR]', '[NOMBRE_COMPLETO_COMPRADOR]'];
            
            if (!isExempted) {
                requiredVars.push('[LISTA_DE_ARCHIVOS]');
            }
            
            const missingVars = requiredVars.filter(v => !expertFormData.texto_legal.includes(v));
            
            if (missingVars.length > 0) {
                showToast(`Faltan variables obligatorias: ${missingVars.join(', ')}`, "error");
                return;
            }
            
            const textToSave = expertFormData.settings 
                ? "<!-- SETTINGS: " + JSON.stringify(expertFormData.settings) + " -->\n" + expertFormData.texto_legal
                : expertFormData.texto_legal;


            const payload = {
                productor_id: user.id,
                [dbCol]: textToSave
            };
            
            const { error } = await supabase.from('licencias').upsert(payload, { onConflict: 'productor_id' });

            if (error) {
                if (error.code === '42P01') throw new Error("La tabla de licencias no existe. Ejecuta el SQL en Supabase primero.");
                throw error;
            }
            showToast("Licencia guardada exitosamente", "success");
            await fetchTemplates();
            setActiveModal({ isOpen: false, type: null, mode: 'editar' });
        } catch (error: any) {
            showToast(`Error: ${error.message}`, "error");
        }
    };


    if (loading) return <LoadingTianguis />;

    const activeContract = CONTRACT_TYPES.find(t => t.id === activeModal.type);
    
    // Validations & Save State Computed
    const isEditingMode = activeModal.mode === 'editar';
    
    // Prepare the initial text comparison without the settings header for accurate dirty check
    let initialTextRaw = activeContract ? (templates[activeContract.db_col] || getDefaultLegalText(activeContract.id)) : '';
    let initialTextClean = initialTextRaw.replace(/^<!-- SETTINGS: .+? -->\n/, '');
    
    const hasChanges = isEditingMode; // Simplified for now since settings might also change -> we'll enable the save button whenever in edit mode
    
    // Dynamic missing vars for UI feedback
    const isSoundKit = activeModal.type === 'soundkits';
    const isExempted = activeModal.type === 'gratis' || activeModal.type === 'soundkits';
    const nameTag = isSoundKit ? '[NOMBRE_DEL_SOUNDKIT]' : '[NOMBRE_DEL_BEAT]';
    const requiredVars = ['[ID_ORDEN]', '[FECHA_COMPRA]', nameTag, '[NOMBRE_COMPLETO_PRODUCTOR]', '[NOMBRE_ARTISTICO_PRODUCTOR]', '[NOMBRE_COMPLETO_COMPRADOR]'];
    if (!isExempted) requiredVars.push('[LISTA_DE_ARCHIVOS]');
    const missingVars = requiredVars.filter(v => !expertFormData.texto_legal.includes(v));

    return (
        <div className="max-w-4xl mx-auto space-y-16 pb-20 px-4 md:px-0 py-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500">Business & Legal Center v2.5</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] text-foreground mb-3 md:mb-4">
                        <span className="opacity-40">Tus</span> <br />
                        <span className="text-blue-500 relative inline-block">
                            Licencias
                            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                        </span>
                    </h1>
                    <p className="text-muted text-[11px] font-bold uppercase tracking-widest max-w-md opacity-40 leading-relaxed">Personaliza los términos legales y límites de cada tipo para proteger tu propiedad intelectual.</p>
                </div>
                <div className="hidden md:block text-right pb-2">
                    <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full mb-4 ml-auto" />
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-30">Studio Official</p>
                </div>
            </div>

            <div className="space-y-8">
                {CONTRACT_TYPES.map((contract, index) => {
                    const dbCol = contract.db_col;

                    return (
                        <div
                            key={contract.id}
                            className="group relative bg-white/70 dark:bg-[#0c0c0e]/60 border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 md:p-10 backdrop-blur-3xl shadow-2xl shadow-black/5 hover:shadow-black/10 transition-all duration-700 hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Card Accent Glow */}
                            <div className={`absolute -top-24 -right-24 w-48 h-48 ${contract.iconBg} blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000`} />
                            
                            {/* Decorative Background Icon */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-[0.03] group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-1000 rotate-12 pointer-events-none">
                                {React.cloneElement(contract.icon as React.ReactElement<any>, { size: 240, className: contract.color })}
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                {/* 1. Icon & Name Block - COMPACTED */}
                                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <div className={`${contract.color} opacity-80`}>
                                                {React.cloneElement(contract.icon as React.ReactElement<any>, { size: 14 })}
                                            </div>
                                            <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${contract.color} opacity-60`}>{contract.tier}</p>
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight text-foreground">
                                            {contract.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* 3. Global Actions */}
                                <div className="flex flex-row gap-3">
                                    <button
                                        onClick={() => openModal(contract.id, 'editar')}
                                        className={`px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 bg-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/20 active:scale-95 border border-white/10`}
                                    >
                                        <AlignLeft size={16} />
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => openModal(contract.id, 'detalles')}
                                        className={`px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 bg-foreground/5 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-foreground/10 dark:hover:bg-white/10 border border-foreground/5 dark:border-white/10 active:scale-95`}
                                    >
                                        <Info size={16} className={`${contract.color}`} />
                                        Detalles
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {activeModal.isOpen && activeModal.type && activeContract && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* NO BLACK BACKGROUND OR BACKDROP BLUR PER USER REQUEST */}
                    <div className="absolute inset-0 pointer-events-auto" onClick={() => setActiveModal({ isOpen: false, type: null, mode: 'editar' })} />

                    {/* Modal Content - Floating with massive deep shadow */}
                    <div className={`relative bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-white/10 rounded-[3.5rem] overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_50px_200px_-20px_rgba(0,0,0,0.6)] dark:shadow-[0_50px_200px_-20px_rgba(0,0,0,1)] ${activeModal.mode === 'editar' ? 'w-full max-w-5xl' : 'w-full max-w-2xl'}`}>
                        {/* Modal accent glow (Top left) */}
                        <div className={`absolute -top-20 -left-20 w-40 h-40 ${activeContract.iconBg} blur-[60px] opacity-40`} />

                        {/* Modal Header */}
                        <div className="p-10 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] relative z-10">
                            <div className="flex items-center gap-6">
                                <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${activeContract.badgeBg} border ${activeContract.borderColor}`}>
                                    {activeModal.mode === 'editar' ? <FileKey size={14} /> : <Info size={14} />}
                                    {activeModal.mode === 'editar' ? 'Studio Editor · 1.0' : 'Especificaciones'}
                                </div>
                                <h2 className={`text-3xl font-black uppercase tracking-tighter ${activeContract.color}`}>
                                    {activeContract.name}
                                </h2>
                            </div>
                            <button
                                onClick={() => setActiveModal({ isOpen: false, type: null, mode: 'editar' })}
                                className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        {activeModal.mode === 'editar' ? (
                            /* ─── SPLIT PANEL EDITOR ─── */
                            <div className="flex h-[75vh] relative z-10">
                                {/* LEFT: Editor Panel */}
                                <div className="w-1/2 flex flex-col border-r border-slate-200 dark:border-white/10 overflow-hidden">
                                    <div className="px-8 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">🎨 Ajustes de Composición Legal</p>
                                            <p className="text-[9px] font-bold text-accent/50 mt-1 uppercase tracking-widest">Sincronización en tiempo real con el documento PDF</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                                            <AlertCircle size={10} className="text-amber-500" />
                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Edición bajo responsabilidad</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-8 space-y-8 bg-white dark:bg-[#0c0c0e] overflow-y-auto pointer-events-auto custom-scrollbar" data-lenis-prevent>
                                        
                                        <div className="p-10 bg-blue-500/[0.02] border border-blue-500/10 rounded-[2.5rem] space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm">
                                                    <ShieldCheck size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">Configuración de Variables de Sistema</p>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40 mt-0.5">Protocolo de automatización legal</p>
                                                </div>
                                            </div>
                                            <div className="pl-14 space-y-3">
                                                <p className="text-[11px] font-bold text-foreground/80 leading-relaxed uppercase tracking-wider">
                                                    Las etiquetas entre corchetes como <span className="text-blue-500">[ID_ORDEN]</span> o <span className="text-blue-500">[NOMBRE_DEL_BEAT]</span> son <span className="text-blue-500">INDISPENSABLES</span>.
                                                </p>
                                                <p className="text-[10px] font-bold text-muted/60 leading-relaxed uppercase tracking-widest">
                                                    No elimines estas etiquetas del texto. El sistema las utiliza para inyectar automáticamente los datos reales de la transacción al momento de la descarga. Si las borras, el contrato perderá su validez legal.
                                                </p>
                                            </div>
                                        </div>

                                        {missingVars.length > 0 && (
                                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl space-y-2">
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                                    <AlertCircle size={14} /> Sistema Comprometido
                                                </p>
                                                <p className="text-[9px] font-bold text-red-400 mt-2 break-all opacity-80 leading-relaxed uppercase">
                                                    Debes re-insertar las etiquetas faltantes para poder guardar el contrato:
                                                </p>
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {missingVars.map(v => (
                                                        <span key={v} className="px-2 py-1 bg-red-500/20 rounded-md text-[9px] font-black text-red-400 border border-red-500/30">
                                                            {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <textarea
                                            ref={textareaRef}
                                            rows={20}
                                            value={expertFormData.texto_legal}
                                            onChange={(e) => setExpertFormData(prev => ({ ...prev, texto_legal: e.target.value }))}
                                            className="w-full min-h-[600px] bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-10 font-mono text-[12px] text-foreground focus:border-blue-500/50 outline-none resize-none leading-relaxed shadow-inner overflow-y-auto pointer-events-auto custom-scrollbar"
                                            placeholder="Escribe aquí el texto completo de tu contrato..."
                                        />
                                    </div>
                                </div>

                                {/* RIGHT: Letterhead Preview Panel */}
                                <div className="w-1/2 flex flex-col overflow-hidden bg-slate-100 dark:bg-black/60">
                                    <div className="px-8 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">📄 Previsualización Studio Print</p>
                                            <p className="text-[9px] font-bold text-muted/40 mt-1 uppercase tracking-widest">Renderización oficial del sistema Tianguis Beats</p>
                                        </div>
                                        <button
                                            onClick={handleDownloadPreview}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-sm"
                                        >
                                            <Download size={14} />
                                            Descargar Demo Oficial
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pointer-events-auto custom-scrollbar p-12 bg-white dark:bg-[#1a1a1c]" data-lenis-prevent>
                                        {/* Letterhead container */}
                                        <div className="relative w-full rounded-md overflow-hidden bg-white shadow-2xl" style={{ aspectRatio: '210/297', maxWidth: '500px' }}>
                                            {/* Letterhead background */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="/hoja_membretada.png"
                                                alt="Hoja Membretada Tianguis Beats"
                                                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                                                draggable={false}
                                            />
                                            {/* Contract text overlay */}
                                            <div
                                                className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar pointer-events-auto"
                                                data-lenis-prevent
                                                style={{ 
                                                    paddingTop: `${expertFormData.settings?.paddingTop || 27}%`, 
                                                    paddingLeft: `${expertFormData.settings?.paddingHorizontal || 10}%`,
                                                    paddingRight: `${(expertFormData.settings?.paddingHorizontal || 10) + 8}%`, 
                                                }}
                                            >
                                                <div className="pb-40">
                                                    <pre
                                                        className="whitespace-pre-wrap break-words leading-relaxed text-gray-900 font-sans"
                                                        style={{ 
                                                            fontSize: `${(expertFormData.settings?.fontSize || 10) * 0.77}px`, 
                                                        }}
                                                    >
                                                        {expertFormData.texto_legal || '(Cargando composición...)'}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ─── ESPECIFICACIONES PANEL ─── */
                            <div className="p-12 overflow-y-auto max-h-[60vh] relative z-10" data-lenis-prevent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-white/5">
                                        {activeContract && activeContract.detalles && Object.entries(activeContract.detalles).map(([key, value]) => (
                                            <div key={key} className="py-6 flex items-center justify-between group/row">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted group-hover/row:text-foreground transition-all duration-300">{key.replace('_', ' ')}</span>
                                                <span className={`text-[13px] font-black uppercase tracking-tight ${activeContract.color}`}>{value as string}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="px-10 py-8 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 flex gap-6 justify-end items-center relative z-10">
                             <button
                                 onClick={() => setActiveModal({ isOpen: false, type: null, mode: 'editar' })}
                                 className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 ${
                                     activeModal.mode === 'editar'
                                         ? 'text-muted hover:text-foreground'
                                         : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 border border-blue-400/20'
                                 }`}
                             >
                                 {activeModal.mode === 'editar' ? 'Descartar' : 'Entendido'}
                             </button>
                            {activeModal.mode === 'editar' && (
                                <>
                                    <button
                                        onClick={handleResetTemplate}
                                        className="mr-auto flex items-center gap-3 px-6 py-3 rounded-2xl border border-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/5 transition-all active:scale-95"
                                    >
                                        <RotateCcw size={16} />
                                        Valores por Defecto
                                    </button>
                                    <button
                                        onClick={handleSaveTemplate}
                                        disabled={!hasChanges || missingVars.length > 0}
                                        className={`px-10 py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] transition-all border flex items-center gap-3 ${
                                            !hasChanges || missingVars.length > 0
                                                ? 'opacity-40 cursor-not-allowed grayscale'
                                                : 'bg-emerald-600 text-white border-emerald-400 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95'
                                        }`}
                                    >
                                        <Check size={18} />
                                        Confirmar Cambios
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
