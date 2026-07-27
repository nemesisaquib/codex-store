import { fetchProducts, toProduct } from "@/lib/api";
import TrendingSlider from "./TrendingSlider";

export default async function TrendingSelection() {
  const { products: raw } = await fetchProducts({ limit: 12 });
  const products = raw.map(toProduct);

  if (products.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden pt-20 pb-16 bg-[#fcfcfc]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <TrendingSlider products={products} />
      </div>
    </section>
  );
}
