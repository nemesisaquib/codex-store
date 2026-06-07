import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
