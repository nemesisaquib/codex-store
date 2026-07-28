import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = 'force-dynamic';

interface Notif {
  id: string; type: string; title: string; body: string;
  time: string; href: string; icon: string;
}

export async function GET() {
  try {
    const db = getDb();
    const notifs: Notif[] = [];

    // Recent orders (last 5)
    const orders = (await db.execute("SELECT id,order_number,customer_name,total,status,created_at FROM orders ORDER BY created_at DESC LIMIT 5")).rows as {id:string;order_number:string;customer_name:string;total:number;status:string;created_at:string}[];
    for (const o of orders) {
      notifs.push({
        id: `order-${o.id}`, type: "order",
        title: `New order ${o.order_number}`,
        body: `${o.customer_name} · $${o.total}`,
        time: o.created_at, href: "/admin/orders", icon: "shopping-cart",
      });
    }

    // Low stock alerts
    const low = (await db.execute("SELECT id,name,stock,created_at FROM products WHERE stock<=10 AND status='active' ORDER BY stock ASC LIMIT 5")).rows as {id:string;name:string;stock:number;created_at:string}[];
    for (const p of low) {
      notifs.push({
        id: `stock-${p.id}`, type: "stock",
        title: p.stock === 0 ? `${p.name} is out of stock` : `Low stock: ${p.name}`,
        body: `${p.stock} unit${p.stock===1?"":"s"} remaining`,
        time: p.created_at || new Date().toISOString(), href: "/admin/inventory", icon: "alert-triangle",
      });
    }

    // New customers (last 3)
    const newCust = (await db.execute("SELECT id,first_name,last_name,created_at FROM customers WHERE tier='new' ORDER BY created_at DESC LIMIT 3")).rows as {id:string;first_name:string;last_name:string;created_at:string}[];
    for (const c of newCust) {
      notifs.push({
        id: `cust-${c.id}`, type: "customer",
        title: "New customer registered",
        body: `${c.first_name} ${c.last_name}`,
        time: c.created_at, href: "/admin/customers", icon: "user-plus",
      });
    }

    // Newsletter signups (last 3)
    const subs = (await db.execute("SELECT id,email,created_at FROM newsletter ORDER BY created_at DESC LIMIT 3")).rows as {id:string;email:string;created_at:string}[];
    for (const s of subs) {
      notifs.push({
        id: `sub-${s.id}`, type: "newsletter",
        title: "Newsletter signup",
        body: s.email,
        time: s.created_at, href: "/admin/crm", icon: "mail",
      });
    }

    // Sort newest first
    notifs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      notifications: notifs.slice(0, 12),
      unread: notifs.length,
      counts: {
        orders: orders.length,
        lowStock: low.length,
        newCustomers: newCust.length,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
