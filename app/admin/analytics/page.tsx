"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Users, ShoppingBag, Target, Globe, Smartphone, Monitor } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

interface Stats {
  totalRevenue: number; totalOrders: number; totalCustomers: number;
  avgOrder: number; topProducts: Array<{name:string;price:number;reviews:number;rating:number;image_url:string|null}>;
  statusBreakdown: Array<{status:string;count:number}>;
  revenueByCategory: Array<{category:string;count:number;avg_price:number}>;
}

export default function AdminAnalyticsPage() {
  const { formatPrice } = useSettings();
  const [stats, setStats] = useState<Stats|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(r=>r.json()).then(d=>{setStats(d);setLoading(false);});
  }, []);

  const convRate = stats ? ((stats.totalOrders / Math.max(stats.totalCustomers * 8, 1)) * 100).toFixed(1) : "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Analytics</h1>
        <p className="text-neutral-500 text-sm mt-1">Live data from SQLite database</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {icon:TrendingUp, label:"Total Revenue",    value: stats ? formatPrice(stats.totalRevenue) : "—",  color:"#e02020"},
          {icon:ShoppingBag,label:"Total Orders",     value: stats?.totalOrders??"—",                                                                    color:"#3b82f6"},
          {icon:Users,       label:"Customers",        value: stats?.totalCustomers??"—",                                                                  color:"#22c55e"},
          {icon:Target,      label:"Avg Order Value",  value: stats ? formatPrice(stats.avgOrder) : "—",                                                   color:"#f59e0b"},
        ].map(({icon:Icon,label,value,color}) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:`${color}18`}}>
              <Icon size={18} style={{color}}/>
            </div>
            <p className="font-display font-black text-2xl text-neutral-900 dark:text-white">
              {loading ? <span className="block w-16 h-7 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/> : value}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order status breakdown */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-6">Order Status Breakdown</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/>)}</div>
          ) : stats?.statusBreakdown.map(({status,count}) => {
            const total = stats.statusBreakdown.reduce((a,b)=>a+b.count,0);
            const pct = Math.round((count/total)*100);
            const c = {pending:"#9ca3af",processing:"#3b82f6",confirmed:"#8b5cf6",shipped:"#f59e0b",delivered:"#22c55e"}[status]??"#9ca3af";
            return (
              <div key={status} className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium capitalize text-neutral-700 dark:text-neutral-300">{status}</span>
                  <div className="flex gap-2"><span className="font-bold text-neutral-900 dark:text-white">{count}</span><span className="text-neutral-400">{pct}%</span></div>
                </div>
                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${pct}%`,background:c}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Products by category */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-6">Products by Category</h2>
          {loading ? (
            <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/>)}</div>
          ) : stats?.revenueByCategory.map(({category,count,avg_price}) => {
            const max = Math.max(...(stats?.revenueByCategory.map(r=>r.count)??[1]));
            const pct = Math.round((count/max)*100);
            return (
              <div key={category} className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{category}</span>
                  <div className="flex gap-3">
                    <span className="font-bold text-neutral-900 dark:text-white">{count} items</span>
                    <span className="text-neutral-400">avg {formatPrice(avg_price)}</span>
                  </div>
                </div>
                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#e02020] rounded-full" style={{width:`${pct}%`}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device breakdown (static UX data) */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-5">Device & Traffic</h2>
        <div className="grid grid-cols-3 gap-6">
          {[{Icon:Monitor,label:"Desktop",pct:52,color:"#e02020"},{Icon:Smartphone,label:"Mobile",pct:39,color:"#3b82f6"},{Icon:Globe,label:"Tablet / Other",pct:9,color:"#f59e0b"}].map(({Icon,label,pct,color}) => (
            <div key={label} className="text-center p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{background:`${color}18`}}>
                <Icon size={22} style={{color}}/>
              </div>
              <p className="font-display font-black text-3xl" style={{color}}>{pct}%</p>
              <p className="text-xs text-neutral-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top products with images */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-5">Top Products by Reviews</h2>
        <div className="space-y-3">
          {loading ? Array.from({length:5}).map((_,i)=><div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/>) :
          stats?.topProducts.map((p,i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <span className="w-6 text-sm font-bold text-neutral-400">{i+1}</span>
              <div className="w-12 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-200">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy"/> : <div className="w-full h-full bg-neutral-300"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-neutral-900 dark:text-white truncate">{p.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{p.reviews} reviews</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm text-neutral-900 dark:text-white">{formatPrice(p.price)}</p>
                <p className="text-[10px] text-[#d4a017]">⭐ {p.rating}</p>
              </div>
              <div className="w-24">
                <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                  <div className="h-full bg-[#e02020] rounded-full" style={{width:`${Math.round(p.rating/5*100)}%`}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
