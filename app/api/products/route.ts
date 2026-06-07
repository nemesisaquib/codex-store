import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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
      where.push("(LOWER(name) LIKE LOWER(?) OR LOWER(brand) LIKE LOWER(?))");
      params.push(`%${q}%`, `%${q}%`);
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

    const products = db.prepare(sql).all(...params, limit, offset);
    const total    = (db.prepare(countSql).get(...params) as { c: number }).c;

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

    db.prepare(`
      INSERT INTO products (id,name,slug,brand,category,price,compare_price,color,image_url,image_url2,gallery,stock,badge,is_new,rating,reviews,colors,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, body.name, slug, body.brand, body.category,
      body.price, body.comparePrice ?? null, body.color ?? null,
      body.image_url ?? null, body.image_url2 ?? null, body.gallery ?? "[]",
      body.stock ?? 100, body.badge ?? null, body.isNew ? 1 : 0,
      body.rating ?? 4.5, body.reviews ?? 0,
      JSON.stringify(body.colors ?? []), body.status ?? "active"
    );

    return NextResponse.json({ id, slug }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
