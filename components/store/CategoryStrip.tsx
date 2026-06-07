import Link from "next/link";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    label:    "Women",
    href:     "/category/women",
    bg:       "linear-gradient(160deg,#c41e3a 0%,#7d1111 60%,#2d1b1b 100%)",
    accent:   "#e02020",
    items:    "12,400+ items",
  },
  {
    label:    "Men",
    href:     "/category/men",
    bg:       "linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)",
    accent:   "#0a0a0a",
    items:    "9,600+ items",
  },
  {
    label:    "Kids",
    href:     "/category/kids",
    bg:       "linear-gradient(160deg,#d4a017 0%,#9a7012 60%,#3d2b00 100%)",
    accent:   "#d4a017",
    items:    "5,200+ items",
  },
  {
    label:    "Sale",
    href:     "/sale",
    bg:       "linear-gradient(160deg,#e02020 0%,#9a1414 50%,#1a0000 100%)",
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
          href="/categories"
          className="hidden md:flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-[#e02020] transition-colors"
        >
          All categories <ArrowRight size={15} />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="category-card relative overflow-hidden rounded-2xl aspect-[3/4] block group"
          >
            {/* Background */}
            <div
              className="absolute inset-0"
              style={{ background: cat.bg }}
            />

            {/* Dark overlay */}
            <div
              className="cat-overlay absolute inset-0 bg-neutral-950"
              style={{ opacity: 0.35 }}
            />

            {/* Hot badge */}
            {cat.hot && (
              <div className="absolute top-4 right-4 z-10">
                <span className="badge-sale bg-[#e02020] text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">
                  HOT
                </span>
              </div>
            )}

            {/* Label */}
            <div className="cat-label absolute bottom-0 left-0 right-0 p-5 z-10">
              <p className="text-white font-display font-bold text-2xl leading-tight mb-1">
                {cat.label}
              </p>
              <p className="text-white/60 text-xs font-medium">{cat.items}</p>
              <div
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                Shop now <ArrowRight size={12} />
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
