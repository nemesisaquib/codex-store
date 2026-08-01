"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Heart, MapPin, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  items: string;
}

const STATUS_STYLE: Record<string, string> = {
  processing: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  pending:    "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
  confirmed:  "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  shipped:    "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  delivered:  "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  returned:   "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  refunded:   "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
};

export default function AccountDashboard() {
  const { formatPrice } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [addressCount, setAddressCount] = useState<number>(0);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/customer")
      .then((r) => r.json())
      .then((d) => {
        if (!d.customer) {
          setLoading(false);
          return;
        }
        setName(d.customer.first_name || d.customer.name || "Valued Customer");

        // 1. Fetch Real Orders & Total Spent
        fetch(`/api/orders?email=${encodeURIComponent(d.customer.email)}&limit=20`)
          .then((r) => r.json())
          .then((o) => setOrders(o.orders ?? []))
          .catch(() => {});

        // 2. Fetch Real Wishlist Count
        fetch("/api/wishlist")
          .then((r) => r.json())
          .then((w) => setWishlistCount(w.items?.length ?? 0))
          .catch(() => {});

        // 3. Fetch Real Addresses Count
        fetch("/api/addresses")
          .then((r) => r.json())
          .then((a) => setAddressCount(a.addresses?.length ?? 0))
          .catch(() => {});

        setLoading(false);
      })
      .catch((err) => {
        console.error("Account dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  const totalSpent = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const itemCount = (o: Order) => {
    try {
      return JSON.parse(o.items).length;
    } catch {
      return 1;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div>
        <h1 className="font-sans font-extrabold text-2xl md:text-3xl text-neutral-900 dark:text-white tracking-tight">
          Welcome back, {name || "Customer"} 👋
        </h1>
        <p className="text-neutral-500 text-xs md:text-sm mt-1">
          Here is real-time activity and analytics for your account.
        </p>
      </div>

      {/* 4 Stat Cards with Real Backend Data & Modern Clean Typography */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Orders",
            value: loading ? "—" : String(orders.length),
            icon: Package,
            color: "text-rose-600",
            bg: "bg-rose-50 dark:bg-rose-950/40",
            href: "/account/orders",
          },
          {
            label: "Total Spent",
            value: loading ? "—" : formatPrice(totalSpent),
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
            href: "/account/orders",
          },
          {
            label: "Wishlist Items",
            value: loading ? "—" : String(wishlistCount),
            icon: Heart,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/40",
            href: "/account/wishlist",
          },
          {
            label: "Saved Addresses",
            value: loading ? "—" : String(addressCount),
            icon: MapPin,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/40",
            href: "/account/addresses",
          },
        ].map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link
            key={label}
            href={href}
            className="group bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <Icon size={18} />
            </div>
            <p className="font-sans font-black text-2xl md:text-3xl text-neutral-900 dark:text-white tracking-tight">
              {value}
            </p>
            <p className="text-xs font-medium text-neutral-400 mt-1 flex items-center justify-between">
              {label} <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#e02020]" />
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Orders List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs font-bold text-[#e02020] hover:underline flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Package size={32} className="mx-auto text-neutral-300 dark:text-neutral-700" />
            <p className="text-xs font-semibold text-neutral-500">No recent orders yet</p>
            <Link href="/" className="text-xs font-bold text-[#e02020] hover:underline inline-block pt-1">
              Browse Store &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between py-3 px-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800"
              >
                <div>
                  <p className="font-mono-brand text-xs font-bold text-neutral-900 dark:text-white">{o.order_number}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {itemCount(o)} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-3.5">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[o.status] ?? STATUS_STYLE.pending}`}>
                    {o.status}
                  </span>
                  <p className="font-sans font-extrabold text-sm text-neutral-900 dark:text-white">
                    {formatPrice(o.total)}
                  </p>
                  <Link
                    href={`/account/orders/${o.order_number}`}
                    className="p-1.5 text-neutral-400 hover:text-[#e02020] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                    title="View Order Details"
                  >
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
