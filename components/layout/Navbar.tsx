"use client";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Non-home pages: ALWAYS solid (white bg needs dark navbar). Home: transparent until scrolled.
    if (!isHome) { setScrolled(true); return; }
    const fn = () => setScrolled(window.scrollY > 40);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [isHome]);

  // Solid when scrolled OR on any non-home page
  const solid = scrolled || !isHome;
  const headerStyle: React.CSSProperties = solid
    ? { top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(229,229,229,0.4)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }
    : { top: 32, background: "transparent" };

  useEffect(() => {
    fetch("/api/cart").then(r => r.json()).then(d => setCartCount(d.items?.length ?? 0));
  }, []);

  // light = white text on transparent — only valid on home hero before scroll
  const light = isHome && !scrolled;

  return (
    <>
      <header
        suppressHydrationWarning
        style={headerStyle}
        className="fixed left-0 right-0 z-[300] transition-all duration-300"
      >
        <div className="max-w-[1440px] mx-auto px-5 lg:px-10">
          <div className="flex items-center h-[68px] gap-2">

            {/* ── Logo ── */}
            <Link href="/" className="flex-shrink-0 mr-6 lg:mr-10 group">
              <span
                className="font-display font-black text-[1.5rem] tracking-tight transition-colors duration-300 inline-flex items-center"
                style={{ color: light ? "#fff" : "#0a0a0a" }}
              >
                CODEX
                <span className="w-1.5 h-1.5 rounded-full bg-[#e02020] ml-1 group-hover:scale-150 transition-transform"/>
              </span>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setDropdown(link.label)}
                  onMouseLeave={() => setDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className={`
                      relative flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold tracking-wide transition-all duration-200 group
                      ${link.sale ? "text-[#e02020]" : light ? "text-white/85 hover:text-white" : "text-neutral-700 hover:text-neutral-900 dark:text-neutral-300"}
                    `}
                  >
                    <span className="relative">
                      {link.label}
                      <span className={`absolute left-0 -bottom-1 h-[2px] bg-[#e02020] transition-all duration-300 ${dropdown === link.label ? "w-full" : "w-0 group-hover:w-full"}`}/>
                    </span>
                    {link.sale && (
                      <span className="badge-sale bg-[#e02020] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm tracking-widest uppercase animate-pulse">
                        SALE
                      </span>
                    )}
                    {link.sub && <Icon.ChevronDown />}
                  </Link>

                  {/* Dropdown */}
                  {link.sub && dropdown === link.label && (
                    <div className="absolute top-full left-0 pt-3 z-50">
                      <div className="bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 min-w-[200px] animate-[fadeIn_.15s_ease-out]">
                        {link.sub.map((s) => (
                          <Link
                            key={s}
                            href={`${link.href}/${s.toLowerCase()}`}
                            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-[#e02020]/5 hover:text-[#e02020] transition-all group"
                          >
                            <span className="font-medium">{s}</span>
                            <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                              <Icon.ArrowRight />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* ── Actions ── */}
            <div className="flex items-center gap-0.5 ml-auto">

              {/* Search */}
              <button
                onClick={() => setSearch(!searchOpen)}
                aria-label="Search"
                className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 ${
                  light
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-neutral-600 hover:text-[#e02020] hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon.Search />
              </button>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                aria-label="Wishlist"
                className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 hidden sm:flex ${
                  light
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-neutral-600 hover:text-[#e02020] hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon.Heart />
              </Link>

              {/* Account */}
              <Link
                href="/account"
                aria-label="Account"
                className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 hidden md:flex ${
                  light
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-neutral-600 hover:text-[#e02020] hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon.User />
              </Link>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                aria-label={`Cart (${cartCount} items)`}
                className={`relative p-2.5 rounded-full bg-[#e02020] hover:bg-[#c01a1a] text-white transition-all duration-200 ml-2 hover:scale-110 shadow-md shadow-[#e02020]/30 ${cartOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
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
                className={`lg:hidden p-2.5 rounded-xl ml-1 transition-all duration-150 ${
                  light
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {mobileOpen ? <Icon.Close /> : <Icon.Menu />}
              </button>
            </div>
          </div>

          {/* ── Search bar ── */}
          {searchOpen && (
            <div className="pb-3 fade-up">
              <form onSubmit={(e) => { e.preventDefault(); if (searchVal) window.location.href = `/search?q=${encodeURIComponent(searchVal)}`; }}>
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
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/25 focus:border-[#e02020] transition-all"
                  />
                </div>
              </form>
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
              <span className="font-display font-black text-xl text-neutral-900 dark:text-white">CODEX</span>
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
