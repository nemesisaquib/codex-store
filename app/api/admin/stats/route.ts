import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();

    const totalOrders    = (db.prepare("SELECT COUNT(*) as c FROM orders").get() as {c:number}).c;
    const totalRevenue   = (db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE payment_status='paid'").get() as {s:number}).s;
    const todayRevenue   = (db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE payment_status='paid' AND date(created_at)=date('now')").get() as {s:number}).s;
    const totalCustomers = (db.prepare("SELECT COUNT(*) as c FROM customers").get() as {c:number}).c;
    const totalProducts  = (db.prepare("SELECT COUNT(*) as c FROM products").get() as {c:number}).c;
    const lowStock       = (db.prepare("SELECT COUNT(*) as c FROM products WHERE stock <= 10").get() as {c:number}).c;
    const pendingOrders  = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status IN ('pending','processing','confirmed')").get() as {c:number}).c;
    const avgOrder       = (db.prepare("SELECT COALESCE(AVG(total),0) as a FROM orders WHERE payment_status='paid'").get() as {a:number}).a;

    const recentOrders   = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 8").all();

    // Orders by status
    const statusBreakdown = db.prepare(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    ).all() as { status: string; count: number }[];

    // Top products by reviews/rating
    const topProducts = db.prepare(
      "SELECT id, name, brand, price, image_url, reviews, rating FROM products ORDER BY reviews DESC LIMIT 5"
    ).all();

    // Revenue by category (approximate)
    const revenueByCategory = db.prepare(
      "SELECT category, COUNT(*) as count, AVG(price) as avg_price FROM products GROUP BY category"
    ).all();

    return NextResponse.json({
      totalOrders, totalRevenue, todayRevenue, totalCustomers,
      totalProducts, lowStock, pendingOrders, avgOrder,
      recentOrders, statusBreakdown, topProducts, revenueByCategory,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
