import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const products = (await db.execute("SELECT id,name,slug,brand,category,stock,status,image_url,price FROM products WHERE status!='deleted' ORDER BY stock ASC")).rows;
    const lowStock = ((await db.execute("SELECT COUNT(*) as c FROM products WHERE stock<=10 AND status='active'")).rows[0] as {c:number}).c;
    const outOfStock = ((await db.execute("SELECT COUNT(*) as c FROM products WHERE stock=0 AND status='active'")).rows[0] as {c:number}).c;
    return NextResponse.json({ products, lowStock, outOfStock });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    if (body.bulk && Array.isArray(body.bulk)) {
      const upd = db.prepare("UPDATE products SET stock=? WHERE id=?");
      db.transaction((rows: {id:string;stock:number}[]) => { for (const r of rows) upd.run(r.stock, r.id); })(body.bulk);
    } else {
      await db.execute({ sql: "UPDATE products SET stock=? WHERE id=?", args: [body.stock, body.id] });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
