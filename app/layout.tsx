import type { Metadata } from "next";
import { Kanit, Montserrat } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Tianguis Beats | La plataforma #1 de beats en México",
  description: "Eleva tu sonido al siguiente nivel con los mejores beats de Corridos Tumbados, Trap y Reggaetón. La comunidad de productores y artistas más grande de México.",
};

import { ThemeProvider } from "@/context/ThemeContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { CartProvider } from "@/context/CartContext";
import AudioPlayer from "@/components/AudioPlayer";
import AIChatBot from "@/components/AIChatBot";
import MobileBottomNav from "@/components/MobileBottomNav";

import { ToastProvider } from "@/context/ToastContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import BackgroundAura from "@/components/ui/BackgroundAura";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* ── Raíz de la aplicación ── */
    <html lang="es">
      <body className={`${kanit.variable} ${montserrat.variable} font-body antialiased`}>
        <BackgroundAura />
        <ThemeProvider>
          <CurrencyProvider>
            <ToastProvider>
              <CartProvider>
                <PlayerProvider>
                  {/* pb-24 en móvil = espacio para MobileBottomNav (62px) + AudioPlayer (aprox. 64px) */}
                  <div className="pb-0 md:pb-0">
                    {children}
                  </div>
                  <MobileBottomNav />
                  <AudioPlayer />
                </PlayerProvider>
              </CartProvider>
            </ToastProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

