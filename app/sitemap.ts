import type { MetadataRoute } from 'next';
import { obtenerSupabaseAdmin } from '@/lib/supabase-admin';

const SITE_URL = (process.env.NEXT_PUBLIC_URL || 'https://tianguisbeats.com').replace(/\/$/, '');

// Revalidar el sitemap cada 6 horas para no consultar la BD en cada request
export const revalidate = 21600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        '', '/beats', '/sound-kits', '/productores', '/explorar',
    ].map((path) => ({
        url: `${SITE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: path === '' ? 1 : 0.8,
    }));

    // Rutas dinámicas (best-effort: si falla la BD, devolvemos al menos las estáticas)
    try {
        const supabase = obtenerSupabaseAdmin();
        const [beatsRes, kitsRes, perfilesRes] = await Promise.all([
            supabase.from('beats').select('id, fecha_creacion').eq('es_publico', true).order('fecha_creacion', { ascending: false }).limit(5000),
            supabase.from('kits_sonido').select('id, fecha_creacion').eq('es_publico', true).order('fecha_creacion', { ascending: false }).limit(2000),
            supabase.from('perfiles').select('nombre_usuario').not('nombre_usuario', 'is', null).limit(5000),
        ]);

        const beatRoutes: MetadataRoute.Sitemap = (beatsRes.data || []).map((b: any) => ({
            url: `${SITE_URL}/beats/${b.id}`,
            lastModified: b.fecha_creacion ? new Date(b.fecha_creacion) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

        const kitRoutes: MetadataRoute.Sitemap = (kitsRes.data || []).map((k: any) => ({
            url: `${SITE_URL}/sound-kits/${k.id}`,
            lastModified: k.fecha_creacion ? new Date(k.fecha_creacion) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

        const perfilRoutes: MetadataRoute.Sitemap = (perfilesRes.data || [])
            .filter((p: any) => p.nombre_usuario)
            .map((p: any) => ({
                url: `${SITE_URL}/${encodeURIComponent(p.nombre_usuario)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.5,
            }));

        return [...staticRoutes, ...beatRoutes, ...kitRoutes, ...perfilRoutes];
    } catch (err) {
        console.error('[sitemap] No se pudieron cargar rutas dinámicas:', err);
        return staticRoutes;
    }
}
