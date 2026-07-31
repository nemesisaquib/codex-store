"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  children?: any[];
}

export default function CategoryStrip() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    fetch("/api/categories?format=tree")
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const fallbackImages = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800&h=1000",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800&h=1000",
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800&h=1000",
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800&h=1000",
    "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=800&h=1000",
    "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800&h=1000"
  ];

  const displayList = categories.filter((c: any) => c.is_active !== 0).slice(0, 4);

  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20">
      {/* Section header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[#e02020] text-xs font-bold tracking-widest uppercase mb-2">
            Shop by Category
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white">
            Find your style
          </h2>
        </div>
        <Link
          href="/category/all"
          className="hidden md:flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-[#e02020] transition-colors"
        >
          All categories <ArrowRight size={15} />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {displayList.map((cat, idx) => {
          const img = cat.image_url || fallbackImages[idx % fallbackImages.length];
          const subCount = cat.children?.length || 0;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative h-[380px] md:h-[460px] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end p-6 md:p-8"
            >
              {/* Background Image */}
              <img
                src={img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300" />

              {/* Content */}
              <div className="relative z-10 text-white">
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/80 mb-1 block">
                  {subCount > 0 ? `${subCount} Subcategories` : "Explore Collection"}
                </span>
                <h3 className="font-display font-bold text-2xl md:text-3xl mb-4 group-hover:translate-x-1 transition-transform">
                  {cat.name}
                </h3>

                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-[#e02020] pb-1 group-hover:border-white transition-colors">
                  Shop Now <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
