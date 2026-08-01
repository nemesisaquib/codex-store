"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Package, ArrowLeft, CheckCircle2, Circle, Truck, MapPin, Download } from "lucide-react";

interface Order {
  id:string; order_number:string; customer_name:string; customer_email:string;
  total:number; subtotal:number; shipping:number; status:string; payment_status:string;
  created_at:string; items:string; shipping_method:string|null; tracking_number:string|null;
}

const TIMELINE = ["confirmed","processing","shipped","delivered"];
const STATUS_ORDER: Record<string,number> = { pending:0, confirmed:1, processing:2, shipped:3, delivered:4, returned:5, refunded:5 };

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r=>r.json())
      .then(d => { setOrder(d.error ? null : d); setLoading(false); });
  }, [id]);

  if (loading) {
    return <div className="space-y-4">{Array.from({length:3}).map((_,i)=><div key={i} className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse"/>)}</div>;
  }
  if (!order) {
    return (
      <div className="text-center py-16">
        <Package size={40} className="mx-auto text-neutral-200 mb-3"/>
        <p className="text-neutral-500 font-medium">Order not found</p>
        <Link href="/account/orders" className="text-sm text-[#e02020] hover:underline mt-2 inline-block">Back to orders</Link>
      </div>
    );
  }

  const items = (() => { try { return JSON.parse(order.items) as {name:string;qty:number;price:number;image?:string}[]; } catch { return []; } })();
  const currentStep = STATUS_ORDER[order.status] ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#e02020] transition-colors">
        <ArrowLeft size={14}/> Back to orders
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">{order.order_number}</h1>
            <p className="text-sm text-neutral-400 mt-1">Placed {new Date(order.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/track?order=${encodeURIComponent(order.order_number)}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#e02020]/20"
            >
              <Truck size={14} /> Track Order Live
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium hover:border-[#e02020] transition-colors">
              <Download size={14}/> Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {order.status !== "returned" && order.status !== "refunded" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-neutral-900 dark:text-white text-sm">Order Status</h2>
            <Link
              href={`/track?order=${encodeURIComponent(order.order_number)}`}
              className="text-xs font-bold text-[#e02020] hover:underline flex items-center gap-1"
            >
              Live Logistics View &rarr;
            </Link>
          </div>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-neutral-100 dark:bg-neutral-800"/>
            <div className="absolute top-3 left-0 h-0.5 bg-[#e02020] transition-all" style={{width:`${(Math.max(0,currentStep-1)/(TIMELINE.length-1))*100}%`}}/>
            {TIMELINE.map((step,i) => {
              const done = currentStep >= i+1;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  {done ? <CheckCircle2 size={26} className="text-[#e02020] bg-white dark:bg-neutral-900 rounded-full"/> : <Circle size={26} className="text-neutral-300 bg-white dark:bg-neutral-900 rounded-full"/>}
                  <span className={`text-[10px] mt-2 capitalize font-medium ${done?"text-neutral-900 dark:text-white":"text-neutral-400"}`}>{step}</span>
                </div>
              );
            })}
          </div>
          {order.tracking_number && (
            <div className="mt-6 flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-[#e02020]"/>
                <span className="text-xs text-neutral-500">Tracking:</span>
                <span className="text-xs font-mono-brand font-bold text-neutral-900 dark:text-white">{order.tracking_number}</span>
              </div>
              <Link
                href={`/track?tracking=${encodeURIComponent(order.tracking_number)}`}
                className="text-xs font-bold text-[#e02020] hover:underline"
              >
                Track carrier &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
      {(order.status === "returned" || order.status === "refunded") && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex items-center gap-3">
          <Package size={18} className="text-red-500"/>
          <p className="text-sm font-medium text-red-600 capitalize">This order was {order.status}</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 text-sm">Items ({items.length})</h2>
        <div className="space-y-3">
          {items.map((item,i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
              <div className="w-14 h-16 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2"/> : <Package size={18} className="text-neutral-300"/>}
              </div>
              <div className="flex-1"><p className="text-sm font-medium text-neutral-900 dark:text-white">{item.name}</p><p className="text-xs text-neutral-400">Qty: {item.qty}</p></div>
              <p className="font-bold text-sm text-neutral-900 dark:text-white">${item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 text-sm">Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>${order.subtotal ?? order.total}</span></div>
          <div className="flex justify-between text-neutral-500"><span>Shipping {order.shipping_method ? `(${order.shipping_method})` : ""}</span><span>{order.shipping ? `$${order.shipping}` : <span className="text-green-600">FREE</span>}</span></div>
          <div className="flex justify-between font-bold text-neutral-900 dark:text-white text-base border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-1"><span>Total</span><span>${order.total}</span></div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-xs text-neutral-400">
          <span className={`font-bold px-2 py-0.5 rounded-full capitalize ${order.payment_status==="paid"?"bg-green-100 text-green-700":"bg-yellow-100 text-yellow-700"}`}>{order.payment_status}</span>
          <MapPin size={12}/> Shipped to {order.customer_name}
        </div>
      </div>
    </div>
  );
}
