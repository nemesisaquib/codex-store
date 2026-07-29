import Link from "next/link";
import CategoryCarousel from "./CategoryCarousel";
import { fetchProducts, toProduct } from "@/lib/api";

export default async function FeaturedProducts() {
  const { products: raw } = await fetchProducts({ limit: 200 });
  const products = raw.map(toProduct);

  // Group products by category
  const grouped: Record<string, typeof products> = {};
  for (const p of products) {
    const cat = p.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  // Sort categories by number of products descending and take top 3
  const categories = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length).slice(0, 3);

  return (
    <div className="space-y-20 py-20">
      {categories.map((category) => {
        // Limit to max 12 products per category showcase
        const categoryProducts = grouped[category].slice(0, 12);
        if (categoryProducts.length === 0) return null;

        return (
          <CategoryCarousel key={category} category={category} products={categoryProducts} />
        );
      })}
    </div>
  );
}
