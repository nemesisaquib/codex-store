"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    label:    "Women",
    href:     "/category/women",
    image:    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800&h=1000",
    accent:   "#e02020",
    items:    "12,400+ items",
  },
  {
    label:    "Men",
    href:     "/category/men",
    image:    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800&h=1000",
    accent:   "#0a0a0a",
    items:    "9,600+ items",
  },
  {
    label:    "Kids",
    href:     "/category/kids",
    image:    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=800&h=1000",
    accent:   "#d4a017",
    items:    "5,200+ items",
  },
  {
    label:    "Sale",
    href:     "/sale",
    image:    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800&h=1000",
    accent:   "#e02020",
    items:    "Up to 70% off",
    hot:      true,
  },
];

export default function CategoryStrip() {
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
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            aria-label={`Shop ${cat.label} category`}
            className="category-card relative overflow-hidden rounded-2xl aspect-[4/5] block group shadow-sm hover:shadow-xl transition-all duration-500 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800"
          >
            {/* Image */}
            <Image
              src={cat.image}
              alt={`${cat.label} collection`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Bottom Vignette Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent transition-opacity duration-300 group-hover:opacity-85" />

            {/* Hot badge */}
            {cat.hot && (
              <div className="absolute top-4 right-4 z-10">
                <span className="badge-sale bg-[#e02020] text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider shadow-md">
                  HOT
                </span>
              </div>
            )}

            {/* Label */}
            <div className="cat-label absolute bottom-0 left-0 right-0 p-5 z-10">
              <p className="text-white font-sans font-bold text-xl md:text-2xl leading-tight mb-1 drop-shadow-md">
                {cat.label}
              </p>
              <p className="text-white/80 text-xs font-medium drop-shadow-sm">{cat.items}</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-white transition-colors">
                <span>Shop now</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Accent bottom border */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1 transition-transform duration-300 scale-x-0 group-hover:scale-x-100 origin-left"
              style={{ background: cat.accent }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
