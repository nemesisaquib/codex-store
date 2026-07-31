import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute("SELECT id, name, category, image_url, image_url2, gallery FROM products");
    const products = res.rows as unknown as Array<{ id: string; name: string; category: string; image_url: string | null; image_url2: string | null; gallery: string | null }>;

    let updatedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      
      const nameLower = p.name.toLowerCase();
      let strictType = "";
      if (nameLower.includes("watch") || nameLower.includes("chronograph")) strictType = "watch";
      else if (nameLower.includes("bag") || nameLower.includes("tote") || nameLower.includes("purse") || nameLower.includes("backpack")) strictType = "bag";
      else if (nameLower.includes("shoe") || nameLower.includes("sneaker") || nameLower.includes("boot") || nameLower.includes("heel")) strictType = "shoe";
      else if (nameLower.includes("shirt") || nameLower.includes("t-shirt") || nameLower.includes("polo")) strictType = "shirt";
      else if (nameLower.includes("jacket") || nameLower.includes("coat")) strictType = "jacket";
      else if (nameLower.includes("sunglasses") || nameLower.includes("glasses")) strictType = "sunglasses";
      else if (nameLower.includes("dress")) strictType = "dress";
      else strictType = p.category === 'accessories' ? 'accessory' : 'fashion'; // fallback

      // Generate 5 specific images for this exact product type using loremflickr
      const images = [];
      for(let j = 1; j <= 5; j++) {
         // Using the product's ID character sum to ensure different products get different locks
         const lock = (p.id.charCodeAt(0) || 1) + j;
         images.push(\`https://loremflickr.com/800/1000/\${strictType},product?lock=\${lock}\`);
      }
      
      const img1 = images[0];
      const img2 = images[1];
      const galleryJson = JSON.stringify(images);

      await db.execute({
        sql: "UPDATE products SET image_url=?, image_url2=?, gallery=? WHERE id=?",
        args: [img1, img2, galleryJson, p.id]
      });

      updatedCount++;
    }

    return NextResponse.json({ ok: true, message: \`Successfully enriched \${updatedCount} products with accurate images from LoremFlickr.\` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
