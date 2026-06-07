import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const products = db.prepare("SELECT id,name,slug,brand,category,stock,status,image_url,price FROM products WHERE status!='deleted' ORDER BY stock ASC").all();
    const lowStock = (db.prepare("SELECT COUNT(*) as c FROM products WHERE stock<=10 AND status='active'").get() as {c:number}).c;
    const outOfStock = (db.prepare("SELECT COUNT(*) as c FROM products WHERE stock=0 AND status='active'").get() as {c:number}).c;
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
      db.prepare("UPDATE products SET stock=? WHERE id=?").run(body.stock, body.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
