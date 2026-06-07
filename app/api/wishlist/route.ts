import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

async function getCustomerId(req: NextRequest): string | null {
  const db = getDb();
  const token = req.cookies.get("customer_session")?.value;
  if (!token) return null;
  const sess = (await db.execute({ sql: "SELECT customer_id FROM sessions WHERE token=? AND expires > datetime('now')", args: [token] })).rows[0] as {customer_id:string}|undefined;
  return sess?.customer_id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const customerId = getCustomerId(req);
    if (!customerId) return NextResponse.json({ items: [] });

    const rows = (await db.execute({ sql: `
      SELECT w.id, p.id as product_id, p.name, p.slug, p.brand, p.price, p.compare_price, p.image_url, p.stock
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.customer_id = ?
      ORDER BY w.created_at DESC
    `, args: [customerId] })).rows;

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
    const exists = (await db.execute({ sql: "SELECT id FROM wishlist WHERE customer_id=? AND product_id=?", args: [customerId, productId] })).rows[0];
    if (exists) return NextResponse.json({ ok: false, error: "Already in wishlist" }, { status: 400 });

    await db.execute({ sql: "INSERT INTO wishlist (id,customer_id,product_id) VALUES (?,?,?)", args: [randomUUID(), customerId, productId] });
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

    await db.execute({ sql: "DELETE FROM wishlist WHERE customer_id=? AND product_id=?", args: [customerId, productId] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
