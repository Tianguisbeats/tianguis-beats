import type { Metadata } from 'next';
import { obtenerSupabaseAdmin } from '@/lib/supabase-admin';

const SITE_URL = (process.env.NEXT_PUBLIC_URL || 'https://tianguisbeats.com').replace(/\/$/, '');

function resolverPortada(portada: string | null | undefined): string {
    if (!portada) return `${SITE_URL}/icon.png`;
    if (portada.startsWith('http')) return portada;
    try {
        const supabase = obtenerSupabaseAdmin();
        return supabase.storage.from('portadas_kits_sonido').getPublicUrl(portada).data?.publicUrl || `${SITE_URL}/icon.png`;
    } catch {
        return `${SITE_URL}/icon.png`;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const supabase = obtenerSupabaseAdmin();
        const { data: kit } = await supabase
            .from('kits_sonido')
            .select('titulo, descripcion, url_portada, es_publico, producer:productor_id(nombre_artistico, nombre_usuario)')
            .eq('id', id)
            .single();

        if (!kit) return { title: 'Sound Kit no encontrado' };

        const productor: any = Array.isArray(kit.producer) ? kit.producer[0] : kit.producer;
        const artista = productor?.nombre_artistico || productor?.nombre_usuario || 'Tianguis Beats';
        const titulo = `${kit.titulo} — ${artista}`;
        const descripcion = kit.descripcion?.trim()
            || `Sound Kit "${kit.titulo}" por ${artista}. Samples, loops y one-shots en Tianguis Beats.`;
        const imagen = resolverPortada(kit.url_portada);
        const url = `${SITE_URL}/sound-kits/${id}`;

        return {
            title: titulo,
            description: descripcion,
            alternates: { canonical: url },
            robots: kit.es_publico === false ? { index: false, follow: false } : undefined,
            openGraph: {
                type: 'website',
                url,
                title: titulo,
                description: descripcion,
                images: [{ url: imagen, width: 1200, height: 1200, alt: kit.titulo }],
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

export default function SoundKitLayout({ children }: { children: React.ReactNode }) {
    return children;
}
