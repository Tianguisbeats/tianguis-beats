// Insights accionables del productor.
// A diferencia de las métricas crudas (ingresos, plays), esto responde
// preguntas: "¿qué beat promociono?", "¿qué día vendo más?". Todo se calcula
// a partir de datos reales de `beats` y `transacciones` — sin valores
// simulados.

export interface InsightBeat {
    id?: string;
    titulo: string;
    genero?: string | null;
    portada_url?: string | null;
    conteo_reproducciones?: number | null;
    conteo_ventas?: number | null;
    conteo_likes?: number | null;
}

export interface InsightSale {
    precio_total?: number | string | null;
    fecha_creacion: string;
    nombre_producto?: string | null;
}

export type InsightTone = 'positivo' | 'oportunidad' | 'neutro';

export interface StudioInsight {
    id: string;
    titulo: string;
    valor: string;
    detalle: string;
    tone: InsightTone;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Reproducciones mínimas para que un ratio de conversión sea significativo.
const MIN_PLAYS_CONVERSION = 30;

export function calcularInsights(beats: InsightBeat[], sales: InsightSale[]): StudioInsight[] {
    const insights: StudioInsight[] = [];

    // 1. Mejor conversión reproducción → venta.
    const conConversion = beats
        .filter((b) => (b.conteo_reproducciones ?? 0) >= MIN_PLAYS_CONVERSION && (b.conteo_ventas ?? 0) > 0)
        .map((b) => ({
            beat: b,
            ratio: (b.conteo_ventas ?? 0) / (b.conteo_reproducciones ?? 1),
        }))
        .sort((a, b) => b.ratio - a.ratio);

    if (conConversion.length > 0) {
        const top = conConversion[0];
        insights.push({
            id: 'mejor_conversion',
            titulo: 'Tu beat que mejor convierte',
            valor: top.beat.titulo,
            detalle: `Convierte ${(top.ratio * 100).toFixed(1)}% de sus reproducciones en ventas. Es tu mejor candidato para invertir en promoción.`,
            tone: 'positivo',
        });
    }

    // 2. Oportunidad: mucho play, cero ventas.
    const oportunidad = beats
        .filter((b) => (b.conteo_ventas ?? 0) === 0)
        .sort((a, b) => (b.conteo_reproducciones ?? 0) - (a.conteo_reproducciones ?? 0))[0];

    if (oportunidad && (oportunidad.conteo_reproducciones ?? 0) >= MIN_PLAYS_CONVERSION) {
        insights.push({
            id: 'oportunidad',
            titulo: 'Oportunidad sin explotar',
            valor: oportunidad.titulo,
            detalle: `Tiene ${(oportunidad.conteo_reproducciones ?? 0).toLocaleString('es-MX')} reproducciones pero ninguna venta. Revisa su precio, licencias o portada.`,
            tone: 'oportunidad',
        });
    }

    // 3. Mejor día de la semana para vender.
    if (sales.length >= 3) {
        const ventasPorDia = new Array(7).fill(0);
        for (const s of sales) {
            const dia = new Date(s.fecha_creacion).getDay();
            ventasPorDia[dia] += Number(s.precio_total) || 0;
        }
        const mejorDiaIdx = ventasPorDia.indexOf(Math.max(...ventasPorDia));
        if (ventasPorDia[mejorDiaIdx] > 0) {
            insights.push({
                id: 'mejor_dia',
                titulo: 'Tu mejor día de ventas',
                valor: DIAS_SEMANA[mejorDiaIdx],
                detalle: `Es el día en que más ingresos generas. Programa tus lanzamientos y promociones para el ${DIAS_SEMANA[mejorDiaIdx].toLowerCase()}.`,
                tone: 'neutro',
            });
        }
    }

    // 4. Género estrella (cruza el nombre del producto vendido con el género del beat).
    if (sales.length > 0 && beats.length > 0) {
        const generoPorTitulo = new Map<string, string>();
        for (const b of beats) {
            if (b.genero) generoPorTitulo.set(b.titulo, b.genero);
        }
        const ingresoPorGenero = new Map<string, number>();
        for (const s of sales) {
            const genero = s.nombre_producto ? generoPorTitulo.get(s.nombre_producto) : undefined;
            if (genero) {
                ingresoPorGenero.set(genero, (ingresoPorGenero.get(genero) || 0) + (Number(s.precio_total) || 0));
            }
        }
        const mejorGenero = [...ingresoPorGenero.entries()].sort((a, b) => b[1] - a[1])[0];
        if (mejorGenero) {
            insights.push({
                id: 'genero_estrella',
                titulo: 'Tu género más rentable',
                valor: mejorGenero[0],
                detalle: `Es el estilo que más ingresos te ha dejado. Considera subir más beats de ${mejorGenero[0]}.`,
                tone: 'positivo',
            });
        }
    }

    return insights;
}
