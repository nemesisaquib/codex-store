import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const pages    = db.prepare("SELECT * FROM seo_pages ORDER BY page").all();
    const products = db.prepare("SELECT id,name,slug,meta_title,meta_desc,og_image,image_url FROM products WHERE status='active' ORDER BY name").all();
    return NextResponse.json({ pages, products });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    if (body.type === "page") {
      const id = `seo${Date.now()}`;
      db.prepare(`INSERT OR REPLACE INTO seo_pages (id,page,title,description,og_title,og_desc,og_image,canonical,robots,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`)
        .run(id, body.page, body.title, body.description, body.og_title, body.og_desc, body.og_image, body.canonical, body.robots ?? "index,follow");
    } else if (body.type === "product") {
      db.prepare("UPDATE products SET meta_title=?,meta_desc=?,og_image=? WHERE id=?")
        .run(body.meta_title, body.meta_desc, body.og_image, body.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
