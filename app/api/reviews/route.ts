import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ reviews: [] });
    }

    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.title, r.comment, r.created_at, c.first_name, c.last_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.id
      WHERE r.product_id=? AND r.status='approved'
      ORDER BY r.created_at DESC
    `).all(productId);

    return NextResponse.json({ reviews });
  } catch (e) {
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const token = req.cookies.get("customer_session")?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const sess = db.prepare("SELECT customer_id FROM sessions WHERE token=? AND expires > datetime('now')").get(token) as {customer_id:string}|undefined;
    const customerId = sess?.customer_id;
    if (!customerId) {
      return NextResponse.json({ ok: false, error: "Session expired" }, { status: 401 });
    }

    const { productId, rating, title, comment } = await req.json();
    if (!productId || !rating) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if customer already reviewed this product
    const existing = db.prepare("SELECT id FROM reviews WHERE product_id=? AND customer_id=?").get(productId, customerId);
    if (existing) {
      return NextResponse.json({ ok: false, error: "You already reviewed this product" }, { status: 400 });
    }

    const id = randomUUID();
    db.prepare(
      "INSERT INTO reviews (id,product_id,customer_id,rating,title,comment,status) VALUES (?,?,?,?,?,?,?)"
    ).run(id, productId, customerId, rating, title||"", comment||"", "pending");

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
