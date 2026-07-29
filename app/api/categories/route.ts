import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = new URL(req.url).searchParams;
    const format = sp.get("format"); // "tree" or "flat"

    const categories = (await db.execute("SELECT * FROM categories ORDER BY display_order ASC, name ASC")).rows as any[];

    if (format === "tree") {
      const parents = categories.filter(c => !c.parent_id);
      const tree = parents.map(p => ({
        ...p,
        children: categories.filter(c => c.parent_id === p.id)
      }));
      return NextResponse.json({ categories: tree });
    }

    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const id = body.id || `cat_${Date.now()}`;
    const slug = (body.slug || body.name)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await db.execute({
      sql: `INSERT INTO categories (id, name, slug, parent_id, image_url, description, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.name,
        slug,
        body.parent_id || null,
        body.image_url || null,
        body.description || null,
        body.display_order || 0
      ]
    });

    revalidatePath("/api/categories");
    revalidatePath("/");

    return NextResponse.json({ id, name: body.name, slug }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
