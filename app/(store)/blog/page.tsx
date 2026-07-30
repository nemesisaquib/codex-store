import Link from "next/link";
import Image from "next/image";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { Clock, User, ArrowUpRight, Search, Sparkles, BookOpen } from "lucide-react";
import { getDb } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Blog & Fashion Style Guides | E-shop",
  description: "Explore the latest international fashion trends, streetwear drops, style guides, and luxury lookbooks curated by the E-shop editorial team.",
  openGraph: {
    title: "Editorial Blog & Fashion Style Guides | E-shop",
    description: "Explore international fashion trends, style guides, and luxury lookbooks.",
  }
};

const CATEGORIES = ["All", "Fashion Guides", "Streetwear Trends", "Lookbooks", "Brand News", "Styling Tips"];

// Pre-seeded high-quality editorial articles if database is starting fresh
const SEEDED_POSTS = [
  {
    id: "b_1",
    title: "The Ultimate Guide to Capsule Wardrobe Essentials for 2026",
    slug: "ultimate-capsule-wardrobe-guide-2026",
    author: "Elena Rostova",
    category: "Fashion Guides",
    featured_image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop",
    excerpt: "Simplify your morning routine with 12 timeless, interchangeable luxury pieces that work effortlessly for any occasion.",
    read_time: 6,
    created_at: new Date().toISOString()
  },
  {
    id: "b_2",
    title: "Tokyo Streetwear Culture: The Rise of Minimalist Outerwear",
    slug: "tokyo-streetwear-minimalist-outerwear",
    author: "Marcus Vance",
    category: "Streetwear Trends",
    featured_image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85&auto=format&fit=crop",
    excerpt: "Inside the Harajuku underground scene: How oversized coats and technical fabrics are shaping the future of global fashion.",
    read_time: 8,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "b_3",
    title: "How to Style Statement Blazers: From Desk to Dinner",
    slug: "how-to-style-statement-blazers",
    author: "Sophia Chen",
    category: "Styling Tips",
    featured_image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85&auto=format&fit=crop",
    excerpt: "Master the art of tailoring. Learn how to pair structured blazers with relaxed denim and bold accessories for a flawless look.",
    read_time: 5,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "b_4",
    title: "Behind the Brand: Sustainable Luxury & Ethical Fabrics",
    slug: "behind-the-brand-sustainable-luxury",
    author: "E-shop Editorial",
    category: "Brand News",
    featured_image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=85&auto=format&fit=crop",
    excerpt: "A deep dive into eco-friendly organic cottons, recycled cashmere, and responsible manufacturing practices across our collections.",
    read_time: 7,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

export default async function StorefrontBlogPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const sp = await searchParams;
  const activeCategory = sp.category || "All";
  const searchQuery = sp.q || "";

  let posts: any[] = [];
  try {
    const db = getDb();
    let sql = "SELECT id, title, slug, author, category, featured_image, excerpt, read_time, created_at FROM blog_posts WHERE status = 'published'";
    const params: any[] = [];

    if (activeCategory !== "All") {
      sql += " AND LOWER(category) = LOWER(?)";
      params.push(activeCategory);
    }
    if (searchQuery) {
      sql += " AND (LOWER(title) LIKE LOWER(?) OR LOWER(excerpt) LIKE LOWER(?))";
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    sql += " ORDER BY created_at DESC LIMIT 20";

    const rows = (await db.execute({ sql, args: params })).rows as unknown as any[];
    posts = rows.length ? rows : SEEDED_POSTS;
  } catch {
    posts = SEEDED_POSTS;
  }

  const heroPost = posts[0] || SEEDED_POSTS[0];
  const gridPosts = posts.length > 1 ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px] text-neutral-900 dark:text-neutral-50">
      {/* Editorial Header */}
      <section className="bg-neutral-950 text-white py-16 md:py-20 relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e02020_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e02020] mb-3">
            <BookOpen size={16} /> E-shop Journal & Lookbooks
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl leading-tight max-w-3xl">
            Style Guides, Runway Trends & Editorial Stories
          </h1>
          <p className="text-neutral-400 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
            Curated articles on global fashion, wardrobe essentials, streetwear culture, and designer spotlights.
          </p>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
        {/* Category Navigation Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 mb-12">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={cat === "All" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-[#e02020] text-white shadow-lg shadow-[#e02020]/20"
                    : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Hero Featured Article */}
        {heroPost && activeCategory === "All" && !searchQuery && (
          <div className="mb-16">
            <Link href={`/blog/${heroPost.slug}`} className="group grid lg:grid-cols-12 gap-8 items-center bg-neutral-50 dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 p-4 md:p-6 hover:shadow-2xl transition-all duration-500">
              <div className="lg:col-span-7 aspect-[16/10] md:aspect-[16/9] relative rounded-2xl overflow-hidden">
                <img
                  src={getOptimizedImageUrl(heroPost.featured_image, { width: 1400, quality: 90 })}
                  alt={heroPost.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-4 left-4 bg-neutral-900/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Featured Article
                </span>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between p-2 md:p-6 space-y-4">
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <span className="text-[#e02020] font-bold uppercase tracking-wider">{heroPost.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {heroPost.read_time || 5} min read</span>
                </div>

                <h2 className="font-display font-bold text-2xl md:text-3xl text-neutral-900 dark:text-white group-hover:text-[#e02020] transition-colors leading-tight">
                  {heroPost.title}
                </h2>

                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed line-clamp-3">
                  {heroPost.excerpt}
                </p>

                <div className="pt-4 flex items-center justify-between border-t border-neutral-200/70 dark:border-neutral-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <User size={14} className="text-[#e02020]" /> {heroPost.author}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center group-hover:bg-[#e02020] dark:group-hover:bg-[#e02020] dark:group-hover:text-white transition-all">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Article Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gridPosts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between">
              <div>
                <div className="aspect-[16/10] relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={getOptimizedImageUrl(post.featured_image, { width: 800, quality: 85 })}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md text-neutral-900 dark:text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {post.category}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <Clock size={12} /> {post.read_time || 5} min read
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white group-hover:text-[#e02020] transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/80 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <span className="flex items-center gap-1.5"><User size={13} className="text-[#e02020]" /> {post.author}</span>
                <span className="text-[#e02020] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-bold">Read More →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
