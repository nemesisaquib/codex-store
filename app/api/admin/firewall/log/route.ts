import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Basic verification token to prevent external spam
    const token = req.headers.get("x-firewall-secret");
    if (token !== "firewall-internal-secret-key-12345") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ip, method, url, country, rule, action } = await req.json();

    const db = getDb();
    
    // Log the event to database
    await db.execute({
      sql: `INSERT INTO firewall_logs (ip, method, url, country, rule, action, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [ip, method, url, country, rule, action]
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Firewall Logger Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
