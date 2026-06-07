import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function getCustomerId(req: NextRequest): string | null {
  const db = getDb();
  const token = req.cookies.get("customer_session")?.value;
  if (!token) return null;
  const sess = db.prepare("SELECT customer_id FROM sessions WHERE token=? AND expires > datetime('now')").get(token) as {customer_id:string}|undefined;
  return sess?.customer_id ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const customerId = getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    // Verify ownership
    const addr = db.prepare("SELECT customer_id FROM addresses WHERE id=?").get(id) as {customer_id:string}|undefined;
    if (!addr || addr.customer_id !== customerId) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const { name, street, city, state, zip, country, phone, isDefault } = await req.json();

    if (isDefault) {
      db.prepare("UPDATE addresses SET is_default=0 WHERE customer_id=?").run(customerId);
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    if (name !== undefined) { updates.push("name=?"); values.push(name); }
    if (street !== undefined) { updates.push("street=?"); values.push(street); }
    if (city !== undefined) { updates.push("city=?"); values.push(city); }
    if (state !== undefined) { updates.push("state=?"); values.push(state); }
    if (zip !== undefined) { updates.push("zip=?"); values.push(zip); }
    if (country !== undefined) { updates.push("country=?"); values.push(country); }
    if (phone !== undefined) { updates.push("phone=?"); values.push(phone); }
    if (isDefault !== undefined) { updates.push("is_default=?"); values.push(isDefault ? 1 : 0); }

    if (updates.length) {
      values.push(id);
      db.prepare(`UPDATE addresses SET ${updates.join(",")} WHERE id=?`).run(...values);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const customerId = getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    // Verify ownership
    const addr = db.prepare("SELECT customer_id FROM addresses WHERE id=?").get(id) as {customer_id:string}|undefined;
    if (!addr || addr.customer_id !== customerId) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM addresses WHERE id=?").run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
