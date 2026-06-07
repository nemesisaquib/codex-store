"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface ApiProduct {
  id: string; name: string; slug: string; brand: string; category: string;
  price: number; compare_price: number | null; image_url: string | null;
  color: string | null; rating: number; reviews: number;
}

// Per-category theme (accent + dark gradient backdrop)
const THEME: Record<string, { accent: string; bg: string; eyebrow: string }> = {
  Women:       { accent: "#e02020", bg: "linear-gradient(135deg,#0a0a0a 0%,#1a0505 45%,#3d0808 75%,#0a0a0a 100%)", eyebrow: "Women's Edit" },
  Men:         { accent: "#3b82f6", bg: "linear-gradient(135deg,#0a0a14 0%,#0f1a2e 50%,#1a2d4a 80%,#0a0a0a 100%)", eyebrow: "Men's Edit" },
  Kids:        { accent: "#22c55e", bg: "linear-gradient(135deg,#0a0a0a 0%,#0d1f0d 50%,#1a3d1a 75%,#0a0a0a 100%)", eyebrow: "Kids & Babies" },
  Accessories: { accent: "#d4a017", bg: "linear-gradient(135deg,#0a0a0a 0%,#1a1500 50%,#2d2400 75%,#0a0a0a 100%)", eyebrow: "Accessories" },
};
const DEFAULT_THEME = THEME.Women;

export default function HeroBanner() {
  const [slides, setSlides] = useState<ApiProduct[]>([]);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  // Pull 5 standout products (one per category where possible)
  useEffect(() => {
    fetch("/api/products?limit=24")
      .then(r => r.json())
      .then((d: { products: ApiProduct[] }) => {
        const products = d.products ?? [];
        const seen = new Set<string>();
        const picks: ApiProduct[] = [];
        // one per category first
        for (const p of products) {
          if (!seen.has(p.category) && p.image_url) { picks.push(p); seen.add(p.category); }
        }
        // top up to 5 with any remaining
        for (const p of products) {
          if (picks.length >= 5) break;
          if (!picks.includes(p) && p.image_url) picks.push(p);
        }
        setSlides(picks.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const go = useCallback((idx: number, dir: "next" | "prev" = "next") => {
    if (animating || slides.length === 0) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 380);
  }, [animating, slides.length]);

  const next = useCallback(() => {
    if (slides.length) go((current + 1) % slides.length, "next");
  }, [current, slides.length, go]);
  const prev = () => { if (slides.length) go((current - 1 + slides.length) % slides.length, "prev"); };

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next, slides.length]);

  // Loading / empty state — dark gradient, no layout shift
  if (slides.length === 0) {
    return (
      <section className="relative h-screen min-h-[620px] overflow-hidden" style={{ background: DEFAULT_THEME.bg }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  const s = slides[current];
  const theme = THEME[s.category] ?? DEFAULT_THEME;
  const discount = s.compare_price ? Math.round((1 - s.price / s.compare_price) * 100) : null;
  const catHref = `/category/${s.category.toLowerCase()}`;

  return (
    <section className="relative h-screen min-h-[620px] overflow-hidden" style={{ background: theme.bg, transition: "background 0.6s ease" }}>
      {/* ── Background product images — crossfade ── */}
      {slides.map((slide, i) => (
        <div key={slide.id} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === current ? 1 : 0 }}>
          {slide.image_url && (
            <img
              src={slide.image_url}
              alt={slide.name}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ animation: i === current ? "ken-burns 9s ease-out forwards" : "none" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          {/* Left-dark gradient so headline stays legible over image */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.6) 42%,rgba(0,0,0,0.2) 100%)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
        </div>
      ))}

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 z-10 transition-colors duration-700" style={{ background: theme.accent }} />

      {/* Slide indicators (right) */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 z-20">
        {slides.map((_, i) => (
          <button key={i} onClick={() => go(i, i > current ? "next" : "prev")}
            className="transition-all duration-300 rounded-full"
            style={{ width: i === current ? "8px" : "4px", height: i === current ? "32px" : "16px", background: i === current ? theme.accent : "rgba(255,255,255,0.25)" }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Category tag */}
      <div className="absolute top-28 right-10 hidden lg:block z-20">
        <span className="text-[10px] font-bold tracking-[0.3em] px-3 py-1.5 rounded-full border uppercase"
          style={{ color: theme.accent, borderColor: theme.accent + "40", background: theme.accent + "15" }}>
          {theme.eyebrow}
        </span>
      </div>

      {/* ── Content ── */}
      <div
        className={`relative z-10 h-full flex flex-col justify-center max-w-[1440px] mx-auto px-6 lg:px-16 pt-20`}
        style={{
          transition: "all 0.38s cubic-bezier(0.4,0,0.2,1)",
          transform: animating ? (direction === "next" ? "translateX(-32px)" : "translateX(32px)") : "translateX(0)",
          opacity: animating ? 0 : 1,
        }}
      >
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-px" style={{ background: theme.accent }} />
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase" style={{ color: theme.accent }}>
              {s.brand}
            </span>
          </div>

          {/* Product name as headline */}
          <h1 className="font-display font-black text-white leading-[0.95] mb-5" style={{ fontSize: "clamp(2.5rem,7vw,5.5rem)" }}>
            {s.name}
          </h1>

          {/* Rating + price row */}
          <div className="flex items-center gap-5 mb-6 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={15} fill={n <= Math.round(s.rating) ? theme.accent : "none"} color={n <= Math.round(s.rating) ? theme.accent : "rgba(255,255,255,0.3)"} strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-white/60 text-sm">{s.rating} ({s.reviews})</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-white font-black text-2xl">${s.price.toFixed(0)}</span>
              {s.compare_price && <span className="text-white/40 line-through text-base">${s.compare_price}</span>}
              {discount && <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: theme.accent, color: "#fff" }}>−{discount}%</span>}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link href={`/product/${s.slug}`}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 leading-none rounded-xl font-semibold text-sm text-white whitespace-nowrap transition-all hover:scale-[1.02]"
              style={{ background: theme.accent, boxShadow: `0 8px 24px ${theme.accent}40` }}>
              Shop This Look <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href={catHref}
              className="inline-flex items-center justify-center px-8 py-4 leading-none border border-white/30 text-white font-semibold rounded-xl text-sm whitespace-nowrap hover:bg-white/10 hover:border-white/50 transition-colors">
              Browse {s.category}
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex gap-8 mt-12">
            {[["50K+","Products"],["120+","Countries"],["4.9★","Rating"]].map(([v,l]) => (
              <div key={l}>
                <p className="font-display font-black text-white text-2xl">{v}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button onClick={prev} aria-label="Previous"
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all hover:scale-110">
        <ChevronLeft size={20} />
      </button>
      <button onClick={next} aria-label="Next"
        className="absolute right-14 lg:right-20 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
        style={{ background: theme.accent }}>
        <ChevronRight size={20} />
      </button>

      {/* Mobile dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 lg:hidden z-20">
        {slides.map((_, i) => (
          <button key={i} onClick={() => go(i, i > current ? "next" : "prev")}
            className="w-2 h-2 rounded-full transition-all"
            style={{ background: i === current ? theme.accent : "rgba(255,255,255,0.3)", width: i === current ? "24px" : "8px" }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
