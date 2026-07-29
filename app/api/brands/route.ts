import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = new URL(req.url).searchParams;
    const featured = sp.get("featured");

    let sql = "SELECT * FROM brands ORDER BY name ASC";
    const args: any[] = [];

    if (featured === "1") {
      sql = "SELECT * FROM brands WHERE is_featured = 1 ORDER BY name ASC";
    }

    const brands = (await db.execute({ sql, args })).rows;
    return NextResponse.json({ brands });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const id = body.id || `brand_${Date.now()}`;
    const slug = (body.slug || body.name)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await db.execute({
      sql: `INSERT INTO brands (id, name, slug, logo_url, description, is_featured)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.name,
        slug,
        body.logo_url || null,
        body.description || null,
        body.is_featured ? 1 : 0
      ]
    });

    revalidatePath("/api/brands");
    revalidatePath("/");

    return NextResponse.json({ id, name: body.name, slug }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
