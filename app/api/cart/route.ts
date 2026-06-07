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

    const cart = db.prepare("SELECT items FROM cart WHERE customer_id=?").get(customerId) as {items:string}|undefined;
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

    const existing = db.prepare("SELECT id FROM cart WHERE customer_id=?").get(customerId);
    if (existing) {
      db.prepare("UPDATE cart SET items=?, updated_at=datetime('now') WHERE customer_id=?").run(JSON.stringify(items), customerId);
    } else {
      db.prepare("INSERT INTO cart (id,customer_id,items) VALUES (?,?,?)").run(randomUUID(), customerId, JSON.stringify(items));
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

    db.prepare("DELETE FROM cart WHERE customer_id=?").run(customerId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
