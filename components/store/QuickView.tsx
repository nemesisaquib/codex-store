"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingBag, Share2, Minus, Plus, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { safeJsonArray, getProductGallery } from "@/lib/api";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { useSettings } from "@/lib/SettingsContext";

interface Product {
  id: string; slug: string; name: string; brand: string;
  price: number; compare_price?: number;
  image_url?: string; image_url2?: string;
  colors?: string; stock: number;
}

interface QuickViewProps {
  product: Product; open: boolean; onClose: () => void;
}

const QuickView = memo(({ product, open, onClose }: QuickViewProps) => {
  const [qty, setQty]               = useState(1);
  const [adding, setAdding]         = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [selectedColor, setColor]   = useState("");
  const [selectedSize, setSize]     = useState("");
  const [imgIdx, setImgIdx]         = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) { setImgIdx(0); return; }
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  setImgIdx(p => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setImgIdx(p => Math.min(images.length - 1, p + 1));
    };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [open, onClose]);

  const rawImages = getProductGallery(product);
  const images = rawImages.map(img => getOptimizedImageUrl(img, { width: 1000, quality: 85 }));
  const colors = safeJsonArray(product?.colors);
  const discount = product?.compare_price && product?.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;

  const addCart = useCallback(async () => {
    setAdding(true);
    try {
      const cart = await fetch("/api/cart").then(r => r.json()).then(d => d.items ?? []);
      cart.push({ productId: product.id, name: product.name, qty, price: product.price, image: product.image_url });
      const res = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
      if (res.ok) {
        toast.success("Added to bag", { description: `${product.name} · Qty ${qty}` });
        window.dispatchEvent(new Event("cart-updated"));
      } else if (res.status === 401) toast.error("Please sign in", { description: "Log in to add items to your bag." });
      onClose();
    } catch (e) { toast.error("Something went wrong"); }
    setAdding(false);
  }, [product, qty, onClose]);

  const { formatPrice } = useSettings();

  if (!open || !mounted) return null;

  const modal = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      role="dialog" aria-modal="true" aria-labelledby="qv-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]" onClick={onClose} />

      {/* Modal — tall portrait on desktop, sheet on mobile */}
      <div
        style={{ maxWidth: "min(840px, calc(100vw - 24px))", width: "100%" }}
        className="relative bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_.35s_cubic-bezier(.16,1,.3,1)] sm:animate-[scaleIn_.28s_cubic-bezier(.16,1,.3,1)] flex flex-col sm:flex-row"
      >
        {/* ── LEFT: big image slider ── */}
        <div className="relative bg-neutral-100 dark:bg-neutral-800 sm:w-[52%] flex-shrink-0 overflow-hidden" style={{ minHeight: "320px" }}>
          {/* Images */}
          <div className="relative w-full h-full" style={{ aspectRatio: "3/4" }}>
            {images.length > 0 ? (
              images.map((src, i) => (
                <img
                  key={i} src={src} alt={product.name}
                  loading={i === 0 ? "eager" : "lazy"}
                  className={`absolute inset-0 w-full h-full object-contain p-6 transition-opacity duration-400 ${i === imgIdx ? "opacity-100" : "opacity-0"}`}
                />
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                <ShoppingBag size={48} />
              </div>
            )}

            {/* Discount badge */}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-[#e02020] text-white px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide z-10">
                −{discount}%
              </span>
            )}

            {/* Prev / Next — only if multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(p => Math.max(0, p - 1))}
                  disabled={imgIdx === 0}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow flex items-center justify-center transition-all ${imgIdx === 0 ? "opacity-30" : "opacity-100 hover:bg-white hover:scale-110"}`}
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setImgIdx(p => Math.min(images.length - 1, p + 1))}
                  disabled={imgIdx === images.length - 1}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow flex items-center justify-center transition-all ${imgIdx === images.length - 1 ? "opacity-30" : "opacity-100 hover:bg-white hover:scale-110"}`}
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`transition-all rounded-full ${i === imgIdx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/75"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: product details ── */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Close */}
          <button
            onClick={onClose} aria-label="Close"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-md flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-[#e02020] hover:text-white transition-all"
          >
            <X size={17} strokeWidth={2.5} />
          </button>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Brand + Name */}
            <div className="pr-10">
              <p className="text-[10px] tracking-[0.25em] text-[#e02020] uppercase font-bold mb-1">{product.brand}</p>
              <h1 id="qv-title" className="font-display font-bold text-xl sm:text-2xl leading-tight text-neutral-900 dark:text-white">
                {product.name}
              </h1>
            </div>

            {/* Price row */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-neutral-900 dark:text-white">{formatPrice(product.price)}</span>
              {product.compare_price && (
                <span className="text-base text-neutral-400 line-through">{formatPrice(product.compare_price)}</span>
              )}
              {discount > 0 && (
                <span className="text-xs font-bold text-[#e02020] bg-[#e02020]/10 px-2 py-0.5 rounded-md">−{discount}%</span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${product.stock > 0 ? "bg-green-500" : "bg-red-400"}`} />
              <p className={`text-xs font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
              </p>
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">
                  Color {selectedColor && <span className="text-neutral-800 dark:text-neutral-200 normal-case">— {selectedColor}</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c: { name?: string; hex?: string }, i: number) => {
                    const id = c.name || c.hex || `c${i}`;
                    const active = selectedColor === id;
                    return (
                      <button key={id} onClick={() => setColor(active ? "" : id)} title={c.name || ""}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${active ? "border-[#e02020] ring-2 ring-[#e02020]/25 scale-110" : "border-neutral-200 dark:border-neutral-700 hover:scale-105"}`}
                        style={{ background: c.hex || "#ccc" }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size */}
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">Size</p>
              <div className="flex gap-1.5 flex-wrap">
                {["XS","S","M","L","XL"].map(s => (
                  <button key={s} onClick={() => setSize(selectedSize === s ? "" : s)}
                    className={`min-w-[44px] h-9 px-3 border-2 rounded-xl text-xs font-bold transition-all ${
                      selectedSize === s
                        ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty */}
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">Quantity</p>
              <div className="inline-flex items-center border-2 border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <Minus size={13}/>
                </button>
                <span className="w-10 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <Plus size={13}/>
                </button>
              </div>
            </div>
          </div>

          {/* Sticky bottom CTA */}
          <div className="mt-auto p-6 sm:p-7 pt-0 space-y-2.5">
            <button onClick={addCart} disabled={adding || product.stock === 0}
              className={`w-full py-4 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2.5 transition-all ${
                product.stock === 0
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                  : "bg-[#e02020] hover:bg-[#c01a1a] text-white shadow-lg shadow-[#e02020]/25 hover:shadow-[#e02020]/40 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              <ShoppingBag size={16}/>
              {adding ? "Adding to bag…" : `Add to Bag — ${formatPrice(product.price * qty)}`}
            </button>

            <div className="flex gap-2">
              <Link href={`/product/${product.slug}`} onClick={onClose}
                className="flex-1 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-semibold text-center text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 transition-colors flex items-center justify-center gap-1.5">
                Full Details <ArrowUpRight size={12}/>
              </Link>
              <button className="w-11 h-11 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl flex items-center justify-center text-neutral-500 hover:border-neutral-400 transition-colors">
                <Share2 size={14}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}, (prev, next) => prev.open === next.open && prev.product.id === next.product.id);

QuickView.displayName = "QuickView";
export default QuickView;
