import type { Metadata, Viewport } from "next";
import { Kanit, Montserrat, Geist } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

const SITE_URL = (process.env.NEXT_PUBLIC_URL || 'https://tianguisbeats.com').replace(/\/$/, '');
const SITE_TITLE = "Tianguis Beats | La plataforma #1 de beats en México";
const SITE_DESC = "Eleva tu sonido al siguiente nivel con los mejores beats de Corridos Tumbados, Trap y Reggaetón. La comunidad de productores y artistas más grande de México.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Tianguis Beats",
  },
  description: SITE_DESC,
  applicationName: "Tianguis Beats",
  keywords: ["beats", "corridos tumbados", "trap", "reggaetón", "instrumentales", "productores", "México", "comprar beats"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: "Tianguis Beats",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'Tianguis Beats' }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ['/icon.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.png' },
      { url: '/icon.png' },
    ],
    apple: [
      { url: '/icon.png' },
    ],
  },
};

import { ThemeProvider } from "@/context/ThemeContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { CartProvider } from "@/context/CartContext";
import AudioPlayer from "@/components/AudioPlayer";
import CartSidebar from "@/components/CartSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";

import { ToastProvider } from "@/context/ToastContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import BackgroundAura from "@/components/ui/BackgroundAura";
import LenisScroll from "@/components/LenisScroll";
import { Toaster } from 'sonner';
import MaintenanceGuard from "@/components/MaintenanceGuard";
import AnuncioBanner from "@/components/AnuncioBanner";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* ── Raíz de la aplicación ── */
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className={`${kanit.variable} ${montserrat.variable} font-body antialiased`}>
        <LenisScroll />
        <Toaster position="top-right" richColors closeButton theme="dark" />
        <BackgroundAura />
        <ThemeProvider>
          <CurrencyProvider>
            <ToastProvider>
              <CartProvider>
                <PlayerProvider>
                  <MaintenanceGuard>
                    <AnuncioBanner />
                    <div>
                      {children}
                    </div>
                    <MobileBottomNav />
                    <CartSidebar />
                    <AudioPlayer />
                  </MaintenanceGuard>
                </PlayerProvider>
              </CartProvider>
            </ToastProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

