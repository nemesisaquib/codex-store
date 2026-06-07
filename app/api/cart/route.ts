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

    const cart = (await db.execute({ sql: "SELECT items FROM cart WHERE customer_id=?", args: [customerId] })).rows[0] as {items:string}|undefined;
    const items = cart ? JSON.parse(cart.items) : [];
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const customerId = getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    const { items } = await req.json();
    if (!Array.isArray(items)) return NextResponse.json({ ok: false, error: "Invalid items" }, { status: 400 });

    const existing = (await db.execute({ sql: "SELECT id FROM cart WHERE customer_id=?", args: [customerId] })).rows[0];
    if (existing) {
      await db.execute({ sql: "UPDATE cart SET items=?, updated_at=datetime('now') WHERE customer_id=?", args: [JSON.stringify(items), customerId] });
    } else {
      await db.execute({ sql: "INSERT INTO cart (id,customer_id,items) VALUES (?,?,?)", args: [randomUUID(), customerId, JSON.stringify(items)] });
    }

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

    await db.execute({ sql: "DELETE FROM cart WHERE customer_id=?", args: [customerId] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
