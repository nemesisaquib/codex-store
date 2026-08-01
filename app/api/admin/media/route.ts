import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface MediaItem {
  id: string;
  url: string;
  type: "logo" | "favicon" | "blog" | "category" | "brand" | "og" | "site";
  title: string;
  source: string;
  extension: string;
  inUse?: boolean;
  usageLabel?: string;
  createdAt?: string;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const items: MediaItem[] = [];
    const seenUrls = new Set<string>();

    const getExtension = (url: string): string => {
      try {
        const clean = url.split("?")[0];
        const ext = clean.split(".").pop()?.toUpperCase();
        if (ext && ext.length <= 4 && !ext.includes("/")) return ext;
      } catch {}
      return "IMG";
    };

    const addMedia = (
      url: string | null | undefined,
      type: MediaItem["type"],
      title: string,
      source: string,
      idPrefix: string,
      inUse: boolean = false,
      usageLabel?: string
    ) => {
      if (!url || typeof url !== "string" || !url.trim()) return;
      const cleanUrl = url.trim();
      if (seenUrls.has(cleanUrl)) return;
      seenUrls.add(cleanUrl);

      items.push({
        id: `${idPrefix}_${Math.random().toString(36).substring(2, 9)}`,
        url: cleanUrl,
        type,
        title,
        source,
        extension: getExtension(cleanUrl),
        inUse,
        usageLabel: usageLabel || (inUse ? "Active on Site" : undefined),
        createdAt: new Date().toISOString(),
      });
    };

    // 1. Fetch site settings assets (Logo, Favicons, OG image)
    try {
      const settingsRows = (
        await db.execute(
          "SELECT key, value FROM settings WHERE key IN ('store_logo','logo_url','store_favicon','store_favicon_apple','og_image')"
        )
      ).rows as unknown as { key: string; value: string }[];

      for (const r of settingsRows) {
        if (r.key === "store_logo" || r.key === "logo_url") {
          addMedia(r.value, "logo", "Store Logo", "Store Settings", "setting_logo", true, "Active Store Logo");
        } else if (r.key === "store_favicon") {
          addMedia(r.value, "favicon", "Browser Favicon", "Store Settings", "setting_fav", true, "Active Favicon");
        } else if (r.key === "store_favicon_apple") {
          addMedia(r.value, "favicon", "Apple Touch Icon", "Store Settings", "setting_fav_apple", true, "Active Apple Touch Icon");
        } else if (r.key === "og_image") {
          addMedia(r.value, "og", "Social Sharing (OG) Image", "SEO Settings", "setting_og", true, "Active OG Share Image");
        }
      }
    } catch {}

    // 2. Fetch Blog CMS post cover images
    try {
      const posts = (
        await db.execute(
          "SELECT id, title, featured_image, created_at FROM blog_posts WHERE featured_image IS NOT NULL AND featured_image != ''"
        )
      ).rows as unknown as { id: string; title: string; featured_image: string; created_at?: string }[];
      for (const p of posts) {
        addMedia(p.featured_image, "blog", p.title || "Blog Post Cover", `Blog: ${p.title}`, `blog_${p.id}`, true, "Published Blog Cover");
      }
    } catch {}

    // 3. Fetch Category banners / images
    try {
      const categories = (
        await db.execute("SELECT id, name, image_url FROM categories WHERE image_url IS NOT NULL AND image_url != ''")
      ).rows as unknown as { id: string; name: string; image_url: string }[];
      for (const c of categories) {
        addMedia(c.image_url, "category", `${c.name} Banner`, `Category: ${c.name}`, `cat_${c.id}`, true, `Category ${c.name}`);
      }
    } catch {}

    // 4. Fetch Brand logos
    try {
      const brands = (
        await db.execute("SELECT id, name, logo_url FROM brands WHERE logo_url IS NOT NULL AND logo_url != ''")
      ).rows as unknown as { id: string; name: string; logo_url: string }[];
      for (const b of brands) {
        addMedia(b.logo_url, "brand", `${b.name} Logo`, `Brand: ${b.name}`, `brand_${b.id}`, true, `Brand ${b.name}`);
      }
    } catch {}

    // 5. Add default public branding assets if not yet included
    const defaultPublicAssets = [
      { url: "/Logo/Eshop.png", type: "logo" as const, title: "Default E-shop Logo", source: "Public /Logo Directory" },
      { url: "/favicon/favicon.ico", type: "favicon" as const, title: "Default Favicon ICO", source: "Public /favicon Directory" },
      { url: "/favicon/apple-touch-icon.png", type: "favicon" as const, title: "Default Apple Touch Icon", source: "Public /favicon Directory" },
      { url: "/favicon/favicon-96x96.png", type: "favicon" as const, title: "Favicon 96x96 PNG", source: "Public /favicon Directory" },
      { url: "/favicon/favicon.svg", type: "favicon" as const, title: "Favicon Vector SVG", source: "Public /favicon Directory" },
    ];

    for (const a of defaultPublicAssets) {
      addMedia(a.url, a.type, a.title, a.source, "public_asset", false);
    }

    return NextResponse.json({ items, total: items.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
