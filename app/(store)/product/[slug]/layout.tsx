import type { Metadata } from "next";
import { getProductMetadata } from "@/lib/seo";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return await getProductMetadata(slug);
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
