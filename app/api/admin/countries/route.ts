import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Fallback seed data in case table is empty or missing
const SEED_COUNTRIES = [
  { code: "BH", name: "Bahrain" },
  { code: "EG", name: "Egypt" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "JO", name: "Jordan" },
  { code: "KW", name: "Kuwait" },
  { code: "LB", name: "Lebanon" },
  { code: "OM", name: "Oman" },
  { code: "PS", name: "Palestine" },
  { code: "QA", name: "Qatar" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SY", name: "Syria" },
  { code: "TR", name: "Turkey" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "YE", name: "Yemen" },
  { code: "ES", name: "Spain" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "NZ", name: "New Zealand" },
  { code: "AU", name: "Australia" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "VE", name: "Venezuela" },
  { code: "BR", name: "Brazil" },
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "AF", name: "Afghanistan" },
  { code: "IN", name: "India" }
];

export async function GET() {
  const db = getDb();
  
  // Ensure table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );
  `);
  
  // Check if it's empty
  const res = await db.execute("SELECT COUNT(*) as count FROM countries");
  const count = Number(res.rows[0].count);
  
  if (count === 0) {
    for (const c of SEED_COUNTRIES) {
      await db.execute({
        sql: "INSERT INTO countries (code, name, is_active) VALUES (?, ?, 1)",
        args: [c.code, c.name]
      });
    }
  }

  const result = await db.execute("SELECT * FROM countries ORDER BY name ASC");
  return NextResponse.json(result.rows);
}

export async function PUT(req: Request) {
  const db = getDb();
  try {
    const { code, is_active } = await req.json();
    await db.execute({
      sql: "UPDATE countries SET is_active = ? WHERE code = ?",
      args: [is_active ? 1 : 0, code]
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update country" }, { status: 500 });
  }
}
