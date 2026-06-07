import Link from "next/link";
import { ArrowRight, Globe, Shield, RefreshCw, Star } from "lucide-react";

const perks = [
  { Icon: Globe,      title: "Global Delivery",   desc: "Free shipping to 120+ countries on orders over $150." },
  { Icon: Shield,     title: "Secure Payments",   desc: "PCI DSS Level 1 certified. Shop with confidence." },
  { Icon: RefreshCw,  title: "Easy Returns",      desc: "30-day hassle-free returns — no questions asked." },
  { Icon: Star,       title: "Premium Quality",   desc: "Every item curated for quality, fit, and longevity." },
];

export default function BrandStory() {
  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20">
      {/* Split layout */}
      <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
        {/* Image side */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl aspect-[4/5]">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&auto=format"
              alt="CODEX brand story"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"/>
            {/* Overlay card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e02020] rounded-full flex items-center justify-center text-white font-display font-black text-lg">C</div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">CODEX Magazine</p>
                  <p className="text-[11px] text-neutral-500">Summer 2026 Edit — out now</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating stat */}
          <div className="absolute -right-4 top-12 bg-[#e02020] text-white rounded-2xl p-5 shadow-2xl hidden lg:block">
            <p className="font-display font-black text-4xl">2M+</p>
            <p className="text-white/80 text-xs uppercase tracking-wider mt-1">Happy customers</p>
          </div>
        </div>

        {/* Text side */}
        <div>
          <p className="text-[#e02020] text-xs font-bold tracking-widest uppercase mb-4">Our Story</p>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-neutral-900 dark:text-white leading-tight mb-6">
            Fashion that<br />
            <em className="italic text-[#e02020]">crosses borders</em>
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
            CODEX was born from the belief that premium fashion should be accessible everywhere.
            We partner with the world&rsquo;s finest designers and emerging labels to bring you a curated
            collection that spans every style, every culture, and every occasion.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
            From London fashion weeks to Tokyo street style — we source globally, ship globally,
            and celebrate the extraordinary diversity of human expression through clothing.
          </p>
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-[#e02020] font-semibold text-sm hover:gap-3 transition-all"
          >
            Read our story
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Perks strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {perks.map(({ Icon, title, desc }) => (
          <div key={title} className="text-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-900 transition-colors group">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#e02020]/10 flex items-center justify-center group-hover:bg-[#e02020] transition-colors">
              <Icon size={22} className="text-[#e02020] group-hover:text-white transition-colors" />
            </div>
            <p className="font-semibold text-neutral-900 dark:text-white text-sm mb-2">{title}</p>
            <p className="text-neutral-500 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
