import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return await getPageMetadata(`/category/${(slug ?? []).join("/")}`);
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
