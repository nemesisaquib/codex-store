"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-6 pt-[100px]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-[#e02020]" />
        </div>
        <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">Cart Sidebar</h1>
        <p className="text-neutral-500 mb-8">
          Click the <strong className="text-[#e02020]">shopping bag icon</strong> in the top navigation to view and manage your cart.
        </p>
        <p className="text-xs text-neutral-400 mb-8">Redirecting to home in 3 seconds...</p>
        <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-[#e02020] text-white font-semibold rounded-full hover:bg-[#c01a1a] transition-colors">
          Back Home <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
