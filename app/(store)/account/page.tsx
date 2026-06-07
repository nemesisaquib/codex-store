"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Heart, MapPin, ArrowRight, TrendingUp } from "lucide-react";

interface Order { id:string; order_number:string; total:number; status:string; created_at:string; items:string }

const STATUS_STYLE: Record<string,string> = {
  processing:"bg-blue-50 text-blue-600", pending:"bg-neutral-100 text-neutral-500",
  confirmed:"bg-purple-50 text-purple-600", shipped:"bg-yellow-50 text-yellow-600",
  delivered:"bg-green-50 text-green-600", returned:"bg-red-50 text-red-500",
};

export default function AccountDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/customer").then(r=>r.json()).then(d=>{
      if (!d.customer) { setLoading(false); return; }
      setName(d.customer.first_name);
      fetch(`/api/orders?email=${d.customer.email}&limit=20`)
        .then(r=>r.json())
        .then(o => { setOrders(o.orders ?? []); setLoading(false); });
    });
  }, []);

  const totalSpent = orders.reduce((s,o)=>s+o.total,0);
  const itemCount = (o: Order) => { try { return JSON.parse(o.items).length; } catch { return 0; } };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Welcome back, {name || "Friend"} 👋</h1>
        <p className="text-neutral-500 text-sm mt-1">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Total Orders",  value:loading?"—":String(orders.length), icon:Package,    color:"#e02020"},
          {label:"Total Spent",   value:loading?"—":`$${totalSpent.toLocaleString()}`, icon:TrendingUp, color:"#22c55e"},
          {label:"Wishlist Items",value:"6", icon:Heart,   color:"#d4a017"},
          {label:"Addresses",     value:"2", icon:MapPin,  color:"#3b82f6"},
        ].map(({label,value,icon:Icon,color})=>(
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:`${color}18`}}>
              <Icon size={18} style={{color}}/>
            </div>
            <p className="font-display font-black text-2xl text-neutral-900 dark:text-white">{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-neutral-900 dark:text-white">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs text-[#e02020] hover:underline flex items-center gap-1">View all <ArrowRight size={12}/></Link>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"/>)}</div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0,5).map(o=>(
              <div key={o.id} className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div>
                  <p className="font-mono-brand text-xs font-bold text-neutral-900 dark:text-white">{o.order_number}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(o.created_at).toLocaleDateString()} · {itemCount(o)} items</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[o.status]??STATUS_STYLE.pending}`}>{o.status}</span>
                  <p className="font-bold text-sm text-neutral-900 dark:text-white">${o.total}</p>
                  <Link href={`/account/orders/${o.order_number}`} className="text-neutral-400 hover:text-[#e02020] transition-colors"><ArrowRight size={14}/></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
