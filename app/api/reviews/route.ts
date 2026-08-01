import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ reviews: [], total: 0, avgRating: 0 });
    }

    const rows = (
      await db.execute({
        sql: `
          SELECT id, product_id, COALESCE(NULLIF(customer_name, ''), 'Verified Buyer') as customer_name, customer_email, country, rating, title, comment, status, admin_reply, created_at
          FROM reviews
          WHERE product_id = ? AND status = 'approved'
          ORDER BY created_at DESC
        `,
        args: [productId],
      })
    ).rows as unknown as {
      id: string;
      product_id: string;
      customer_name: string;
      customer_email?: string;
      country?: string;
      rating: number;
      title?: string;
      comment: string;
      status: string;
      admin_reply?: string;
      created_at: string;
    }[];

    const total = rows.length;
    const avgRating = total > 0 ? Number((rows.reduce((s, r) => s + (r.rating || 5), 0) / total).toFixed(1)) : 5.0;

    const breakdown = {
      5: rows.filter((r) => r.rating === 5).length,
      4: rows.filter((r) => r.rating === 4).length,
      3: rows.filter((r) => r.rating === 3).length,
      2: rows.filter((r) => r.rating === 2).length,
      1: rows.filter((r) => r.rating === 1).length,
    };

    return NextResponse.json({ reviews: rows, total, avgRating, breakdown });
  } catch (e) {
    return NextResponse.json({ reviews: [], total: 0, avgRating: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const { productId, rating, title, comment, customerName, customerEmail, country } = body;
    if (!productId || !rating || !comment) {
      return NextResponse.json({ ok: false, error: "Missing required fields (productId, rating, comment)" }, { status: 400 });
    }

    // Ensure all columns exist
    try { await db.execute("ALTER TABLE reviews ADD COLUMN customer_id TEXT DEFAULT 'cust_guest'"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN customer_name TEXT DEFAULT 'Verified Buyer'"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN customer_email TEXT DEFAULT NULL"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN country TEXT DEFAULT NULL"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN title TEXT DEFAULT NULL"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN admin_reply TEXT DEFAULT NULL"); } catch (e) {}

    const id = randomUUID();
    const customerId = `cust_${randomUUID().slice(0, 8)}`;
    const name = customerName?.trim() || "Verified Buyer";
    const email = customerEmail?.trim() || "";

    await db.execute({
      sql: `
        INSERT INTO reviews (id, product_id, customer_id, customer_name, customer_email, country, rating, title, comment, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, productId, customerId, name, email, country || null, rating, title || "", comment, "pending", new Date().toISOString()],
    });

    return NextResponse.json({ ok: true, id, message: "Review submitted! It will appear after admin approval." });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
