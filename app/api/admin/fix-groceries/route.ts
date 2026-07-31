import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    
    // Check if groceries exists
    const check = await db.execute("SELECT * FROM categories WHERE slug = 'groceries'");
    if (check.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO categories (id, name, slug, image_url, display_order, is_active)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          "cat_groceries", 
          "Groceries", 
          "groceries", 
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", 
          99, 
          0 // 0 means hidden by default
        ]
      });
      return NextResponse.json({ success: true, message: "Groceries category created and hidden." });
    }
    
    return NextResponse.json({ success: true, message: "Groceries already exists." });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
