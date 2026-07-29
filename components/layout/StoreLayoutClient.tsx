"use client";
import { usePathname } from "next/navigation";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ConsentBanner from "@/components/store/ConsentBanner";

export default function StoreLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMinimalCheckout = pathname?.startsWith("/checkout");

  if (isMinimalCheckout) {
    return <main className="flex-1 min-h-screen bg-neutral-50 dark:bg-neutral-950">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ConsentBanner />
    </div>
  );
}
