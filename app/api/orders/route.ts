import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendEmail, orderBookingTemplate } from "@/lib/email";
import { randomUUID, createHash } from "crypto";

const hashPassword = (pwd: string) => createHash("sha256").update(pwd).digest("hex");

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

    // Handle Auto Customer Account Creation & Instant Session
    let temporaryPassword: string | undefined = undefined;
    let customerId: string | null = null;

    if (email && email.includes("@")) {
      try {
        const custCheck = (await db.execute({ sql: "SELECT id FROM customers WHERE email = ?", args: [email] })).rows[0] as unknown as { id: string } | undefined;
        if (custCheck) {
          customerId = custCheck.id;
        } else {
          // Generate temporary password
          temporaryPassword = `Codex-${Math.floor(1000 + Math.random() * 9000)}`;
          const hash = hashPassword(temporaryPassword);
          const newCustId = randomUUID();
          
          const nameParts = name.trim().split(" ");
          const firstName = nameParts[0] || "Customer";
          const lastName  = nameParts.slice(1).join(" ") || "";

          await db.execute({
            sql: "INSERT INTO customers (id,email,first_name,last_name,password_hash,status,tier) VALUES (?,?,?,?,?,?,?)",
            args: [newCustId, email, firstName, lastName, hash, "active", "new"]
          });
          customerId = newCustId;
        }
      } catch (err) {
        console.error("Auto customer creation error:", err);
      }
    }

    // Send order booking email
    let mailRes: any = null;
    if (email && email.includes("@")) {
      try {
        const html = orderBookingTemplate({
          orderNumber: num,
          customerName: name,
          total: body.total ?? 0,
          items: items.map((it: any) => ({ name: it.name || "Product", quantity: it.quantity || 1, price: it.price || 0 })),
          shippingAddress: typeof addr === "object" && addr !== null ? `${(addr as any).addressLine1 || ""}, ${(addr as any).city || ""} ${(addr as any).state || ""}` : String(addr),
          temporaryPassword
        });
        mailRes = await sendEmail(email, `Order Confirmation — #${num}`, html);
      } catch (err) {
        console.error("Order email error:", err);
      }
    }

    const response = NextResponse.json({ ok: true, id, orderNumber: num, emailStatus: mailRes }, { status: 201 });

    // Set instant login session cookie if customer ID is available
    if (customerId) {
      try {
        const token = randomUUID();
        const expires = new Date(Date.now() + 30 * 86400000).toISOString();
        await db.execute({ sql: "INSERT INTO sessions (token,customer_id,expires) VALUES (?,?,?)", args: [token, customerId, expires] });
        response.cookies.set("customer_session", token, { httpOnly: true, maxAge: 30 * 86400, path: "/" });
      } catch (err) {
        console.error("Session creation error:", err);
      }
    }

    return response;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const limit = url.searchParams.get("limit") || "20";
    
    if (!email) return NextResponse.json({ orders: [] });

    const rows = (await db.execute({
      sql: "SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC LIMIT ?",
      args: [email, parseInt(limit, 10)]
    })).rows;

    return NextResponse.json({ orders: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
