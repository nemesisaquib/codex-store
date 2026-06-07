"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { toProduct, type ApiProduct } from "@/lib/api";

export default function NewArrivalsCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<ReturnType<typeof toProduct>[]>([]);

  useEffect(() => {
    fetch("/api/products?limit=12&is_new=1")
      .then(r => r.json())
      .then((d: { products: ApiProduct[] }) => {
        // show newest items (is_new=1 first, then fill from all)
        const items = d.products ?? [];
        setProducts(items.map(toProduct));
      });
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const card = ref.current.querySelector(".carousel-item") as HTMLElement;
    const w = card ? card.offsetWidth + 20 : 280;
    ref.current.scrollBy({ left: dir === "right" ? w * 2 : -w * 2, behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-900/40">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#e02020] text-xs font-bold tracking-widest uppercase mb-2">Just Dropped</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white">New Arrivals</h2>
          </div>
          <div className="flex items-center gap-3">
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

        {products.length === 0 ? (
          <div className="carousel-track pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="carousel-item flex-shrink-0" style={{ width: "clamp(220px,22vw,280px)" }}>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse aspect-[4/5]" />
              </div>
            ))}
          </div>
        ) : (
          <div ref={ref} className="carousel-track pb-2">
            {products.map(p => (
              <div key={p.id} className="carousel-item" style={{ width: "clamp(220px,22vw,280px)" }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/new-arrivals"
            className="inline-flex items-center gap-2 px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold hover:bg-[#e02020] dark:hover:bg-[#e02020] dark:hover:text-white transition-colors">
            Shop all new arrivals <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
