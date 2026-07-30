import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendEmail, orderBookingTemplate } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const email  = searchParams.get("email");
    const limit  = Number(searchParams.get("limit") ?? 50);

    const where: string[] = [];
    const params: any[] = [];
    if (status && status !== "all") { where.push("status = ?"); params.push(status); }
    if (email) { where.push("customer_email = ?"); params.push(email); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orders = (await db.execute({ sql: `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ?`, args: [...params, limit] })).rows;
    const total  = ((await db.execute({ sql: `SELECT COUNT(*) as c FROM orders ${whereSql}`, args: params })).rows[0] as unknown as { c: number })?.c ?? 0;
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

    await db.execute({ sql: `
      INSERT INTO orders (id,order_number,customer_name,customer_email,status,payment_status,subtotal,shipping,tax,discount,total,items,shipping_address,shipping_method)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, args: [id, num, name, email, body.status ?? "pending", body.payment_method ? "paid" : "pending", body.subtotal ?? 0, body.shipping ?? 0, body.tax ?? 0, body.discount ?? 0, body.total ?? 0, JSON.stringify(items), shipAddr, body.shipping_method ?? body.shippingMethod ?? "standard"] });

    // Asynchronously send order booking email if customer email exists
    let mailRes: any = null;
    if (email && email.includes("@")) {
      try {
        const html = orderBookingTemplate({
          orderNumber: num,
          customerName: name,
          total: body.total ?? 0,
          items: items.map((it: any) => ({ name: it.name || "Product", quantity: it.quantity || 1, price: it.price || 0 })),
          shippingAddress: typeof addr === "object" && addr !== null ? `${(addr as any).addressLine1 || ""}, ${(addr as any).city || ""} ${(addr as any).state || ""}` : String(addr),
        });
        mailRes = await sendEmail(email, `Order Confirmation — #${num}`, html);
      } catch (err) {
        console.error("Order email error:", err);
      }
    }

    return NextResponse.json({ ok: true, id, orderNumber: num, emailStatus: mailRes }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
