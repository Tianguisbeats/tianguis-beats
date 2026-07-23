// Diagnóstico de "salud" de un beat del catálogo.
// Traduce las columnas crudas de la tabla `beats` en avisos accionables para
// el productor: qué le falta a un beat para vender mejor. Se usa tanto en el
// Panel (resumen) como en Mis Beats (badge por tarjeta).

export type BeatHealthSeverity = 'critico' | 'aviso';

export interface BeatHealthIssue {
    id: string;
    label: string;
    detail: string;
    severity: BeatHealthSeverity;
}

// Estructura mínima que necesita el diagnóstico. Cualquier fila de `beats`
// con estas columnas encaja.
export interface BeatHealthInput {
    portada_url?: string | null;
    archivo_wav_url?: string | null;
    archivo_stems_url?: string | null;
    es_publico?: boolean | null;
    esta_archivado?: boolean | null;
    esta_desactivado_por_plan?: boolean | null;
    conteo_reproducciones?: number | null;
    conteo_ventas?: number | null;
    es_premium_activa?: boolean | null;
    es_exclusiva_premium_activa?: boolean | null;
}

// Umbral de reproducciones a partir del cual "0 ventas" ya es una señal real
// y no simple falta de tráfico.
const PLAYS_SIN_VENTA_UMBRAL = 50;

export function diagnosticarBeat(beat: BeatHealthInput): BeatHealthIssue[] {
    const issues: BeatHealthIssue[] = [];

    // Un beat archivado no se muestra ni se vende: no tiene sentido
    // diagnosticarlo, sólo indicar su estado.
    if (beat.esta_archivado) {
        return [{ id: 'archivado', label: 'Archivado', detail: 'Este beat está archivado y no aparece en el catálogo.', severity: 'aviso' }];
    }

    const plays = beat.conteo_reproducciones ?? 0;
    const ventas = beat.conteo_ventas ?? 0;

    if (!beat.portada_url) {
        issues.push({
            id: 'sin_portada',
            label: 'Sin portada',
            detail: 'Los beats con portada reciben muchas más reproducciones. Sube un arte.',
            severity: 'critico',
        });
    }

    if (!beat.archivo_wav_url) {
        issues.push({
            id: 'sin_wav',
            label: 'Sin WAV',
            detail: 'Sin archivo WAV no puedes ofrecer licencias Pro ni superiores.',
            severity: 'aviso',
        });
    }

    // Stems sólo importan si el productor activó una licencia que los entrega.
    if (!beat.archivo_stems_url && (beat.es_premium_activa || beat.es_exclusiva_premium_activa)) {
        issues.push({
            id: 'sin_stems',
            label: 'Sin stems',
            detail: 'Activaste una licencia Premium/Exclusiva pero no subiste los stems que promete.',
            severity: 'critico',
        });
    }

    if (plays >= PLAYS_SIN_VENTA_UMBRAL && ventas === 0) {
        issues.push({
            id: 'plays_sin_venta',
            label: 'Revisa el precio',
            detail: `Tiene ${plays.toLocaleString('es-MX')} reproducciones y ninguna venta. Prueba ajustar el precio o las licencias.`,
            severity: 'aviso',
        });
    }

    if (beat.esta_desactivado_por_plan) {
        issues.push({
            id: 'desactivado_plan',
            label: 'Desactivado por plan',
            detail: 'Superaste el límite de tu plan. Mejóralo para reactivar este beat.',
            severity: 'critico',
        });
    } else if (!beat.es_publico) {
        issues.push({
            id: 'oculto',
            label: 'Oculto',
            detail: 'Este beat no es visible en tu perfil ni en el catálogo.',
            severity: 'aviso',
        });
    }

    return issues;
}

// Nivel de salud agregado de un beat, para pintar un solo indicador.
export function nivelSaludBeat(beat: BeatHealthInput): 'ok' | 'aviso' | 'critico' {
    const issues = diagnosticarBeat(beat);
    if (issues.some((i) => i.severity === 'critico')) return 'critico';
    if (issues.length > 0) return 'aviso';
    return 'ok';
}

// Resumen del catálogo completo, para el Panel.
export function resumenSaludCatalogo(beats: BeatHealthInput[]) {
    let ok = 0;
    let aviso = 0;
    let critico = 0;
    for (const b of beats) {
        const nivel = nivelSaludBeat(b);
        if (nivel === 'ok') ok++;
        else if (nivel === 'aviso') aviso++;
        else critico++;
    }
    return { ok, aviso, critico, total: beats.length };
}
