import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const newsletter    = (await db.execute("SELECT * FROM newsletter ORDER BY created_at DESC")).rows;
    const vipCustomers  = (await db.execute("SELECT * FROM customers WHERE tier='vip' ORDER BY total_spend DESC")).rows;
    const newCustomers  = (await db.execute("SELECT * FROM customers WHERE tier='new' ORDER BY created_at DESC")).rows;
    const atRisk        = (await db.execute("SELECT * FROM customers WHERE tier='loyal' OR tier='regular' ORDER BY total_spend DESC")).rows;
    const messages      = (await db.execute("SELECT * FROM contact_messages ORDER BY created_at DESC")).rows;
    const totalSubs     = ((await db.execute("SELECT COUNT(*) as c FROM newsletter")).rows[0] as unknown as {c:number}).c;
    const segments = {
      vip:      { count: (vipCustomers as unknown[]).length,  label: "VIP",           color: "#d4a017" },
      loyal:    { count: ((await db.execute("SELECT COUNT(*) as c FROM customers WHERE tier='loyal'")).rows[0] as unknown as {c:number}).c,    label: "Loyal",         color: "#3b82f6" },
      regular:  { count: ((await db.execute("SELECT COUNT(*) as c FROM customers WHERE tier='regular'")).rows[0] as unknown as {c:number}).c,  label: "Regular",       color: "#8b5cf6" },
      new:      { count: (newCustomers as unknown[]).length,  label: "New",           color: "#22c55e" },
    };
    return NextResponse.json({ newsletter, vipCustomers, newCustomers, atRisk, totalSubs, segments, messages });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
