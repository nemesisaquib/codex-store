import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { createHash } from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "codex.db");
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      slug          TEXT UNIQUE NOT NULL,
      brand         TEXT NOT NULL,
      category      TEXT NOT NULL,
      price         REAL NOT NULL,
      compare_price REAL,
      color         TEXT,
      image_url     TEXT,
      image_url2    TEXT,
      stock         INTEGER DEFAULT 100,
      status        TEXT DEFAULT 'active',
      badge         TEXT,
      is_new        INTEGER DEFAULT 0,
      rating        REAL DEFAULT 4.5,
      reviews       INTEGER DEFAULT 0,
      colors        TEXT DEFAULT '[]',
      description   TEXT,
      meta_title    TEXT,
      meta_desc     TEXT,
      og_image      TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id               TEXT PRIMARY KEY,
      order_number     TEXT UNIQUE NOT NULL,
      guest_email      TEXT,
      status           TEXT DEFAULT 'pending',
      payment_status   TEXT DEFAULT 'pending',
      currency         TEXT DEFAULT 'USD',
      subtotal         REAL NOT NULL,
      shipping         REAL DEFAULT 0,
      tax              REAL DEFAULT 0,
      discount         REAL DEFAULT 0,
      total            REAL NOT NULL,
      customer_name    TEXT,
      customer_email   TEXT,
      shipping_address TEXT,
      shipping_method  TEXT,
      tracking_number  TEXT,
      items            TEXT NOT NULL,
      notes            TEXT,
      created_at       TEXT DEFAULT (datetime('now')),
      updated_at       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id           TEXT PRIMARY KEY,
      first_name   TEXT NOT NULL,
      last_name    TEXT NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      phone        TEXT,
      status       TEXT DEFAULT 'active',
      tier         TEXT DEFAULT 'new',
      loyalty_pts  INTEGER DEFAULT 0,
      country      TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spend  REAL DEFAULT 0,
      notes        TEXT,
      created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS newsletter (
      id         TEXT PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      status     TEXT DEFAULT 'subscribed',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id            TEXT PRIMARY KEY,
      code          TEXT UNIQUE NOT NULL,
      type          TEXT NOT NULL,
      value         REAL NOT NULL,
      min_order     REAL DEFAULT 0,
      max_uses      INTEGER,
      used_count    INTEGER DEFAULT 0,
      valid_from    TEXT NOT NULL,
      valid_until   TEXT,
      is_active     INTEGER DEFAULT 1,
      description   TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS seo_pages (
      id          TEXT PRIMARY KEY,
      page        TEXT UNIQUE NOT NULL,
      title       TEXT,
      description TEXT,
      og_title    TEXT,
      og_desc     TEXT,
      og_image    TEXT,
      canonical   TEXT,
      robots      TEXT DEFAULT 'index,follow',
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      group_name TEXT DEFAULT 'general',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      role         TEXT DEFAULT 'admin',
      avatar       TEXT,
      last_login   TEXT,
      created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id         TEXT PRIMARY KEY,
      admin_id   TEXT,
      action     TEXT NOT NULL,
      resource   TEXT,
      resource_id TEXT,
      detail     TEXT,
      ip         TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id           TEXT PRIMARY KEY,
      customer_id  TEXT NOT NULL,
      product_id   TEXT NOT NULL,
      created_at   TEXT DEFAULT (datetime('now')),
      UNIQUE(customer_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id          TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      name        TEXT NOT NULL,
      street      TEXT NOT NULL,
      city        TEXT NOT NULL,
      state       TEXT,
      zip         TEXT NOT NULL,
      country     TEXT NOT NULL,
      phone       TEXT,
      is_default  INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      rating     INTEGER NOT NULL,
      title      TEXT,
      comment    TEXT,
      helpful    INTEGER DEFAULT 0,
      status     TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart (
      id          TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL UNIQUE,
      items       TEXT NOT NULL DEFAULT '[]',
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      expires     TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reset_tokens (
      token       TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      expires     TEXT NOT NULL,
      used        INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `);

  /* ── Migrations ── */
  migrate(db, "products", ["image_url TEXT","image_url2 TEXT","description TEXT","meta_title TEXT","meta_desc TEXT","og_image TEXT","gallery TEXT DEFAULT '[]'"]);
  migrate(db, "orders",   ["shipping_method TEXT","tracking_number TEXT","notes TEXT","updated_at TEXT DEFAULT (datetime('now'))"]);
  migrate(db, "customers",["country TEXT","total_orders INTEGER DEFAULT 0","total_spend REAL DEFAULT 0","notes TEXT","password_hash TEXT","phone TEXT"]);

  /* ── Seed ── */
  seed(db);
}

function migrate(db: Database.Database, table: string, cols: string[]) {
  const existing = (db.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(c=>c.name);
  for (const col of cols) {
    const name = col.split(" ")[0];
    if (!existing.includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col}`);
  }
}

function seed(db: Database.Database) {
  /* Products */
  if (!(db.prepare("SELECT COUNT(*) as c FROM products").get() as {c:number}).c) {
    seedProducts(db);
  } else {
    /* update images/meta on existing rows */
    for (const p of PRODUCTS) {
      db.prepare("UPDATE products SET image_url=?,image_url2=?,description=?,meta_title=?,meta_desc=? WHERE id=?")
        .run(p.image_url,p.image_url2,p.description,p.meta_title,p.meta_desc,p.id);
    }
  }
  if (!(db.prepare("SELECT COUNT(*) as c FROM customers").get() as {c:number}).c) seedCustomers(db);
  if (!(db.prepare("SELECT COUNT(*) as c FROM orders").get() as {c:number}).c)    seedOrders(db);
  if (!(db.prepare("SELECT COUNT(*) as c FROM promotions").get() as {c:number}).c) seedPromotions(db);
  if (!(db.prepare("SELECT COUNT(*) as c FROM seo_pages").get() as {c:number}).c)  seedSeo(db);
  if (!(db.prepare("SELECT COUNT(*) as c FROM settings").get() as {c:number}).c)   seedSettings(db);
  if (!(db.prepare("SELECT COUNT(*) as c FROM admin_users").get() as {c:number}).c) seedAdmins(db);

  /* Top-up SMTP settings if missing on existing DB */
  const smtpDefaults = [
    ["smtp_host","","smtp"],["smtp_port","587","smtp"],["smtp_user","","smtp"],
    ["smtp_pass","","smtp"],["smtp_from_name","CODEX","smtp"],
    ["smtp_from_email","no-reply@codex-store.com","smtp"],["smtp_secure","false","smtp"],
  ];
  const ins = db.prepare("INSERT OR IGNORE INTO settings (key,value,group_name) VALUES (?,?,?)");
  for (const [k,v,g] of smtpDefaults) ins.run(k,v,g);
}

/* ─────────────────────────── SEED DATA ─────────────────────────── */

const PRODUCTS = [
  { id:"p1",  name:"Oversized Linen Blazer",      slug:"oversized-linen-blazer",      brand:"Studio Co.",      category:"Women", price:189, compare_price:249, color:"#c4a882", stock:45, badge:"Bestseller", is_new:0, rating:4.8, reviews:312, colors:'["#f5f0e8","#2d2d2d","#8b7355"]',
    image_url:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=80&auto=format&fit=crop",
    description:"A contemporary oversized blazer crafted from 100% premium Irish linen.",
    meta_title:"Oversized Linen Blazer — Studio Co. | CODEX",
    meta_desc:"Shop the Oversized Linen Blazer from Studio Co. Premium Irish linen, relaxed silhouette. Free shipping over $150." },
  { id:"p2",  name:"Silk Wrap Midi Dress",         slug:"silk-wrap-midi-dress",         brand:"Lumière",          category:"Women", price:145, compare_price:null, color:"#9a3a5c", stock:23, badge:null, is_new:1, rating:4.9, reviews:486, colors:'["#c5a87b","#1a3a5c","#2d1b1b"]',
    image_url:"https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=80&auto=format&fit=crop",
    description:"Effortlessly elegant silk wrap dress with a fluid midi length.",
    meta_title:"Silk Wrap Midi Dress — Lumière | CODEX",
    meta_desc:"Elegant silk wrap midi dress by Lumière. Available in 3 colours. New season drop — free delivery over $150." },
  { id:"p3",  name:"Tailored Wide-Leg Trousers",   slug:"tailored-wide-leg-trousers",   brand:"Atelier M",        category:"Women", price:98,  compare_price:129, color:"#404040", stock:78, badge:null, is_new:0, rating:4.6, reviews:198, colors:'["#1c1c1c","#6b7280","#f3f0e8"]',
    image_url:"https://images.unsplash.com/photo-1551803091-e20673f15770?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&q=80&auto=format&fit=crop",
    description:"Perfectly tailored wide-leg trousers with a high waist and fluid drape.",
    meta_title:"Tailored Wide-Leg Trousers — Atelier M | CODEX",
    meta_desc:"Premium wide-leg trousers from Atelier M. High waist, fluid drape, available in 3 colours. Was $129." },
  { id:"p4",  name:"Merino Wool Crew Knit",        slug:"merino-wool-crew-knit",        brand:"Nordic Knitwear",  category:"Men",   price:112, compare_price:145, color:"#8b7355", stock:12, badge:"Editor's Pick", is_new:0, rating:4.7, reviews:224, colors:'["#c4a882","#2c3e50","#e8d5b7"]',
    image_url:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900&q=80&auto=format&fit=crop",
    description:"Luxuriously soft merino wool crew neck knit. Lightweight yet warm.",
    meta_title:"Merino Wool Crew Knit — Nordic Knitwear | CODEX",
    meta_desc:"Editor's Pick: Merino Wool Crew Knit from Nordic Knitwear. Ultra-soft, lightweight and warm. Was $145." },
  { id:"p5",  name:"Structured Leather Tote",      slug:"structured-leather-tote",      brand:"Vero Pelle",       category:"Accessories", price:265, compare_price:null, color:"#5c3d1e", stock:6, badge:null, is_new:1, rating:4.9, reviews:167, colors:'["#2d1b0e","#c4a882","#1a1a1a"]',
    image_url:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&q=80&auto=format&fit=crop",
    description:"A structured leather tote crafted from full-grain Italian leather.",
    meta_title:"Structured Leather Tote — Vero Pelle | CODEX",
    meta_desc:"Full-grain Italian leather tote by Vero Pelle. Spacious, elegant, built to last. New season." },
  { id:"p6",  name:"High-Rise Straight Jeans",     slug:"high-rise-straight-jeans",     brand:"Denim House",      category:"Men",   price:89,  compare_price:115, color:"#1e3a5f", stock:89, badge:null, is_new:0, rating:4.5, reviews:543, colors:'["#1e3a5f","#2d2d2d","#8b8b8b"]',
    image_url:"https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1475178626620-a4d074967452?w=900&q=80&auto=format&fit=crop",
    description:"Classic high-rise straight jeans in premium selvedge denim.",
    meta_title:"High-Rise Straight Jeans — Denim House | CODEX",
    meta_desc:"Classic selvedge denim jeans from Denim House. High-rise straight cut. Was $115. Free returns." },
  { id:"p7",  name:"Resort Floral Shirt",           slug:"resort-floral-shirt",           brand:"Tropicana",        category:"Men",   price:75,  compare_price:null, color:"#2d5a3d", stock:34, badge:null, is_new:1, rating:4.4, reviews:89, colors:'["#f0e6d3","#2d5a3d"]',
    image_url:"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1603252109303-2751441dd157?w=900&q=80&auto=format&fit=crop",
    description:"A relaxed resort shirt in a bold floral print.",
    meta_title:"Resort Floral Shirt — Tropicana | CODEX",
    meta_desc:"Bold floral resort shirt by Tropicana. Perfect for warm-weather escapes. New arrival." },
  { id:"p8",  name:"Cashmere Blend Scarf",         slug:"cashmere-blend-scarf",         brand:"Alpine Luxe",      category:"Accessories", price:145, compare_price:195, color:"#8b1a2a", stock:15, badge:"Limited", is_new:0, rating:4.8, reviews:76, colors:'["#c41e3a","#2c3e50","#d4a017"]',
    image_url:"https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1520903920243-1d3e7a3d9c20?w=900&q=80&auto=format&fit=crop",
    description:"A generous cashmere-blend scarf in a classic plaid.",
    meta_title:"Cashmere Blend Scarf — Alpine Luxe | CODEX",
    meta_desc:"Limited edition cashmere-blend scarf by Alpine Luxe. Warm and versatile. Was $195." },
  { id:"p9",  name:"Organic Cotton Maxi Skirt",    slug:"organic-cotton-maxi-skirt",    brand:"Earth Studio",     category:"Women", price:95,  compare_price:null, color:"#2d4a1e", stock:67, badge:null, is_new:1, rating:4.7, reviews:34, colors:'["#f5e6d3","#2d4a1e","#1a1a2e"]',
    image_url:"https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=900&q=80&auto=format&fit=crop",
    description:"A flowing organic cotton maxi skirt. Sustainably made.",
    meta_title:"Organic Cotton Maxi Skirt — Earth Studio | CODEX",
    meta_desc:"Sustainably made organic cotton maxi skirt. Comfortable, ethical fashion. New arrival." },
  { id:"p10", name:"Ribbed Knit Cardigan Set",     slug:"ribbed-knit-cardigan-set",     brand:"Knitwear Lab",     category:"Women", price:155, compare_price:null, color:"#8b7355", stock:19, badge:null, is_new:1, rating:4.9, reviews:19, colors:'["#f5f0e8","#c4a882","#2d2d2d"]',
    image_url:"https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&q=80&auto=format&fit=crop",
    description:"A coordinated ribbed knit set — longline cardigan and matching top.",
    meta_title:"Ribbed Knit Cardigan Set — Knitwear Lab | CODEX",
    meta_desc:"Matching ribbed knit cardigan set by Knitwear Lab. Premium quality, new season drop." },
  { id:"p11", name:"Cropped Trench Coat",          slug:"cropped-trench-coat",          brand:"Studio Co.",       category:"Women", price:285, compare_price:null, color:"#6b5a3e", stock:43, badge:null, is_new:1, rating:4.8, reviews:22, colors:'["#d4c5b0","#1c1c1c"]',
    image_url:"https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=900&q=80&auto=format&fit=crop",
    description:"A modern cropped trench coat. Timeless with a contemporary edge.",
    meta_title:"Cropped Trench Coat — Studio Co. | CODEX",
    meta_desc:"Contemporary cropped trench coat from Studio Co. Classic gabardine, modern cut. New arrival." },
  { id:"p12", name:"Structured Canvas Jacket",    slug:"structured-canvas-jacket",    brand:"Workwear Co",      category:"Men",   price:198, compare_price:240, color:"#4a3728", stock:28, badge:null, is_new:1, rating:4.6, reviews:28, colors:'["#d4c5b0","#2c3e50"]',
    image_url:"https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1520975954732-35dd22299614?w=900&q=80&auto=format&fit=crop",
    description:"A workwear-inspired canvas jacket with brass hardware.",
    meta_title:"Structured Canvas Jacket — Workwear Co | CODEX",
    meta_desc:"Premium canvas jacket from Workwear Co. Brass hardware, reinforced stitching. Was $240." },
  { id:"p13", name:"Kids Rainbow Hoodie",          slug:"kids-rainbow-hoodie",          brand:"Tiny Threads",     category:"Kids",  price:42,  compare_price:55,  color:"#e85d75", stock:60, badge:"Bestseller", is_new:1, rating:4.9, reviews:88, colors:'["#e85d75","#5b9bd5","#f4c430"]',
    image_url:"https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=900&q=80&auto=format&fit=crop",
    description:"Soft organic-cotton hoodie with a cheerful rainbow print. Machine washable.",
    meta_title:"Kids Rainbow Hoodie — Tiny Threads | CODEX",
    meta_desc:"Bright organic-cotton hoodie for kids by Tiny Threads. Soft, durable, machine washable. Was $55." },
  { id:"p14", name:"Boys Denim Overalls",          slug:"boys-denim-overalls",          brand:"Little Rascals",   category:"Kids",  price:38,  compare_price:null, color:"#4a6fa5", stock:45, badge:null, is_new:1, rating:4.7, reviews:52, colors:'["#4a6fa5","#2d2d2d"]',
    image_url:"https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=900&q=80&auto=format&fit=crop",
    description:"Durable denim overalls built for play, with adjustable straps and reinforced knees.",
    meta_title:"Boys Denim Overalls — Little Rascals | CODEX",
    meta_desc:"Tough denim overalls for boys by Little Rascals. Adjustable straps, reinforced knees. Free returns." },
  { id:"p15", name:"Girls Floral Sundress",        slug:"girls-floral-sundress",        brand:"Bloom & Co.",      category:"Kids",  price:34,  compare_price:45,  color:"#f4a6c0", stock:38, badge:null, is_new:0, rating:4.8, reviews:67, colors:'["#f4a6c0","#fff3e0","#a8d5a8"]',
    image_url:"https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=900&q=80&auto=format&fit=crop",
    description:"Breezy floral sundress in lightweight cotton — perfect for warm-weather adventures.",
    meta_title:"Girls Floral Sundress — Bloom & Co. | CODEX",
    meta_desc:"Lightweight cotton floral sundress for girls by Bloom & Co. Breezy and comfortable. Was $45." },
  { id:"p16", name:"Kids Canvas Sneakers",         slug:"kids-canvas-sneakers",         brand:"Hop Skip",         category:"Kids",  price:29,  compare_price:39,  color:"#5b9bd5", stock:72, badge:"Limited", is_new:1, rating:4.6, reviews:41, colors:'["#5b9bd5","#e85d75","#ffffff"]',
    image_url:"https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=900&q=80&auto=format&fit=crop",
    image_url2:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=80&auto=format&fit=crop",
    description:"Easy slip-on canvas sneakers with velcro straps and grippy soles for active little feet.",
    meta_title:"Kids Canvas Sneakers — Hop Skip | CODEX",
    meta_desc:"Velcro canvas sneakers for kids by Hop Skip. Grippy soles, easy on/off. Was $39." },
];

function seedProducts(db: Database.Database) {
  const ins = db.prepare(`INSERT INTO products (id,name,slug,brand,category,price,compare_price,color,image_url,image_url2,stock,badge,is_new,rating,reviews,colors,description,meta_title,meta_desc,status)
    VALUES (@id,@name,@slug,@brand,@category,@price,@compare_price,@color,@image_url,@image_url2,@stock,@badge,@is_new,@rating,@reviews,@colors,@description,@meta_title,@meta_desc,'active')`);
  const many = db.transaction((rows: typeof PRODUCTS) => { for (const r of rows) ins.run(r); });
  many(PRODUCTS);
}

function seedCustomers(db: Database.Database) {
  // sha256("password123") — demo login password for all seeded customers
  const DEMO_HASH = createHash("sha256").update("password123").digest("hex");
  const ins = db.prepare(`INSERT INTO customers (id,first_name,last_name,email,phone,tier,loyalty_pts,country,total_orders,total_spend,password_hash) VALUES (@id,@first_name,@last_name,@email,@phone,@tier,@loyalty_pts,@country,@total_orders,@total_spend,'${DEMO_HASH}')`);
  const rows = [
    {id:"c1",first_name:"Jane",last_name:"Doe",email:"jane.doe@example.com",phone:"+44 7700 900123",tier:"vip",loyalty_pts:2450,country:"UK",total_orders:12,total_spend:2890},
    {id:"c2",first_name:"James",last_name:"Miller",email:"james.miller@example.com",phone:"+1 555 0102",tier:"loyal",loyalty_pts:980,country:"US",total_orders:8,total_spend:1340},
    {id:"c3",first_name:"Sofia",last_name:"Loren",email:"sofia.l@example.com",phone:"+39 02 1234567",tier:"regular",loyalty_pts:120,country:"IT",total_orders:3,total_spend:445},
    {id:"c4",first_name:"Ahmed",last_name:"Hassan",email:"ahmed.h@example.com",phone:"+966 50 123 4567",tier:"vip",loyalty_pts:4200,country:"SA",total_orders:15,total_spend:4200},
    {id:"c5",first_name:"Mei",last_name:"Zhang",email:"mei.zhang@example.com",phone:"+86 138 0013 8000",tier:"regular",loyalty_pts:340,country:"CN",total_orders:6,total_spend:880},
    {id:"c6",first_name:"Emma",last_name:"Thompson",email:"emma.t@example.com",phone:"+44 7911 123456",tier:"new",loyalty_pts:0,country:"UK",total_orders:1,total_spend:145},
    {id:"c7",first_name:"Lucas",last_name:"Martin",email:"lucas.m@example.com",phone:"+33 6 12 34 56 78",tier:"loyal",loyalty_pts:760,country:"FR",total_orders:9,total_spend:1760},
    {id:"c8",first_name:"Aisha",last_name:"Patel",email:"aisha.p@example.com",phone:"+91 98765 43210",tier:"regular",loyalty_pts:230,country:"IN",total_orders:4,total_spend:630},
  ];
  db.transaction((r: typeof rows) => { for (const x of r) ins.run(x); })(rows);
}

function seedOrders(db: Database.Database) {
  const ins = db.prepare(`INSERT INTO orders (id,order_number,customer_name,customer_email,status,payment_status,subtotal,shipping,tax,total,items,shipping_method,created_at,updated_at) VALUES (@id,@order_number,@customer_name,@customer_email,@status,@payment_status,@subtotal,@shipping,@tax,@total,@items,@shipping_method,@created_at,@created_at)`);
  const rows = [
    {id:"o1",order_number:"COD-2026-78432",customer_name:"Jane Doe",customer_email:"jane.doe@example.com",status:"processing",payment_status:"paid",subtotal:577,shipping:0,tax:0,total:577,items:'[{"name":"Oversized Linen Blazer","qty":1,"price":189,"image":"https://picsum.photos/seed/codex25/600/750"},{"name":"Silk Wrap Midi Dress","qty":2,"price":290},{"name":"Wide-Leg Trousers","qty":1,"price":98}]',shipping_method:"Standard",created_at:"2026-06-05 14:32:00"},
    {id:"o2",order_number:"COD-2026-78431",customer_name:"James Miller",customer_email:"james.miller@example.com",status:"confirmed",payment_status:"paid",subtotal:189,shipping:0,tax:0,total:189,items:'[{"name":"Merino Wool Crew Knit","qty":1,"price":189}]',shipping_method:"Express",created_at:"2026-06-05 14:10:00"},
    {id:"o3",order_number:"COD-2026-78430",customer_name:"Sofia Loren",customer_email:"sofia.l@example.com",status:"shipped",payment_status:"paid",subtotal:892,shipping:12.95,tax:0,total:904.95,items:'[{"name":"Cropped Trench Coat","qty":1,"price":285},{"name":"Leather Tote","qty":2,"price":530}]',shipping_method:"Standard",created_at:"2026-06-04 09:22:00"},
    {id:"o4",order_number:"COD-2026-71891",customer_name:"Jane Doe",customer_email:"jane.doe@example.com",status:"delivered",payment_status:"paid",subtotal:145,shipping:0,tax:0,total:145,items:'[{"name":"Cashmere Blend Scarf","qty":1,"price":145}]',shipping_method:"Standard",created_at:"2026-05-18 11:00:00"},
    {id:"o5",order_number:"COD-2026-64320",customer_name:"Ahmed Hassan",customer_email:"ahmed.h@example.com",status:"delivered",payment_status:"paid",subtotal:244,shipping:0,tax:0,total:244,items:'[{"name":"Resort Floral Shirt","qty":1,"price":75},{"name":"High-Rise Jeans","qty":1,"price":169}]',shipping_method:"Express",created_at:"2026-05-03 16:45:00"},
    {id:"o6",order_number:"COD-2026-58102",customer_name:"Lucas Martin",customer_email:"lucas.m@example.com",status:"delivered",payment_status:"paid",subtotal:442,shipping:0,tax:0,total:442,items:'[{"name":"Linen Blazer","qty":1,"price":189},{"name":"Canvas Jacket","qty":1,"price":198},{"name":"Ribbed Cardigan","qty":1,"price":155}]',shipping_method:"Standard",created_at:"2026-04-14 08:30:00"},
    {id:"o7",order_number:"COD-2026-49871",customer_name:"Mei Zhang",customer_email:"mei.zhang@example.com",status:"returned",payment_status:"refunded",subtotal:118,shipping:0,tax:0,total:118,items:'[{"name":"Silk Wrap Dress","qty":1,"price":118}]',shipping_method:"Standard",created_at:"2026-03-28 16:45:00"},
    {id:"o8",order_number:"COD-2026-41230",customer_name:"Aisha Patel",customer_email:"aisha.p@example.com",status:"delivered",payment_status:"paid",subtotal:375,shipping:0,tax:0,total:375,items:'[{"name":"Leather Tote","qty":1,"price":265},{"name":"Cashmere Scarf","qty":1,"price":110}]',shipping_method:"Express",created_at:"2026-03-10 12:00:00"},
  ];
  db.transaction((r: typeof rows) => { for (const x of r) ins.run(x); })(rows);
}

function seedPromotions(db: Database.Database) {
  const ins = db.prepare(`INSERT INTO promotions (id,code,type,value,min_order,max_uses,used_count,valid_from,valid_until,is_active,description) VALUES (@id,@code,@type,@value,@min_order,@max_uses,@used_count,@valid_from,@valid_until,@is_active,@description)`);
  const rows = [
    {id:"pr1",code:"WELCOME10",type:"percentage",value:10,min_order:0,max_uses:null,used_count:284,valid_from:"2026-01-01",valid_until:null,is_active:1,description:"10% off for new customers"},
    {id:"pr2",code:"SUMMER25",type:"percentage",value:25,min_order:150,max_uses:500,used_count:312,valid_from:"2026-06-01",valid_until:"2026-08-31",is_active:1,description:"Summer sale — 25% off orders over $150"},
    {id:"pr3",code:"FREESHIP",type:"free_shipping",value:0,min_order:0,max_uses:null,used_count:891,valid_from:"2026-01-01",valid_until:"2026-12-31",is_active:1,description:"Free shipping on any order"},
    {id:"pr4",code:"VIP50",type:"fixed",value:50,min_order:300,max_uses:100,used_count:67,valid_from:"2026-05-01",valid_until:"2026-07-01",is_active:1,description:"VIP customers — $50 off orders over $300"},
    {id:"pr5",code:"FLASH30",type:"percentage",value:30,min_order:100,max_uses:200,used_count:200,valid_from:"2026-05-15",valid_until:"2026-05-16",is_active:0,description:"24h flash sale — 30% off"},
  ];
  db.transaction((r: typeof rows) => { for (const x of r) ins.run(x); })(rows);
}

function seedSeo(db: Database.Database) {
  const ins = db.prepare(`INSERT INTO seo_pages (id,page,title,description,og_title,og_desc,robots) VALUES (@id,@page,@title,@description,@og_title,@og_desc,@robots)`);
  const rows = [
    {id:"seo1",page:"/",title:"CODEX — Wear the World | Premium Global Fashion",description:"Premium international clothing. Shop women, men and kids fashion from top global brands. Free shipping over $150.",og_title:"CODEX — Wear the World",og_desc:"Premium global fashion for everyone.",robots:"index,follow"},
    {id:"seo2",page:"/sale",title:"Sale — Up to 70% Off | CODEX",description:"Shop the CODEX mid-season sale. Hundreds of premium styles reduced by up to 70%. Limited time.",og_title:"CODEX Sale — Up to 70% Off",og_desc:"Mid-season sale now on.",robots:"index,follow"},
    {id:"seo3",page:"/new-arrivals",title:"New Arrivals | CODEX",description:"Discover the latest additions to the CODEX edit. Fresh styles updated weekly.",og_title:"New Arrivals — CODEX",og_desc:"The latest drops from CODEX.",robots:"index,follow"},
    {id:"seo4",page:"/category/women",title:"Women's Fashion | CODEX",description:"Shop women's clothing at CODEX. Dresses, blazers, trousers and more from the world's finest brands.",og_title:"Women's Fashion — CODEX",og_desc:"Premium women's clothing.",robots:"index,follow"},
    {id:"seo5",page:"/category/men",title:"Men's Fashion | CODEX",description:"Shop men's clothing at CODEX. Shirts, jackets, trousers and more.",og_title:"Men's Fashion — CODEX",og_desc:"Premium men's clothing.",robots:"index,follow"},
  ];
  db.transaction((r: typeof rows) => { for (const x of r) ins.run(x); })(rows);
}

function seedSettings(db: Database.Database) {
  const ins = db.prepare(`INSERT INTO settings (key,value,group_name) VALUES (@key,@value,@group_name)`);
  const rows = [
    {key:"store_name",value:"CODEX",group_name:"general"},
    {key:"store_email",value:"hello@codex-store.com",group_name:"general"},
    {key:"store_phone",value:"+44 20 1234 5678",group_name:"general"},
    {key:"store_address",value:"12 Fashion Street, London, EC1A 1BB",group_name:"general"},
    {key:"currency",value:"USD",group_name:"general"},
    {key:"free_shipping_threshold",value:"150",group_name:"shipping"},
    {key:"express_shipping_price",value:"12.95",group_name:"shipping"},
    {key:"overnight_shipping_price",value:"24.95",group_name:"shipping"},
    {key:"tax_rate",value:"0",group_name:"tax"},
    {key:"low_stock_alert",value:"10",group_name:"inventory"},
    {key:"meta_title",value:"CODEX — Wear the World",group_name:"seo"},
    {key:"meta_desc",value:"Premium international clothing eCommerce.",group_name:"seo"},
    {key:"og_image",value:"/og-image.jpg",group_name:"seo"},
    {key:"google_analytics",value:"",group_name:"integrations"},
    {key:"facebook_pixel",value:"",group_name:"integrations"},
    {key:"stripe_pk",value:"pk_test_...",group_name:"integrations"},
    {key:"maintenance_mode",value:"false",group_name:"advanced"},
    {key:"reviews_enabled",value:"true",group_name:"advanced"},
    {key:"smtp_host",value:"",group_name:"smtp"},
    {key:"smtp_port",value:"587",group_name:"smtp"},
    {key:"smtp_user",value:"",group_name:"smtp"},
    {key:"smtp_pass",value:"",group_name:"smtp"},
    {key:"smtp_from_name",value:"CODEX",group_name:"smtp"},
    {key:"smtp_from_email",value:"no-reply@codex-store.com",group_name:"smtp"},
    {key:"smtp_secure",value:"false",group_name:"smtp"},
  ];
  db.transaction((r: typeof rows) => { for (const x of r) ins.run(x); })(rows);
}

function seedAdmins(db: Database.Database) {
  // password: "admin123" (plain for demo — in prod use bcrypt)
  db.prepare(`INSERT INTO admin_users (id,name,email,password,role,avatar) VALUES ('adm1','Aquib','admin@codex.com','admin123','super_admin',null)`).run();
}
