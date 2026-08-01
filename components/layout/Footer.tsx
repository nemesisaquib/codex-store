import Link from "next/link";
import { ShieldCheck, Lock, Cpu, CheckCircle2 } from "lucide-react";

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

/* ── Inline SVG Payment Badges ── */
const PaymentIcons = () => (
  <div className="flex items-center gap-2 flex-wrap">
    {/* Visa */}
    <div className="px-2.5 py-1.5 bg-[#181a20] border border-neutral-800 rounded-lg flex items-center justify-center text-white" title="Visa">
      <svg className="h-3.5 w-auto" viewBox="0 0 36 12" fill="currentColor">
        <path d="M13.882 0L9.805 11.758H6.551L10.628 0h3.254zm10.741 7.795l1.715-4.632.99 4.632h-2.705zm3.766 3.963h3.019L28.795 0h-3.018c-.67 0-1.25.385-1.5 1.006L19.46 11.758h3.407s.557-1.528.683-1.874h4.156c.097.433.383 1.874.383 1.874zm-11.23-2.613c-.157-1.077-1.085-1.89-2.39-2.227l-1.393-.362c-.75-.192-1.077-.45-1.077-.833 0-.384.45-.672 1.258-.672.934 0 1.77.304 2.298.636l.542-2.457a8.775 8.775 0 00-3.08-.51c-3.14 0-5.344 1.637-5.36 3.966-.03 1.733 1.572 2.697 2.78 3.277 1.242.594 1.662.977 1.66 1.51-.005.819-.997 1.196-1.92 1.196-1.618 0-2.576-.46-3.327-.807l-.582 2.646c.729.33 2.074.614 3.468.629 3.326 0 5.485-1.61 5.513-4.104.01-1.378-.838-2.434-2.45-3.21zm-13.88.396L.452 1.006C.2.75 0 .614 0 .307A.307.307 0 01.307 0h5.163c.69 0 1.28.47 1.44 1.156l2.456 9.474H3.279z"/>
      </svg>
    </div>
    {/* Mastercard */}
    <div className="px-2.5 py-1.5 bg-[#181a20] border border-neutral-800 rounded-lg flex items-center justify-center" title="Mastercard">
      <svg className="h-3.5 w-auto" viewBox="0 0 36 22" fill="none">
        <circle cx="12" cy="11" r="10" fill="#EB001B"/>
        <circle cx="24" cy="11" r="10" fill="#F79E1B" fillOpacity="0.9"/>
        <path d="M18 3.464a9.96 9.96 0 013.742 7.536A9.96 9.96 0 0118 18.536 9.96 9.96 0 0114.258 11 9.96 9.96 0 0118 3.464z" fill="#FF5F00"/>
      </svg>
    </div>
    {/* Apple Pay */}
    <div className="px-2.5 py-1.5 bg-[#181a20] border border-neutral-800 rounded-lg flex items-center justify-center text-white font-bold text-[11px]" title="Apple Pay">
      Pay
    </div>
    {/* Google Pay */}
    <div className="px-2.5 py-1.5 bg-[#181a20] border border-neutral-800 rounded-lg flex items-center justify-center text-white font-bold text-[11px]" title="Google Pay">
      <span className="text-blue-400">G</span><span className="text-[#e02020]">P</span><span className="text-yellow-400">a</span><span className="text-green-400">y</span>
    </div>
    {/* PayPal */}
    <div className="px-2.5 py-1.5 bg-[#181a20] border border-neutral-800 rounded-lg flex items-center justify-center text-blue-400 font-bold text-[11px] italic" title="PayPal">
      PayPal
    </div>
    {/* Klarna */}
    <div className="px-2.5 py-1.5 bg-[#181a20] border border-neutral-800 rounded-lg flex items-center justify-center text-pink-400 font-bold text-[11px]" title="Klarna">
      Klarna.
    </div>
  </div>
);

/* ── Inline SVG Social Icons ── */
const SocialIcons = () => (
  <div className="flex gap-3 mt-4">
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
        className="w-8 h-8 rounded-full border border-neutral-800 bg-[#14161c] flex items-center justify-center text-neutral-400 hover:border-[#e02020] hover:text-[#e02020] hover:bg-[#1a1d26] transition-all"
      >
        {svg}
      </a>
    ))}
  </div>
);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0e0f12] text-neutral-400 border-t border-neutral-800/80">
      {/* 🔒 Top Security & Trust Assurance Bar with Charcoal Shade */}
      <div className="border-b border-neutral-800/60 bg-[#13151b]/80 py-8 px-6 lg:px-10">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              icon: Lock,
              title: "256-Bit SSL Encrypted",
              desc: "Bank-level TLS 1.3 encryption on every transaction",
            },
            {
              icon: ShieldCheck,
              title: "PCI-DSS Level 1 Security",
              desc: "Verified compliant payment gateway processing",
            },
            {
              icon: Cpu,
              title: "Firewall Protected",
              desc: "Database protected by anti-hoarding threat shields",
            },
            {
              icon: CheckCircle2,
              title: "100% Buyer Protection",
              desc: "Guaranteed authentic products & 30-day money-back",
            },
          ].map((sec, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#1c1e26] border border-neutral-700/50 text-[#e02020] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <sec.icon size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">{sec.title}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{sec.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1 space-y-3.5">
            <Link href="/" className="inline-block">
              <img
                src="/Logo/Eshop.png"
                alt="E-shop Logo"
                className="h-9 w-auto object-contain brightness-0 invert"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                }}
              />
            </Link>
            <p className="text-sm leading-relaxed text-neutral-400">
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
                      className="text-sm text-neutral-400 hover:text-white hover:translate-x-0.5 transition-all inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods & Security Compliance Row */}
        <div className="border-t border-neutral-800/60 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-xs font-bold text-neutral-200">Guaranteed Safe &amp; Secure Checkout</p>
            <p className="text-[11px] text-neutral-400">256-Bit TLS Encryption · PCI-DSS Level 1 Compliant Gateway</p>
          </div>
          <PaymentIcons />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-800/80 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs bg-[#090a0d] -mx-6 lg:-mx-10 px-6 lg:px-10 -mb-14 pb-8">
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

          <div className="flex gap-6 text-neutral-400">
            <Link href="/privacy"  className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms"    className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link href="/cookies"  className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
