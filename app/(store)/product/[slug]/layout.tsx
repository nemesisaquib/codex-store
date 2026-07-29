import { Metadata } from "next";
import { getDb } from "@/lib/db";

interface LayoutProps {
  children: React.ReactNode;
}

interface MetadataProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const db = getDb();
    const product = (await db.execute({ sql: "SELECT name, description, brand, image_url, meta_title, meta_desc, meta_keywords FROM products WHERE slug = ?", args: [slug] })).rows[0] as any;
    
    if (!product) {
      return { title: "Product Not Found" };
    }

    const title = product.meta_title || `${product.name} | ${product.brand || "Codex"}`;
    const description = product.meta_desc || product.description || `Buy ${product.name} at Codex store.`;
    const image = product.image_url || "/og-image.jpg"; // Fallback image
    const keywords = product.meta_keywords ? product.meta_keywords.split(",").map((k: string) => k.trim()).filter(Boolean) : [product.name, product.brand, "buy online", "e-commerce"];

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        images: [{ url: image }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      }
    };
  } catch (e) {
    return { title: "Product" };
  }
}

export default function ProductLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
