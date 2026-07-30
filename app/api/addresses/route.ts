import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

async function getCustomerId(req: NextRequest): Promise<string | null> {
  const db = getDb();
  const token = req.cookies.get("customer_session")?.value;
  if (!token) return null;
  const sess = (await db.execute({ sql: "SELECT customer_id FROM sessions WHERE token=? AND expires > datetime('now')", args: [token] })).rows[0] as unknown as {customer_id:string}|undefined;
  return sess?.customer_id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const customerId = await getCustomerId(req);
    if (!customerId) return NextResponse.json({ addresses: [] });

    const addresses = (await db.execute({ sql: "SELECT id,name,street,city,state,zip,country,phone,is_default FROM addresses WHERE customer_id=? ORDER BY is_default DESC, created_at DESC", args: [customerId] })).rows;

    return NextResponse.json({ addresses });
  } catch (e) {
    return NextResponse.json({ addresses: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const customerId = await getCustomerId(req);
    if (!customerId) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    const { name, street, city, state, zip, country, phone, isDefault } = await req.json();
    if (!name || !street || !city || !zip || !country) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // If setting as default, unset others
    if (isDefault) {
      await db.execute({ sql: "UPDATE addresses SET is_default=0 WHERE customer_id=?", args: [customerId] });
    }

    const id = randomUUID();
    await db.execute({ sql: "INSERT INTO addresses (id,customer_id,name,street,city,state,zip,country,phone,is_default) VALUES (?,?,?,?,?,?,?,?,?,?)", args: [id, customerId, name, street, city, state||"", zip, country, phone||"", isDefault ? 1 : 0] });

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
