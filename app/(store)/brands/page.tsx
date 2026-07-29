import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDb } from "@/lib/db";

export const metadata = {
  title: "Brands | E-shop",
  description: "Explore all premium brands available in our store.",
};

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const db = getDb();
  let brands: { name: string; count: number }[] = [];
  
  try {
    const res = await db.execute(`
      SELECT brand as name, COUNT(*) as count 
      FROM products 
      WHERE brand IS NOT NULL AND brand != '' 
      GROUP BY brand 
      ORDER BY name ASC
    `);
    
    brands = (res.rows as any[]).map(r => ({
      name: r.name,
      count: Number(r.count)
    }));
  } catch (error) {
    console.error("Failed to fetch brands", error);
  }

  // Fallback if no brands are loaded
  if (brands.length === 0) {
    brands = [
      { name: "Gucci", count: 12 },
      { name: "Prada", count: 8 },
      { name: "Nike", count: 24 },
      { name: "Adidas", count: 18 },
      { name: "Balenciaga", count: 5 },
      { name: "Chanel", count: 9 },
    ];
  }

  // Pre-assigned some aesthetic images for popular brands
  const brandImages: Record<string, string> = {
    "gucci": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    "prada": "https://images.unsplash.com/photo-1599643478524-fb5244510006?w=800&q=80",
    "nike": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "adidas": "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80",
    "apple": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    "samsung": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80",
  };

  const getBrandImage = (name: string, index: number) => {
    const key = name.toLowerCase();
    if (brandImages[key]) return brandImages[key];
    
    // Fallback images based on index
    const fallbacks = [
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80",
    ];
    return fallbacks[index % fallbacks.length];
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="mb-16">
          <h1 className="font-display font-bold text-4xl md:text-6xl text-neutral-900 dark:text-white mb-6">
            Our <br />
            <span className="text-[#e02020] italic">Brands</span>
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-xl text-lg">
            Discover our carefully selected premium brands. From high-fashion houses to top-tier technology manufacturers.
          </p>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brands.map((brand, idx) => (
            <Link
              key={brand.name}
              href={`/search?q=${encodeURIComponent(brand.name)}`}
              className="group relative h-64 overflow-hidden rounded-3xl block"
            >
              <img
                src={getBrandImage(brand.name, idx)}
                alt={brand.name}
                loading={idx < 4 ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="font-display font-bold text-2xl text-white mb-1">
                  {brand.name}
                </h3>
                <p className="text-neutral-300 text-xs mb-3">
                  {brand.count} {brand.count === 1 ? 'Product' : 'Products'}
                </p>
                <div className="flex items-center gap-2 text-white/80 font-medium text-sm translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  Shop Brand <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
