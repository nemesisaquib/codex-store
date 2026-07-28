"use client";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag, Trash2, ArrowRight, Tag, Truck, Plus, Minus, Package, Sparkles } from "lucide-react";

interface CartItem { productId: string; name: string; qty: number; price: number; image?: string }

export default function CartAside({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState("");
  const [promoCode, setPromoCode] = useState<{ type: string; value: number; code: string } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/cart").then(r => r.json()).then(d => { setItems(d.items ?? []); setLoading(false); });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [open, onClose]);

  const update = useCallback((productId: string, qty: number) => {
    setItems(p => qty < 1 ? p.filter(i => i.productId !== productId) : p.map(i => i.productId === productId ? { ...i, qty } : i));
  }, []);

  const applyPromo = async () => {
    if (!promo.trim()) return;
    setApplyingPromo(true);
    setPromoErr("");
    const res = await fetch("/api/promotions?code=" + encodeURIComponent(promo.trim().toUpperCase()));
    const data = await res.json();
    if (data.promo?.is_active) {
      setPromoCode({ type: data.promo.type, value: data.promo.value, code: data.promo.code });
      setPromo("");
    } else {
      setPromoErr("Invalid or expired code");
    }
    setApplyingPromo(false);
  };

  // Debounced cart save
  useEffect(() => {
    const t = setTimeout(() => {
      if (!loading) {
        fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) })
          .then(() => window.dispatchEvent(new Event("cart-updated")))
          .catch(() => {});
      }
    }, 600);
    return () => clearTimeout(t);
  }, [items, loading]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = promoCode ? (promoCode.type === "percentage" ? subtotal * promoCode.value / 100 : promoCode.value) : 0;
  const shipping = subtotal >= 150 ? 0 : 12.95;
  const total = subtotal - discount + shipping;
  const progress = Math.min(100, (subtotal / 150) * 100);
  const remaining = Math.max(0, 150 - subtotal);

  if (!mounted) return null;

  const drawer = (
    <div style={{ position:"fixed", inset:0, zIndex:99999, pointerEvents: open ? "auto" : "none" }}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        style={{ width: "min(40%, 520px)", minWidth: "320px" }}
        className={`absolute right-0 top-0 h-full flex flex-col bg-neutral-50 dark:bg-neutral-950 shadow-2xl transition-transform duration-[400ms] ease-[cubic-bezier(.16,1,.3,1)] will-change-transform ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog" aria-modal="true" aria-label="Shopping cart"
      >
        {/* ── Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag size={22} className="text-neutral-900 dark:text-white" />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#e02020] text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                  {items.length > 9 ? "9+" : items.length}
                </span>
              )}
            </div>
            <h2 className="font-semibold text-[15px] text-neutral-900 dark:text-white tracking-tight">Your Bag</h2>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Free shipping bar ── */}
        {items.length > 0 && (
          <div className="flex-shrink-0 px-5 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Truck size={12} className={progress >= 100 ? "text-green-500" : "text-neutral-400"} />
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {progress >= 100 ? <span className="text-green-600 font-semibold">🎉 Free shipping unlocked!</span> : <><span className="font-semibold text-neutral-900 dark:text-white">£{remaining.toFixed(0)}</span> away from free shipping</>}
                </span>
              </div>
              <span className="text-[10px] font-bold text-neutral-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#e02020] to-[#ff4040] rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ── Items ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-3 p-4 bg-white dark:bg-neutral-900 rounded-2xl animate-pulse">
                  <div className="w-16 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-5">
                <Package size={32} className="text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="font-semibold text-neutral-900 dark:text-white mb-1">Your bag is empty</p>
              <p className="text-sm text-neutral-400 mb-8">Looks like you haven't added anything yet.</p>
              <Link href="/category/women" onClick={onClose}
                className="flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-sm font-semibold hover:bg-[#e02020] dark:hover:bg-[#e02020] dark:hover:text-white transition-colors">
                <Sparkles size={14} /> Start Shopping
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {items.map((item, i) => (
                <div key={`${item.productId}-${i}`}
                  className="group flex gap-3 p-3 bg-white dark:bg-neutral-900 rounded-2xl hover:shadow-sm transition-all">
                  {/* Image */}
                  <div className="w-[68px] h-[84px] rounded-xl bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 overflow-hidden relative">
                    {item.image
                      ? <Image src={item.image} alt={item.name} fill unoptimized sizes="68px" className="object-contain p-1" />
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={20} className="text-neutral-300" /></div>
                    }
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-white leading-snug line-clamp-2">{item.name}</p>
                      <button onClick={() => update(item.productId, 0)} aria-label={`Remove ${item.name}`}
                        className="flex-shrink-0 p-1 text-neutral-300 hover:text-[#e02020] transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-0 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                        <button onClick={() => update(item.productId, item.qty - 1)} aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500">
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-neutral-900 dark:text-white" aria-label="Current quantity">{item.qty}</span>
                        <button onClick={() => update(item.productId, item.qty + 1)} aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500">
                          <Plus size={11} />
                        </button>
                      </div>
                      <p className="font-bold text-[13px] text-neutral-900 dark:text-white">£{(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer (only when items) ── */}
        {items.length > 0 && (
          <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
            {/* Promo */}
            <div className="px-5 pt-4">
              {promoCode ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-xl mb-3">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">{promoCode.code} applied</span>
                    <span className="text-[10px] text-green-600">−{promoCode.type === "percentage" ? `${promoCode.value}%` : `£${promoCode.value}`}</span>
                  </div>
                  <button onClick={() => setPromoCode(null)} className="text-green-400 hover:text-green-600">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={promo}
                      onChange={e => { setPromo(e.target.value); setPromoErr(""); }}
                      onKeyDown={e => e.key === "Enter" && applyPromo()}
                      placeholder="Promo code"
                      className="w-full pl-8 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] transition-colors"
                    />
                  </div>
                  <button onClick={applyPromo} disabled={applyingPromo}
                    className="px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold hover:bg-[#e02020] transition-colors disabled:opacity-50">
                    {applyingPromo ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {promoErr && <p className="text-[11px] text-[#e02020] mb-2 -mt-1">{promoErr}</p>}
            </div>

            {/* Totals */}
            <div className="px-5 pb-2 space-y-2">
              <div className="flex justify-between text-[12px] text-neutral-500"><span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span><span>£{subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-[12px] text-green-600 font-medium"><span>Discount</span><span>−£{discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-[12px] text-neutral-500"><span>Shipping</span><span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>{shipping === 0 ? "FREE" : `£${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between font-bold text-[15px] text-neutral-900 dark:text-white pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span>Total</span><span>£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="px-5 pb-5 pt-3 space-y-2">
              <Link href="/checkout" onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#e02020] hover:bg-[#c01a1a] text-white font-bold rounded-xl text-[14px] uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#e02020]/20">
                Checkout — £{total.toFixed(2)} <ArrowRight size={15} />
              </Link>
              <button onClick={onClose}
                className="w-full py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}
