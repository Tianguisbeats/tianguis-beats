import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Tianguis Beats',
        short_name: 'Tianguis',
        description: 'La plataforma #1 de beats en México: Corridos Tumbados, Trap y Reggaetón.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        lang: 'es-MX',
        categories: ['music', 'shopping', 'entertainment'],
        icons: [
            { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
        ],
    };
}
