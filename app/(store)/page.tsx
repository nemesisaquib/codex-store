import type { Metadata } from "next";
import HeroBanner        from "@/components/store/HeroBanner";
import CategoryStrip     from "@/components/store/CategoryStrip";
import TrendingSelection from "@/components/store/TrendingSelection";
import FeaturedProducts  from "@/components/store/FeaturedProducts";
import VideoShowcase     from "@/components/store/VideoShowcase";
import NewArrivalsCarousel from "@/components/store/NewArrivalsCarousel";
import BrandStory        from "@/components/store/BrandStory";
import SocialFeed        from "@/components/store/SocialFeed";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata("/");
}

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryStrip />
      <TrendingSelection />
      <FeaturedProducts />
      <VideoShowcase />
      <NewArrivalsCarousel />
      <BrandStory />
      <SocialFeed />
    </>
  );
}
