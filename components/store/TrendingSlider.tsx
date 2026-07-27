"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import type { Product } from "./ProductCard";

export default function TrendingSlider({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      const currentScroll = scrollRef.current.scrollLeft;
      scrollRef.current.scrollTo({
        left: dir === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .slider-card {
          flex: 0 0 calc(85%) !important;
          min-width: calc(85%) !important;
        }
        @media (min-width: 640px) {
          .slider-card {
            flex: 0 0 calc(50% - 12px) !important;
            min-width: calc(50% - 12px) !important;
          }
        }
        @media (min-width: 768px) {
          .slider-card {
            flex: 0 0 calc(33.333% - 16px) !important;
            min-width: calc(33.333% - 16px) !important;
          }
        }
        @media (min-width: 1024px) {
          .slider-card {
            flex: 0 0 calc(25% - 18px) !important;
            min-width: calc(25% - 18px) !important;
          }
        }
        .slider-nav-btn {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          border: 1px solid #e5e5e5;
          background-color: #ffffff;
          color: #171717;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          cursor: pointer;
        }
        .slider-nav-btn:hover {
          background-color: #171717 !important;
          border-color: #171717 !important;
          color: #ffffff !important;
        }
        .slider-nav-btn:active {
          transform: scale(0.95);
        }
      `}</style>
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#e02020] uppercase mb-2">Editor's Pick</p>
          <h2 className="font-display font-medium text-3xl md:text-4xl text-neutral-900 tracking-tight">
            Trending Selection
          </h2>
        </div>
        
        <div className="flex items-center justify-between md:justify-end gap-6">
          <Link href="/category/all" className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors group">
            Shop all trends <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => scroll("left")} 
              aria-label="Scroll left"
              className="slider-nav-btn"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => scroll("right")} 
              aria-label="Scroll right"
              className="slider-nav-btn"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div 
        ref={scrollRef}
        className="hide-scrollbar flex overflow-x-auto snap-x snap-mandatory pb-4 gap-4 md:gap-6 items-stretch"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="snap-start flex-none slider-card"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </>
  );
}
