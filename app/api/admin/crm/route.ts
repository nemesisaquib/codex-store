import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const newsletter    = db.prepare("SELECT * FROM newsletter ORDER BY created_at DESC").all();
    const vipCustomers  = db.prepare("SELECT * FROM customers WHERE tier='vip' ORDER BY total_spend DESC").all();
    const newCustomers  = db.prepare("SELECT * FROM customers WHERE tier='new' ORDER BY created_at DESC").all();
    const atRisk        = db.prepare("SELECT * FROM customers WHERE tier='loyal' OR tier='regular' ORDER BY total_spend DESC").all();
    const totalSubs     = (db.prepare("SELECT COUNT(*) as c FROM newsletter").get() as {c:number}).c;
    const segments = {
      vip:      { count: (vipCustomers as unknown[]).length,  label: "VIP",           color: "#d4a017" },
      loyal:    { count: db.prepare("SELECT COUNT(*) as c FROM customers WHERE tier='loyal'").get() as {c:number},    label: "Loyal",         color: "#3b82f6" },
      regular:  { count: db.prepare("SELECT COUNT(*) as c FROM customers WHERE tier='regular'").get() as {c:number},  label: "Regular",       color: "#8b5cf6" },
      new:      { count: (newCustomers as unknown[]).length,  label: "New",           color: "#22c55e" },
    };
    return NextResponse.json({ newsletter, vipCustomers, newCustomers, atRisk, totalSubs, segments });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
