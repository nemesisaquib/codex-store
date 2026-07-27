"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Check, AlertCircle } from "lucide-react";

const perks = ["Free shipping on first order", "Early access to sales", "Loyalty points on every purchase", "Easy 30-day returns"];

export default function RegisterPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms) {
      setError("Please agree to terms and privacy");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email, password, firstName, lastName }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/account");
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div
        className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0a0a0a 0%,#050a1a 50%,#0a1a30 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)" }}
        />
        <Link href="/" className="relative z-10">
          <span className="font-display font-black text-white text-3xl">E-shop</span>
        </Link>
        <div className="relative z-10">
          <p className="font-display font-black text-white leading-tight mb-6" style={{ fontSize: "3rem" }}>
            Join the
            <br />
            <em className="italic text-[#3b82f6]">E-shop</em>
            <br />
            community.
          </p>
          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="w-5 h-5 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-[#3b82f6]" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-white/30 text-xs">Trusted by 2M+ shoppers worldwide.</p>
      </div>

      <div className="flex items-center justify-center p-8 bg-white dark:bg-neutral-950">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden font-display font-black text-2xl text-[#e02020] block mb-10">
            E-shop
          </Link>
          <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">Create account</h1>
          <p className="text-neutral-500 text-sm mb-8">
            Already registered?{" "}
            <Link href="/auth/login" className="text-[#e02020] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {error && (
            <div className="mb-6 flex gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/30 focus:border-[#e02020] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/30 focus:border-[#e02020] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/30 focus:border-[#e02020] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/30 focus:border-[#e02020] transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 accent-[#e02020]"
              />
              <span className="text-xs text-neutral-500">
                I agree to E-shop's{" "}
                <Link href="/terms" className="text-[#e02020] hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#e02020] hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 ${loading ? "bg-neutral-300 text-neutral-500" : "bg-[#e02020] hover:bg-[#c01a1a] text-white"} font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group`}
            >
              {loading ? "Creating account…" : "Create account"} {!loading && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
