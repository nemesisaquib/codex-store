"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, ShoppingBag, Star, Shield, RotateCcw, Truck, ChevronDown, ChevronUp, Share2, MapPin } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { toProduct, safeJsonArray, getProductGallery, type ApiProduct } from "@/lib/api";
import { useSettings } from "@/lib/SettingsContext";
import { useCountry } from "@/lib/CountryContext";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

interface Review { id:string; rating:number; title:string|null; comment:string|null; created_at:string; first_name:string; last_name:string }

export default function ProductViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { formatPrice } = useSettings();
  const { country } = useCountry();
  const [product, setProduct]   = useState<ApiProduct | null>(null);
  const [related, setRelated]   = useState<ReturnType<typeof toProduct>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [qty, setQty]           = useState(1);
  const [wishlisted, setWish]   = useState(false);
  const [expanded, setExpanded] = useState<string|null>("description");
  const [activeImg, setActiveImg] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pinCode, setPinCode] = useState("");
  const [pinStatus, setPinStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    fetch(`/api/products/${slug}`, { cache: "no-store" })
      .then(r => r.json())
      .then((p: ApiProduct) => {
        setProduct(p);
        setLoading(false);
        if (p?.id) {
          fetch(`/api/reviews?productId=${p.id}`, { cache: "no-store" }).then(r=>r.json()).then(d=>setReviews(d.reviews ?? []));
        }
      });
    fetch("/api/products?limit=4", { cache: "no-store" })
      .then(r => r.json())
      .then((d: { products: ApiProduct[] }) => setRelated(d.products.map(toProduct)));
  }, [slug]);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff/86400000);
    if (d < 1) return "today";
    if (d < 7) return `${d}d ago`;
    if (d < 30) return `${Math.floor(d/7)}w ago`;
    if (d < 365) return `${Math.floor(d/30)}mo ago`;
    return `${Math.floor(d/365)}y ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10 grid lg:grid-cols-2 gap-12">
          <div className="aspect-[4/5] bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse"/>
          <div className="space-y-4">
            {[40,60,20,40,100,50].map((w,i) => <div key={i} className={`h-6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse`} style={{width:`${w}%`}}/>)}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-[100px]">
        <div className="text-center">
          <p className="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2">Product not found</p>
          <Link href="/category/all" className="text-[#e02020] hover:underline text-sm">Browse all products</Link>
        </div>
      </div>
    );
  }

  const colors: string[] = safeJsonArray(product.colors);
  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;
  const gallery = getProductGallery(product);

  const mainImageSrc = getOptimizedImageUrl(gallery[activeImg] ?? gallery[0], { width: 1200, quality: 90 });

  const attrs: {key:string,value:string}[] = safeJsonArray(product.attributes);
  const opts: {name:string,values:string[]}[] = safeJsonArray(product.options);

  const hasSpecs = attrs && attrs.length > 0;
  const specText = attrs.map((a: any) => `${a.key}: ${a.value}`).join("\n") || "";

  const accordions = [
    {k:"description",t:"Description",c:product.description || `A premium piece from ${product.brand}. Crafted with attention to quality and fit for the modern wardrobe.`},
    hasSpecs ? {k:"specifications",t:"Specifications", c:specText} : null,
    {k:"delivery",t:"Delivery & Returns",c:"Standard (3-7 days): Free over $150. Express (1-3 days): $12.95. Free returns within 30 days."},
    {k:"care",t:"Size & Care",c:"Check label for specific care instructions. Sizes may vary — consult size guide."},
  ].filter(Boolean) as {k:string;t:string;c:string}[];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
        {/* JSON-LD Schema for AI/Google Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": product.name,
              "image": gallery.length ? gallery : undefined,
              "description": product.description || `Buy ${product.name} by ${product.brand}`,
              "brand": {
                "@type": "Brand",
                "name": product.brand
              },
              "offers": {
                "@type": "Offer",
                "url": `${typeof window !== 'undefined' ? window.location.href : ''}`,
                "priceCurrency": "GBP",
                "price": product.price,
                "itemCondition": "https://schema.org/NewCondition",
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
              },
              "aggregateRating": product.reviews > 0 ? {
                "@type": "AggregateRating",
                "ratingValue": product.rating,
                "reviewCount": product.reviews
              } : undefined
            })
          }}
        />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-8">
          {["Home","Shop",product.category,product.name].map((b,i,arr) => (
            <span key={i} className="flex items-center gap-2">
              <Link href={i===0?"/":`/category/${product.category.toLowerCase()}`}
                className={i===arr.length-1?"text-neutral-900 dark:text-white font-medium":"hover:text-[#e02020] transition-colors"}>
                {b}
              </Link>
              {i<arr.length-1 && <span>/</span>}
            </span>
          ))}
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">
          {/* Images */}
          <div className="flex gap-4 lg:sticky lg:top-[120px] lg:h-fit">
            {/* Thumbnails */}
            <div className="hidden md:flex flex-col gap-3">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-20 h-24 rounded-xl flex-shrink-0 border-2 overflow-hidden transition-all relative bg-slate-50 dark:bg-neutral-900 border-slate-200/70 dark:border-neutral-800 ${activeImg===i?"border-[#e02020] ring-2 ring-[#e02020]/20":"hover:border-neutral-400"}`}>
                  <img src={getOptimizedImageUrl(g, { width: 250, quality: 80 })} alt="" className="absolute inset-0 w-full h-full object-contain p-1.5" onError={e=>(e.currentTarget.style.display="none")}/>
                </button>
              ))}
            </div>
            {/* Main image */}
            <div className="flex-1 rounded-2xl overflow-hidden aspect-[4/5] relative bg-gradient-to-b from-slate-50 via-slate-50/50 to-slate-100/80 dark:from-neutral-900 dark:to-neutral-950 border border-slate-200/60 dark:border-neutral-800 shadow-sm p-4 md:p-8">
              <img
                key={mainImageSrc}
                src={mainImageSrc}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-sm transition-transform duration-500 hover:scale-105"
                onError={e=>(e.currentTarget.style.display="none")}
              />
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={async () => {
                    const next = !wishlisted; setWish(next);
                    const res = await fetch("/api/wishlist", { method: next?"POST":"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ productId: product.id }) }).catch(()=>null);
                    if (res && !res.ok && res.status===401) { setWish(!next); toast.error("Please sign in", { description:"Log in to save to wishlist." }); }
                    else if (next) toast.success("Added to wishlist", { description: product.name });
                    else toast("Removed from wishlist");
                  }}
                  className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                  <Heart size={15} fill={wishlisted?"#e02020":"none"} color={wishlisted?"#e02020":"#737373"}/>
                </button>
                <button onClick={async () => {
                    const url = `${window.location.origin}/product/${product.slug}`;
                    if (navigator.share) { try { await navigator.share({ title: product.name, url }); } catch {} }
                    else { await navigator.clipboard.writeText(url); toast.success("Link copied!", { description: "Product link copied to clipboard." }); }
                  }}
                  className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                  <Share2 size={15} color="#737373"/>
                </button>
              </div>
              {product.is_new === 1 && (
                <div className="absolute top-4 left-4">
                  <span className="bg-neutral-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">NEW</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-1">{product.brand}</p>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white leading-tight mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{[1,2,3,4,5].map(s=>(
                <Star key={s} size={14} fill={s<=Math.round(product.rating)?"#d4a017":"none"} color={s<=Math.round(product.rating)?"#d4a017":"#d4d4d4"} strokeWidth={1.5}/>
              ))}</div>
              <span className="text-sm text-neutral-500">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <div className="flex items-center gap-3 mb-7">
              <span className="font-display font-bold text-3xl text-neutral-900 dark:text-white">{formatPrice(product.price)}</span>
              {product.compare_price && <span className="text-lg text-neutral-400 line-through">{formatPrice(product.compare_price)}</span>}
              {discount && <span className="badge-sale bg-[#e02020] text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount}%</span>}
            </div>

            {/* Dynamic Options */}
            {opts && opts.map((opt: any) => {
              const isColor = opt.name.toLowerCase().includes("color") || opt.name.toLowerCase().includes("colour");
              return (
                <div key={opt.name} className="mb-6">
                  <p className="text-xs font-bold tracking-wider uppercase text-neutral-600 dark:text-neutral-400 mb-3">{opt.name}</p>
                  <div className={`flex flex-wrap ${isColor ? 'gap-2.5' : 'gap-3'}`}>
                    {opt.values.map((val: string) => (
                      <button key={val} title={val} onClick={() => setSelectedOptions(p => ({...p, [opt.name]: val}))}
                        className={isColor ? `w-8 h-8 rounded-full border-2 shadow-sm transition-all ${selectedOptions[opt.name] === val ? 'border-[#e02020] scale-110' : 'border-white dark:border-neutral-800 hover:scale-110'}` 
                        : `min-w-[3.5rem] h-12 px-4 border rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center ${selectedOptions[opt.name] === val ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-md scale-105" : "border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-white dark:hover:text-white"}`}
                        style={isColor ? {background:val} : {}}
                      >
                        {!isColor && val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Qty + Add */}
            <div className="flex gap-3 mb-6">
              <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1,qty-1))} className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-lg font-medium">−</button>
                <span className="px-4 py-3 text-sm font-semibold min-w-[40px] text-center">{qty}</span>
                <button onClick={() => setQty(qty+1)} className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-lg font-medium">+</button>
              </div>
              <button
                disabled={isAdding}
                onClick={async () => {
                  const unselected = (opts || []).find((o: any) => !selectedOptions[o.name]);
                  if (unselected) { toast.error(`Select a ${unselected.name}`, { description: `Please choose a ${unselected.name} before adding to bag.` }); return; }
                  setIsAdding(true);
                  try {
                    const cart: Array<{ productId: string; name: string; qty: number; price: number; image?: string }> = await fetch("/api/cart").then(r => r.json()).then(d => d.items ?? []);
                    const optionString = Object.values(selectedOptions).join(" / ");
                    const itemName = optionString ? `${product.name} (${optionString})` : product.name;
                    const existingIdx = cart.findIndex(i => i.name === itemName);
                    if (existingIdx > -1) {
                      cart[existingIdx].qty += qty;
                    } else {
                      cart.push({ productId: product.id, name: itemName, qty, price: product.price, image: product.image_url ?? undefined });
                    }
                    const res = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
                    if (res.ok) {
                      toast.success("Added to bag", { description: optionString ? `${product.name} · ${optionString} · Qty ${qty}` : `${product.name} · Qty ${qty}` });
                      window.dispatchEvent(new Event("cart-updated"));
                    } else if (res.status === 401) {
                      toast.error("Please sign in", { description: "Log in to add items to your bag." });
                    }
                  } catch { toast.error("Something went wrong"); }
                  finally { setIsAdding(false); }
                }}
                className="flex-1 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <><ShoppingBag size={17}/> Add to bag</>
                )}
              </button>
            </div>

            {/* Delivery Checker */}
            <div className="mb-8 p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-[#e02020]" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Check Delivery Availability</h3>
              </div>
              <p className="text-xs text-neutral-500 mb-4">Enter your ZIP / PIN code for worldwide delivery estimates.</p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter PIN Code" 
                  value={pinCode}
                  onChange={(e) => { setPinCode(e.target.value); setPinStatus("idle"); }}
                  className="flex-1 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                />
                <button 
                  onClick={async () => {
                    if (!pinCode) return;
                    setPinStatus("loading");
                    try {
                      const res = await fetch(`/api/geocode?pin=${encodeURIComponent(pinCode)}&country=${encodeURIComponent(country?.code || "")}`);
                      const data = await res.json();
                      if (data?.error) {
                        setPinStatus("error");
                        setLocationName(`Invalid PIN code for ${country?.name || "selected country"}`);
                      } else if (data && data.location) {
                        setLocationName(data.location);
                        setPinStatus("success");
                      } else {
                        setLocationName(pinCode);
                        setPinStatus("success");
                      }
                    } catch {
                      setLocationName(pinCode);
                      setPinStatus("success");
                    }
                  }}
                  disabled={!pinCode || pinStatus === "loading"}
                  className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {pinStatus === "loading" ? "Checking..." : "Check"}
                </button>
              </div>

              {/* Success / Error Messages */}
              {pinStatus === "success" && (
                <div className="mt-4 flex gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <Truck size={18} className="text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900 dark:text-green-50 mb-0.5">Delivery available to {locationName}</p>
                    <p className="text-xs text-green-700 dark:text-green-400">Order now to receive it in 3-5 business days. Worldwide shipping is active.</p>
                  </div>
                </div>
              )}

              {pinStatus === "error" && (
                <div className="mt-4 flex gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <MapPin size={18} className="text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-50 mb-0.5">{locationName}</p>
                    <p className="text-xs text-red-700 dark:text-red-400">Please verify your PIN code or select a different country from the top menu.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-3 mb-8 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
              {[[Truck,"Free Delivery","Orders over $150"],[RotateCcw,"Free Returns","30 days"],[Shield,"Secure Pay","PCI DSS L1"]].map(([Icon,t,s]: any)=>(
                <div key={t} className="text-center flex flex-col items-center">
                  <div className="flex justify-center mb-1.5"><Icon size={20} className="text-[#e02020]"/></div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">{t}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{s}</p>
                </div>
              ))}
            </div>

            {/* Accordion */}
            {accordions.map(({k,t,c}) => (
              <div key={k} className="border-b border-neutral-200 dark:border-neutral-800">
                <button onClick={() => setExpanded(expanded===k?null:k)}
                  className="flex items-center justify-between w-full py-4 text-sm font-semibold text-neutral-900 dark:text-white cursor-pointer hover:opacity-80 transition-opacity">
                  {t} {expanded===k?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
                </button>
                {expanded===k && <p className="pb-4 text-sm text-neutral-500 leading-relaxed whitespace-pre-wrap">{c}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-20">
          <h2 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-8">Customer Reviews {reviews.length > 0 && <span className="text-neutral-400 font-normal text-base">({reviews.length})</span>}</h2>
          {reviews.length === 0 ? (
            <p className="text-neutral-400 text-sm">No reviews yet — be the first to review this product!</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map(r => (
                <div key={r.id} className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-3">{[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s<=r.rating?"#d4a017":"none"} color={s<=r.rating?"#d4a017":"#d4d4d4"} strokeWidth={1.5}/>)}</div>
                  {r.title && <p className="font-semibold text-sm text-neutral-900 dark:text-white mb-1.5">{r.title}</p>}
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">{r.comment}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">{r.first_name} {r.last_name?.[0]}.</p>
                    <p className="text-[10px] text-neutral-400">{timeAgo(r.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.filter(p => p.slug !== slug).slice(0,4).map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          </div>
        )}
      </div>
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": realImgs,
            "description": product.meta_desc || product.description,
            "keywords": product.meta_keywords || undefined,
            "sku": product.slug,
            "brand": {
              "@type": "Brand",
              "name": product.brand || "Codex"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://codex.com/product/${product.slug}`,
              "priceCurrency": "USD",
              "price": product.price,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            },
            ...((attrs && attrs.length > 0) ? {
              "additionalProperty": attrs.map((a: any) => ({
                "@type": "PropertyValue",
                "name": a.key,
                "value": a.value
              }))
            } : {})
          })
        }}
      />
    </div>
  );
}
