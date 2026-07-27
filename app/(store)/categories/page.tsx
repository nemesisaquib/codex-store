import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Categories | E-shop",
  description: "Browse all collections and categories.",
};

const allCategories = [
  { name: "Electronics", slug: "electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80", colSpan: "col-span-1 md:col-span-2", rowSpan: "row-span-1" },
  { name: "Jewelry", slug: "jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80", colSpan: "col-span-1", rowSpan: "row-span-1" },
  { name: "Men's Fashion", slug: "mens", image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=800&q=80", colSpan: "col-span-1", rowSpan: "row-span-2" },
  { name: "Women's Fashion", slug: "womens", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80", colSpan: "col-span-1 md:col-span-2", rowSpan: "row-span-2" },
  { name: "Beauty & Health", slug: "beauty", image: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800&q=80", colSpan: "col-span-1", rowSpan: "row-span-1" },
  { name: "Home & Decor", slug: "furniture", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80", colSpan: "col-span-1 md:col-span-2", rowSpan: "row-span-1" },
  { name: "Groceries", slug: "groceries", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", colSpan: "col-span-1", rowSpan: "row-span-1" },
];

export default function CategoriesPage() {
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
          {allCategories.map((cat, idx) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`group relative overflow-hidden rounded-3xl block ${cat.colSpan} ${cat.rowSpan}`}
            >
              <img
                src={cat.image}
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
          ))}
        </div>
      </div>
    </div>
  );
}
