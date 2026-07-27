"use client";
import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/store/ProductCard";
import { toProduct } from "@/lib/api";
import type { ApiProduct } from "@/lib/api";

export default function SalePage() {
  const [products, setProducts] = useState<ReturnType<typeof toProduct>[]>([]);
  const [total, setTotal]       = useState(0);
  const [sort, setSort]         = useState("price_asc");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?sale=1&limit=200&sort=${sort}`)
      .then(r => r.json())
      .then((d: { products: ApiProduct[]; total: number }) => {
        setProducts(d.products.map(toProduct));
        setTotal(d.total);
        setLoading(false);
      });
  }, [sort]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px]">
      <div className="relative py-20 px-6 lg:px-10 overflow-hidden"
        style={{background:"linear-gradient(135deg,#1a0000 0%,#3d0000 50%,#1a0000 100%)"}}>
        <div className="absolute inset-0 opacity-[0.05]"
          style={{backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)"}}/>
        <div className="max-w-[1440px] mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#e02020]/20 border border-[#e02020]/30 px-4 py-1.5 rounded-full mb-6">
            <Tag size={13} className="text-[#e02020]"/>
            <span className="text-[#e02020] text-xs font-bold tracking-widest uppercase">Mid-Season Sale</span>
          </div>
          <h1 className="font-display font-black text-white text-5xl md:text-7xl mb-4">Up to <span className="text-[#e02020]">70%</span> Off</h1>
          <p className="text-white/50 text-lg max-w-lg mx-auto">{total} items on sale — shop before they are gone.</p>
          <div className="flex items-center justify-center gap-8 mt-8">
            {["Women","Men","Kids","Accessories"].map(c => (
              <Link key={c} href={`/category/${c.toLowerCase()}`} className="text-white/60 hover:text-[#e02020] text-sm font-medium transition-colors">{c}</Link>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-neutral-500 text-sm">{total} sale items from database</p>
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-900 focus:outline-none">
            <option value="price_asc">Price: Low-High</option>
            <option value="price_desc">Price: High-Low</option>
            <option value="rating">Best Rated</option>
          </select>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({length:8}).map((_,i) => <div key={i} className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse aspect-[4/5]"/>)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20"><p className="text-neutral-400">No sale items at the moment.</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
