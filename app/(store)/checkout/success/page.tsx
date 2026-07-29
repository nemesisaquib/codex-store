"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Truck, Mail, ArrowRight } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

interface Order {
  order_number: string;
  total: number;
  shipping_method: string;
  items: string;
  created_at: string;
  status: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNum = searchParams.get("order");
  const { formatPrice } = useSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNum) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${orderNum}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.error ? null : d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderNum]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400 text-sm">Loading order details…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <h1 className="font-display font-black text-2xl text-neutral-900 dark:text-white mb-2">Order Not Found</h1>
          <p className="text-neutral-500 mb-8 text-sm">We couldn't find your order. Please check your email for confirmation.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-[#e02020] text-white font-semibold rounded-full hover:bg-[#c01a1a] transition-colors text-sm">
            Back Home <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const items = (() => {
    try {
      return JSON.parse(order.items);
    } catch {
      return [];
    }
  })();

  const timeline = [
    { Icon: Mail, t: "Confirmation email sent", s: "Check your inbox for order details and invoice.", done: true },
    { Icon: Package, t: "Processing your order", s: "We're preparing your items for dispatch.", done: ["processing", "shipped", "delivered"].includes(order.status) },
    { Icon: Truck, t: "Estimated delivery", s: `3–7 business days · ${order.shipping_method || "Standard"} Shipping`, done: order.status === "delivered" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle size={44} className="text-emerald-600" />
        </div>
        <h1 className="font-display font-black text-3xl text-neutral-900 dark:text-white mb-2">Order Confirmed!</h1>
        <p className="text-neutral-500 text-sm mb-2">Thank you for shopping with E-shop.</p>
        <p className="font-mono-brand text-[#e02020] font-bold text-sm mb-8">{order.order_number}</p>

        {/* Timeline */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-6 text-left space-y-4 shadow-sm">
          {timeline.map(({ Icon, t, s, done }) => (
            <div key={t} className="flex gap-4 items-start">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm text-neutral-900 dark:text-white">{t}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{s}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order items with Real Thumbnails & formatPrice */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mb-4 text-left uppercase tracking-wider">
            Items Ordered ({items.length})
          </h3>
          <div className="space-y-3">
            {items.length ? (
              items.map((i: { name: string; qty: number; price: number; image?: string }, idx: number) => (
                <div key={idx} className="flex gap-3 items-center p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                  <div className="w-10 h-12 rounded-lg flex-shrink-0 bg-white dark:bg-neutral-800 overflow-hidden relative border border-neutral-200 dark:border-neutral-700">
                    {(i.image || (i as any).image_url || (i as any).img || (i as any).imageUrl) ? (
                      <img src={i.image || (i as any).image_url || (i as any).img || (i as any).imageUrl} alt={i.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">🛍️</div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{i.name}</p>
                    <p className="text-[10px] font-medium text-neutral-400">Qty: {i.qty}</p>
                  </div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    {formatPrice(i.price * i.qty)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400">No items</p>
            )}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex justify-between text-sm font-bold text-neutral-900 dark:text-white">
              <span>Total</span>
              <span className="text-[#e02020] text-base">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/account/orders" className="flex-1 py-3.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-[#e02020] hover:text-[#e02020] transition-colors text-center">
            Track Order
          </Link>
          <Link href="/" className="flex-1 py-3.5 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group shadow-md">
            Continue Shopping <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-neutral-400">Loading order…</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
