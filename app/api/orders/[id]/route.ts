import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendEmail, orderCancellationTemplate, orderDeliveryTemplate } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();
    const allowed = ["status", "payment_status", "tracking_number", "notes", "shipping_method"];
    const updates = Object.keys(body).filter(k => allowed.includes(k));
    if (!updates.length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

    // Fetch existing order before updating to compare status & get email info
    const existing = (await db.execute({ sql: "SELECT * FROM orders WHERE id=? OR order_number=?", args: [id, id] })).rows[0] as any;

    const sql = `UPDATE orders SET ${updates.map(k => `${k}=?`).join(",")} , updated_at=datetime('now') WHERE id=? OR order_number=?`;
    await db.execute({ sql: sql, args: [...updates.map(k => body[k]), id, id] });

    let mailRes: any = null;
    if (existing && existing.customer_email && body.status && body.status !== existing.status) {
      const orderNum = existing.order_number || id;
      const custName = existing.customer_name || "Customer";
      const custEmail = existing.customer_email;

      try {
        if (body.status === "cancelled") {
          const html = orderCancellationTemplate({
            orderNumber: orderNum,
            customerName: custName,
            reason: body.notes || "Order cancelled by store administrator.",
            refundAmount: Number(existing.total) || 0,
          });
          mailRes = await sendEmail(custEmail, `Order Cancelled — #${orderNum}`, html);
        } else if (body.status === "shipped" || body.status === "delivered") {
          const html = orderDeliveryTemplate({
            orderNumber: orderNum,
            customerName: custName,
            status: body.status,
            trackingNumber: body.tracking_number || existing.tracking_number || undefined,
          });
          mailRes = await sendEmail(custEmail, `Order Status: ${body.status.toUpperCase()} — #${orderNum}`, html);
        }
      } catch (err) {
        console.error("Order status update email error:", err);
      }
    }

    return NextResponse.json({ ok: true, emailStatus: mailRes });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
