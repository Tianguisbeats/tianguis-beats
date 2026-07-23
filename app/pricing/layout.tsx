import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Precios',
    description: 'Compara los planes de Tianguis Beats para productores: 0% de comisión y las mejores condiciones para vender tus beats.',
    alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
