import { createClient, Client } from "@libsql/client";

let _db: Client | null = null;

export function getDb(): Client {
  if (_db) return _db;
  
  let url = process.env.TURSO_DATABASE_URL || "file:./data/codex.db";
  
  // Force HTTPS instead of WebSockets to prevent Vercel connection hanging
  if (url.startsWith("libsql://")) {
    url = url.replace("libsql://", "https://");
  }
  
  _db = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Lazy schema migration & favicon sync
  (async () => {
    try {
      const fs = require('fs');
      const path = require('path');
      const srcIco = path.join(process.cwd(), 'public/favicon/favicon.ico');
      const destPublicIco = path.join(process.cwd(), 'public/favicon.ico');
      const destAppIco = path.join(process.cwd(), 'app/favicon.ico');
      const srcApple = path.join(process.cwd(), 'public/favicon/apple-touch-icon.png');
      const destPublicApple = path.join(process.cwd(), 'public/apple-touch-icon.png');
      const destAppApple = path.join(process.cwd(), 'app/apple-icon.png');

      if (fs.existsSync(srcIco)) {
        if (!fs.existsSync(destPublicIco)) fs.copyFileSync(srcIco, destPublicIco);
        if (!fs.existsSync(destAppIco)) fs.copyFileSync(srcIco, destAppIco);
      }
      if (fs.existsSync(srcApple)) {
        if (!fs.existsSync(destPublicApple)) fs.copyFileSync(srcApple, destPublicApple);
        if (!fs.existsSync(destAppApple)) fs.copyFileSync(srcApple, destAppApple);
      }
    } catch {}

    try {
      // Create categories table
      await _db!.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          parent_id TEXT DEFAULT NULL,
          image_url TEXT DEFAULT NULL,
          description TEXT DEFAULT NULL,
          display_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create brands table
      await _db!.execute(`
        CREATE TABLE IF NOT EXISTS brands (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          logo_url TEXT DEFAULT NULL,
          description TEXT DEFAULT NULL,
          is_featured INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create blog_posts table
      await _db!.execute(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          author TEXT DEFAULT 'E-shop Editorial',
          category TEXT DEFAULT 'Fashion Guides',
          tags TEXT,
          featured_image TEXT,
          excerpt TEXT,
          content TEXT NOT NULL,
          status TEXT DEFAULT 'published',
          views INTEGER DEFAULT 0,
          read_time INTEGER DEFAULT 5,
          meta_title TEXT,
          meta_desc TEXT,
          meta_keywords TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const cols = [
        "status TEXT DEFAULT 'active'",
        "is_new INTEGER DEFAULT 0",
        "sizes TEXT",
        "colors TEXT",
        "variants TEXT",
        "options TEXT",
        "attributes TEXT",
        "weight REAL",
        "length REAL",
        "width REAL",
        "height REAL",
        "meta_title TEXT",
        "meta_desc TEXT",
        "meta_keywords TEXT",
        "category_id TEXT",
        "subcategory_id TEXT",
        "brand_id TEXT"
      ];
      cols.forEach(async (col) => {
        try { await _db!.execute(`ALTER TABLE products ADD COLUMN ${col}`); } catch(e) {}
      });

      // Seed default categories if table is empty
      const catCheck = await _db!.execute("SELECT COUNT(*) as c FROM categories");
      if ((catCheck.rows[0] as any).c === 0) {
        const defaultParents = [
          { id: "cat_women", name: "Women", slug: "women", image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80" },
          { id: "cat_men", name: "Men", slug: "men", image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80" },
          { id: "cat_kids", name: "Kids", slug: "kids", image_url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80" },
          { id: "cat_shoes", name: "Shoes", slug: "shoes", image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80" },
          { id: "cat_electronics", name: "Electronics", slug: "electronics", image_url: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80" },
          { id: "cat_accessories", name: "Accessories", slug: "accessories", image_url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80" }
        ];
        for (const p of defaultParents) {
          await _db!.execute({ sql: "INSERT INTO categories (id, name, slug, image_url, display_order) VALUES (?, ?, ?, ?, ?)", args: [p.id, p.name, p.slug, p.image_url, 0] });
        }

        const defaultSubs = [
          { id: "sub_w_dresses", name: "Dresses", slug: "women-dresses", parent_id: "cat_women" },
          { id: "sub_w_tops", name: "Tops & Blouses", slug: "women-tops", parent_id: "cat_women" },
          { id: "sub_m_shirts", name: "Shirts", slug: "mens-shirts", parent_id: "cat_men" },
          { id: "sub_m_jeans", name: "Jeans & Pants", slug: "mens-jeans", parent_id: "cat_men" },
          { id: "sub_s_sneakers", name: "Sneakers", slug: "sneakers", parent_id: "cat_shoes" },
          { id: "sub_s_formal", name: "Formal Shoes", slug: "formal-shoes", parent_id: "cat_shoes" },
          { id: "sub_e_laptops", name: "Laptops & PCs", slug: "laptops", parent_id: "cat_electronics" },
          { id: "sub_e_audio", name: "Headphones & Audio", slug: "audio", parent_id: "cat_electronics" }
        ];
        for (const s of defaultSubs) {
          await _db!.execute({ sql: "INSERT INTO categories (id, name, slug, parent_id, display_order) VALUES (?, ?, ?, ?, ?)", args: [s.id, s.name, s.slug, s.parent_id, 1] });
        }
      }

      // Seed default brands if table is empty
      const brandCheck = await _db!.execute("SELECT COUNT(*) as c FROM brands");
      if ((brandCheck.rows[0] as any).c === 0) {
        const defaultBrands = [
          { id: "brand_nike", name: "Nike", slug: "nike", is_featured: 1 },
          { id: "brand_adidas", name: "Adidas", slug: "adidas", is_featured: 1 },
          { id: "brand_codex", name: "Codex", slug: "codex", is_featured: 1 },
          { id: "brand_urban", name: "Urban Chic", slug: "urban-chic", is_featured: 0 },
          { id: "brand_apple", name: "Apple", slug: "apple", is_featured: 1 }
        ];
        for (const b of defaultBrands) {
          await _db!.execute({ sql: "INSERT INTO brands (id, name, slug, is_featured) VALUES (?, ?, ?, ?)", args: [b.id, b.name, b.slug, b.is_featured] });
        }
      }
    } catch (e) {}
  })();

  return _db;
}
