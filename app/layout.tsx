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
  description: "Compra y vende beats de Corridos Tumbados, Rap, Trap y más.",
};

import { ThemeProvider } from "@/context/ThemeContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { CartProvider } from "@/context/CartContext";
import AudioPlayer from "@/components/AudioPlayer";
import AIChatBot from "@/components/AIChatBot";

import { ToastProvider } from "@/context/ToastContext";
import { CurrencyProvider } from "@/context/CurrencyContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${kanit.variable} ${montserrat.variable} font-body antialiased`}
      >
        <ThemeProvider>
          <CurrencyProvider>
            <ToastProvider>
              <CartProvider>
                <PlayerProvider>
                  {children}
                  <AudioPlayer />
                  <AIChatBot />
                </PlayerProvider>
              </CartProvider>
            </ToastProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
