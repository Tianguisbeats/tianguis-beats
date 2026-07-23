import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Centro de Ayuda',
    description: 'Resuelve tus dudas sobre compra, venta, pagos, licencias y calculadora de ganancias en Tianguis Beats.',
    alternates: { canonical: '/help' },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
    return children;
}
