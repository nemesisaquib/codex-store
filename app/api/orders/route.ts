import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const email  = searchParams.get("email");
    const limit  = Number(searchParams.get("limit") ?? 50);

    const where: string[] = [];
    const params: unknown[] = [];
    if (status && status !== "all") { where.push("status = ?"); params.push(status); }
    if (email) { where.push("customer_email = ?"); params.push(email); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orders = db.prepare(`SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ?`).all(...params, limit);
    const total  = (db.prepare(`SELECT COUNT(*) as c FROM orders ${whereSql}`).get(...params) as { c: number }).c;
    return NextResponse.json({ orders, total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db   = getDb();
    const body = await req.json();
    const id   = `o${Date.now()}`;
    const num  = `COD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Accept both snake_case (from checkout) and camelCase
    const name  = body.customer_name  ?? body.customerName  ?? "Guest";
    const email = body.customer_email ?? body.customerEmail ?? "";
    const addr  = body.shipping_address ?? body.shippingAddress ?? "";
    const shipAddr = typeof addr === "string" ? addr : JSON.stringify(addr);
    const items = Array.isArray(body.items) ? body.items : [];

    db.prepare(`
      INSERT INTO orders (id,order_number,customer_name,customer_email,status,payment_status,subtotal,shipping,tax,discount,total,items,shipping_address,shipping_method)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, num, name, email,
      body.status ?? "pending",
      body.payment_method ? "paid" : "pending",
      body.subtotal ?? 0, body.shipping ?? 0, body.tax ?? 0, body.discount ?? 0,
      body.total ?? 0,
      JSON.stringify(items), shipAddr,
      body.shipping_method ?? body.shippingMethod ?? "standard"
    );

    return NextResponse.json({ ok: true, id, orderNumber: num }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
