import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

// ─── Fonts: preload only used weights/subsets ───────────────────────────────
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],           // Only bold/black used in headings
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,                   // Code font — lazy, not critical path
});

export const metadata: Metadata = {
  title: "CODEX — Wear the World | Premium Global Fashion",
  description: "Premium international clothing eCommerce. Shop women, men, and kids fashion.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "CODEX",
    title: "CODEX — Wear the World",
    description: "Premium global fashion for women, men, and kids.",
  },
};

// ─── Viewport: proper mobile scaling ────────────────────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${playfair.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <head>
        {/* DNS prefetch for external image CDNs */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: { borderRadius: "14px", fontSize: "13px" },
          }}
        />
      </body>
    </html>
  );
}
