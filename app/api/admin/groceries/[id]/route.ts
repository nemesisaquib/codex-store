import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();

    const map: Record<string, unknown> = {};
    if (body.name !== undefined) map["name"] = body.name;
    if (body.price !== undefined) map["price"] = parseFloat(body.price);
    if (body.compare_price !== undefined) map["compare_price"] = body.compare_price ? parseFloat(body.compare_price) : null;
    if (body.unit !== undefined) map["unit"] = body.unit;
    if (body.freshness_badge !== undefined) map["freshness_badge"] = body.freshness_badge;
    if (body.image_url !== undefined) map["image_url"] = body.image_url;
    if (body.stock !== undefined) map["stock"] = parseInt(body.stock);
    if (body.is_active !== undefined) map["is_active"] = body.is_active ? 1 : 0;

    const keys = Object.keys(map);
    if (keys.length === 0) return NextResponse.json({ ok: true });

    const sets = keys.map(k => `${k} = ?`).join(", ");
    const vals = [...keys.map(k => map[k]), id];

    await db.execute({ sql: `UPDATE grocery_items SET ${sets} WHERE id = ?`, args: [...vals] });

    revalidatePath("/");
    revalidatePath("/admin/groceries");

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    await db.execute({ sql: "DELETE FROM grocery_items WHERE id = ?", args: [id] });

    revalidatePath("/");
    revalidatePath("/admin/groceries");

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
