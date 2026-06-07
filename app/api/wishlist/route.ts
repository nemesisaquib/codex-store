import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

function getCustomerId(req: NextRequest): string | null {
  const db = getDb();
  const token = req.cookies.get("customer_session")?.value;
  if (!token) return null;
  const sess = db.prepare("SELECT customer_id FROM sessions WHERE token=? AND expires > datetime('now')").get(token) as {customer_id:string}|undefined;
  return sess?.customer_id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const customerId = getCustomerId(req);
    if (!customerId) return NextResponse.json({ items: [] });

    const rows = db.prepare(`
      SELECT w.id, p.id as product_id, p.name, p.slug, p.brand, p.price, p.compare_price, p.image_url, p.stock
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.customer_id = ?
      ORDER BY w.created_at DESC
    `).all(customerId);

    return NextResponse.json({ items: rows });
  } catch (e) {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const customerId = getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ ok: false, error: "Product ID required" }, { status: 400 });

    // Check if already in wishlist
    const exists = db.prepare("SELECT id FROM wishlist WHERE customer_id=? AND product_id=?").get(customerId, productId);
    if (exists) return NextResponse.json({ ok: false, error: "Already in wishlist" }, { status: 400 });

    db.prepare("INSERT INTO wishlist (id,customer_id,product_id) VALUES (?,?,?)").run(randomUUID(), customerId, productId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const customerId = getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ ok: false, error: "Product ID required" }, { status: 400 });

    db.prepare("DELETE FROM wishlist WHERE customer_id=? AND product_id=?").run(customerId, productId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
