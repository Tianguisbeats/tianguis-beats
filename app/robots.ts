import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_URL || 'https://tianguisbeats.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                // Rutas privadas / de sesión que no deben indexarse
                disallow: ['/studio/', '/checkout/', '/cart', '/api/', '/login', '/registro', '/recuperar'],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
