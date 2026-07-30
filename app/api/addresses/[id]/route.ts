import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

async function getCustomerId(req: NextRequest): Promise<string | null> {
  const db = getDb();
  const token = req.cookies.get("customer_session")?.value;
  if (!token) return null;
  const sess = (await db.execute({ sql: "SELECT customer_id FROM sessions WHERE token=? AND expires > datetime('now')", args: [token] })).rows[0] as unknown as {customer_id:string}|undefined;
  return sess?.customer_id ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const customerId = await getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    // Verify ownership
    const addr = (await db.execute({ sql: "SELECT customer_id FROM addresses WHERE id=?", args: [id] })).rows[0] as unknown as {customer_id:string}|undefined;
    if (!addr || addr.customer_id !== customerId) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const { name, street, city, state, zip, country, phone, isDefault } = await req.json();

    if (isDefault) {
      await db.execute({ sql: "UPDATE addresses SET is_default=0 WHERE customer_id=?", args: [customerId] });
    }

    const updates: string[] = [];
    const values: any[] = [];
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
      await db.execute({ sql: `UPDATE addresses SET ${updates.join(",")} WHERE id=?`, args: [...values] });
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
    const customerId = await getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    // Verify ownership
    const addr = (await db.execute({ sql: "SELECT customer_id FROM addresses WHERE id=?", args: [id] })).rows[0] as unknown as {customer_id:string}|undefined;
    if (!addr || addr.customer_id !== customerId) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    await db.execute({ sql: "DELETE FROM addresses WHERE id=?", args: [id] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
