import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = getDb();
    await db.execute({ sql: "UPDATE products SET status='deleted' WHERE slug=?", args: [slug] });
    revalidatePath(`/product/${slug}`);
    revalidatePath(`/api/products/${slug}`);
    revalidatePath("/api/products");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = getDb();
    const product = (await db.execute({ sql: "SELECT * FROM products WHERE slug = ?", args: [slug] })).rows[0];
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
    set("category_id", body.category_id);
    set("subcategory_id", body.subcategory_id);
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
    set("meta_keywords", body.meta_keywords);
    if (body.isNew !== undefined) map["is_new"] = body.isNew ? 1 : 0;
    if (body.colors !== undefined) map["colors"] = typeof body.colors === "string" ? body.colors : JSON.stringify(body.colors);
    if (body.sizes !== undefined) map["sizes"] = typeof body.sizes === "string" ? body.sizes : JSON.stringify(body.sizes);
    if (body.variants !== undefined) map["variants"] = typeof body.variants === "string" ? body.variants : JSON.stringify(body.variants);
    if (body.options !== undefined) map["options"] = typeof body.options === "string" ? body.options : JSON.stringify(body.options);
    if (body.attributes !== undefined) map["attributes"] = typeof body.attributes === "string" ? body.attributes : JSON.stringify(body.attributes);
    set("weight", body.weight);
    set("length", body.length);
    set("width", body.width);
    set("height", body.height);

    const keys = Object.keys(map);
    if (keys.length === 0) return NextResponse.json({ ok: true });

    const sets = keys.map(k => `${k} = ?`).join(", ");
    const vals = [...keys.map(k => map[k]), slug];
    await db.execute({ sql: `UPDATE products SET ${sets} WHERE slug = ?`, args: [...vals] });
    
    revalidatePath(`/product/${slug}`);
    revalidatePath(`/api/products/${slug}`);
    revalidatePath("/api/products");
    revalidatePath("/");
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
