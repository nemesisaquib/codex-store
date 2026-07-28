import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  
  const countRes = await db.execute("SELECT COUNT(*) as c FROM products");
  const rowCount = countRes.rows[0].c as number;

  return NextResponse.json({ totalProductsInDB: rowCount, time: Date.now() });
}
