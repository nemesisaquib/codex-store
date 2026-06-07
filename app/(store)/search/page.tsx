"use client";
import { useState } from "react";
import { X } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { toProduct } from "@/lib/api";
import type { ApiProduct } from "@/lib/api";

const TRENDING = ["Linen blazer","Silk dress","Wide leg trousers","Cashmere sweater","Leather bag","New arrivals"];

export default function SearchPage() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<ReturnType<typeof toProduct>[]>([]);
  const [total, setTotal]     = useState(0);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setSearched(true);
    setLoading(true);
    fetch(`/api/products?q=${encodeURIComponent(q)}&limit=24`)
      .then(r => r.json())
      .then((d: { products: ApiProduct[]; total: number }) => {
        setResults(d.products.map(toProduct));
        setTotal(d.total);
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px]">
      <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 lg:px-10 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch(query)}
              placeholder="Search products, brands, categories..."
              className="w-full pl-12 pr-12 py-4 text-base bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e02020]/30 focus:border-[#e02020] transition-all"
            />
            {query && (
              <button onClick={() => { setQuery(""); setSearched(false); setResults([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700">
                <X size={18}/>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
        {!searched ? (
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-4">Trending Searches</p>
            <div className="flex flex-wrap gap-2 mb-10">
              {TRENDING.map(t => (
                <button key={t} onClick={() => doSearch(t)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm font-medium hover:bg-[#e02020] hover:text-white transition-colors">
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-4">Browse Categories</p>
            <div className="grid grid-cols-3 gap-3">
              {[["Women","#9a3a5c"],["Men","#1e3a5f"],["Kids","#2d5a3d"],["Sale","#e02020"],["Accessories","#d4a017"],["New In","#404040"]].map(([c,col]) => (
                <div key={c} className="rounded-xl p-5 text-white font-display font-bold text-xl cursor-pointer hover:opacity-90 transition-opacity"
                  style={{background:`linear-gradient(160deg,${col}dd,${col}88)`}}
                  onClick={() => doSearch(c as string)}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display font-semibold text-xl text-neutral-900 dark:text-white">
                {loading ? "Searching…" : `${total} results for "${query}"`}
              </h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({length:8}).map((_,i) => <div key={i} className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse aspect-[4/5]"/>)}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-neutral-400 text-lg mb-4">No results for "{query}"</p>
                <button onClick={() => { setSearched(false); setQuery(""); }} className="text-sm text-[#e02020] hover:underline">Clear search</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map(p => <ProductCard key={p.id} product={p}/>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
