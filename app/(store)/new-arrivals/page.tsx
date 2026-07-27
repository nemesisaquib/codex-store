"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { toProduct } from "@/lib/api";
import type { ApiProduct } from "@/lib/api";

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<ReturnType<typeof toProduct>[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/products?limit=24&sort=newest")
      .then(r => r.json())
      .then((d: { products: ApiProduct[] }) => { setProducts(d.products.map(toProduct)); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px]">
      <div className="bg-neutral-950 py-16 px-6 lg:px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="inline-flex items-center gap-2 text-[#e02020] mb-4">
            <Sparkles size={16}/><span className="text-xs font-bold tracking-widest uppercase">Just Dropped</span>
          </div>
          <h1 className="font-display font-black text-white text-4xl md:text-6xl">New <em className="italic text-[#e02020]">Arrivals</em></h1>
          <p className="text-white/50 mt-3">The latest from the E-shop edit. {products.length} pieces available now.</p>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({length:10}).map((_,i) => <div key={i} className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse aspect-[4/5]"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
