"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SlidersHorizontal, X, Grid3X3, LayoutList } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { toProduct, type ApiProduct } from "@/lib/api";

const SIZES  = ["XS","S","M","L","XL","XXL"];
const PRICES = ["Under $50","$50–$100","$100–$200","$200+"];

const LABELS: Record<string,string> = {
  women:"Women", men:"Men", kids:"Kids",
  accessories:"Accessories", sale:"Sale", all:"All Products",
};

export default function CategoryPage() {
  const params = useParams<{ slug: string | string[] }>();
  // catch-all: slug is string[] like ["women","dresses"] or ["women"]
  const slugArr = Array.isArray(params.slug) ? params.slug : [params.slug];
  const slug = slugArr[0] ?? "all";          // main category = first segment
  const subSlug = slugArr[1] ?? null;        // sub-category = second segment (e.g. "dresses")
  const label = (LABELS[slug] ?? slug) + (subSlug ? ` / ${subSlug.charAt(0).toUpperCase()+subSlug.slice(1)}` : "");

  const [products, setProducts]   = useState<ReturnType<typeof toProduct>[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filterOpen, setFilter]   = useState(false);
  const [view, setView]           = useState<"grid"|"list">("grid");
  const [active, setActive]       = useState<string[]>([]);
  const [sort, setSort]           = useState("newest");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "48", sort });
    if (slug !== "all") params.set("category", slug);
    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then((d: { products: ApiProduct[]; total: number }) => {
        setProducts(d.products.map(toProduct));
        setTotal(d.total);
        setLoading(false);
      });
  }, [slug, sort]);

  const toggle = (f: string) =>
    setActive(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px]">
      {/* Hero */}
      <div className="bg-neutral-950 text-white py-14 px-6 lg:px-10">
        <div className="max-w-[1440px] mx-auto">
          <p className="text-[#e02020] text-xs font-bold tracking-widest uppercase mb-2">CODEX / {label}</p>
          <h1 className="font-display font-black text-4xl md:text-5xl">{label}</h1>
          <p className="text-white/50 mt-2 text-sm">{total} products</p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <button onClick={() => setFilter(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-[#e02020] transition-colors">
            <SlidersHorizontal size={15}/> Filters
            {active.length > 0 && <span className="bg-[#e02020] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{active.length}</span>}
          </button>

          <div className="flex flex-wrap gap-2 flex-1">
            {active.map(f => (
              <span key={f} className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-medium">
                {f} <button onClick={() => toggle(f)}><X size={11}/></button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-900 focus:outline-none cursor-pointer">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low–High</option>
              <option value="price_desc">Price: High–Low</option>
              <option value="rating">Best Rated</option>
            </select>
            <div className="flex gap-1 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1">
              {(["grid","list"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`p-1.5 rounded-lg transition-colors ${view===v?"bg-neutral-900 text-white dark:bg-white dark:text-neutral-900":""}`}>
                  {v === "grid" ? <Grid3X3 size={15}/> : <LayoutList size={15}/>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          {filterOpen && (
            <aside className="w-60 flex-shrink-0 space-y-8">
              <div>
                <p className="text-xs font-bold tracking-wider uppercase text-neutral-600 dark:text-neutral-400 mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(s => (
                    <button key={s} onClick={() => toggle(s)}
                      className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${active.includes(s)?"border-[#e02020] bg-[#e02020]/10 text-[#e02020]":"border-neutral-200 dark:border-neutral-700 hover:border-[#e02020]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold tracking-wider uppercase text-neutral-600 dark:text-neutral-400 mb-3">Price</p>
                <div className="space-y-2">
                  {PRICES.map(p => (
                    <label key={p} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={active.includes(p)} onChange={() => toggle(p)} className="accent-[#e02020] w-4 h-4"/>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Grid */}
          {loading ? (
            <div className={`flex-1 grid gap-4 ${view==="grid"?"grid-cols-2 md:grid-cols-3 xl:grid-cols-4":"grid-cols-1"}`}>
              {Array.from({length:8}).map((_,i) => (
                <div key={i} className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse aspect-[4/5]"/>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 text-center py-24">
              <p className="text-neutral-400 text-lg">No products found</p>
              <p className="text-neutral-300 text-sm mt-1">Try a different category or filter</p>
            </div>
          ) : (
            <div className={`flex-1 grid gap-4 ${view==="grid"?"grid-cols-2 md:grid-cols-3 xl:grid-cols-4":"grid-cols-1"}`}>
              {products.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
