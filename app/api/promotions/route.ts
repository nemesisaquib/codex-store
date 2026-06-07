import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (code) {
      const promo = (await db.execute({ sql: "SELECT * FROM promotions WHERE code=? AND is_active=1", args: [code.toUpperCase()] })).rows[0];
      return NextResponse.json({ promo: promo || null });
    }

    const promotions = (await db.execute("SELECT * FROM promotions ORDER BY created_at DESC")).rows;
    return NextResponse.json({ promotions });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const id = `pr${Date.now()}`;
    await db.execute({ sql: `INSERT INTO promotions (id,code,type,value,min_order,max_uses,valid_from,valid_until,is_active,description) VALUES (?,?,?,?,?,?,?,?,?,?)`, args: [id, body.code.toUpperCase(), body.type, body.value, body.min_order ?? 0, body.max_uses ?? null, body.valid_from, body.valid_until ?? null, 1, body.description ?? null] });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
