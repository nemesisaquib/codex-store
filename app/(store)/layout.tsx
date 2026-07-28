import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ConsentBanner from "@/components/store/ConsentBanner";

export const dynamic = "force-dynamic"; // Always SSR — picks up DB changes live


export default function StoreLayout({ children }: { children: React.ReactNode }) {
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
