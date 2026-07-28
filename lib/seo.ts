import type { Metadata } from "next";
import { getDb } from "@/lib/db";

/** Read SEO row from DB for a given page path; falls back gracefully. */
export async function getPageMetadata(page: string): Promise<Metadata> {
  try {
    const db  = getDb();
    const res = await db.execute({ sql: "SELECT * FROM seo_pages WHERE page = ?", args: [page] });
    const row = res.rows[0] as any;
    if (!row) return {};
    return {
      title:       row.title       || undefined,
      description: row.description || undefined,
      robots:      row.robots      || "index,follow",
      alternates:  row.canonical   ? { canonical: row.canonical } : undefined,
      openGraph: {
        title:       row.og_title   || row.title       || undefined,
        description: row.og_desc    || row.description || undefined,
        images:      row.og_image   ? [{ url: row.og_image }] : undefined,
        type: "website",
      },
    };
  } catch {
    return {};
  }
}

/** Read product SEO from the products table. */
export async function getProductMetadata(slug: string): Promise<Metadata> {
  try {
    const db  = getDb();
    const res = await db.execute({
      sql:  "SELECT name, brand, meta_title, meta_desc, og_image, image_url, price FROM products WHERE slug = ?",
      args: [slug],
    });
    const p = res.rows[0] as any;
    if (!p) return {};
    const img = p.og_image || p.image_url || undefined;
    return {
      title:       p.meta_title || `${p.name} — ${p.brand} | E-shop`,
      description: p.meta_desc  || `Shop the ${p.name} from ${p.brand}. $${p.price}. Free shipping over $150.`,
      openGraph: {
        title:       p.meta_title || p.name,
        description: p.meta_desc  || `${p.name} by ${p.brand}`,
        images:      img ? [{ url: img }] : undefined,
        type: "website",
      },
    };
  } catch {
    return {};
  }
}
