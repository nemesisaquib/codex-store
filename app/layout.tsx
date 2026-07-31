import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { CountryProvider } from "@/lib/CountryContext";
import { SettingsProvider } from "@/lib/SettingsContext";
import { getDb } from "@/lib/db";

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

export async function generateMetadata(): Promise<Metadata> {
  try {
    const db = getDb();
    const rows = (await db.execute(
      "SELECT key, value FROM settings WHERE key IN ('store_name','store_logo','logo_url','store_favicon','store_favicon_apple','meta_title','meta_desc','og_image','seo_keywords','seo_author','seo_robots')"
    )).rows as unknown as { key: string; value: string }[];
    const s = Object.fromEntries(rows.map(r => [r.key, r.value]));

    const name    = s.store_name   || "E-shop";
    const title   = s.meta_title   || `${name} — Wear the World | Premium Global Fashion`;
    const desc    = s.meta_desc    || "Premium international clothing eCommerce. Shop women, men, and kids fashion.";
    const favicon = s.store_favicon || "/favicon/favicon.ico";
    const apple   = s.store_favicon_apple || "/favicon/apple-touch-icon.png";
    const ogImg   = s.og_image || s.store_logo || s.logo_url || "/Logo/Eshop.png";

    return {
      title,
      description: desc,
      keywords: s.seo_keywords || "fashion, clothing, premium apparel",
      authors: [{ name: s.seo_author || name }],
      robots: s.seo_robots || "index, follow",
      icons: {
        icon: [
          { url: favicon, sizes: "any" },
          { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
          { url: "/favicon/favicon.svg", type: "image/svg+xml" },
        ],
        shortcut: favicon,
        apple: [{ url: apple, sizes: "180x180", type: "image/png" }],
      },
      manifest: "/favicon/site.webmanifest",
      openGraph: { type: "website", siteName: name, title, description: desc, images: [{ url: ogImg }] },
    };
  } catch {
    return {
      title: "E-shop — Wear the World | Premium Global Fashion",
      description: "Premium international clothing eCommerce.",
      icons: { icon: "/favicon/favicon.ico", apple: "/favicon/apple-touch-icon.png" },
      manifest: "/favicon/site.webmanifest",
    };
  }
}

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();
  let name = "E-shop";
  let logo = "/Logo/Eshop.png";
  try {
    const rows = (await db.execute("SELECT key, value FROM settings WHERE key IN ('store_name', 'logo_url', 'store_logo')")).rows as unknown as {key:string, value:string}[];
    const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
    if (s.store_name) name = s.store_name;
    if (s.store_logo || s.logo_url) logo = s.store_logo || s.logo_url;
  } catch {}

  return (
    <html lang="en" className={`h-full antialiased ${playfair.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <head>
        {/* DNS prefetch for external image CDNs */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
        {/* JSON-LD WebSite & Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": name,
                  "url": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
                },
                {
                  "@type": "Organization",
                  "name": name,
                  "url": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
                  "logo": logo || undefined
                }
              ]
            })
          }}
        />
        <SettingsProvider>
          <CountryProvider>
            {children}
            <Toaster
              position="top-right"
              offset={80}
              richColors
              closeButton
              toastOptions={{
                style: { borderRadius: "14px", fontSize: "13px" },
              }}
            />
          </CountryProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
