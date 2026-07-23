import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Licencias',
    description: 'Conoce los planes de licencia de Tianguis Beats: Gratis, Básica, Pro, Premium y Exclusiva, con sus alcances de uso comercial.',
    alternates: { canonical: '/licencias' },
};

export default function LicenciasLayout({ children }: { children: React.ReactNode }) {
    return children;
}
