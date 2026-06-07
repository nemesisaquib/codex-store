import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const customer = (await db.execute({ sql: "SELECT * FROM customers WHERE id=?", args: [id] })).rows[0];
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const orders = (await db.execute({ sql: "SELECT * FROM orders WHERE customer_email=(SELECT email FROM customers WHERE id=?) ORDER BY created_at DESC", args: [id] })).rows;
    return NextResponse.json({ customer, orders });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  try {
    const { id } = await params;
    const db   = getDb();
    const body = await req.json();
    const allowed = ["status","tier","loyalty_pts"];
    const updates = Object.keys(body).filter(k => allowed.includes(k));
    if (!updates.length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    await db.execute({ sql: `UPDATE customers SET ${updates.map(k=>`${k}=?`).join(",")} WHERE id=?`, args: [...updates.map(k=>body[k]), id] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
