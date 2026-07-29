"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Lock, AlertCircle, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

const STEPS = ["Shipping", "Delivery", "Payment"];
const METHODS = [
  { id: "standard", label: "Standard", sub: "3–7 business days", price: 0, badge: "FREE" },
  { id: "express", label: "Express", sub: "1–3 business days", price: 12.95 },
  { id: "overnight", label: "Premium Overnight", sub: "Next business day", price: 24.95 },
];

interface CartItem { productId: string; name: string; qty: number; price: number; image?: string }
interface CountryItem { code: string; name: string }

export default function CheckoutPage() {
  const router = useRouter();
  const { formatPrice } = useSettings();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("standard");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<{ id: string; email: string; first_name: string; last_name: string } | null>(null);
  const [dbCountries, setDbCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState("Verifying Card Details...");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [payMethod, setPayMethod] = useState("card");

  // Real-time International Locations State
  const [apiStates, setApiStates] = useState<string[]>([]);
  const [apiCities, setApiCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", street: "", street2: "",
    city: "London", state: "England", zip: "", country: "United Kingdom",
    cardNum: "", expiry: "", cvv: "", nameOnCard: ""
  });

  // Load cart + customer + dynamic DB countries on mount
  useEffect(() => {
    (async () => {
      try {
        const cart = await fetch("/api/cart").then(r => r.json());
        const cust = await fetch("/api/auth/customer").then(r => r.json());
        const countriesData = await fetch("/api/countries").then(r => r.json()).catch(() => []);

        setCartItems(cart.items ?? []);
        if (Array.isArray(countriesData) && countriesData.length > 0) {
          setDbCountries(countriesData);
        }

        if (cust.customer) {
          setCustomer(cust.customer);
          setForm(p => ({
            ...p,
            firstName: cust.customer.first_name || "",
            lastName: cust.customer.last_name || "",
            email: cust.customer.email || ""
          }));
        }

        // Fetch initial real-time states for default country
        fetchStatesForCountry("United Kingdom");
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch real-time States for ANY Country in the world
  const fetchStatesForCountry = async (countryName: string) => {
    setLoadingStates(true);
    setApiStates([]);
    setApiCities([]);
    try {
      const res = await fetch(`/api/locations?country=${encodeURIComponent(countryName)}`);
      const data = await res.json();
      if (Array.isArray(data.states) && data.states.length > 0) {
        const stateNames = data.states.map((s: any) => s.name);
        setApiStates(stateNames);
        const firstState = stateNames[0];
        setForm(p => ({ ...p, country: countryName, state: firstState, city: "" }));
        fetchCitiesForState(countryName, firstState);
      } else {
        setApiStates([]);
        setForm(p => ({ ...p, country: countryName, state: "", city: "" }));
      }
    } catch (e) {
      console.error("Failed to fetch states:", e);
      setApiStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  // Fetch real-time Cities for ANY State in the world
  const fetchCitiesForState = async (countryName: string, stateName: string) => {
    if (!stateName) return;
    setLoadingCities(true);
    setApiCities([]);
    try {
      const res = await fetch(`/api/locations?country=${encodeURIComponent(countryName)}&state=${encodeURIComponent(stateName)}`);
      const data = await res.json();
      if (Array.isArray(data.cities) && data.cities.length > 0) {
        setApiCities(data.cities);
        setForm(p => ({ ...p, city: data.cities[0] }));
      } else {
        setApiCities([]);
      }
    } catch (e) {
      console.error("Failed to fetch cities:", e);
      setApiCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCountryChange = (countryName: string) => {
    setForm(p => ({ ...p, country: countryName }));
    fetchStatesForCountry(countryName);
    setFieldErrors(p => ({ ...p, country: false }));
  };

  const handleStateChange = (stateName: string) => {
    setForm(p => ({ ...p, state: stateName }));
    fetchCitiesForState(form.country, stateName);
    setFieldErrors(p => ({ ...p, state: false }));
  };

  const shippingCost = METHODS.find(m => m.id === method)?.price || 0;
  const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
  const total = subtotal + shippingCost;

  // Auto-detect Credit Card Brand
  const detectCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (/^4/.test(clean)) return "VISA";
    if (/^5[1-5]/.test(clean)) return "MASTERCARD";
    if (/^3[47]/.test(clean)) return "AMEX";
    if (/^6/.test(clean)) return "DISCOVER";
    return "CARD";
  };

  // Card Number Auto-Formatter (XXXX XXXX XXXX XXXX)
  const handleCardNumChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    const formatted = clean.match(/.{1,4}/g)?.join(" ") || clean;
    setForm(p => ({ ...p, cardNum: formatted }));
    setFieldErrors(p => ({ ...p, cardNum: false }));
  };

  // Expiry Auto-Formatter (MM/YY)
  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) {
      setForm(p => ({ ...p, expiry: `${clean.slice(0, 2)}/${clean.slice(2)}` }));
    } else {
      setForm(p => ({ ...p, expiry: clean }));
    }
    setFieldErrors(p => ({ ...p, expiry: false }));
  };

  const validateStep0 = () => {
    const errs: Record<string, boolean> = {};
    if (!form.firstName.trim()) errs.firstName = true;
    if (!form.lastName.trim()) errs.lastName = true;
    if (!form.email.trim()) errs.email = true;
    if (!form.street.trim()) errs.street = true;
    if (!form.city.trim()) errs.city = true;
    if (!form.state.trim()) errs.state = true;
    if (!form.zip.trim()) errs.zip = true;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Please complete all highlighted required shipping fields");
      return false;
    }
    setFieldErrors({});
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    // Validate shipping fields
    if (!validateStep0()) {
      setStep(0); // Jump back to Step 0 immediately if shipping fields missing!
      return;
    }

    if (payMethod === "card") {
      const cardErrs: Record<string, boolean> = {};
      if (!form.cardNum.trim()) cardErrs.cardNum = true;
      if (!form.expiry.trim()) cardErrs.expiry = true;
      if (!form.cvv.trim()) cardErrs.cvv = true;

      if (Object.keys(cardErrs).length > 0) {
        setFieldErrors(cardErrs);
        setError("Please complete all highlighted card payment fields");
        return;
      }
    }

    setSubmitting(true);
    setError("");
    setVerifyingPayment(true);

    // Realistic 3D Secure Simulation sequence
    setPaymentStepText("Connecting to 256-bit SSL Secure Bank Gateway...");
    await new Promise(r => setTimeout(r, 800));

    setPaymentStepText("Verifying 3D Secure Authentication Token...");
    await new Promise(r => setTimeout(r, 900));

    setPaymentStepText("Payment Approved! Finalizing Order...");
    await new Promise(r => setTimeout(r, 600));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: `${form.firstName} ${form.lastName}`,
          customer_email: form.email,
          shipping_address: `${form.street}${form.street2 ? ', Landmark: ' + form.street2 : ''}, ${form.city}, ${form.state} ${form.zip}, ${form.country}`,
          shipping_method: method,
          items: cartItems,
          subtotal,
          shipping: shippingCost,
          total,
          payment_method: payMethod === "card" ? `Credit Card (${detectCardBrand(form.cardNum)})` : payMethod,
          status: "pending",
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setVerifyingPayment(false);
        setError(data.error || "Order placement failed");
        setSubmitting(false);
        return;
      }

      // Clear cart
      await fetch("/api/cart", { method: "DELETE" });

      // Redirect to success
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch (e) {
      setVerifyingPayment(false);
      setError(String(e));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
          <div className="w-5 h-5 border-2 border-[#e02020] border-t-transparent rounded-full animate-spin" />
          Loading checkout session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* ── Realistic 3D Secure Payment Verification Modal ── */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_.2s_ease-out]">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
              <ShieldCheck size={32} className="text-emerald-600 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
                🔒 256-BIT SSL ENCRYPTED GATEWAY
              </span>
              <h3 className="font-display font-bold text-xl text-neutral-900 dark:text-white mt-3">
                Processing Secure Payment
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {paymentStepText}
              </p>
            </div>

            {/* Simulated Progress Bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#e02020] via-amber-500 to-emerald-500 h-full w-full animate-[pulse_1.5s_infinite]" />
            </div>

            <p className="text-[11px] text-neutral-400">
              Demo Gateway · Live Verification Simulator
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display font-black text-xl text-[#e02020]">E-shop</Link>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-[#e02020] text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400"}`}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </button>
                <span className={`text-sm hidden sm:block ${i === step ? "font-semibold text-neutral-900 dark:text-white" : "text-neutral-400"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-emerald-400" : "bg-neutral-200 dark:bg-neutral-700"}`} />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Lock size={12} /> SSL 256-Bit
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 grid lg:grid-cols-5 gap-10">
        {/* Left — form */}
        <div className="lg:col-span-3 space-y-6">
          {error && (
            <div className="flex gap-2.5 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl animate-shake">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Step 1 — Shipping Address */}
          {step === 0 && (
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-6">Shipping Address</h2>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (validateStep0()) setStep(1); }}>
                
                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1">
                      <span>First Name</span>
                      {fieldErrors.firstName && <span className="text-red-500 font-extrabold text-[10px] whitespace-nowrap">* Required</span>}
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={e => { setForm(p => ({ ...p, firstName: e.target.value })); setFieldErrors(p => ({ ...p, firstName: false })); }}
                      className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none transition-colors ${fieldErrors.firstName ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1">
                      <span>Last Name</span>
                      {fieldErrors.lastName && <span className="text-red-500 font-extrabold text-[10px] whitespace-nowrap">* Required</span>}
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={e => { setForm(p => ({ ...p, lastName: e.target.value })); setFieldErrors(p => ({ ...p, lastName: false })); }}
                      className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none transition-colors ${fieldErrors.lastName ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1">
                    <span>Email Address</span>
                    {fieldErrors.email && <span className="text-red-500 font-extrabold text-[10px] whitespace-nowrap">* Required</span>}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setFieldErrors(p => ({ ...p, email: false })); }}
                    className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none transition-colors ${fieldErrors.email ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                  />
                </div>

                {/* Country Selector (Primary Driver) */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Country</label>
                  <select
                    value={form.country}
                    onChange={e => handleCountryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm font-medium focus:outline-none focus:border-[#e02020] transition-colors"
                  >
                    {dbCountries.length > 0 ? (
                      dbCountries.map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      ["United Kingdom", "United States", "Mexico", "Spain", "Italy", "Japan", "Brazil", "Germany", "France", "Canada", "India", "Australia"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Real-time State & City Selectors */}
                <div className="grid grid-cols-2 gap-4">
                  {/* State / Region */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1">
                      <span>State / Region</span>
                      {fieldErrors.state && <span className="text-red-500 font-extrabold text-[10px] whitespace-nowrap">* Required</span>}
                    </label>
                    {loadingStates ? (
                      <div className="flex items-center gap-2 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 text-xs text-neutral-400">
                        <Loader2 size={14} className="animate-spin text-[#e02020]" /> Fetching states for {form.country}...
                      </div>
                    ) : apiStates.length > 0 ? (
                      <select
                        value={form.state}
                        onChange={e => handleStateChange(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm font-medium focus:outline-none transition-colors ${fieldErrors.state ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                      >
                        {apiStates.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.state}
                        onChange={e => { setForm(p => ({ ...p, state: e.target.value })); setFieldErrors(p => ({ ...p, state: false })); }}
                        placeholder="State / Province"
                        className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none transition-colors ${fieldErrors.state ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                      />
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1">
                      <span>City</span>
                      {fieldErrors.city && <span className="text-red-500 font-extrabold text-[10px] whitespace-nowrap">* Required</span>}
                    </label>
                    {loadingCities ? (
                      <div className="flex items-center gap-2 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 text-xs text-neutral-400">
                        <Loader2 size={14} className="animate-spin text-[#e02020]" /> Fetching cities...
                      </div>
                    ) : apiCities.length > 0 ? (
                      <select
                        value={form.city}
                        onChange={e => { setForm(p => ({ ...p, city: e.target.value })); setFieldErrors(p => ({ ...p, city: false })); }}
                        className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm font-medium focus:outline-none transition-colors ${fieldErrors.city ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                      >
                        {apiCities.map(ct => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.city}
                        onChange={e => { setForm(p => ({ ...p, city: e.target.value })); setFieldErrors(p => ({ ...p, city: false })); }}
                        placeholder="City"
                        className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none transition-colors ${fieldErrors.city ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                      />
                    )}
                  </div>
                </div>

                {/* Postal Code & Address Line 1 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1">
                      <span>Address Line 1</span>
                      {fieldErrors.street && <span className="text-red-500 font-extrabold text-[10px] whitespace-nowrap">* Required</span>}
                    </label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={e => { setForm(p => ({ ...p, street: e.target.value })); setFieldErrors(p => ({ ...p, street: false })); }}
                      placeholder="House / Building No., Street Name"
                      className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none transition-colors ${fieldErrors.street ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1">
                      <span>Postal Code</span>
                      {fieldErrors.zip && <span className="text-red-500 font-extrabold text-[10px] whitespace-nowrap">* Required</span>}
                    </label>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={e => { setForm(p => ({ ...p, zip: e.target.value })); setFieldErrors(p => ({ ...p, zip: false })); }}
                      placeholder="e.g. 01000 / SW1A"
                      className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none transition-colors ${fieldErrors.zip ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}
                    />
                  </div>
                </div>

                {/* Address Line 2 / Nearby Landmark */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Address Line 2 / Nearby Landmark <span className="text-neutral-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.street2}
                    onChange={e => setForm(p => ({ ...p, street2: e.target.value }))}
                    placeholder="Nearby Landmark (e.g. Near City Mall, Apt #4B, Opposite Park)"
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020] transition-colors"
                  />
                </div>

                <button type="submit" className="w-full py-4 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group shadow-sm mt-4">
                  Continue to Delivery <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          )}

          {/* Step 2 — Shipping method */}
          {step === 1 && (
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-6">Shipping Method</h2>
              <div className="space-y-3 mb-6">
                {METHODS.map(m => (
                  <label key={m.id} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${method === m.id ? "border-[#e02020] bg-[#e02020]/5" : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-[#e02020]" />
                      <div>
                        <p className="font-semibold text-sm text-neutral-900 dark:text-white">{m.label}</p>
                        <p className="text-xs text-neutral-400">{m.sub}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {m.badge ? <span className="text-emerald-600 font-bold text-sm">{m.badge}</span> : <span className="font-bold text-sm text-neutral-900 dark:text-white">{formatPrice(m.price)}</span>}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-6 py-4 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-[#e02020] transition-colors flex items-center gap-2"><ArrowLeft size={15} />Back</button>
                <button onClick={() => setStep(2)} className="flex-1 py-4 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group">Continue to Payment<ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /></button>
              </div>
            </div>
          )}

          {/* Step 3 — Portfolio Payment Gateway Simulator */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">Payment Method</h2>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200">
                  Demo Gateway Active
                </span>
              </div>

              {/* Payment Option Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, Amex" },
                  { id: "apple", label: "Apple / Google Pay", sub: "Instant 1-Click Pay" },
                  { id: "paypal", label: "PayPal Express", sub: "Pay with PayPal Balance" },
                  { id: "klarna", label: "Klarna Pay Later", sub: "3 Interest-Free Payments" }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayMethod(p.id)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${payMethod === p.id ? "border-[#e02020] bg-[#e02020]/5 shadow-sm" : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"}`}
                  >
                    <p className="font-semibold text-xs text-neutral-900 dark:text-white">{p.label}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{p.sub}</p>
                  </button>
                ))}
              </div>

              {/* Card Simulator Fields */}
              {payMethod === "card" && (
                <div className="space-y-4 p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-sm mb-6">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Card Details</span>
                    <span className="text-xs font-mono font-bold text-[#e02020] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                      {detectCardBrand(form.cardNum)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Cardholder Name</label>
                    <input type="text" value={form.nameOnCard} onChange={e => setForm(p => ({ ...p, nameOnCard: e.target.value }))} placeholder="e.g. John Doe" className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-[#e02020] transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex justify-between">
                      Card Number {fieldErrors.cardNum && <span className="text-red-500 font-bold">* Required</span>}
                    </label>
                    <input type="text" value={form.cardNum} onChange={e => handleCardNumChange(e.target.value)} placeholder="4000 1234 5678 9010" className={`w-full px-4 py-3 border rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm font-mono tracking-widest focus:outline-none transition-colors ${fieldErrors.cardNum ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex justify-between">
                        Expiry {fieldErrors.expiry && <span className="text-red-500 font-bold">* Required</span>}
                      </label>
                      <input type="text" value={form.expiry} onChange={e => handleExpiryChange(e.target.value)} placeholder="MM / YY" className={`w-full px-4 py-3 border rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-none transition-colors ${fieldErrors.expiry ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex justify-between">
                        CVV / CVC {fieldErrors.cvv && <span className="text-red-500 font-bold">* Required</span>}
                      </label>
                      <input type="password" maxLength={4} value={form.cvv} onChange={e => { setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "") })); setFieldErrors(p => ({ ...p, cvv: false })); }} placeholder="•••" className={`w-full px-4 py-3 border rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-none transition-colors ${fieldErrors.cvv ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`} />
                    </div>
                  </div>
                </div>
              )}

              {payMethod !== "card" && (
                <div className="p-5 bg-neutral-100/70 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center space-y-2 mb-6">
                  <Sparkles size={20} className="mx-auto text-[#e02020]" />
                  <p className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {payMethod === "apple" ? "Apple Pay / Google Pay Selected" : payMethod === "paypal" ? "PayPal Express Checkout" : "Klarna 3 Interest-Free Payments"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Clicking "Place Order" will simulate instant gateway approval.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-4 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-[#e02020] transition-colors flex items-center gap-2"><ArrowLeft size={15} />Back</button>
                <button onClick={handleSubmit} disabled={submitting} className={`flex-1 py-4 ${submitting ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-[#e02020] hover:bg-[#c01a1a] text-white"} font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group shadow-md`}>
                  <Lock size={14} /> {submitting ? "Processing SSL Gateway..." : `Pay ${formatPrice(total)}`} {!submitting && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — Order Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-28 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-900 dark:text-white text-sm uppercase tracking-wider">
              Order Summary ({cartItems.length})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cartItems.length ? cartItems.map((i, idx) => (
                <div key={`${i.productId}-${idx}`} className="flex gap-3 items-center p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                  <div className="w-12 h-14 rounded-lg flex-shrink-0 bg-white dark:bg-neutral-800 overflow-hidden relative border border-neutral-200 dark:border-neutral-700">
                    {i.image ? (
                      <img src={i.image} alt={i.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">🛍️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{i.name}</p>
                    <p className="text-[10px] font-medium text-neutral-400 mt-0.5">Qty: {i.qty}</p>
                  </div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    {formatPrice(i.price * i.qty)}
                  </p>
                </div>
              )) : <p className="text-xs text-neutral-400">No items in cart</p>}
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-neutral-500"><span>Shipping ({method})</span><span className="font-semibold text-neutral-900 dark:text-white">{shippingCost ? formatPrice(shippingCost) : "FREE"}</span></div>
              <div className="flex justify-between font-bold text-neutral-900 dark:text-white text-sm pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span>Total</span><span className="text-[#e02020] font-black text-base">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
