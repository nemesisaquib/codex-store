import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();

    const totalOrders    = ((await db.execute("SELECT COUNT(*) as c FROM orders")).rows[0] as {c:number}).c;
    const totalRevenue   = ((await db.execute("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE payment_status='paid'")).rows[0] as {s:number}).s;
    const todayRevenue   = ((await db.execute("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE payment_status='paid' AND date(created_at)=date('now')")).rows[0] as {s:number}).s;
    const totalCustomers = ((await db.execute("SELECT COUNT(*) as c FROM customers")).rows[0] as {c:number}).c;
    const totalProducts  = ((await db.execute("SELECT COUNT(*) as c FROM products")).rows[0] as {c:number}).c;
    const lowStock       = ((await db.execute("SELECT COUNT(*) as c FROM products WHERE stock <= 10")).rows[0] as {c:number}).c;
    const pendingOrders  = ((await db.execute("SELECT COUNT(*) as c FROM orders WHERE status IN ('pending','processing','confirmed')")).rows[0] as {c:number}).c;
    const avgOrder       = ((await db.execute("SELECT COALESCE(AVG(total),0) as a FROM orders WHERE payment_status='paid'")).rows[0] as {a:number}).a;

    const recentOrders   = (await db.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 8")).rows;

    // Orders by status
    const statusBreakdown = (await db.execute("SELECT status, COUNT(*) as count FROM orders GROUP BY status")).rows as { status: string; count: number }[];

    // Top products by reviews/rating
    const topProducts = (await db.execute("SELECT id, name, brand, price, image_url, reviews, rating FROM products ORDER BY reviews DESC LIMIT 5")).rows;

    // Revenue by category (approximate)
    const revenueByCategory = (await db.execute("SELECT category, COUNT(*) as count, AVG(price) as avg_price FROM products GROUP BY category")).rows;

    return NextResponse.json({
      totalOrders, totalRevenue, todayRevenue, totalCustomers,
      totalProducts, lowStock, pendingOrders, avgOrder,
      recentOrders, statusBreakdown, topProducts, revenueByCategory,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
