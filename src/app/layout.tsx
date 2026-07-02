import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ChatWidget } from "@/components/chat/chat-widget";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { Providers } from "@/components/providers";
import { ScrollTopButton } from "@/components/scroll-top-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SplashScreen } from "@/components/splash-screen";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Pokédex · Explorador en tiempo real",
    template: "%s · Pokédex",
  },
  description:
    "Explora los 1025 Pokémon de las generaciones I–IX: busca por nombre (con evoluciones), filtra por tipo y generación, y consulta stats y cadenas evolutivas. Datos de PokéAPI.",
  applicationName: "Pokédex",
  authors: [{ name: "Alexander Yánez" }],
  keywords: ["Pokédex", "Pokémon", "PokéAPI", "Next.js", "TypeScript"],
  appleWebApp: {
    capable: true,
    title: "Pokédex",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#08090d" },
  ],
  // Edge-to-edge on notched iPhones; header/tab bar pad the safe areas.
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SplashScreen />
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </main>
          <SiteFooter />
          <ChatWidget />
          <ScrollTopButton />
          {/* Suspense: the tab bar reads searchParams for the Favoritos state. */}
          <Suspense fallback={null}>
            <MobileTabBar />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
