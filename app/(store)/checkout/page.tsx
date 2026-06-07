"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Lock, AlertCircle } from "lucide-react";

const STEPS = ["Shipping","Delivery","Payment"];
const METHODS = [
  {id:"standard",label:"Standard",sub:"3–7 business days",price:0,badge:"FREE"},
  {id:"express",label:"Express",sub:"1–3 business days",price:12.95},
  {id:"overnight",label:"Premium Overnight",sub:"Next business day",price:24.95},
];

interface CartItem { productId:string; name:string; qty:number; price:number; image?:string }

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("standard");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<{id:string;email:string;first_name:string;last_name:string}|null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", street:"", street2:"",
    city:"", state:"", zip:"", country:"United States",
    cardNum:"", expiry:"", cvv:"",
  });

  // Load cart + customer on mount
  useEffect(() => {
    (async () => {
      const cart = await fetch("/api/cart").then(r=>r.json());
      const cust = await fetch("/api/auth/customer").then(r=>r.json());
      setCartItems(cart.items ?? []);
      if (cust.customer) {
        setCustomer(cust.customer);
        setForm(p=>({...p, firstName: cust.customer.first_name, lastName: cust.customer.last_name, email: cust.customer.email}));
      }
      setLoading(false);
    })();
  }, []);

  const shippingCost = METHODS.find(m=>m.id===method)?.price || 0;
  const subtotal = cartItems.reduce((s,i)=>s+(i.price*i.qty),0);
  const total = subtotal + shippingCost;

  const handleSubmit = async () => {
    if (!form.email || !form.firstName || !form.street || !form.city || !form.zip) {
      setError("Please fill all required fields");
      return;
    }
    if (!form.cardNum || !form.expiry || !form.cvv) {
      setError("Please enter payment details");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          customer_name: `${form.firstName} ${form.lastName}`,
          customer_email: form.email,
          shipping_address: `${form.street}${form.street2?', '+form.street2:''}, ${form.city}, ${form.state} ${form.zip}, ${form.country}`,
          shipping_method: method,
          items: cartItems,
          subtotal,
          shipping: shippingCost,
          total,
          payment_method: "credit_card",
          status: "pending",
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Order failed");
        setSubmitting(false);
        return;
      }

      // Clear cart
      await fetch("/api/cart", { method:"DELETE" });

      // Redirect to success
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch (e) {
      setError(String(e));
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center"><div className="text-neutral-400">Loading…</div></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display font-black text-xl text-[#e02020]">CODEX</Link>
          <div className="flex items-center gap-2">
            {STEPS.map((s,i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i<step?"bg-green-500 text-white":i===step?"bg-[#e02020] text-white":"bg-neutral-200 dark:bg-neutral-700 text-neutral-400"}`}>
                  {i<step?<Check size={12}/>:i+1}
                </div>
                <span className={`text-sm hidden sm:block ${i===step?"font-semibold text-neutral-900 dark:text-white":"text-neutral-400"}`}>{s}</span>
                {i<STEPS.length-1 && <div className={`w-8 h-px ${i<step?"bg-green-400":"bg-neutral-200 dark:bg-neutral-700"}`}/>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-400"><Lock size={12}/> Secure</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 grid lg:grid-cols-5 gap-10">
        {/* Left — form */}
        <div className="lg:col-span-3 space-y-6">
          {error && <div className="flex gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl"><AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5"/><p className="text-sm text-red-600">{error}</p></div>}

          {/* Step 1 — Shipping */}
          {step===0 && (
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-6">Shipping Address</h2>
              <form className="space-y-4" onSubmit={e=>{e.preventDefault();setStep(1);}}>
                <div className="grid grid-cols-2 gap-4">
                  {[{k:"firstName",l:"First name"},{k:"lastName",l:"Last name"}].map(({k,l})=>(
                    <div key={k}><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{l}</label><input type="text" value={(form as Record<string,string>)[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020] transition-colors"/></div>
                  ))}
                </div>
                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Email</label><input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020] transition-colors"/></div>
                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Address Line 1</label><input type="text" value={form.street} onChange={e=>setForm(p=>({...p,street:e.target.value}))} className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020] transition-colors"/></div>
                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Address Line 2 (Optional)</label><input type="text" value={form.street2} onChange={e=>setForm(p=>({...p,street2:e.target.value}))} className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020] transition-colors"/></div>
                <div className="grid grid-cols-3 gap-4">
                  {[{k:"city",l:"City"},{k:"state",l:"State"},{k:"zip",l:"Postal Code"}].map(({k,l})=>(
                    <div key={k}><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{l}</label><input type="text" value={(form as Record<string,string>)[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020] transition-colors"/></div>
                  ))}
                </div>
                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Country</label>
                  <select value={form.country} onChange={e=>setForm(p=>({...p,country:e.target.value}))} className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020] transition-colors">
                    {["United States","United Kingdom","France","Germany","Japan","Australia","Canada"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group">
                  Continue to Delivery <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/>
                </button>
              </form>
            </div>
          )}

          {/* Step 2 — Shipping method */}
          {step===1 && (
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-6">Shipping Method</h2>
              <div className="space-y-3 mb-6">
                {METHODS.map(m => (
                  <label key={m.id} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${method===m.id?"border-[#e02020] bg-[#e02020]/5":"border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="method" value={m.id} checked={method===m.id} onChange={()=>setMethod(m.id)} className="accent-[#e02020]"/>
                      <div>
                        <p className="font-semibold text-sm text-neutral-900 dark:text-white">{m.label}</p>
                        <p className="text-xs text-neutral-400">{m.sub}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {m.badge ? <span className="text-green-600 font-bold text-sm">{m.badge}</span> : <span className="font-bold text-sm text-neutral-900 dark:text-white">${m.price.toFixed(2)}</span>}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(0)} className="px-6 py-4 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-[#e02020] transition-colors flex items-center gap-2"><ArrowLeft size={15}/>Back</button>
                <button onClick={()=>setStep(2)} className="flex-1 py-4 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group">Continue to Payment<ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/></button>
              </div>
            </div>
          )}

          {/* Step 3 — Payment */}
          {step===2 && (
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-6">Payment</h2>
              <div className="space-y-3 mb-6">
                {["Credit / Debit Card","PayPal","Klarna — Buy Now, Pay Later","Apple Pay","Google Pay"].map((p,i) => (
                  <label key={p} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${i===0?"border-[#e02020] bg-[#e02020]/5":"border-neutral-200 dark:border-neutral-700"}`}>
                    <input type="radio" name="pay" defaultChecked={i===0} className="accent-[#e02020]"/>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{p}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-4 p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl mb-6">
                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Card Number</label><input type="text" value={form.cardNum} onChange={e=>setForm(p=>({...p,cardNum:e.target.value}))} placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-[#e02020] transition-colors font-mono-brand"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Expiry</label><input type="text" value={form.expiry} onChange={e=>setForm(p=>({...p,expiry:e.target.value}))} placeholder="MM / YY" className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-[#e02020] transition-colors"/></div>
                  <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">CVV</label><input type="text" value={form.cvv} onChange={e=>setForm(p=>({...p,cvv:e.target.value}))} placeholder="123" className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-[#e02020] transition-colors"/></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(1)} className="px-6 py-4 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-[#e02020] transition-colors flex items-center gap-2"><ArrowLeft size={15}/>Back</button>
                <button onClick={handleSubmit} disabled={submitting} className={`flex-1 py-4 ${submitting?"bg-neutral-300 text-neutral-500":"bg-[#e02020] hover:bg-[#c01a1a] text-white"} font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group`}>
                  <Lock size={14}/> {submitting?"Placing Order…":"Place Order"} {!submitting && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-28 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 text-sm">Order Summary ({cartItems.length})</h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {cartItems.length ? cartItems.map(i=>(
                <div key={i.productId} className="flex gap-3">
                  <div className="w-12 h-14 rounded-lg flex-shrink-0 bg-neutral-100 dark:bg-neutral-800"/>
                  <div className="flex-1"><p className="text-xs font-medium text-neutral-900 dark:text-white line-clamp-2">{i.name}</p><p className="text-[10px] text-neutral-400 mt-0.5">Qty: {i.qty}</p></div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">${(i.price*i.qty).toFixed(2)}</p>
                </div>
              )) : <p className="text-xs text-neutral-400">No items</p>}
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-neutral-500"><span>Shipping ({method})</span><span>{shippingCost?`$${shippingCost.toFixed(2)}`:"FREE"}</span></div>
              <div className="flex justify-between font-bold text-neutral-900 dark:text-white text-sm pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
