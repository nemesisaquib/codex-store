"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, Package, Heart, MapPin, Settings, LogOut, Star } from "lucide-react";

const NAV = [
  { href: "/account",           icon: User,     label: "Dashboard" },
  { href: "/account/orders",    icon: Package,  label: "Orders" },
  { href: "/account/wishlist",  icon: Heart,    label: "Wishlist" },
  { href: "/account/addresses", icon: MapPin,   label: "Addresses" },
  { href: "/account/settings",  icon: Settings, label: "Settings" },
];

interface Customer { id: string; email: string; first_name: string; last_name: string; loyalty_pts?: number; tier?: string }

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/customer")
      .then(r => r.json())
      .then(d => {
        if (!d.customer) {
          router.push("/auth/login");
        } else {
          // also pull loyalty data
          fetch("/api/customer/profile").then(r => r.json()).then(p => {
            setCustomer({ ...d.customer, ...(p.profile || {}) });
            setLoading(false);
          });
        }
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/customer", { method: "DELETE" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400 text-sm">Loading account…</p>
      </div>
    );
  }
  if (!customer) return null;

  const initial = (customer.first_name?.[0] || customer.email[0]).toUpperCase();
  const fullName = `${customer.first_name} ${customer.last_name}`.trim() || customer.email;
  const isVIP = customer.tier === "vip";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-[100px]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 sticky top-28">
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e02020] to-[#7d1111] flex items-center justify-center text-white font-display font-black text-xl">{initial}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{fullName}</p>
                  {isVIP && (
                    <div className="flex items-center gap-1 text-[#d4a017] text-xs mt-0.5">
                      <Star size={10} fill="currentColor" /><span>VIP Member</span>
                    </div>
                  )}
                  {!isVIP && customer.tier && (
                    <p className="text-xs text-neutral-400 capitalize mt-0.5">{customer.tier} Tier</p>
                  )}
                </div>
              </div>

              <nav className="space-y-1">
                {NAV.map(({ href, icon: Icon, label }) => {
                  const active = path === href;
                  return (
                    <Link key={href} href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                        active
                          ? "bg-[#e02020]/10 text-[#e02020] font-medium"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-[#e02020]"
                      }`}>
                      <Icon size={16} className={active ? "text-[#e02020]" : "group-hover:text-[#e02020] transition-colors"} />
                      {label}
                    </Link>
                  );
                })}
                <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all w-full mt-2">
                  <LogOut size={16} /> Sign Out
                </button>
              </nav>

              {/* Loyalty points */}
              {(customer.loyalty_pts ?? 0) > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-br from-[#e02020]/10 to-[#e02020]/5 rounded-xl border border-[#e02020]/15">
                  <p className="text-xs font-bold text-[#e02020] uppercase tracking-wider mb-1">Loyalty Points</p>
                  <p className="font-display font-black text-2xl text-neutral-900 dark:text-white">{(customer.loyalty_pts ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">≈ ${((customer.loyalty_pts ?? 0) / 100).toFixed(2)} reward value</p>
                </div>
              )}
            </div>
          </aside>

          {/* Main */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
