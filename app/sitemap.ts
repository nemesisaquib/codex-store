import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // In production, this should ideally be an environment variable.
  // Using a fallback for local dev.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  const db = getDb();
  
  // Base static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/category/all`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }
  ];

  try {
    // 1. Get all products
    const productsRes = await db.execute("SELECT slug, created_at FROM products WHERE status = 'active'");
    const products = productsRes.rows as { slug: string, created_at: string }[];
    
    products.forEach(p => {
      routes.push({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: new Date(p.created_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

    // 2. Get categories
    const catRes = await db.execute("SELECT DISTINCT category FROM products WHERE status = 'active'");
    const categories = catRes.rows as { category: string }[];
    
    categories.forEach(c => {
      if (c.category) {
        routes.push({
          url: `${baseUrl}/category/${c.category.toLowerCase()}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });

    // 3. Get static pages from SEO settings
    const pagesRes = await db.execute("SELECT page FROM seo_pages");
    const pages = pagesRes.rows as { page: string }[];
    
    pages.forEach(p => {
      // Don't add root again
      if (p.page !== "/") {
        routes.push({
          url: `${baseUrl}${p.page}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    });

  } catch (error) {
    console.error("Failed to generate sitemap:", error);
  }

  return routes;
}
