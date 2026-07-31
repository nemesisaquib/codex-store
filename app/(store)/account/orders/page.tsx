"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight, Search } from "lucide-react";

interface Order { id:string; order_number:string; total:number; status:string; created_at:string; items:string }

const S: Record<string,string> = {
  processing:"bg-blue-50 text-blue-600", pending:"bg-neutral-100 text-neutral-500",
  confirmed:"bg-purple-50 text-purple-600", shipped:"bg-yellow-50 text-yellow-600",
  delivered:"bg-green-50 text-green-600", returned:"bg-neutral-100 text-neutral-500",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/customer").then(r=>r.json()).then(d=>{
      if (!d.customer) { setLoading(false); return; }
      fetch(`/api/orders?email=${d.customer.email}&limit=50`)
        .then(r=>r.json())
        .then(o => { setOrders(o.orders ?? []); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const parseItems = (o: Order) => { try { return JSON.parse(o.items) as {name:string;qty:number;price:number;image?:string}[]; } catch { return []; } };
  const filtered = orders.filter(o => o.order_number.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Order History</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders…"
            className="pl-8 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#e02020]"/>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({length:3}).map((_,i)=><div key={i} className="h-40 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl py-16 text-center">
          <Package size={40} className="mx-auto text-neutral-200 mb-3"/>
          <p className="text-neutral-500 font-medium">No orders found</p>
          <Link href="/category/women" className="text-sm text-[#e02020] hover:underline mt-2 inline-block">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(o => {
            const items = parseItems(o);
            return (
              <div key={o.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono-brand text-sm font-bold text-neutral-900 dark:text-white">{o.order_number}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{new Date(o.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${S[o.status]??S.pending}`}>{o.status}</span>
                </div>
                <div className="flex gap-2 mb-4">
                  {items.map((item,i)=>(
                    <div key={i} className="w-14 h-16 rounded-lg flex-shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2"/> : <Package size={18} className="text-neutral-300"/>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mb-3">{items.map(i=>i.name).join(" · ")}</p>
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="font-bold text-neutral-900 dark:text-white">${o.total}</p>
                  <Link href={`/account/orders/${o.order_number}`} className="flex items-center gap-1.5 text-xs font-medium text-[#e02020] hover:underline">
                    View details <ArrowRight size={12}/>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
