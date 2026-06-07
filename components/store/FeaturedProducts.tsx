import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { fetchProducts, toProduct } from "@/lib/api";

export default async function FeaturedProducts() {
  const { products: raw } = await fetchProducts({ limit: 8 });
  const products = raw.map(toProduct);

  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[#e02020] text-xs font-bold tracking-widest uppercase mb-2">Curated Selection</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white">
            Featured Products
          </h2>
        </div>
        <Link href="/category/all" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-[#e02020] transition-colors">
          View all <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      <div className="md:hidden mt-8 text-center">
        <Link href="/category/all" className="inline-flex items-center gap-2 px-8 py-3 border border-neutral-200 rounded-full text-sm font-medium text-neutral-700 hover:border-[#e02020] hover:text-[#e02020] transition-colors">
          View all products <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
