import type { Metadata } from 'next';
import { obtenerSupabaseAdmin } from '@/lib/supabase-admin';

const SITE_URL = (process.env.NEXT_PUBLIC_URL || 'https://tianguisbeats.com').replace(/\/$/, '');

function resolverFoto(foto: string | null | undefined): string {
    if (!foto) return `${SITE_URL}/icon.png`;
    if (foto.startsWith('http')) return foto;
    try {
        const supabase = obtenerSupabaseAdmin();
        return supabase.storage.from('fotos_perfil').getPublicUrl(foto).data?.publicUrl || `${SITE_URL}/icon.png`;
    } catch {
        return `${SITE_URL}/icon.png`;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;
    try {
        const supabase = obtenerSupabaseAdmin();
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre_usuario, nombre_artistico, biografia, foto_perfil')
            .eq('nombre_usuario', username)
            .single();

        if (!perfil) return {};

        const nombre = perfil.nombre_artistico || perfil.nombre_usuario;
        const titulo = `${nombre} (@${perfil.nombre_usuario})`;
        const descripcion = perfil.biografia?.trim()
            || `Escucha y compra los beats de ${nombre} en Tianguis Beats.`;
        const imagen = resolverFoto(perfil.foto_perfil);
        const url = `${SITE_URL}/${encodeURIComponent(perfil.nombre_usuario)}`;

        return {
            title: titulo,
            description: descripcion,
            alternates: { canonical: url },
            openGraph: {
                type: 'profile',
                url,
                title: titulo,
                description: descripcion,
                images: [{ url: imagen, width: 512, height: 512, alt: nombre }],
            },
            twitter: {
                card: 'summary',
                title: titulo,
                description: descripcion,
                images: [imagen],
            },
        };
    } catch {
        return {};
    }
}

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
    return children;
}
