import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const q     = searchParams.get("q");
    const limit = Number(searchParams.get("limit") ?? 50);

    let sql = "SELECT * FROM customers WHERE 1=1";
    const params: any[] = [];
    if (q) {
      sql += " AND (LOWER(first_name||' '||last_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))";
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const customers = (await db.execute({ sql: sql, args: [...params] })).rows;
    const total = ((await db.execute("SELECT COUNT(*) as c FROM customers")).rows[0] as unknown as { c: number }).c;
    return NextResponse.json({ customers, total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
