import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const cat = (await db.execute({ sql: "SELECT * FROM categories WHERE id = ? OR slug = ?", args: [id, id] })).rows[0];
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json(cat);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();

    const map: Record<string, unknown> = {};
    if (body.name !== undefined) map["name"] = body.name;
    if (body.slug !== undefined) map["slug"] = body.slug;
    if (body.parent_id !== undefined) map["parent_id"] = body.parent_id || null;
    if (body.image_url !== undefined) map["image_url"] = body.image_url || null;
    if (body.description !== undefined) map["description"] = body.description || null;
    if (body.display_order !== undefined) map["display_order"] = body.display_order;

    const keys = Object.keys(map);
    if (keys.length === 0) return NextResponse.json({ ok: true });

    const sets = keys.map(k => `${k} = ?`).join(", ");
    const vals = [...keys.map(k => map[k]), id];

    await db.execute({ sql: `UPDATE categories SET ${sets} WHERE id = ?`, args: [...vals] });

    revalidatePath("/api/categories");
    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    // Delete subcategories as well or unbind parent
    await db.execute({ sql: "DELETE FROM categories WHERE id = ? OR parent_id = ?", args: [id, id] });

    revalidatePath("/api/categories");
    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
