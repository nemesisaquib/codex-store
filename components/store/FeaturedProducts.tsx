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

  // Sort categories by number of products descending
  let categories = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);

  try {
    // Filter out categories that are explicitly hidden in the DB
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    const activeRows = await db.execute("SELECT name, is_active FROM categories");
    const inactiveCats = activeRows.rows
      .filter((r: any) => r.is_active === 0)
      .map((r: any) => String(r.name).toLowerCase());
      
    categories = categories.filter(c => !inactiveCats.includes(c.toLowerCase()));
  } catch (e) {
    console.error("Error filtering categories", e);
  }

  // Take top 3
  categories = categories.slice(0, 3);

  // Check if groceries is enabled and fetch fresh grocery items from dedicated table
  let grocerySectionProducts: any[] = [];
  let isGroceriesEnabled = false;

  try {
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    const grocCat = await db.execute("SELECT is_active FROM categories WHERE slug = 'groceries'");
    isGroceriesEnabled = grocCat.rows.length > 0 && grocCat.rows[0].is_active !== 0;

    if (isGroceriesEnabled) {
      const grocRes = await db.execute("SELECT * FROM grocery_items WHERE is_active = 1 LIMIT 12");
      grocerySectionProducts = grocRes.rows.map((g: any) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        price: g.price,
        compare_price: g.compare_price,
        badge: g.freshness_badge || "Farm Fresh",
        image: g.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
        images: [g.image_url],
        category: "Groceries",
        unit: g.unit,
        rating: 5.0,
        reviews_count: 12
      }));
    }
  } catch (e) {}

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

      {/* Fresh Groceries Showcase Section (Only when Enabled by Admin) */}
      {isGroceriesEnabled && grocerySectionProducts.length > 0 && (
        <CategoryCarousel category="Fresh Groceries" products={grocerySectionProducts} />
      )}
    </div>
  );
}
