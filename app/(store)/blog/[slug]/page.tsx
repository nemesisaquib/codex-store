import Link from "next/link";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { Clock, User, ArrowLeft, Share2, Bookmark, Check, Sparkles, BookOpen } from "lucide-react";
import { getDb } from "@/lib/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const db = getDb();
    const post = (await db.execute({ sql: "SELECT * FROM blog_posts WHERE slug=?", args: [slug] })).rows[0] as unknown as any;
    if (!post) return { title: "Article Not Found | E-shop Blog" };

    return {
      title: post.meta_title || `${post.title} | E-shop Fashion Blog`,
      description: post.meta_desc || post.excerpt,
      keywords: post.meta_keywords || "fashion, style guide, apparel, e-shop",
      openGraph: {
        title: post.meta_title || post.title,
        description: post.meta_desc || post.excerpt,
        images: [{ url: post.featured_image }],
      }
    };
  } catch {
    return { title: "E-shop Fashion Blog" };
  }
}

export default async function SingleBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post: any = null;
  let relatedPosts: any[] = [];

  try {
    const db = getDb();
    post = (await db.execute({ sql: "SELECT * FROM blog_posts WHERE slug=? OR id=?", args: [slug, slug] })).rows[0] as unknown as any;
    if (post) {
      relatedPosts = (await db.execute({
        sql: "SELECT id, title, slug, category, featured_image, read_time, created_at FROM blog_posts WHERE id != ? LIMIT 3",
        args: [post.id]
      })).rows as unknown as any[];

      // Increment view counter
      db.execute({ sql: "UPDATE blog_posts SET views = views + 1 WHERE id=?", args: [post.id] }).catch(() => {});
    }
  } catch {}

  // Fallback pre-seeded article
  if (!post) {
    if (slug === "ultimate-capsule-wardrobe-guide-2026") {
      post = {
        id: "b_1",
        title: "The Ultimate Guide to Capsule Wardrobe Essentials for 2026",
        slug: "ultimate-capsule-wardrobe-guide-2026",
        author: "Elena Rostova",
        category: "Fashion Guides",
        featured_image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop",
        excerpt: "Simplify your morning routine with 12 timeless, interchangeable luxury pieces that work effortlessly for any occasion.",
        content: `
          <p class="lead">Building a functional, high-end capsule wardrobe isn't about owning less — it's about owning better. In 2026, the focus has shifted toward hyper-quality fabrics, versatile tailoring, and neutral palettes that flow effortlessly from casual mornings to evening dinners.</p>

          <h2>1. The Sculpted Overcoat</h2>
          <p>Invest in an overcoat with structure. Look for double-faced wool or heavy cashmere blends in camel, charcoal, or deep espresso. A sharp shoulder silhouette anchors any outfit underneath, whether you're wearing a silk blouse or a relaxed knit hoodie.</p>

          <h2>2. Premium Heavyweight Cotton Tees</h2>
          <p>The foundation of off-duty elegance. Choose 220GSM+ organic cotton t-shirts in optic white and midnight black. The heavier weight ensures the collar maintains its crisp shape after repeated wear and washing.</p>

          <h2>3. Tailored Wide-Leg Trousers</h2>
          <p>Ditch rigid denim for high-waisted, pleated trousers. Fluid drape fabrics create elongated proportions while delivering unmatched comfort throughout the day.</p>

          <blockquote>
            "True luxury lies in ease and proportion. When your clothes fit perfectly and feel remarkable against your skin, confidence follows naturally."
          </blockquote>

          <h2>4. Timeless Footwear Pairings</h2>
          <p>Limit your core footwear to three essential silhouettes: a minimal leather sneaker, a refined Chelsea boot, and a classic loafer. Quality leather construction ensures longevity and graceful aging over time.</p>
        `,
        read_time: 6,
        created_at: new Date().toISOString()
      };
    } else {
      notFound();
    }
  }

  return (
    <article className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px] text-neutral-900 dark:text-neutral-50">
      {/* Google JSON-LD BlogPosting Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "image": [post.featured_image],
            "datePublished": post.created_at,
            "author": { "@type": "Person", "name": post.author },
            "publisher": { "@type": "Organization", "name": "E-shop", "logo": { "@type": "ImageObject", "url": "https://eshop.com/Logo/Eshop.png" } },
            "description": post.excerpt || post.title
          })
        }}
      />

      <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-10">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-[#e02020] transition-colors mb-8 uppercase tracking-wider">
          <ArrowLeft size={14} /> Back to Journal
        </Link>

        {/* Article Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="bg-red-50 dark:bg-red-950/40 text-[#e02020] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {post.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {post.read_time || 5} min read</span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>

          <h1 className="font-display font-black text-3xl md:text-5xl text-neutral-900 dark:text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e02020] text-white font-bold flex items-center justify-center text-sm shadow-md shadow-[#e02020]/20">
                {post.author ? post.author.charAt(0) : "E"}
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">{post.author}</p>
                <p className="text-[10px] text-neutral-400">Senior Fashion Contributor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Featured Image */}
        <div className="aspect-[16/9] rounded-3xl overflow-hidden mb-12 shadow-2xl relative bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <img
            src={getOptimizedImageUrl(post.featured_image, { width: 1400, quality: 90 })}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Body */}
        <div
          className="prose dark:prose-invert prose-neutral max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-base prose-p:leading-relaxed prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-blockquote:border-l-4 prose-blockquote:border-[#e02020] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-lg prose-blockquote:my-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer Share & Tag Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tags:</span>
            {(post.tags || "fashion, style guide, luxury").split(",").map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full text-xs font-medium">
                #{tag.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="font-display font-bold text-2xl mb-8 text-neutral-900 dark:text-white">Related Stories</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map(r => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group bg-neutral-50 dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 p-4 hover:shadow-lg transition-all">
                  <div className="aspect-[16/10] relative rounded-xl overflow-hidden mb-3">
                    <img src={getOptimizedImageUrl(r.featured_image, { width: 600 })} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <p className="text-[10px] text-[#e02020] font-bold uppercase tracking-wider">{r.category}</p>
                  <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-white group-hover:text-[#e02020] transition-colors line-clamp-2 mt-1">
                    {r.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
