import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const brand = (await db.execute({ sql: "SELECT * FROM brands WHERE id = ? OR slug = ?", args: [id, id] })).rows[0];
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    return NextResponse.json(brand);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();

    const map: Record<string, any> = {};
    if (body.name !== undefined) map["name"] = body.name;
    if (body.slug !== undefined) map["slug"] = body.slug;
    if (body.logo_url !== undefined) map["logo_url"] = body.logo_url || null;
    if (body.description !== undefined) map["description"] = body.description || null;
    if (body.is_featured !== undefined) map["is_featured"] = body.is_featured ? 1 : 0;

    const keys = Object.keys(map);
    if (keys.length === 0) return NextResponse.json({ ok: true });

    const sets = keys.map(k => `${k} = ?`).join(", ");
    const vals: any[] = [...keys.map(k => map[k]), id];

    await db.execute({ sql: `UPDATE brands SET ${sets} WHERE id = ?`, args: [...vals] });

    revalidatePath("/api/brands");
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

    await db.execute({ sql: "DELETE FROM brands WHERE id = ?", args: [id] });

    revalidatePath("/api/brands");
    revalidatePath("/");

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
