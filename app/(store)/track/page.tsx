"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Truck, Package, CheckCircle2, Clock, MapPin, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";

interface TrackingEvent {
  status: string;
  location: string;
  time: string;
  desc: string;
  done: boolean;
}

interface TrackingData {
  order_number: string;
  tracking_number: string;
  carrier: string;
  status: string;
  customer_name: string;
  shipping_address: string;
  estimated_delivery: string;
  events: TrackingEvent[];
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("order") || searchParams.get("tracking") || "";
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTracking = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(searchQuery.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Tracking details not found");
        setData(null);
      } else {
        setData(json);
      }
    } catch (e) {
      setError("Failed to fetch tracking information");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchTracking(initialQuery);
    }
  }, [initialQuery]);

  const steps = ["pending", "processing", "shipped", "delivered"];
  const currentStepIdx = data ? steps.indexOf(data.status.toLowerCase()) : 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Truck size={14} /> Live Carrier Logistics Tracker
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-neutral-900 dark:text-white">
            Track Your Order
          </h1>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Enter your Order Number (e.g. <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">COD-2026-42483</span>) or Tracking Number to view real-time parcel updates.
          </p>
        </div>

        {/* Search Input Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 md:p-6 shadow-sm">
          <form
            onSubmit={e => {
              e.preventDefault();
              fetchTracking(query);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter Order # or Tracking #"
                className="w-full pl-11 pr-4 py-3.5 border border-neutral-200 dark:border-neutral-700 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-sm font-medium focus:outline-none focus:border-[#e02020] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-[#e02020] hover:bg-[#c01a1a] text-white font-bold rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <><Search size={16} /> Track Order</>}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </div>

        {/* Tracking Details Card */}
        {data && (
          <div className="space-y-6 animate-[fadeIn_.3s_ease-out]">
            {/* Top Summary Bar */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase">Order Number</span>
                  <p className="font-mono-brand text-lg font-black text-[#e02020]">{data.order_number}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase">Carrier Service</span>
                  <p className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Truck size={15} className="text-[#e02020]" /> {data.carrier}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase">Tracking AWB</span>
                  <p className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg mt-0.5">
                    {data.tracking_number}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase">Estimated Delivery</span>
                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {data.estimated_delivery}
                  </p>
                </div>
              </div>

              {/* Step Progress Bar */}
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 block">Fulfillment Progress</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: "pending", label: "Ordered" },
                    { key: "processing", label: "Packed" },
                    { key: "shipped", label: "In Transit" },
                    { key: "delivered", label: "Delivered" }
                  ].map((s, idx) => {
                    const isDone = idx <= (currentStepIdx >= 0 ? currentStepIdx : 1);
                    return (
                      <div key={s.key} className="space-y-2">
                        <div className={`h-2 rounded-full transition-all duration-500 ${isDone ? "bg-gradient-to-r from-[#e02020] to-emerald-500" : "bg-neutral-100 dark:bg-neutral-800"}`} />
                        <p className={`text-[11px] font-bold text-center ${isDone ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
                          {s.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Real-time Timeline Events */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                Live Checkpoint Updates ({data.events.length})
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                {data.events.map((ev, i) => (
                  <div key={i} className="relative flex items-start gap-4 group">
                    {/* Circle Node */}
                    <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${ev.done ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200" : "bg-white dark:bg-neutral-900 text-neutral-400 border-neutral-300 dark:border-neutral-700"}`}>
                      {ev.done ? <CheckCircle2 size={13} /> : i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`text-sm font-bold ${ev.done ? "text-neutral-900 dark:text-white" : "text-neutral-500"}`}>
                          {ev.status}
                        </p>
                        <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          {ev.time}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{ev.desc}</p>
                      <p className="text-[10px] font-medium text-neutral-400 flex items-center gap-1 mt-1">
                        <MapPin size={11} className="text-[#e02020]" /> {ev.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Back Home */}
            <div className="text-center pt-4">
              <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-2xl text-xs hover:bg-[#e02020] dark:hover:bg-[#e02020] dark:hover:text-white transition-colors">
                Back to Shopping <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center text-sm text-neutral-400">Loading order tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
