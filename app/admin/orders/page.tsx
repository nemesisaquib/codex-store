"use client";
import { useEffect, useState } from "react";
import { Search, Download, Eye, X, Truck, CheckCircle, Package, Clock, RefreshCw } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

interface Order {
  id:string; order_number:string; customer_name:string; customer_email:string;
  total:number; status:string; payment_status:string; created_at:string;
  shipping_method:string|null; tracking_number:string|null; items:string; notes:string|null;
}

const STATUSES = ["pending","processing","confirmed","shipped","delivered","returned","refunded"];
const S: Record<string,string> = {
  pending:"bg-neutral-100 text-neutral-500", processing:"bg-blue-100 text-blue-700",
  confirmed:"bg-purple-100 text-purple-700", shipped:"bg-yellow-100 text-yellow-700",
  delivered:"bg-green-100 text-green-700",   returned:"bg-red-100 text-red-500",
  refunded:"bg-orange-100 text-orange-600",
};

export default function AdminOrdersPage() {
  const { formatPrice } = useSettings();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [total, setTotal]       = useState(0);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [livePolling, setLive]  = useState(false);
  const [selected, setSelected] = useState<Order|null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setLive(true);
    try {
      const p = new URLSearchParams({ limit: "50" });
      if (filter !== "all") p.set("status", filter);
      const d = await fetch(`/api/orders?${p}`).then(r => r.json());
      const list = (d.orders ?? []) as Order[];
      setOrders(search ? list.filter(o => o.order_number.includes(search) || o.customer_name?.toLowerCase().includes(search.toLowerCase())) : list);
      setTotal(d.total ?? 0);
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
      setLive(false);
    }
  };

  // Initial load when filter/search changes
  useEffect(() => { fetchOrders(); }, [filter, search]);

  // Silent background polling every 10 seconds
  useEffect(() => {
    const id = setInterval(() => fetchOrders(true), 10_000);
    return () => clearInterval(id);
  }, [filter, search]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    await fetch(`/api/orders/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status}) });
    setUpdating(false);
    if (selected?.id === id) setSelected(prev => prev ? {...prev, status} : null);
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white flex items-center gap-2">
            Orders
            {livePolling && (
              <span className="flex h-2 w-2 relative" title="Polling for updates…">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">{total} total · live updates every 10s</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchOrders()} disabled={loading} className="p-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl transition-colors" title="Refresh Orders">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-[#e02020] transition-colors">
            <Download size={14}/> Export CSV
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all","pending","processing","confirmed","shipped","delivered"].map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${filter===s?"bg-[#e02020] text-white":"bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-700 hover:text-[#e02020]"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search orders or customer…"
              className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>{["Order","Customer","Total","Status","Payment","Date","Action"].map(h =>
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                Array.from({length:5}).map((_,i)=><tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/></td></tr>)
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-neutral-400">No orders found</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-5 py-4 font-mono-brand text-xs font-bold text-[#e02020]">{o.order_number}</td>
                  <td className="px-5 py-4"><p className="text-sm font-medium text-neutral-900 dark:text-white">{o.customer_name}</p><p className="text-[10px] text-neutral-400">{o.customer_email}</p></td>
                  <td className="px-5 py-4 text-sm font-bold text-neutral-900 dark:text-white">{formatPrice(o.total)}</td>
                  <td className="px-5 py-4">
                    <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize border-0 cursor-pointer focus:outline-none ${S[o.status]??S.pending}`}>
                      {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4"><span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${o.payment_status==="paid"?"bg-green-100 text-green-700":"bg-yellow-100 text-yellow-700"}`}>{o.payment_status}</span></td>
                  <td className="px-5 py-4 text-xs text-neutral-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <button onClick={()=>setSelected(o)} className="p-1.5 text-neutral-400 hover:text-[#e02020] transition-colors"><Eye size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">{orders.length} orders shown</div>
      </div>

      {/* Order detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={()=>setSelected(null)}/>
          <div style={{maxWidth:"1140px"}} className="w-full bg-white dark:bg-neutral-900 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <div>
                <h2 className="font-semibold text-neutral-900 dark:text-white">{selected.order_number}</h2>
                <p className="text-xs text-neutral-400">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <button onClick={()=>setSelected(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"><X size={18}/></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status update */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={()=>updateStatus(selected.id,s)} disabled={updating}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${selected.status===s?"ring-2 ring-[#e02020] "+S[s]:(S[s]+" opacity-60 hover:opacity-100")}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer */}
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Customer</p>
                <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e02020] to-[#7d1111] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {selected.customer_name?.[0] ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white">{selected.customer_name}</p>
                    <p className="text-xs text-neutral-400">{selected.customer_email}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Items</p>
                <div className="space-y-3">
                  {(() => { try { return JSON.parse(selected.items); } catch { return []; } })().map((item: {name:string;qty:number;price:number;image?:string}, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                        {(item.image || (item as any).image_url || (item as any).img || (item as any).imageUrl) ? (
                          <img src={item.image || (item as any).image_url || (item as any).img || (item as any).imageUrl} alt={item.name} className="w-full h-full object-contain p-1"/>
                        ) : (
                          <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">🛍️</div>
                        )}
                      </div>
                      <div className="flex-1"><p className="text-sm font-medium text-neutral-900 dark:text-white">{item.name}</p><p className="text-xs text-neutral-400">Qty: {item.qty}</p></div>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">{formatPrice(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between text-neutral-500"><span>Shipping</span><span className="text-green-600">FREE</span></div>
                <div className="flex justify-between font-bold text-neutral-900 dark:text-white text-base border-t border-neutral-200 dark:border-neutral-700 pt-2">
                  <span>Total</span><span>{formatPrice(selected.total)}</span>
                </div>
              </div>

              {/* Tracking */}
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Tracking Number</p>
                <div className="flex gap-2">
                  <input defaultValue={selected.tracking_number ?? ""} placeholder="Enter tracking number…"
                    className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"
                    id="tracking-input"/>
                  <button onClick={async () => {
                    const val = (document.getElementById("tracking-input") as HTMLInputElement)?.value;
                    await fetch(`/api/orders/${selected.id}`, {method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({tracking_number:val})});
                    setSelected(prev=>prev?{...prev,tracking_number:val}:null);
                  }} className="px-4 py-2 bg-[#e02020] text-white rounded-xl text-sm font-semibold hover:bg-[#c01a1a] transition-colors">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
