import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();
    const allowed = ["is_active","valid_until","max_uses","description","value"];
    const updates = Object.keys(body).filter(k => allowed.includes(k));
    if (!updates.length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    db.prepare(`UPDATE promotions SET ${updates.map(k=>`${k}=?`).join(",")} WHERE id=?`).run(...updates.map(k=>body[k]), id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare("DELETE FROM promotions WHERE id=?").run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
