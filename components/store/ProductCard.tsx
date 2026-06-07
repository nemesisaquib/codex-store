"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import QuickView from "./QuickView";

export interface Product {
  id:           string;
  name:         string;
  slug:         string;
  brand:        string;
  price:        number;
  comparePrice?: number;
  image?:       string;
  image2?:      string;
  color?:       string;
  rating:       number;
  reviews:      number;
  badge?:       string;
  colors?:      string[];
  isNew?:       boolean;
  stock?:       number;
  image_url?:   string;
  image_url2?:  string;
  compare_price?: number;
  colors_str?:  string;
}

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered]       = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  const fallbackBg = `linear-gradient(160deg,${product.color ?? "#c4a882"},${product.color ?? "#c4a882"}88)`;
  const hasImg = !!product.image;

  return (
    <div
      className="product-card group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
    >
      {/* ── Image ── */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-800"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Always render gradient fallback in background */}
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: fallbackBg }} />

        {hasImg && (
          <>
            {/* Primary image */}
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${hovered && product.image2 ? "opacity-0" : "opacity-100"} group-hover:scale-105`}
            />
            {/* Hover image */}
            {product.image2 && (
              <img
                src={product.image2}
                alt={`${product.name} alternate`}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${hovered ? "opacity-100" : "opacity-0"} group-hover:scale-105`}
              />
            )}
          </>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNew && (
            <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider">NEW</span>
          )}
          {discount && (
            <span className="badge-sale bg-[#e02020] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">-{discount}%</span>
          )}
          {product.badge && !discount && (
            <span className="bg-[#d4a017] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">{product.badge}</span>
          )}
          {product.stock !== undefined && product.stock <= 10 && product.stock > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Low Stock</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={async e => {
            e.preventDefault();
            const next = !wishlisted;
            setWishlisted(next);
            const res = await fetch("/api/wishlist", {
              method: next ? "POST" : "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: product.id }),
            }).catch(() => { setWishlisted(!next); return null; });
            if (res && !res.ok && res.status === 401) {
              setWishlisted(!next);
              toast.error("Please sign in", { description: "Log in to save items to your wishlist." });
            } else if (next) {
              toast.success("Added to wishlist", { description: product.name });
            } else {
              toast("Removed from wishlist", { description: product.name });
            }
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          aria-label="Wishlist"
        >
          <Heart size={14} fill={wishlisted ? "#e02020" : "none"} color={wishlisted ? "#e02020" : "#737373"} strokeWidth={2}/>
        </button>

        {/* Hover actions */}
        <div className="card-actions absolute bottom-3 left-3 right-3 z-10 flex gap-2">
          <button
            onClick={async e => {
              e.preventDefault();
              setAdding(true);
              try {
                const cart = await fetch("/api/cart").then(r => r.json()).then(d => d.items ?? []);
                cart.push({ productId: product.id, name: product.name, qty: 1, price: product.price, image: product.image });
                const res = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
                if (res.ok) {
                  toast.success("Added to bag", { description: `${product.name} — $${product.price.toFixed(2)}` });
                } else if (res.status === 401) {
                  toast.error("Please sign in", { description: "Log in to add items to your bag." });
                }
              } catch {
                toast.error("Something went wrong", { description: "Could not add to bag." });
              }
              setAdding(false);
            }}
            disabled={adding}
            className={`flex-1 ${adding ? "bg-neutral-600" : "bg-neutral-900/90 hover:bg-[#e02020]"} backdrop-blur-sm text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors`}
          >
            <ShoppingBag size={13}/> {adding ? "Adding…" : "Quick Add"}
          </button>
          <button
            onClick={e => { e.preventDefault(); setQuickViewOpen(true); }}
            className="w-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-neutral-700 hover:bg-[#e02020] hover:text-white transition-colors"
            aria-label="Quick view"
          >
            <Eye size={13}/>
          </button>
        </div>
      </Link>

      {/* ── Info ── */}
      <div className="p-4">
        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-0.5">{product.brand}</p>
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white leading-snug mb-2 line-clamp-2 hover:text-[#e02020] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="flex gap-px">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={11}
                fill={s <= Math.round(product.rating) ? "#d4a017" : "none"}
                color={s <= Math.round(product.rating) ? "#d4a017" : "#d4d4d4"}
                strokeWidth={1.5}/>
            ))}
          </div>
          <span className="text-[10px] text-neutral-400">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-neutral-900 dark:text-white">${product.price.toFixed(2)}</span>
          {product.comparePrice && (
            <span className="text-xs text-neutral-400 line-through">${product.comparePrice.toFixed(2)}</span>
          )}
        </div>

        {/* Colour swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-1.5 mt-3">
            {product.colors.slice(0,5).map(c => (
              <span key={c} title={c}
                className="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-700 shadow-sm cursor-pointer hover:scale-125 transition-transform"
                style={{ background: c }}/>
            ))}
          </div>
        )}
      </div>

      <QuickView
        product={{
          ...product,
          image_url: product.image,
          image_url2: product.image2,
          compare_price: product.comparePrice,
          colors: product.colors_str || JSON.stringify(product.colors || []),
          stock: product.stock ?? 0,
        }}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </div>
  );
}
