import type { Metadata } from "next";
import { getDb } from "@/lib/db";

/** Read SEO row from DB for a given page path; fall back to defaults. */
export function getPageMetadata(page: string): Metadata {
  try {
    const db = getDb();
    const row = db.prepare("SELECT * FROM seo_pages WHERE page=?").get(page) as
      | { title:string; description:string; og_title:string; og_desc:string; og_image:string; canonical:string; robots:string }
      | undefined;

    if (!row) return {};

    return {
      title: row.title || undefined,
      description: row.description || undefined,
      robots: row.robots || "index,follow",
      alternates: row.canonical ? { canonical: row.canonical } : undefined,
      openGraph: {
        title: row.og_title || row.title || undefined,
        description: row.og_desc || row.description || undefined,
        images: row.og_image ? [row.og_image] : undefined,
        type: "website",
      },
    };
  } catch {
    return {};
  }
}

/** Read product SEO from DB. */
export function getProductMetadata(slug: string): Metadata {
  try {
    const db = getDb();
    const p = db.prepare("SELECT name,brand,meta_title,meta_desc,og_image,image_url,price FROM products WHERE slug=?").get(slug) as
      | { name:string; brand:string; meta_title:string|null; meta_desc:string|null; og_image:string|null; image_url:string|null; price:number }
      | undefined;
    if (!p) return {};
    const img = p.og_image || p.image_url || undefined;
    return {
      title: p.meta_title || `${p.name} — ${p.brand} | CODEX`,
      description: p.meta_desc || `Shop the ${p.name} from ${p.brand}. $${p.price}. Free shipping over $150.`,
      openGraph: {
        title: p.meta_title || p.name,
        description: p.meta_desc || `${p.name} by ${p.brand}`,
        images: img ? [img] : undefined,
        type: "website",
      },
    };
  } catch {
    return {};
  }
}
