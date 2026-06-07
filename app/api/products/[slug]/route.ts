import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = getDb();
    db.prepare("UPDATE products SET status='deleted' WHERE slug=?").run(slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE slug = ?").get(slug);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db   = getDb();
    const body = await req.json();

    // Map incoming (camelCase) → DB columns. Whitelist only.
    const map: Record<string, unknown> = {};
    const set = (col: string, v: unknown) => { if (v !== undefined) map[col] = v; };
    set("name", body.name);
    set("brand", body.brand);
    set("category", body.category);
    set("price", body.price);
    set("compare_price", body.comparePrice);
    set("color", body.color);
    set("image_url", body.image_url);
    set("image_url2", body.image_url2);
    set("gallery", body.gallery);
    set("stock", body.stock);
    set("badge", body.badge);
    set("description", body.description);
    set("status", body.status);
    set("meta_title", body.meta_title);
    set("meta_desc", body.meta_desc);
    if (body.isNew !== undefined) map["is_new"] = body.isNew ? 1 : 0;
    if (body.colors !== undefined) map["colors"] = JSON.stringify(body.colors);

    const keys = Object.keys(map);
    if (keys.length === 0) return NextResponse.json({ ok: true });

    const sets = keys.map(k => `${k} = ?`).join(", ");
    const vals = [...keys.map(k => map[k]), slug];
    db.prepare(`UPDATE products SET ${sets} WHERE slug = ?`).run(...vals);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
