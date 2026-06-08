"use client";
import { useEffect, useState } from "react";
import { Search, Download, Star, Eye, X, Mail, MapPin, ShoppingBag, Award } from "lucide-react";

interface Customer {
  id:string; first_name:string; last_name:string; email:string; phone:string;
  tier:string; status:string; loyalty_pts:number; country:string|null;
  total_orders:number; total_spend:number; created_at:string;
}
interface Order { id:string; order_number:string; total:number; status:string; created_at:string }

const TIER: Record<string,string> = {
  vip:"bg-[#d4a017]/15 text-[#d4a017]", loyal:"bg-blue-100 text-blue-700",
  regular:"bg-neutral-100 text-neutral-500", new:"bg-green-100 text-green-700",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState("");
  const [tier, setTier]           = useState("all");
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Customer|null>(null);
  const [orders, setOrders]       = useState<Order[]>([]);

  const load = () => {
    setLoading(true);
    fetch(`/api/customers?q=${search}&limit=50`)
      .then(r=>r.json())
      .then(d => {
        let list = (d.customers ?? []) as Customer[];
        if (tier !== "all") list = list.filter(c => c.tier === tier);
        setCustomers(list); setTotal(d.total ?? 0); setLoading(false);
      });
  };
  useEffect(load, [search, tier]);

  const openDetail = (c: Customer) => {
    setSelected(c);
    fetch(`/api/customers/${c.id}`).then(r=>r.json()).then(d => setOrders(d.orders ?? []));
  };

  const updateTier = async (id: string, newTier: string) => {
    await fetch(`/api/customers/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({tier:newTier})});
    if (selected?.id === id) setSelected(p=>p?{...p,tier:newTier}:null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Customers</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{total} total · SQLite</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-[#e02020] transition-colors">
          <Download size={14}/> Export CSV
        </button>
      </div>

      {/* Tier filter */}
      <div className="flex gap-2 flex-wrap">
        {["all","vip","loyal","regular","new"].map(t => (
          <button key={t} onClick={()=>setTier(t)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${tier===t?"bg-[#e02020] text-white":"bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-700 hover:text-[#e02020]"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…"
              className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>{["Customer","Orders","Total Spend","Loyalty","Tier","Status",""].map(h=>
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-neutral-400">Loading…</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onClick={()=>openDetail(c)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e02020] to-[#7d1111] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{c.first_name[0]}</div>
                      <div><p className="text-sm font-medium text-neutral-900 dark:text-white">{c.first_name} {c.last_name}</p><p className="text-[10px] text-neutral-400">{c.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-neutral-600 dark:text-neutral-400">{c.total_orders}</td>
                  <td className="px-5 py-4 text-sm font-bold text-neutral-900 dark:text-white">${c.total_spend.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-neutral-500">{c.loyalty_pts.toLocaleString()} pts</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 capitalize ${TIER[c.tier]??TIER.regular}`}>
                      {c.tier==="vip"&&<Star size={9} fill="currentColor"/>}{c.tier}
                    </span>
                  </td>
                  <td className="px-5 py-4"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${c.status==="active"?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>{c.status}</span></td>
                  <td className="px-5 py-4"><button onClick={(e)=>{e.stopPropagation();openDetail(c);}} className="p-1.5 text-neutral-400 hover:text-[#e02020] transition-colors"><Eye size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">{customers.length} customers shown</div>
      </div>

      {/* Detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={()=>setSelected(null)}/>
          <div style={{maxWidth:"1140px"}} className="w-full bg-white dark:bg-neutral-900 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h2 className="font-semibold text-neutral-900 dark:text-white">Customer Profile</h2>
              <button onClick={()=>setSelected(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e02020] to-[#7d1111] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">{selected.first_name[0]}</div>
                <p className="font-display font-bold text-lg text-neutral-900 dark:text-white">{selected.first_name} {selected.last_name}</p>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 capitalize mt-2 ${TIER[selected.tier]}`}>
                  {selected.tier==="vip"&&<Star size={9} fill="currentColor"/>}{selected.tier} Member
                </span>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"><Mail size={14} className="text-neutral-400"/>{selected.email}</div>
                {selected.phone && <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-3.5 text-neutral-400">☎</span>{selected.phone}</div>}
                {selected.country && <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"><MapPin size={14} className="text-neutral-400"/>{selected.country}</div>}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[{Icon:ShoppingBag,v:selected.total_orders,l:"Orders"},{Icon:Award,v:`$${selected.total_spend.toLocaleString()}`,l:"Spent"},{Icon:Star,v:selected.loyalty_pts,l:"Points"}].map(({Icon,v,l})=>(
                  <div key={l} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 text-center">
                    <Icon size={16} className="text-[#e02020] mx-auto mb-1"/>
                    <p className="font-bold text-sm text-neutral-900 dark:text-white">{v}</p>
                    <p className="text-[10px] text-neutral-400">{l}</p>
                  </div>
                ))}
              </div>

              {/* Tier change */}
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Change Tier</p>
                <div className="flex flex-wrap gap-2">
                  {["new","regular","loyal","vip"].map(t=>(
                    <button key={t} onClick={()=>updateTier(selected.id,t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${selected.tier===t?"ring-2 ring-[#e02020] "+TIER[t]:TIER[t]+" opacity-60 hover:opacity-100"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order history */}
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Order History ({orders.length})</p>
                <div className="space-y-2">
                  {orders.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-4">No orders yet</p>
                  ) : orders.map(o=>(
                    <div key={o.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <div><p className="font-mono-brand text-xs font-bold text-[#e02020]">{o.order_number}</p><p className="text-[10px] text-neutral-400">{new Date(o.created_at).toLocaleDateString()}</p></div>
                      <div className="text-right"><p className="text-sm font-bold text-neutral-900 dark:text-white">${o.total}</p><p className="text-[10px] text-neutral-400 capitalize">{o.status}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
