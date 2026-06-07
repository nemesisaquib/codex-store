import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const order = (await db.execute({ sql: "SELECT * FROM orders WHERE id=? OR order_number=?", args: [id, id] })).rows[0];
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  try {
    const { id } = await params;
    const db   = getDb();
    const body = await req.json();
    const allowed = ["status","payment_status","tracking_number","notes","shipping_method"];
    const updates = Object.keys(body).filter(k => allowed.includes(k));
    if (!updates.length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    const sql = `UPDATE orders SET ${updates.map(k=>`${k}=?`).join(",")} , updated_at=datetime('now') WHERE id=? OR order_number=?`;
    await db.execute({ sql: sql, args: [...updates.map(k => body[k]), id, id] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
