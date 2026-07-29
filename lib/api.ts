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
  variants: string | null;
  options: string | null;
  attributes: string | null;
  sizes: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  meta_title: string | null;
  meta_desc: string | null;
  meta_keywords: string | null;
}

export interface Option {
  name: string;
  values: string[];
}

export interface Attribute {
  key: string;
  value: string;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export function safeJsonArray<T = any>(val: any): T[] {
  if (!val) return [];
  let current = val;
  let attempts = 0;
  while (typeof current === "string" && attempts < 5) {
    try {
      const parsed = JSON.parse(current);
      current = parsed;
    } catch {
      break;
    }
    attempts++;
  }
  return Array.isArray(current) ? current : [];
}

export function toProduct(p: ApiProduct) {
  const colorList: string[] = safeJsonArray(p.colors);
  const sizeList: string[] = safeJsonArray(p.sizes);
  const variantList: Variant[] = safeJsonArray(p.variants);
  const optionList: Option[] = safeJsonArray(p.options);
  const attributeList: Attribute[] = safeJsonArray(p.attributes);
  
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
    sizes:        sizeList.length > 0 ? sizeList : ["XS","S","M","L","XL","XXL"], // fallback for old products
    description:  p.description ?? undefined,
    stock:        p.stock,
    weight:       p.weight ?? undefined,
    length:       p.length ?? undefined,
    width:        p.width ?? undefined,
    height:       p.height ?? undefined,
    variants:     variantList,
    options:      optionList,
    attributes:   attributeList,
    meta_title:   p.meta_title ?? undefined,
    meta_desc:    p.meta_desc ?? undefined,
    meta_keywords: p.meta_keywords ?? undefined,
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
