import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

export default function HeroBanner() {
  const categories = [
    {
      title: "Fresh sweatshirts",
      href: "/category/women",
      image: getOptimizedImageUrl("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f", { width: 1400, quality: 90 }),
    },
    {
      title: "New drop from Supreme",
      href: "/category/men",
      image: getOptimizedImageUrl("https://images.unsplash.com/photo-1509631179647-0177331693ae", { width: 1400, quality: 90 }),
    },
    {
      title: "Exclusive access",
      href: "/category/all",
      image: getOptimizedImageUrl("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6", { width: 1400, quality: 90 }),
    }
  ];

  return (
    <>
      <style>{`
        .hero-banner-section {
          width: 100%;
          height: 90vh !important;
          display: flex;
          flex-direction: column;
          padding-top: 68px;
          padding-bottom: 0;
        }
        @media (min-width: 768px) {
          .hero-banner-section {
            height: 80vh !important;
            flex-direction: row;
          }
        }
      `}</style>
      <section className="hero-banner-section">
        {categories.map((c, i) => (
          <div key={i} className="group relative w-full md:w-1/3 h-[300px] md:h-full overflow-hidden border-b md:border-b-0 md:border-r border-neutral-900/10 last:border-0">
            <Link href={c.href} className="block w-full h-full relative" aria-label={`Shop ${c.title}`}>
              <Image 
                src={c.image} 
                alt={c.title} 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
                className="object-cover object-center transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 md:right-8 flex items-end justify-between z-10">
                <h2 className="text-2xl md:text-3xl font-display font-medium text-white leading-tight max-w-[200px]">{c.title}</h2>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out hidden md:flex shrink-0">
                   <ArrowUpRight size={20} className="text-black" />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </section>
    </>
  );
}
