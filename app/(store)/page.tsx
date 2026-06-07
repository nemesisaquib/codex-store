import type { Metadata } from "next";
import HeroBanner        from "@/components/store/HeroBanner";
import CategoryStrip     from "@/components/store/CategoryStrip";
import FeaturedProducts  from "@/components/store/FeaturedProducts";
import VideoShowcase     from "@/components/store/VideoShowcase";
import NewArrivalsCarousel from "@/components/store/NewArrivalsCarousel";
import BrandStory        from "@/components/store/BrandStory";
import { getPageMetadata } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return getPageMetadata("/");
}

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryStrip />
      <FeaturedProducts />
      <VideoShowcase />
      <NewArrivalsCarousel />
      <BrandStory />
    </>
  );
}
