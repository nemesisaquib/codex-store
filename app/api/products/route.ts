import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = new URL(req.url).searchParams;

    const category = sp.get("category");
    const q        = sp.get("q");
    const isNew    = sp.get("is_new");
    const isSale   = sp.get("sale");    // has compare_price
    const limit    = Number(sp.get("limit") ?? 50);
    const offset   = Number(sp.get("offset") ?? 0);
    const sort     = sp.get("sort") ?? "created_at";

    const where: string[] = ["status = 'active'"];
    const params: unknown[] = [];

    if (category && category !== "all") {
      where.push("LOWER(category) = LOWER(?)");
      params.push(category);
    }
    if (q) {
      const terms = q.trim().split(/\s+/).filter(Boolean);
      for (const term of terms) {
        where.push("(LOWER(name) LIKE LOWER(?) OR LOWER(brand) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))");
        params.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
      }
    }
    if (isNew === "1") {
      where.push("is_new = 1");
    }
    if (isSale === "1") {
      where.push("compare_price IS NOT NULL");
    }

    const orderMap: Record<string, string> = {
      price_asc:  "price ASC",
      price_desc: "price DESC",
      rating:     "rating DESC",
      newest:     "created_at DESC",
      created_at: "created_at DESC",
    };
    const orderBy = orderMap[sort] ?? "created_at DESC";

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql      = `SELECT * FROM products ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    const countSql = `SELECT COUNT(*) as c FROM products ${whereSql}`;

    const products = (await db.execute({ sql: sql, args: [...params, limit, offset] })).rows;
    const total    = ((await db.execute({ sql: countSql, args: [...params] })).rows[0] as { c: number }).c;

    return NextResponse.json({ products, total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db   = getDb();
    const body = await req.json();
    const id   = `p${Date.now()}`;
    const slug = body.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const sizes = Array.isArray(body.sizes) ? JSON.stringify(body.sizes) : "[]";
    const colors = Array.isArray(body.colors) ? JSON.stringify(body.colors) : "[]";
    const variants = Array.isArray(body.variants) ? JSON.stringify(body.variants) : "[]";
    const options = Array.isArray(body.options) ? JSON.stringify(body.options) : "[]";
    const attributes = Array.isArray(body.attributes) ? JSON.stringify(body.attributes) : "[]";
    
    await db.execute({
      sql: `INSERT INTO products (
        id, name, slug, brand, category, price, compare_price, color, image_url, image_url2, gallery, stock, status, badge, description, sizes, colors, variants, options, attributes, weight, length, width, height, is_new, meta_title, meta_desc, meta_keywords, category_id, subcategory_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, body.name, slug, body.brand || "Codex", body.category || "Uncategorized", body.price,
        body.comparePrice || null, body.color || "#c4a882", body.image_url || null, body.image_url2 || null,
        body.gallery || "[]", body.stock || 0, body.status || "active", body.badge || null, body.description || null,
        sizes, colors, variants, options, attributes,
        body.weight || null, body.length || null, body.width || null, body.height || null, body.isNew ? 1 : 0,
        body.meta_title || null, body.meta_desc || null, body.meta_keywords || null,
        body.category_id || null, body.subcategory_id || null
      ]
    });

    revalidatePath("/api/products");
    revalidatePath("/");

    return NextResponse.json({ id, slug }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
