"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Truck, Mail, ArrowRight, Package2 } from "lucide-react";

interface Order {
  order_number: string;
  total: number;
  shipping_method: string;
  items: string;
  created_at: string;
  status: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNum = searchParams.get("order");
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
        <p className="text-neutral-400">Loading order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <h1 className="font-display font-black text-2xl text-neutral-900 dark:text-white mb-2">Order Not Found</h1>
          <p className="text-neutral-500 mb-8">We couldn't find your order. Please check your email for confirmation.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-[#e02020] text-white font-semibold rounded-full hover:bg-[#c01a1a] transition-colors">
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={44} className="text-green-500" />
        </div>
        <h1 className="font-display font-black text-3xl text-neutral-900 dark:text-white mb-2">Order Confirmed!</h1>
        <p className="text-neutral-500 mb-2">Thank you for shopping with CODEX.</p>
        <p className="font-mono-brand text-[#e02020] font-bold text-sm mb-8">{order.order_number}</p>

        {/* Timeline */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-8 text-left space-y-4">
          {timeline.map(({ Icon, t, s, done }) => (
            <div key={t} className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-50" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                <Icon size={18} className={done ? "text-green-600" : "text-neutral-400"} />
              </div>
              <div>
                <p className="font-semibold text-sm text-neutral-900 dark:text-white">{t}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{s}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order items */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mb-4 text-left">Items Ordered ({items.length})</h3>
          <div className="space-y-3">
            {items.length ? (
              items.map((i: { name: string; qty: number; price: number }, idx: number) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="w-10 h-12 rounded-lg flex-shrink-0 bg-neutral-100 dark:bg-neutral-800" />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-neutral-900 dark:text-white">{i.name}</p>
                    <p className="text-[10px] text-neutral-400">Qty: {i.qty}</p>
                  </div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">${(i.price * i.qty).toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400">No items</p>
            )}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between text-sm font-bold text-neutral-900 dark:text-white">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/account/orders" className="flex-1 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-[#e02020] hover:text-[#e02020] transition-colors text-center">
            Track Order
          </Link>
          <Link href="/" className="flex-1 py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group">
            Continue Shopping <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
