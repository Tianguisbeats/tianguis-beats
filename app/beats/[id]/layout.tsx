import type { Metadata } from 'next';
import { obtenerSupabaseAdmin } from '@/lib/supabase-admin';

const SITE_URL = (process.env.NEXT_PUBLIC_URL || 'https://tianguisbeats.com').replace(/\/$/, '');

function resolverPortada(portada_url: string | null | undefined): string {
    if (!portada_url) return `${SITE_URL}/icon.png`;
    if (portada_url.startsWith('http')) return portada_url;
    try {
        const supabase = obtenerSupabaseAdmin();
        return supabase.storage.from('portadas_beats').getPublicUrl(portada_url).data?.publicUrl || `${SITE_URL}/icon.png`;
    } catch {
        return `${SITE_URL}/icon.png`;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const supabase = obtenerSupabaseAdmin();
        const { data: beat } = await supabase
            .from('beats')
            .select('titulo, descripcion, genero, bpm, portada_url, es_publico, productor:perfiles(nombre_artistico, nombre_usuario)')
            .eq('id', id)
            .single();

        if (!beat) return { title: 'Beat no encontrado' };

        const productor: any = Array.isArray(beat.productor) ? beat.productor[0] : beat.productor;
        const artista = productor?.nombre_artistico || productor?.nombre_usuario || 'Tianguis Beats';
        const titulo = `${beat.titulo} — ${artista}`;
        const partes = [beat.genero, beat.bpm ? `${beat.bpm} BPM` : null].filter(Boolean).join(' · ');
        const descripcion = beat.descripcion?.trim()
            || `${beat.titulo} por ${artista}${partes ? ` (${partes})` : ''}. Escucha y compra la licencia en Tianguis Beats.`;
        const imagen = resolverPortada(beat.portada_url);
        const url = `${SITE_URL}/beats/${id}`;

        return {
            title: titulo,
            description: descripcion,
            alternates: { canonical: url },
            robots: beat.es_publico === false ? { index: false, follow: false } : undefined,
            openGraph: {
                type: 'music.song',
                url,
                title: titulo,
                description: descripcion,
                images: [{ url: imagen, width: 1200, height: 1200, alt: beat.titulo }],
            },
            twitter: {
                card: 'summary_large_image',
                title: titulo,
                description: descripcion,
                images: [imagen],
            },
        };
    } catch {
        return {};
    }
}

export default function BeatLayout({ children }: { children: React.ReactNode }) {
    return children;
}
