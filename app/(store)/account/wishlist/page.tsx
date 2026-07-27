"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

interface WishItem { id: string; product_id: string; name: string; price: number; image_url?: string; stock: number }

export default function WishlistPage() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist").then(r => r.json()).then(d => { setItems(d.items ?? []); setLoading(false); });
  }, []);

  const remove = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      fetch("/api/wishlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.product_id }) });
      setItems(p => p.filter(i => i.id !== id));
    }
  };

  if (loading) return <div className="py-16 text-center text-neutral-400">Loading…</div>;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-6">My Wishlist ({items.length})</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={40} className="mx-auto text-neutral-200 mb-3" />
          <p className="text-neutral-500 font-medium">No items in your wishlist</p>
          <Link href="/category/women" className="text-sm text-[#e02020] hover:underline mt-2 inline-block">Continue shopping</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden group">
              <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" /> : ""}
                <button onClick={() => remove(item.id)} className="absolute top-2 right-2 p-2 bg-white dark:bg-neutral-800 rounded-full text-[#e02020] hover:bg-[#e02020] hover:text-white transition-colors">
                  <Heart size={16} className="fill-current" />
                </button>
              </div>
              <div className="p-3">
                <p className="font-medium text-sm text-neutral-900 dark:text-white line-clamp-2">{item.name}</p>
                <p className="font-bold text-sm text-neutral-900 dark:text-white mt-1">${item.price}</p>
                <Link href={`/product/${item.product_id}`} className="text-[10px] text-[#e02020] hover:underline mt-2 inline-block">View</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
