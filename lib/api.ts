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
  gallery?: string | null;
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

const CATEGORY_IMAGE_SETS: Record<string, string[]> = {
  women: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85&auto=format&fit=crop"
  ],
  men: [
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490555758436-2277d337f76e?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=85&auto=format&fit=crop"
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&q=85&auto=format&fit=crop"
  ],
  accessories: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611591475777-233cd7577770?w=1200&q=85&auto=format&fit=crop"
  ],
  kids: [
    "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=1200&q=85&auto=format&fit=crop"
  ]
};

export function getProductGallery(p?: any): string[] {
  if (!p) return [];
  const id = p.id || "";
  const name = p.name || "";
  const existing: string[] = safeJsonArray(p.gallery);
  const rawList = [p.image_url || p.image, p.image_url2 || p.image2, ...existing].filter(Boolean) as string[];
  
  if (rawList.length >= 6) {
    return rawList;
  }

  const catLower = (p.category || "").toLowerCase();
  let pool = CATEGORY_IMAGE_SETS.women;
  if (catLower.includes("men") && !catLower.includes("women")) pool = CATEGORY_IMAGE_SETS.men;
  else if (catLower.includes("shoe") || catLower.includes("footwear") || catLower.includes("sneaker")) pool = CATEGORY_IMAGE_SETS.shoes;
  else if (catLower.includes("access") || catLower.includes("watch") || catLower.includes("bag") || catLower.includes("jewel")) pool = CATEGORY_IMAGE_SETS.accessories;
  else if (catLower.includes("kid") || catLower.includes("child") || catLower.includes("baby")) pool = CATEGORY_IMAGE_SETS.kids;

  const result = [...rawList];
  const charSum = (id + name).split("").reduce((s, c) => s + c.charCodeAt(0), 0);

  for (let i = 0; i < 8; i++) {
    if (result.length >= 6) break;
    const img = pool[(charSum + i * 3) % pool.length];
    if (!result.includes(img)) {
      result.push(img);
    }
  }

  return result.length > 0 ? result : [pool[0]];
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
