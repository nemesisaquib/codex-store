"use client";
import { useEffect, useState } from "react";
import { TrendingUp, ShoppingCart, Users, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/lib/SettingsContext";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

interface Stats {
  totalRevenue: number; todayRevenue: number;
  totalOrders: number; pendingOrders: number;
  totalCustomers: number; lowStock: number;
  avgOrder: number;
  recentOrders: Array<{id:string;order_number:string;customer_name:string;total:number;status:string;created_at:string;payment_status:string}>;
  topProducts: Array<{id:string;name:string;brand:string;price:number;image_url:string|null;reviews:number;rating:number}>;
  statusBreakdown: Array<{status:string;count:number}>;
}

const S: Record<string,string> = {
  pending:"bg-neutral-100 text-neutral-500",
  processing:"bg-blue-100 text-blue-700",
  confirmed:"bg-purple-100 text-purple-700",
  shipped:"bg-yellow-100 text-yellow-700",
  delivered:"bg-green-100 text-green-700",
};

export default function AdminDashboard() {
  const { formatPrice } = useSettings();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [livePolling, setLive] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true); else setLive(true);
    try {
      const d = await fetch("/api/admin/stats").then(r => r.json());
      setStats(d);
    } catch {}
    setLoading(false); setLive(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 5000);
    return () => clearInterval(id);
  }, []);

  const cards = [
    {label:"Total Revenue",  value:stats?formatPrice(stats.totalRevenue):"—", sub:`${formatPrice(stats?.todayRevenue??0)} today`, icon:TrendingUp,   color:"#e02020", up:true},
    {label:"Orders",         value:stats?.totalOrders??"—",       sub:`${stats?.pendingOrders??0} pending`,       icon:ShoppingCart, color:"#3b82f6", up:true},
    {label:"Customers",      value:stats?.totalCustomers??"—",    sub:`Avg order ${formatPrice(stats?.avgOrder??0)}`, icon:Users, color:"#22c55e", up:true},
    {label:"Low Stock",      value:stats?.lowStock??"—",          sub:"Items below 10 units",                     icon:AlertTriangle,color:"#f59e0b", up:false},
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white flex items-center gap-2">
            Dashboard
            {livePolling && (
              <span className="flex h-2 w-2 relative" title="Live — polling every 5s">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/>
              </span>
            )}
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">{new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm hover:border-[#e02020] transition-colors">
          <RefreshCw size={13} className={loading?"animate-spin":""}/> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(({label,value,sub,icon:Icon,color,up}) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}18`}}>
                <Icon size={18} style={{color}}/>
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-semibold ${up?"text-green-600":"text-orange-500"}`}>
                {up?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>}
              </div>
            </div>
            <p className="font-display font-black text-2xl text-neutral-900 dark:text-white">
              {loading ? <span className="block w-16 h-7 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/> : value}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
            <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Revenue Overview</h2>
            <span className="text-xs text-neutral-400">Last 30 days</span>
          </div>
          <p className="text-2xl font-display font-black text-neutral-900 dark:text-white mb-6">
            {stats ? formatPrice(stats.totalRevenue) : "—"}
          </p>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-32">
            {[42,58,35,72,65,80,55,90,68,78,85,60,95,70,88,75,65,92,55,80,72,85,60,95,78,88,65,100,82,90].map((h,i) => (
              <div key={i} title={`Day ${i+1}`}
                className="flex-1 rounded-t-sm cursor-pointer hover:opacity-70 transition-opacity"
                style={{height:`${h}%`, background:`linear-gradient(to top,#e02020,#f48787)`}}/>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-neutral-400 mt-2">
            <span>May 7</span><span>May 14</span><span>May 21</span><span>May 28</span><span>Jun 6</span>
          </div>
        </div>

        {/* Order status donut */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-5">Orders by Status</h2>
          {stats?.statusBreakdown && stats.statusBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.statusBreakdown.map(({status,count}) => {
                const total = stats.statusBreakdown.reduce((a,b)=>a+b.count,0);
                const pct   = Math.round((count/total)*100);
                const color = {pending:"#9ca3af",processing:"#3b82f6",confirmed:"#8b5cf6",shipped:"#f59e0b",delivered:"#22c55e",returned:"#ef4444"}[status] ?? "#9ca3af";
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium capitalize text-neutral-700 dark:text-neutral-300">{status}</span>
                      <div className="flex gap-2">
                        <span className="font-bold text-neutral-900 dark:text-white">{count}</span>
                        <span className="text-neutral-400">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${pct}%`,background:color}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/>)}</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent orders table */}
        <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="font-semibold text-neutral-900 dark:text-white text-sm">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[#e02020] hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? Array.from({length:5}).map((_,i)=>(
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 h-9 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/>
              </div>
            )) : stats?.recentOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div>
                  <p className="font-mono-brand text-xs font-bold text-[#e02020]">{o.order_number}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{o.customer_name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${S[o.status]??S.pending}`}>{o.status}</span>
                <p className="font-bold text-sm text-neutral-900 dark:text-white">{formatPrice(o.total)}</p>
                <p className="text-[10px] text-neutral-400">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 dark:text-white text-sm">Top Products</h2>
            <Link href="/admin/products" className="text-xs text-[#e02020] hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {loading ? Array.from({length:5}).map((_,i)=>(
              <div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/>
            )) : stats?.topProducts.map((p,i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-5 text-[10px] font-bold text-neutral-400 flex-shrink-0">{i+1}</span>
                <div className="w-10 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  {p.image_url ? (
                    <img src={getOptimizedImageUrl(p.image_url, { width: 150, quality: 80 })} alt={p.name} className="w-full h-full object-contain p-0.5" loading="lazy"/>
                  ) : (
                    <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800"/>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-neutral-400">{p.reviews} reviews · ⭐ {p.rating}</p>
                </div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white flex-shrink-0">{formatPrice(p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
