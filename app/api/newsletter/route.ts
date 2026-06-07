import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const db = getDb();
    const id = `nl${Date.now()}`;
    db.prepare("INSERT OR IGNORE INTO newsletter (id,email) VALUES (?,?)").run(id, email);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
