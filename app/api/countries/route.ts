import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  
  try {
    const result = await db.execute("SELECT code, name FROM countries WHERE is_active = 1 ORDER BY name ASC");
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
