import Link from "next/link";

const cols = [
  {
    title: "Shop",
    links: [
      { label: "Women",        href: "/category/women" },
      { label: "Men",          href: "/category/men" },
      { label: "Kids",         href: "/category/kids" },
      { label: "Sale",         href: "/sale" },
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "All Brands",   href: "/brands" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Size Guide",          href: "/size-guide" },
      { label: "Track Your Order",    href: "/track" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "Shipping Info",       href: "/shipping" },
      { label: "FAQ",                 href: "/faq" },
      { label: "Contact Us",          href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us",          href: "/about" },
      { label: "Journal & Blog",    href: "/blog" },
      { label: "Fashion Guides",    href: "/blog?category=Fashion%20Guides" },
      { label: "Careers",           href: "/careers" },
      { label: "Press",             href: "/press" },
      { label: "Affiliates",        href: "/affiliates" },
      { label: "Sustainability",    href: "/sustainability" },
    ],
  },
];

/* ── Inline SVG brand icons – no lucide text fallbacks ── */
const SocialIcons = () => (
  <div className="flex gap-3 mt-5">
    {[
      {
        label: "Instagram",
        href: "#",
        svg: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        ),
      },
      {
        label: "X / Twitter",
        href: "#",
        svg: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        ),
      },
      {
        label: "TikTok",
        href: "#",
        svg: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.17a8.18 8.18 0 004.78 1.52V7.24a4.85 4.85 0 01-1.01-.55z"/>
          </svg>
        ),
      },
      {
        label: "Pinterest",
        href: "#",
        svg: (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
        ),
      },
    ].map(({ label, href, svg }) => (
      <a
        key={label}
        href={href}
        aria-label={label}
        className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-400 hover:border-[#e02020] hover:text-[#e02020] transition-colors"
      >
        {svg}
      </a>
    ))}
  </div>
);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-neutral-400">
      {/* Main footer grid */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <div 
                style={{ 
                  width: "140px", 
                  height: "40px", 
                  backgroundColor: "#ffffff",
                  maskImage: 'url("/Logo+ favicon/Eshop.png")',
                  WebkitMaskImage: 'url("/Logo+ favicon/Eshop.png")',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'left center',
                  WebkitMaskPosition: 'left center'
                }} 
                aria-label="E-shop Logo"
              />
            </Link>
            <p className="text-sm leading-relaxed">
              Premium global fashion for everyone. Wear the World.
            </p>
            <SocialIcons />
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-5">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white hover:translate-x-0.5 transition-all inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-800 mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Dynamic credit */}
          <p className="text-neutral-500">
            Design &amp; Development by{" "}
            <a 
              href="https://aquibdesigner.framer.website/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-[#e02020] font-semibold transition-colors underline decoration-neutral-700 underline-offset-4"
            >
              Mohd Aquib Javed
            </a>
            {" "}©{" "}
            <span suppressHydrationWarning>{year}</span>
            {" · E-shop"}
          </p>

          <div className="flex gap-6">
            <Link href="/privacy"  className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms"    className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link href="/cookies"  className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
