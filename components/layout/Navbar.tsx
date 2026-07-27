"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import CartAside from "@/components/store/CartAside";

/* ── Inline SVG icon set ── */
const Icon = {
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Heart: ({ filled }: { filled?: boolean }) => (
    <svg viewBox="0 0 24 24" fill={filled ? "#e02020" : "none"} stroke={filled ? "#e02020" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Bag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-50">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

const MEGA_MENU_DATA: Record<string, {
  categories: { title: string; links: { name: string; href: string }[] }[];
  featured: { title: string; price: string; image: string; href: string }[];
}> = {
  Women: {
    categories: [
      {
        title: "CATEGORIES",
        links: [
          { name: "All Women's", href: "/category/women" },
          { name: "New In Dresses", href: "/category/women" },
          { name: "New In Tops & Blouses", href: "/category/women" },
          { name: "New In Skirts", href: "/category/women" },
          { name: "New In Trousers", href: "/category/women" },
        ],
      },
      {
        title: "SHOP BY FIT",
        links: [
          { name: "Petite Collection", href: "/category/women" },
          { name: "Oversized Fit", href: "/category/women" },
          { name: "Tailored Fits", href: "/category/women" },
        ],
      },
    ],
    featured: [
      {
        title: "Robyn Daisy Button Through V-Neck Dress",
        price: "$145.00",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&h=550&q=80",
        href: "/category/women",
      },
      {
        title: "Dana Indigo Denim Flare A-Line Skirt",
        price: "$98.00",
        image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=400&h=550&q=80",
        href: "/category/women",
      },
      {
        title: "Lorna Red Ditsy Empire Waist Dress",
        price: "$120.00",
        image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=400&h=550&q=80",
        href: "/category/women",
      },
    ],
  },
  Men: {
    categories: [
      {
        title: "CATEGORIES",
        links: [
          { name: "All Men's", href: "/category/men" },
          { name: "Casual Shirts", href: "/category/men" },
          { name: "Denim & Trousers", href: "/category/men" },
          { name: "Jackets & Coats", href: "/category/men" },
          { name: "Hoodies & Sweatshirts", href: "/category/men" },
        ],
      },
      {
        title: "SHOP BY STYLE",
        links: [
          { name: "Supreme Streetwear", href: "/category/men" },
          { name: "Minimalist Edit", href: "/category/men" },
        ],
      },
    ],
    featured: [
      {
        title: "Structured Leather Tote",
        price: "$265.00",
        image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
        href: "/category/men",
      },
      {
        title: "High-Rise Straight Jeans",
        price: "$89.00",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
        href: "/category/men",
      },
      {
        title: "Resort Floral Shirt",
        price: "$75.00",
        image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=600&q=80",
        href: "/category/men",
      },
    ],
  },
  Kids: {
    categories: [
      {
        title: "CATEGORIES",
        links: [
          { name: "All Kids", href: "/category/kids" },
          { name: "Girls Collection", href: "/category/kids" },
          { name: "Boys Collection", href: "/category/kids" },
          { name: "Babies & Toddlers", href: "/category/kids" },
        ],
      },
    ],
    featured: [
      {
        title: "Organic Cotton Matchy Hoodie Set",
        price: "$65.00",
        image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
        href: "/category/kids",
      },
    ],
  },
  "New In": {
    categories: [
      {
        title: "NEW ARRIVALS",
        links: [
          { name: "All New In", href: "/new-arrivals" },
          { name: "This Week's Drop", href: "/new-arrivals" },
          { name: "Trending Top 20", href: "/new-arrivals" },
        ],
      },
    ],
    featured: [
      {
        title: "Oversized Linen Blazer 22",
        price: "$189.00",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
        href: "/new-arrivals",
      },
    ],
  },
  Sale: {
    categories: [
      {
        title: "OFFERS",
        links: [
          { name: "All Sale", href: "/sale" },
          { name: "Up to 50% Off", href: "/sale" },
          { name: "Clearance Deals", href: "/sale" },
        ],
      },
    ],
    featured: [
      {
        title: "Silk Wrap Midi Dress",
        price: "$145.00",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
        href: "/sale",
      },
    ],
  },
};

const NAV_LINKS = [
  { label: "Women",    href: "/category/women",  sub: ["Dresses", "Tops", "Trousers", "Outerwear", "Shoes"] },
  { label: "Men",      href: "/category/men",    sub: ["Shirts", "Trousers", "Jackets", "Shoes", "Accessories"] },
  { label: "Kids",     href: "/category/kids",   sub: ["Girls", "Boys", "Babies", "Shoes"] },
  { label: "Sale",     href: "/sale",            sub: null, sale: true },
  { label: "New In",   href: "/new-arrivals",    sub: null },
  { label: "Brands",   href: "/brands",          sub: null },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobile]   = useState(false);
  const [dropdown, setDropdown]   = useState<string | null>(null);
  const [searchOpen, setSearch]   = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [cartOpen, setCartOpen]   = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (label: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDropdown(label);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDropdown(null);
    }, 200);
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const headerStyle: React.CSSProperties = { 
    top: scrolled ? 0 : 32, 
    background: "rgba(255,255,255,0.95)", 
    backdropFilter: "blur(24px)", 
    borderBottom: "1px solid rgba(229,229,229,0.5)", 
    boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.04)",
    transition: "top 0.2s ease, box-shadow 0.2s ease"
  };

  useEffect(() => {
    fetch("/api/cart").then(r => r.json()).then(d => setCartCount(d.items?.length ?? 0));
  }, []);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchVal.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(searchVal.trim())}&limit=6`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.products || []);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchVal]);

  return (
    <>
      <header
        suppressHydrationWarning
        style={{ top: scrolled ? 0 : 32, backgroundColor: "#ffffff", borderBottom: "1px solid #e5e5e5", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        className="fixed left-0 right-0 z-[300] transition-all duration-200"
      >
        <div className="max-w-[1440px] mx-auto px-5 lg:px-10">
          <div className="flex items-center h-[68px] gap-2">

            {/* ── Logo ── */}
            <Link href="/" className="flex-shrink-0 mr-6 lg:mr-10 group flex items-center shrink-0">
              <img 
                src="/Logo+%20favicon/Eshop.png" 
                alt="E-shop Logo" 
                style={{ height: "36px", maxHeight: "36px", width: "auto", maxWidth: "160px", objectFit: "contain" }}
                className="transition-transform duration-300 group-hover:scale-105" 
              />
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 h-full">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.label}
                  className="h-full flex items-center static"
                  onMouseEnter={() => handleMouseEnter(link.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={link.href}
                    className="relative flex items-center gap-1.5 px-4 h-full text-[13px] font-bold tracking-wider uppercase transition-all duration-200 group"
                    style={{ color: link.sale ? "#e02020" : "#0a0a0a" }}
                  >
                    <span className="relative">
                      {link.label}
                      <span className={`absolute left-0 bottom-3 h-[2px] bg-[#e02020] transition-all duration-300 ${dropdown === link.label ? "w-full" : "w-0 group-hover:w-full"}`}/>
                    </span>
                    {link.sale && (
                      <span className="badge-sale bg-[#e02020] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm tracking-widest uppercase animate-pulse">
                        SALE
                      </span>
                    )}
                  </Link>
                </div>
              ))}
            </nav>

            {/* ── Full Width Mega Menu Dropdown ── */}
            {dropdown && MEGA_MENU_DATA[dropdown] && (
              <div 
                className="absolute top-full left-0 right-0 w-full shadow-2xl animate-[fadeIn_.15s_ease-out] z-50"
                style={{ backgroundColor: "#ffffff", color: "#0a0a0a", borderTop: "1px solid #e5e5e5", borderBottom: "1px solid #e5e5e5" }}
                onMouseEnter={() => {
                  if (timerRef.current) clearTimeout(timerRef.current);
                }}
                onMouseLeave={handleMouseLeave}
              >
                <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-10 lg:py-12">
                  <div className="flex items-start justify-between gap-8">
                    
                    {/* Left Subcategory Columns */}
                    <div className="flex gap-12 shrink-0">
                      {MEGA_MENU_DATA[dropdown].categories.map((catGroup, idx) => (
                        <div key={idx} className="flex flex-col gap-2.5 min-w-[150px]">
                          <h4 
                            className="text-[11px] font-bold tracking-[0.2em] uppercase mb-1"
                            style={{ color: "#0a0a0a" }}
                          >
                            {catGroup.title}
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {catGroup.links.map((linkItem) => (
                              <li key={linkItem.name}>
                                <Link
                                  href={linkItem.href}
                                  onClick={() => setDropdown(null)}
                                  className="text-xs font-semibold hover:text-[#e02020] transition-colors"
                                  style={{ color: "#404040" }}
                                >
                                  {linkItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Right Featured Product Cards */}
                    <div className="flex items-start gap-4 border-l border-neutral-200 pl-8 shrink-0">
                      {MEGA_MENU_DATA[dropdown].featured.map((prod) => (
                        <Link
                          key={prod.title}
                          href={prod.href}
                          onClick={() => setDropdown(null)}
                          className="group flex flex-col gap-2"
                          style={{ width: "130px" }}
                        >
                          <div 
                            className="relative w-full rounded-xl overflow-hidden bg-neutral-100 shadow-sm border border-neutral-200"
                            style={{ width: "130px", height: "130px" }}
                          >
                            <img
                              src={prod.image}
                              alt={prod.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div>
                            <h5 
                              className="text-[11px] font-semibold line-clamp-1 group-hover:text-[#e02020] transition-colors leading-tight"
                              style={{ color: "#0a0a0a" }}
                            >
                              {prod.title}
                            </h5>
                            <p className="text-[11px] font-bold text-neutral-500 mt-0.5">{prod.price}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center gap-0.5 ml-auto">

              {/* Search */}
              <button
                onClick={() => setSearch(!searchOpen)}
                aria-label="Search"
                className="cursor-pointer p-2.5 rounded-full text-neutral-800 hover:text-[#e02020] hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-110"
              >
                <Icon.Search />
              </button>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                aria-label="Wishlist"
                className="cursor-pointer p-2.5 rounded-full text-neutral-800 hover:text-[#e02020] hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-110 hidden sm:flex"
              >
                <Icon.Heart />
              </Link>

              {/* Account */}
              <Link
                href="/account"
                aria-label="Account"
                className="cursor-pointer p-2.5 rounded-full text-neutral-800 hover:text-[#e02020] hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-110 hidden md:flex"
              >
                <Icon.User />
              </Link>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                aria-label={`Cart (${cartCount} items)`}
                className={`cursor-pointer relative p-2.5 rounded-full bg-[#e02020] hover:bg-[#c01a1a] text-white transition-all duration-200 ml-2 hover:scale-110 shadow-md shadow-[#e02020]/30 ${cartOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              >
                <Icon.Bag />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none border-2 border-white dark:border-neutral-950">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu */}
              <button
                onClick={() => setMobile(!mobileOpen)}
                aria-label="Menu"
                className="cursor-pointer lg:hidden p-2.5 rounded-xl ml-1 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150"
              >
                {mobileOpen ? <Icon.Close /> : <Icon.Menu />}
              </button>
            </div>
          </div>

          {/* ── Live Search bar & Results Dropdown ── */}
          {searchOpen && (
            <div className="pb-4 relative fade-up max-w-3xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); if (searchVal) { setSearch(false); window.location.href = `/search?q=${encodeURIComponent(searchVal)}`; } }}>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Icon.Search />
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search products, brands, categories…"
                    className="w-full pl-12 pr-10 py-3 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-800 transition-all text-neutral-900 shadow-sm"
                    style={{ backgroundColor: "#ffffff", color: "#0a0a0a" }}
                  />
                  {searchLoading ? (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : searchVal ? (
                    <button
                      type="button"
                      onClick={() => setSearchVal("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              </form>

              {/* Live Results Dropdown */}
              {searchVal.trim().length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden z-[500] animate-[fadeIn_.15s_ease-out]"
                  style={{ backgroundColor: "#ffffff", color: "#0a0a0a", border: "1px solid #e5e5e5" }}
                >
                  {searchLoading ? (
                    <div className="p-6 text-center text-xs font-semibold text-neutral-400">
                      Searching products…
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div>
                      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        <span>Matching Products ({searchResults.length})</span>
                        <span className="text-[#e02020]">Live Search</span>
                      </div>
                      <div className="divide-y divide-neutral-100 max-h-[360px] overflow-y-auto">
                        {searchResults.map((prod) => {
                          let img = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80";
                          try {
                            if (Array.isArray(prod.images)) img = prod.images[0];
                            else if (typeof prod.images === "string" && prod.images.startsWith("[")) img = JSON.parse(prod.images)[0];
                            else if (prod.images) img = prod.images;
                          } catch (e) {
                            img = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80";
                          }
                          return (
                            <Link
                              key={prod.id}
                              href={`/product/${prod.id}`}
                              onClick={() => { setSearch(false); setSearchVal(""); }}
                              className="flex items-center gap-4 p-3 hover:bg-neutral-50 transition-colors group"
                            >
                              <div className="w-12 h-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200/60">
                                <img src={img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-neutral-900 truncate group-hover:text-[#e02020] transition-colors">
                                  {prod.name}
                                </h4>
                                <p className="text-[11px] font-medium text-neutral-500 capitalize mt-0.5">
                                  {prod.category} {prod.brand ? `• ${prod.brand}` : ""}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-[#e02020] block">${prod.price}</span>
                                {prod.compare_price && (
                                  <span className="text-[10px] text-neutral-400 line-through">${prod.compare_price}</span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <Link
                        href={`/search?q=${encodeURIComponent(searchVal)}`}
                        onClick={() => setSearch(false)}
                        className="block text-center py-3 bg-neutral-50 text-xs font-bold text-[#e02020] hover:bg-neutral-100 transition-colors border-t border-neutral-100"
                      >
                        View all results for "{searchVal}" →
                      </Link>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-neutral-500">
                      No products found matching "<span className="font-semibold text-neutral-900">{searchVal}</span>"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[400] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobile(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[320px] bg-white dark:bg-neutral-950 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
              <img src="/Logo+ favicon/Eshop.png" alt="E-shop Logo" className="h-7 w-auto object-contain" />
              <button onClick={() => setMobile(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                <Icon.Close />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobile(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    link.sale ? "text-[#e02020] bg-[#e02020]/5" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  }`}
                >
                  {link.label}
                  {link.sale && <span className="badge-sale text-[9px] font-black bg-[#e02020] text-white px-2 py-0.5 rounded-sm">SALE</span>}
                </Link>
              ))}

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4 space-y-1">
                {[
                  { href: "/account",          label: "My Account" },
                  { href: "/account/orders",   label: "Orders" },
                  { href: "/account/wishlist", label: "Wishlist" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobile(false)}
                    className="flex items-center px-4 py-3 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Auth buttons */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-3">
              <Link
                href="/auth/login"
                onClick={() => setMobile(false)}
                className="text-center py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-[#e02020] hover:text-[#e02020] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobile(false)}
                className="text-center py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}

      <CartAside open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
