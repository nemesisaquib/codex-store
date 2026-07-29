import StoreLayoutClient from "@/components/layout/StoreLayoutClient";

export const dynamic = "force-dynamic"; // Always SSR — picks up DB changes live

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreLayoutClient>{children}</StoreLayoutClient>;
}
