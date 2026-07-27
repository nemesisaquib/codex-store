"use client";
import Link from "next/link";
import { ArrowRight, Laptop, Gem, Shirt, Sparkles, Heart, Home } from "lucide-react";

const browseCategories = [
  {
    name: "Electronics",
    href: "/category/electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&h=1000&q=80",
    icon: Laptop,
    count: "1,200+ Products",
  },
  {
    name: "Jewelry & Watches",
    href: "/category/jewelry",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&h=1000&q=80",
    icon: Gem,
    count: "850+ Products",
  },
  {
    name: "Men's Fashion",
    href: "/category/mens",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=800&h=1000&q=80",
    icon: Shirt,
    count: "4,300+ Products",
  },
  {
    name: "Women's Fashion",
    href: "/category/womens",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&h=1000&q=80",
    icon: Sparkles,
    count: "6,100+ Products",
  },
  {
    name: "Beauty & Wellness",
    href: "/category/beauty",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&h=1000&q=80",
    icon: Heart,
    count: "2,400+ Products",
  },
  {
    name: "Home & Living",
    href: "/category/furniture",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&h=1000&q=80",
    icon: Home,
    count: "1,900+ Products",
  },
];

export default function BrandStory() {
  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#e02020] uppercase mb-2">Discover More</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white tracking-tight">
            Explore Collections
          </h2>
        </div>
        <Link
          href="/category/all"
          className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group"
        >
          View all categories <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
        {browseCategories.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <Link
              key={cat.name}
              href={cat.href}
              className="group flex flex-col gap-3 block"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-sm border border-neutral-200/70 dark:border-neutral-800">
                <img 
                  src={cat.image} 
                  alt={cat.name}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Floating Glass Icon Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="w-8 h-8 rounded-full bg-white/85 dark:bg-black/60 backdrop-blur-md border border-white/50 flex items-center justify-center text-neutral-900 dark:text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <IconComponent size={15} />
                  </div>
                </div>
              </div>

              {/* Text Info Below Image for 100% Perfect UX & Legibility */}
              <div className="flex flex-col gap-0.5 px-0.5">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  {cat.count}
                </span>
                <h3 className="font-sans font-bold text-sm md:text-base tracking-tight text-neutral-900 dark:text-white group-hover:text-[#e02020] transition-colors leading-tight">
                  {cat.name}
                </h3>
                <div className="flex items-center gap-1 text-xs font-bold text-[#e02020] group-hover:text-[#b81818] transition-colors mt-0.5">
                  <span>Explore</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
