import { getDb } from "../lib/db";

async function importFakeStore() {
  console.log("Fetching FakeStore API...");
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    const data = await res.json() as any[];
    
    return data.map(p => ({
      id: `fs_${p.id}`,
      name: p.title,
      slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      brand: "FakeStore",
      category: p.category,
      price: p.price,
      comparePrice: p.price * 1.2, // Mock 20% off
      color: "#000000",
      image_url: p.image,
      stock: 100,
      badge: "Popular",
      isNew: 0,
      rating: p.rating?.rate ?? 4.5,
      reviews: p.rating?.count ?? 0,
      colors: [],
      status: "active",
      description: p.description
    }));
  } catch (e) {
    console.error("Failed to fetch FakeStore API", e);
    return [];
  }
}

async function importDummyJson() {
  console.log("Fetching DummyJSON API...");
  try {
    const res = await fetch("https://dummyjson.com/products?limit=100");
    if (!res.ok) throw new Error("Not ok");
    const data = (await res.json()) as any;
    
    return data.products.map((p: any) => ({
      id: `dj_${p.id}`,
      name: p.title,
      slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      brand: p.brand ?? "DummyBrand",
      category: p.category,
      price: p.price,
      comparePrice: p.price + (p.price * (p.discountPercentage / 100)), // original price
      color: "#000000",
      image_url: p.thumbnail,
      stock: p.stock ?? 50,
      badge: "Top Rated",
      isNew: 1,
      rating: p.rating ?? 4.0,
      reviews: p.reviews?.length ?? 15,
      colors: [],
      status: "active",
      description: p.description
    }));
  } catch (e) {
    console.error("Failed to fetch DummyJSON API", e);
    return [];
  }
}

async function run() {
  const db = getDb();
  
  const fsProducts = await importFakeStore();
  const djProducts = await importDummyJson();
  
  const allProducts = [...fsProducts, ...djProducts];
  
  console.log(`Found ${allProducts.length} products to insert.`);
  
  let inserted = 0;
  for (const p of allProducts) {
    try {
      await db.execute({
        sql: `
          INSERT INTO products (id,name,slug,brand,category,price,compare_price,color,image_url,stock,badge,is_new,rating,reviews,colors,status,gallery,image_url2)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, 
        args: [
          p.id, p.name, p.slug, p.brand, p.category, p.price, p.comparePrice, p.color, p.image_url, p.stock, p.badge, p.isNew, p.rating, p.reviews, JSON.stringify(p.colors), p.status, "[]", null
        ]
      });
      inserted++;
    } catch (e: any) {
      if (e.message?.includes("UNIQUE constraint failed")) {
        // ignore duplicate
      } else {
        console.error(`Error inserting product ${p.name}:`, e.message);
      }
    }
  }
  
  console.log(`Successfully inserted ${inserted} new products.`);
}

run().catch(console.error);
