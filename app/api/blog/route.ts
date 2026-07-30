import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

const SEED_ARTICLES = [
  {
    id: "b_101",
    title: "The Ultimate Guide to Capsule Wardrobe Essentials for 2026",
    slug: "ultimate-capsule-wardrobe-guide-2026",
    author: "Elena Rostova",
    category: "Fashion Guides",
    tags: "capsule wardrobe, luxury, style, minimal",
    featured_image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop",
    excerpt: "Simplify your morning routine with 12 timeless, interchangeable luxury pieces that work effortlessly for any occasion.",
    content: "<p>Building a functional, high-end capsule wardrobe isn't about owning less — it's about owning better. In 2026, the focus has shifted toward hyper-quality fabrics, versatile tailoring, and neutral palettes that flow effortlessly from casual mornings to evening dinners.</p><h2>1. The Sculpted Overcoat</h2><p>Invest in an overcoat with structure. Look for double-faced wool or heavy cashmere blends in camel, charcoal, or deep espresso.</p>",
    status: "published",
    read_time: 6,
    meta_title: "The Ultimate Guide to Capsule Wardrobe Essentials | E-shop",
    meta_desc: "Simplify your morning routine with 12 timeless, interchangeable luxury fashion pieces.",
    meta_keywords: "capsule wardrobe, fashion guide, luxury apparel"
  },
  {
    id: "b_102",
    title: "Tokyo Streetwear Culture: The Rise of Minimalist Outerwear",
    slug: "tokyo-streetwear-minimalist-outerwear",
    author: "Marcus Vance",
    category: "Streetwear Trends",
    tags: "tokyo, streetwear, harajuku, coats",
    featured_image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85&auto=format&fit=crop",
    excerpt: "Inside the Harajuku underground scene: How oversized coats and technical fabrics are shaping the future of global fashion.",
    content: "<p>Tokyo remains the world center for avant-garde streetwear. From Harajuku back alleys to Ginza flagship stores, Japanese designers are redefining outerwear with dramatic proportions and waterproof technical textiles.</p>",
    status: "published",
    read_time: 8,
    meta_title: "Tokyo Streetwear Culture: Minimalist Outerwear Trends | E-shop",
    meta_desc: "Explore Harajuku streetwear culture and how technical outerwear is leading global fashion.",
    meta_keywords: "tokyo streetwear, harajuku fashion, technical outerwear"
  },
  {
    id: "b_103",
    title: "How to Style Statement Blazers: From Desk to Dinner",
    slug: "how-to-style-statement-blazers",
    author: "Sophia Chen",
    category: "Styling Tips",
    tags: "blazers, tailoring, workwear, styling",
    featured_image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85&auto=format&fit=crop",
    excerpt: "Master the art of tailoring. Learn how to pair structured blazers with relaxed denim and bold accessories for a flawless look.",
    content: "<p>A well-tailored blazer is the ultimate power garment. Pair an oversized double-breasted blazer with selvedge denim for daytime sophistication, or swap for tailored trousers and gold jewelry for evening cocktails.</p>",
    status: "published",
    read_time: 5,
    meta_title: "How to Style Statement Blazers: Desk to Dinner Guide | E-shop",
    meta_desc: "Master statement blazers with versatile styling tips for work, dinners, and events.",
    meta_keywords: "statement blazers, tailoring, women fashion"
  },
  {
    id: "b_104",
    title: "Behind the Brand: Sustainable Luxury & Ethical Fabrics",
    slug: "behind-the-brand-sustainable-luxury",
    author: "E-shop Editorial",
    category: "Brand News",
    tags: "sustainability, organic cotton, ethical, brand",
    featured_image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=85&auto=format&fit=crop",
    excerpt: "A deep dive into eco-friendly organic cottons, recycled cashmere, and responsible manufacturing practices across our collections.",
    content: "<p>We believe fashion should look extraordinary without sacrificing environmental responsibility. Explore our commitment to GOTS-certified organic cotton, closed-loop dyeing processes, and zero-waste packaging.</p>",
    status: "published",
    read_time: 7,
    meta_title: "Sustainable Luxury & Ethical Fabrics | E-shop Journal",
    meta_desc: "Learn how E-shop leads in eco-friendly organic cottons and responsible fashion.",
    meta_keywords: "sustainable luxury, ethical fashion, organic cotton"
  }
];

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = new URL(req.url).searchParams;

    const category = sp.get("category");
    const q        = sp.get("q");
    const status   = sp.get("status"); // default 'published' for public, '' for admin
    const limit    = Number(sp.get("limit") ?? 20);
    const offset   = Number(sp.get("offset") ?? 0);

    // Auto-seed initial blog posts if table is empty
    const checkCount = ((await db.execute("SELECT COUNT(*) as c FROM blog_posts")).rows[0] as unknown as { c: number })?.c ?? 0;
    if (checkCount === 0) {
      for (const a of SEED_ARTICLES) {
        await db.execute({
          sql: `INSERT INTO blog_posts (id, title, slug, author, category, tags, featured_image, excerpt, content, status, read_time, meta_title, meta_desc, meta_keywords)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [a.id, a.title, a.slug, a.author, a.category, a.tags, a.featured_image, a.excerpt, a.content, a.status, a.read_time, a.meta_title, a.meta_desc, a.meta_keywords]
        }).catch(() => {});
      }
    }

    const where: string[] = [];
    const params: any[] = [];

    if (status !== null && status !== "") {
      where.push("status = ?");
      params.push(status);
    }

    if (category && category !== "all") {
      where.push("LOWER(category) = LOWER(?)");
      params.push(category);
    }

    if (q) {
      where.push("(LOWER(title) LIKE LOWER(?) OR LOWER(content) LIKE LOWER(?) OR LOWER(excerpt) LIKE LOWER(?))");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `SELECT * FROM blog_posts ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const countSql = `SELECT COUNT(*) as c FROM blog_posts ${whereSql}`;

    const posts = (await db.execute({ sql, args: [...params, limit, offset] })).rows;
    const total = ((await db.execute({ sql: countSql, args: [...params] })).rows[0] as unknown as { c: number })?.c ?? 0;

    return NextResponse.json({ posts, total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const id = `b_${Date.now()}`;
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const readTime = Math.max(1, Math.ceil(body.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length / 200));

    await db.execute({
      sql: `INSERT INTO blog_posts (
        id, title, slug, author, category, tags, featured_image, excerpt, content, status, read_time, meta_title, meta_desc, meta_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.title,
        slug,
        body.author || "E-shop Editorial",
        body.category || "Fashion Guides",
        body.tags || "",
        body.featured_image || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop",
        body.excerpt || body.title,
        body.content,
        body.status || "published",
        readTime,
        body.meta_title || body.title,
        body.meta_desc || body.excerpt || body.title,
        body.meta_keywords || ""
      ]
    });

    return NextResponse.json({ id, slug }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
