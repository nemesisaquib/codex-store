"use client";
import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "./ProductCard";

export default function CategoryCarousel({ category, products }: { category: string; products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const card = ref.current.querySelector(".carousel-item") as HTMLElement;
    const w = card ? card.offsetWidth + 20 : 280;
    ref.current.scrollBy({ left: dir === "right" ? w * 2 : -w * 2, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-10">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[#e02020] text-xs font-bold tracking-widest uppercase mb-2">Curated Selection</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white capitalize">
            {category}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/category/${category.toLowerCase()}`} className="hidden md:flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-[#e02020] transition-colors mr-2">
            View all {category} <ArrowRight size={15} />
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll("left")} aria-label="Previous"
              className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 hover:border-[#e02020] hover:text-[#e02020] transition-colors">
              <ArrowLeft size={16} />
            </button>
            <button onClick={() => scroll("right")} aria-label="Next"
              className="w-10 h-10 rounded-full bg-[#e02020] text-white flex items-center justify-center hover:bg-[#c01a1a] transition-colors">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div ref={ref} className="carousel-track pb-2">
        {products.map(p => (
          <div key={p.id} className="carousel-item" style={{ width: "clamp(220px,22vw,280px)" }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <div className="md:hidden mt-8 text-center">
        <Link href={`/category/${category.toLowerCase()}`} className="inline-flex items-center gap-2 px-8 py-3 border border-neutral-200 rounded-full text-sm font-medium text-neutral-700 hover:border-[#e02020] hover:text-[#e02020] transition-colors">
          View all {category} <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
