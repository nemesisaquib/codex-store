import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const db = getDb();
    
    // Fetch all grocery items
    const itemsRes = await db.execute("SELECT * FROM grocery_items ORDER BY created_at DESC");
    
    // Fetch setting for groceries homepage visibility
    const catCheck = await db.execute("SELECT is_active FROM categories WHERE slug = 'groceries'");
    const is_enabled = catCheck.rows.length > 0 ? (catCheck.rows[0].is_active !== 0) : false;

    return NextResponse.json({
      items: itemsRes.rows,
      is_enabled
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    if (!body.name || !body.price) {
      return NextResponse.json({ error: "Name and Price are required" }, { status: 400 });
    }

    const id = body.id || `groc_${Date.now()}`;
    const slug = (body.slug || body.name)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await db.execute({
      sql: `INSERT INTO grocery_items (id, name, slug, price, compare_price, unit, freshness_badge, image_url, stock, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.name,
        slug,
        parseFloat(body.price),
        body.compare_price ? parseFloat(body.compare_price) : null,
        body.unit || "per pack",
        body.freshness_badge || "Farm Fresh",
        body.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
        body.stock ? parseInt(body.stock) : 100,
        body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1
      ]
    });

    revalidatePath("/");
    revalidatePath("/admin/groceries");

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    // Toggle global homepage visibility for Groceries
    if (body.toggle_visibility !== undefined) {
      const activeState = body.toggle_visibility ? 1 : 0;
      await db.execute({
        sql: "UPDATE categories SET is_active = ? WHERE slug = 'groceries'",
        args: [activeState]
      });

      revalidatePath("/");
      revalidatePath("/admin/groceries");

      return NextResponse.json({ ok: true, is_enabled: body.toggle_visibility });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
