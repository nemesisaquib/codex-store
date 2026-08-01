import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let sql = `
      SELECT r.id, r.product_id, r.customer_name, r.customer_email, r.country, r.rating, r.title, r.comment, r.status, r.admin_reply, r.created_at, p.name as product_name, p.image_url as product_image
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
    `;
    const args: any[] = [];

    if (status && status !== "all") {
      sql += " WHERE r.status = ?";
      args.push(status);
    }

    sql += " ORDER BY r.created_at DESC";

    const rows = (await db.execute({ sql, args })).rows;
    return NextResponse.json({ reviews: rows, total: rows.length });
  } catch (e) {
    return NextResponse.json({ reviews: [], error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const {
      productId,
      customerName,
      customerEmail,
      country,
      rating,
      title,
      comment,
      status,
      createdAt,
      adminReply,
    } = body;

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields (productId, customerName, rating, comment)" },
        { status: 400 }
      );
    }

    // Ensure all columns exist across any SQLite schema version
    try { await db.execute("ALTER TABLE reviews ADD COLUMN customer_id TEXT DEFAULT 'cust_admin'"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN customer_name TEXT DEFAULT 'Verified Buyer'"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN customer_email TEXT DEFAULT NULL"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN country TEXT DEFAULT NULL"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN title TEXT DEFAULT NULL"); } catch (e) {}
    try { await db.execute("ALTER TABLE reviews ADD COLUMN admin_reply TEXT DEFAULT NULL"); } catch (e) {}

    const id = `rev_${randomUUID().slice(0, 8)}`;
    const customerId = `cust_${randomUUID().slice(0, 8)}`;
    const reviewDate = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();
    const reviewStatus = status || "approved";

    await db.execute({
      sql: `
        INSERT INTO reviews (id, product_id, customer_id, customer_name, customer_email, country, rating, title, comment, status, admin_reply, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        productId,
        customerId,
        customerName.trim(),
        customerEmail?.trim() || null,
        country?.trim() || null,
        Number(rating) || 5,
        title?.trim() || "",
        comment.trim(),
        reviewStatus,
        adminReply?.trim() || null,
        reviewDate,
      ],
    });

    return NextResponse.json({ ok: true, id, message: "Review created successfully!" });
  } catch (e) {
    console.error("Admin POST review error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, status, admin_reply, rating, title, comment, country, created_at, customer_name, customer_email } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Review ID required" }, { status: 400 });
    }

    const updates: string[] = [];
    const args: any[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      args.push(status);
    }
    if (admin_reply !== undefined) {
      updates.push("admin_reply = ?");
      args.push(admin_reply);
    }
    if (rating !== undefined) {
      updates.push("rating = ?");
      args.push(rating);
    }
    if (title !== undefined) {
      updates.push("title = ?");
      args.push(title);
    }
    if (comment !== undefined) {
      updates.push("comment = ?");
      args.push(comment);
    }
    if (country !== undefined) {
      updates.push("country = ?");
      args.push(country);
    }
    if (created_at !== undefined) {
      updates.push("created_at = ?");
      args.push(created_at);
    }
    if (customer_name !== undefined) {
      updates.push("customer_name = ?");
      args.push(customer_name);
    }
    if (customer_email !== undefined) {
      updates.push("customer_email = ?");
      args.push(customer_email);
    }

    if (updates.length === 0) {
      return NextResponse.json({ ok: true, message: "Nothing to update" });
    }

    args.push(id);
    await db.execute({
      sql: `UPDATE reviews SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Review ID required" }, { status: 400 });
    }

    await db.execute({ sql: "DELETE FROM reviews WHERE id = ?", args: [id] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
