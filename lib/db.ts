import { createClient, Client } from "@libsql/client";

let _db: Client | null = null;

export function getDb(): Client {
  let url = process.env.TURSO_DATABASE_URL || "file:./data/codex.db";
  
  // Force HTTPS instead of WebSockets to prevent Vercel connection hanging
  if (url.startsWith("libsql://")) {
    url = url.replace("libsql://", "https://");
  }
  
  if (!_db) {
    _db = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  // Lazy schema migration
  (async () => {
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
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Migrate existing DB if column doesn't exist
      try { await _db!.execute("ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1"); } catch(e) {}

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

      // Create contact_messages table
      await _db!.execute(`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'unread',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create orders table
      await _db!.execute(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          order_number TEXT UNIQUE NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          payment_status TEXT DEFAULT 'pending',
          subtotal REAL DEFAULT 0,
          shipping REAL DEFAULT 0,
          tax REAL DEFAULT 0,
          discount REAL DEFAULT 0,
          total REAL DEFAULT 0,
          items TEXT,
          shipping_address TEXT,
          shipping_method TEXT DEFAULT 'standard',
          tracking_number TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Seed default sample orders if empty
      try {
        const orderCheck = await _db!.execute("SELECT COUNT(*) as c FROM orders");
        if ((orderCheck.rows[0] as any).c === 0) {
          const sampleOrders = [
            {
              id: "ord_demo_1",
              order_number: "COD-2026-84920",
              customer_name: "Sarah Jenkins",
              customer_email: "sarah.j@example.com",
              status: "shipped",
              payment_status: "paid",
              subtotal: 185.00,
              shipping: 12.99,
              tax: 15.00,
              total: 212.99,
              items: JSON.stringify([{ name: "Classic Leather Jacket", quantity: 1, price: 185.00 }]),
              shipping_address: "742 Evergreen Terrace, Springfield, OR 97477",
              shipping_method: "DHL Express",
              tracking_number: "TRK-849201948"
            },
            {
              id: "ord_demo_2",
              order_number: "COD-2026-91042",
              customer_name: "Alexander Wright",
              customer_email: "alex.wright@example.com",
              status: "processing",
              payment_status: "paid",
              subtotal: 120.00,
              shipping: 0.00,
              tax: 10.20,
              total: 130.20,
              items: JSON.stringify([{ name: "Minimalist Chronograph Watch", quantity: 1, price: 120.00 }]),
              shipping_address: "100 Market St, San Francisco, CA 94105",
              shipping_method: "Standard Shipping",
              tracking_number: "TRK-910425510"
            },
            {
              id: "ord_demo_3",
              order_number: "COD-2026-10492",
              customer_name: "Emily Watson",
              customer_email: "emily.w@example.com",
              status: "delivered",
              payment_status: "paid",
              subtotal: 95.00,
              shipping: 5.00,
              tax: 8.00,
              total: 108.00,
              items: JSON.stringify([{ name: "Designer Leather Tote Bag", quantity: 1, price: 95.00 }]),
              shipping_address: "500 5th Ave, New York, NY 10110",
              shipping_method: "FedEx Ground",
              tracking_number: "TRK-104928841"
            }
          ];

          for (const o of sampleOrders) {
            await _db!.execute({
              sql: "INSERT INTO orders (id, order_number, customer_name, customer_email, status, payment_status, subtotal, shipping, tax, total, items, shipping_address, shipping_method, tracking_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              args: [o.id, o.order_number, o.customer_name, o.customer_email, o.status, o.payment_status, o.subtotal, o.shipping, o.tax, o.total, o.items, o.shipping_address, o.shipping_method, o.tracking_number]
            });
          }
        }
      } catch (e) {}

      // Create reviews table
      await _db!.execute(`
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          customer_id TEXT DEFAULT 'cust_admin',
          customer_name TEXT DEFAULT 'Verified Buyer',
          customer_email TEXT,
          country TEXT,
          rating INTEGER NOT NULL DEFAULT 5,
          title TEXT,
          comment TEXT NOT NULL,
          status TEXT DEFAULT 'approved',
          admin_reply TEXT
        )
      `);
      // Migration for reviews table columns
      try { await _db!.execute("ALTER TABLE reviews ADD COLUMN customer_id TEXT DEFAULT 'cust_admin'"); } catch (e) {}
      try { await _db!.execute("ALTER TABLE reviews ADD COLUMN customer_name TEXT DEFAULT 'Verified Buyer'"); } catch (e) {}
      try { await _db!.execute("ALTER TABLE reviews ADD COLUMN customer_email TEXT DEFAULT NULL"); } catch (e) {}
      try { await _db!.execute("ALTER TABLE reviews ADD COLUMN country TEXT DEFAULT NULL"); } catch (e) {}
      try { await _db!.execute("ALTER TABLE reviews ADD COLUMN title TEXT DEFAULT NULL"); } catch (e) {}
      try { await _db!.execute("ALTER TABLE reviews ADD COLUMN admin_reply TEXT DEFAULT NULL"); } catch (e) {}

      // Seed sample reviews if empty
      try {
        const revCheck = await _db!.execute("SELECT COUNT(*) as c FROM reviews");
        if ((revCheck.rows[0] as any).c === 0) {
          const sampleReviews = [
            {
              id: "rev_1",
              product_id: "p1",
              customer_name: "Eleanor Vance",
              customer_email: "eleanor@example.com",
              rating: 5,
              title: "Absolute perfection!",
              comment: "The leather quality is top tier. Fits like a glove and feels incredibly luxurious. Highly recommend!",
              status: "approved",
              admin_reply: "Thank you Eleanor! We take great pride in our leather craftsmanship.",
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "rev_2",
              product_id: "p1",
              customer_name: "Marcus Brody",
              customer_email: "marcus@example.com",
              rating: 4,
              title: "Great quality, fast shipping",
              comment: "Arrived in 2 days via DHL. Great finish and heavy duty zippers. Slightly snug around the shoulders.",
              status: "approved",
              admin_reply: null,
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "rev_3",
              product_id: "p2",
              customer_name: "Sophia Martinez",
              customer_email: "sophia@example.com",
              rating: 5,
              title: "Stunning timepiece!",
              comment: "Looks way more expensive than it is. The minimal dial and strap get compliments everywhere I go.",
              status: "approved",
              admin_reply: null,
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "rev_4",
              product_id: "p3",
              customer_name: "David Kim",
              customer_email: "david.k@example.com",
              rating: 5,
              title: "Worth every penny",
              comment: "Extremely spacious tote bag with durable stitching. Fits my 15-inch laptop and daily essentials easily.",
              status: "pending",
              admin_reply: null,
              created_at: new Date().toISOString()
            }
          ];

          for (const r of sampleReviews) {
            await _db!.execute({
              sql: "INSERT INTO reviews (id, product_id, customer_name, customer_email, rating, title, comment, status, admin_reply, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              args: [r.id, r.product_id, r.customer_name, r.customer_email, r.rating, r.title, r.comment, r.status, r.admin_reply, r.created_at]
            });
          }
        }
      } catch (e) {}

      // Seed default fresh grocery items if table is empty
      try {
        const grocCount = await _db!.execute("SELECT COUNT(*) as c FROM grocery_items");
        if ((grocCount.rows[0] as any).c === 0) {
          const defaultGroceries = [
            { id: "groc_1", name: "Organic Red Potatoes", slug: "organic-red-potatoes", price: 2.29, compare_price: 2.49, unit: "per 1kg", freshness_badge: "100% Organic", image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80", stock: 150 },
            { id: "groc_2", name: "Farm Fresh Red Onions", slug: "farm-fresh-red-onions", price: 1.99, compare_price: 2.19, unit: "per 500g", freshness_badge: "Daily Harvest", image_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80", stock: 200 },
            { id: "groc_3", name: "Premium Basmati Rice", slug: "premium-basmati-rice", price: 5.99, compare_price: 6.55, unit: "per 2kg bag", freshness_badge: "High Quality", image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80", stock: 80 },
            { id: "groc_4", name: "Fresh Whole Milk", slug: "fresh-whole-milk", price: 1.49, compare_price: 1.79, unit: "per 1L bottle", freshness_badge: "Dairy Fresh", image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80", stock: 120 },
            { id: "groc_5", name: "Crisp Red Apples", slug: "crisp-red-apples", price: 3.49, compare_price: 3.99, unit: "per 1kg pack", freshness_badge: "Farm Fresh", image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80", stock: 90 }
          ];
          for (const item of defaultGroceries) {
            await _db!.execute({
              sql: "INSERT INTO grocery_items (id, name, slug, price, compare_price, unit, freshness_badge, image_url, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
              args: [item.id, item.name, item.slug, item.price, item.compare_price, item.unit, item.freshness_badge, item.image_url, item.stock]
            });
          }
        }
      } catch (e) {}

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
      for (const col of cols) {
        try {
          await _db!.execute(`ALTER TABLE products ADD COLUMN ${col}`);
        } catch (e) {}
      }

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
      // Ensure groceries exists
      const grocCheck = await _db!.execute("SELECT * FROM categories WHERE slug = 'groceries'");
      if (grocCheck.rows.length === 0) {
        await _db!.execute({
          sql: "INSERT INTO categories (id, name, slug, image_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)",
          args: ["cat_groceries", "Groceries", "groceries", "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", 99, 0]
        });
      }
    } catch (e) {}
  })();

  return _db;
}
