import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** All settings with defaults — seeded on first GET if missing */
const DEFAULT_SETTINGS = [
  // General
  { key: "store_name",          value: "E-shop",                               group_name: "general" },
  { key: "store_email",         value: "hello@eshop.com",                      group_name: "general" },
  { key: "store_phone",         value: "+1 555 000 0000",                      group_name: "general" },
  { key: "store_address",       value: "123 Fashion Ave, New York, NY 10001",  group_name: "general" },
  { key: "currency",            value: "USD",                                  group_name: "general" },
  { key: "store_logo",          value: "/Logo/Eshop.png",                      group_name: "general" },
  { key: "store_favicon",       value: "/Logo/favicon/favicon.ico",            group_name: "general" },
  { key: "store_favicon_apple", value: "/Logo/favicon/apple-touch-icon.png",   group_name: "general" },
  // Shipping
  { key: "free_shipping_threshold",  value: "150",  group_name: "shipping" },
  { key: "express_shipping_price",   value: "12.99",group_name: "shipping" },
  { key: "overnight_shipping_price", value: "24.99",group_name: "shipping" },
  { key: "tax_rate",                 value: "8.5",  group_name: "shipping" },
  { key: "shipping_api_carrier",     value: "DHL Express", group_name: "shipping" },
  { key: "shipping_api_key",         value: "ship_live_8492049182394", group_name: "shipping" },
  { key: "shipping_api_mode",        value: "sandbox", group_name: "shipping" },
  // SEO
  { key: "meta_title",    value: "E-shop — Wear the World | Premium Global Fashion", group_name: "seo" },
  { key: "meta_desc",     value: "Premium international clothing eCommerce. Shop women, men, and kids fashion.", group_name: "seo" },
  { key: "og_image",      value: "/Logo/Eshop.png",                group_name: "seo" },
  { key: "seo_keywords",  value: "fashion, clothing, e-shop, premium apparel", group_name: "seo" },
  { key: "seo_author",    value: "E-shop",                          group_name: "seo" },
  { key: "seo_robots",    value: "index, follow",                   group_name: "seo" },
  // Advanced
  { key: "low_stock_alert",   value: "10",    group_name: "advanced" },
  { key: "maintenance_mode",  value: "false", group_name: "advanced" },
  { key: "reviews_enabled",   value: "true",  group_name: "advanced" },
];

/** Derive the group_name from a settings key */
function deriveGroup(key: string): string {
  if (["store_name","store_email","store_phone","store_address","currency","store_logo","store_favicon","store_favicon_apple"].includes(key)) return "general";
  if (key.startsWith("seo_") || key.startsWith("meta_") || key === "og_image") return "seo";
  if (key.startsWith("smtp_")) return "smtp";
  if (key.includes("shipping") || key === "tax_rate") return "shipping";
  if (key.startsWith("google_") || key.startsWith("facebook_") || key.startsWith("stripe_")) return "integrations";
  if (["maintenance_mode","reviews_enabled","low_stock_alert"].includes(key)) return "advanced";
  return "general";
}

export async function GET() {
  try {
    const db = getDb();

    // Seed missing defaults on every startup (INSERT OR IGNORE = safe)
    for (const item of DEFAULT_SETTINGS) {
      await db.execute({
        sql: "INSERT OR IGNORE INTO settings (key, value, group_name) VALUES (?, ?, ?)",
        args: [item.key, item.value, item.group_name],
      });
    }

    const rows = (await db.execute("SELECT * FROM settings ORDER BY group_name, key")).rows as {key:string;value:string;group_name:string}[];
    const grouped: Record<string, Record<string,string>> = {};
    for (const r of rows) {
      if (!grouped[r.group_name]) grouped[r.group_name] = {};
      grouped[r.group_name][r.key] = r.value;
    }
    return NextResponse.json({ settings: grouped, flat: Object.fromEntries(rows.map(r => [r.key, r.value])) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db   = getDb();
    const body = await req.json() as Record<string,string>;

    for (const [key, value] of Object.entries(body)) {
      // Try updating with updated_at; fall back to simple update if column doesn't exist
      let rowsAffected = 0;
      try {
        const res = await db.execute({
          sql: "UPDATE settings SET value=?, updated_at=datetime('now') WHERE key=?",
          args: [String(value), key],
        });
        rowsAffected = res.rowsAffected;
      } catch {
        const res = await db.execute({
          sql: "UPDATE settings SET value=? WHERE key=?",
          args: [String(value), key],
        });
        rowsAffected = res.rowsAffected;
      }

      if (rowsAffected === 0) {
        // Key doesn't exist yet — insert with correct group
        await db.execute({
          sql: "INSERT OR IGNORE INTO settings (key, value, group_name) VALUES (?, ?, ?)",
          args: [key, String(value), deriveGroup(key)],
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
