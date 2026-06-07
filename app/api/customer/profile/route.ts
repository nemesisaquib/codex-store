import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createHash } from "crypto";

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
    if (!customerId) return NextResponse.json({ profile: null });

    const profile = db.prepare(
      "SELECT id,email,first_name,last_name,phone,country,status,tier,loyalty_pts,total_orders,total_spend FROM customers WHERE id=?"
    ).get(customerId);

    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json({ profile: null });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = getDb();
    const customerId = getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    const { firstName, lastName, phone, country, password } = await req.json();

    const updates: string[] = [];
    const values: unknown[] = [];
    if (firstName !== undefined) { updates.push("first_name=?"); values.push(firstName); }
    if (lastName !== undefined) { updates.push("last_name=?"); values.push(lastName); }
    if (phone !== undefined) { updates.push("phone=?"); values.push(phone); }
    if (country !== undefined) { updates.push("country=?"); values.push(country); }
    if (password !== undefined) {
      const hash = createHash("sha256").update(password).digest("hex");
      updates.push("password_hash=?");
      values.push(hash);
    }

    if (updates.length) {
      values.push(customerId);
      db.prepare(`UPDATE customers SET ${updates.join(",")} WHERE id=?`).run(...values);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
