import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDb } from "@/lib/db";

export const metadata = {
  title: "Categories | E-shop",
  description: "Browse all collections and categories.",
};

export default async function CategoriesPage() {
  const db = getDb();
  // Fetch only active categories
  const res = await db.execute("SELECT * FROM categories WHERE is_active = 1 AND parent_id IS NULL ORDER BY display_order ASC, name ASC");
  const categories = res.rows as any[];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="mb-16">
          <h1 className="font-display font-bold text-4xl md:text-6xl text-neutral-900 dark:text-white mb-6">
            Explore <br />
            <span className="text-[#e02020] italic">Collections</span>
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-xl text-lg">
            Dive into our curated categories. From the latest tech gadgets to high-end fashion, find exactly what fits your style and lifestyle.
          </p>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] gap-6">
          {categories.map((cat, idx) => {
            // Create a dynamic masonry-like pattern for colSpan and rowSpan based on index
            const isLarge = idx % 5 === 0;
            const isTall = idx % 5 === 2;
            const colSpan = isLarge ? "col-span-1 md:col-span-2" : "col-span-1";
            const rowSpan = isTall || isLarge ? "row-span-2" : "row-span-1";
            const imageUrl = cat.image_url || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80";

            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`group relative overflow-hidden rounded-3xl block ${colSpan} ${rowSpan}`}
              >
                <img
                  src={imageUrl}
                  alt={cat.name}
                  loading={idx < 3 ? "eager" : "lazy"}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                
                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <h3 className="font-display font-bold text-3xl md:text-4xl text-white mb-2">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-2 text-white/80 font-medium text-sm translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    View Collection <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
          {categories.length === 0 && (
            <div className="col-span-full py-20 text-center text-neutral-500">
              No categories found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
