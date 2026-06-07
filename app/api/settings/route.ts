import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const rows = (await db.execute("SELECT * FROM settings ORDER BY group_name, key")).rows as {key:string;value:string;group_name:string}[];
    const grouped: Record<string, Record<string,string>> = {};
    for (const r of rows) {
      if (!grouped[r.group_name]) grouped[r.group_name] = {};
      grouped[r.group_name][r.key] = r.value;
    }
    return NextResponse.json({ settings: grouped, flat: Object.fromEntries(rows.map(r=>[r.key,r.value])) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db   = getDb();
    const body = await req.json() as Record<string,string>;
    // UPDATE existing (preserves group_name); INSERT only if missing
    const upd = db.prepare("UPDATE settings SET value=?, updated_at=datetime('now') WHERE key=?");
    const ins = db.prepare("INSERT OR IGNORE INTO settings (key,value,group_name) VALUES (?,?,'general')");
    const many = db.transaction((obj: Record<string,string>) => {
      for (const [k,v] of Object.entries(obj)) {
        const res = upd.run(v, k);
        if (res.changes === 0) ins.run(k, v);
      }
    });
    many(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
