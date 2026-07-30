const { createClient } = require("@libsql/client");
const path = require("path");

let dbUrl = process.env.TURSO_DATABASE_URL || "file:./data/codex.db";
if (dbUrl.startsWith("libsql://")) {
  dbUrl = dbUrl.replace("libsql://", "https://");
}

const db = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const IMAGE_SETS = {
  women: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85&auto=format&fit=crop"
  ],
  men: [
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490555758436-2277d337f76e?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=85&auto=format&fit=crop"
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&q=85&auto=format&fit=crop"
  ],
  accessories: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611591475777-233cd7577770?w=1200&q=85&auto=format&fit=crop"
  ],
  kids: [
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=1200&q=85&auto=format&fit=crop"
  ]
};

async function main() {
  console.log("Updating all product galleries with 5 to 6 real high-res photography images...");
  const res = await db.execute("SELECT id, name, category, image_url, image_url2, gallery FROM products");
  const products = res.rows;

  console.log(`Found ${products.length} products in database.`);

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const catLower = (p.category || "").toLowerCase();
    
    let pool = IMAGE_SETS.women;
    if (catLower.includes("men") && !catLower.includes("women")) pool = IMAGE_SETS.men;
    else if (catLower.includes("shoe") || catLower.includes("footwear") || catLower.includes("sneaker")) pool = IMAGE_SETS.shoes;
    else if (catLower.includes("access") || catLower.includes("watch") || catLower.includes("bag") || catLower.includes("jewel")) pool = IMAGE_SETS.accessories;
    else if (catLower.includes("kid") || catLower.includes("child") || catLower.includes("baby")) pool = IMAGE_SETS.kids;

    // Pick 6 images deterministically based on product ID and name
    const offset = i * 3;
    const img1 = p.image_url && p.image_url.startsWith("http") ? p.image_url : pool[offset % pool.length];
    const img2 = pool[(offset + 1) % pool.length];
    const img3 = pool[(offset + 2) % pool.length];
    const img4 = pool[(offset + 3) % pool.length];
    const img5 = pool[(offset + 4) % pool.length];
    const img6 = pool[(offset + 5) % pool.length];

    const galleryArray = [img1, img2, img3, img4, img5, img6];
    const galleryJson = JSON.stringify(galleryArray);

    await db.execute({
      sql: "UPDATE products SET image_url=?, image_url2=?, gallery=? WHERE id=?",
      args: [img1, img2, galleryJson, p.id]
    });

    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} products with 6 high-res gallery images each!`);
}

main().catch(console.error);
