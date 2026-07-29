import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  // Default fallback in case DB query fails
  const defaultRobots: MetadataRoute.Robots = {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };

  try {
    const db = getDb();
    const rows = (await db.execute(
      "SELECT value FROM settings WHERE key = 'seo_robots'"
    )).rows as { value: string }[];
    
    if (rows.length > 0 && rows[0].value) {
      const robotsSetting = rows[0].value.toLowerCase(); // e.g., "index, follow" or "noindex, nofollow"
      
      if (robotsSetting.includes("noindex")) {
        return {
          rules: {
            userAgent: "*",
            disallow: "/",
          },
        };
      }
    }
    
    return defaultRobots;
  } catch (error) {
    console.error("Failed to generate robots.txt:", error);
    return defaultRobots;
  }
}
