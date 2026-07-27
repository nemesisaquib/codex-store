export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  compare_price: number | null;
  color: string | null;
  image_url: string | null;
  image_url2: string | null;
  stock: number;
  status: string;
  badge: string | null;
  is_new: number;
  rating: number;
  reviews: number;
  colors: string;
  description: string | null;
}

export function toProduct(p: ApiProduct) {
  const colorList: string[] = (() => { try { return JSON.parse(p.colors); } catch { return []; } })();
  return {
    id:           p.id,
    name:         p.name,
    slug:         p.slug,
    brand:        p.brand,
    category:     p.category,
    price:        p.price,
    comparePrice: p.compare_price ?? undefined,
    color:        p.color ?? "#c4a882",
    image:        p.image_url ?? undefined,
    image2:       p.image_url2 ?? undefined,
    rating:       p.rating,
    reviews:      p.reviews,
    badge:        p.badge ?? undefined,
    isNew:        p.is_new === 1,
    colors:       colorList,
    description:  p.description ?? undefined,
    stock:        p.stock,
  };
}

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};
const BASE = getBaseUrl();

export async function fetchProducts(params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)]))
  ).toString();
  const res = await fetch(`${BASE}/api/products?${qs}`, { next: { revalidate: 60 } });
  if (!res.ok) return { products: [], total: 0 };
  return res.json() as Promise<{ products: ApiProduct[]; total: number }>;
}

export async function fetchProduct(slug: string) {
  const res = await fetch(`${BASE}/api/products/${slug}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json() as Promise<ApiProduct>;
}
