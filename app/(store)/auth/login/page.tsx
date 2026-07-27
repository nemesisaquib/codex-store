"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Login failed");
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
      {/* Left — branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#0a0a0a 0%,#1a0505 50%,#3d0808 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)" }}
        />
        <Link href="/" className="relative z-10">
          <span className="font-display font-black text-white text-3xl">E-shop</span>
        </Link>
        <div className="relative z-10">
          <p className="font-display font-black text-white leading-tight mb-4" style={{ fontSize: "3.5rem" }}>
            Welcome
            <br />
            <em className="italic text-[#e02020]">back.</em>
          </p>
          <p className="text-white/50 text-lg">Your style, your story. Pick up where you left off.</p>
        </div>
        <div className="relative z-10 flex gap-8">
          {[
            ["2M+", "Customers"],
            ["120+", "Countries"],
            ["50K+", "Styles"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="font-display font-bold text-white text-2xl">{v}</p>
              <p className="text-white/40 text-xs uppercase tracking-wider">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8 bg-white dark:bg-neutral-950">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden font-display font-black text-2xl text-[#e02020] block mb-10">
            E-shop
          </Link>
          <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">Sign in</h1>
          <p className="text-neutral-500 text-sm mb-8">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-[#e02020] font-medium hover:underline">
              Register free
            </Link>
          </p>

          {error && (
            <div className="mb-6 flex gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Demo credentials hint */}
          <button
            type="button"
            onClick={() => { setEmail("jane.doe@example.com"); setPassword("password123"); }}
            className="mb-6 w-full text-left p-3 bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl hover:border-[#e02020] transition-colors group"
          >
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Demo account — click to fill</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-300"><span className="font-mono">jane.doe@example.com</span> · <span className="font-mono">password123</span></p>
          </button>

          <form className="space-y-5" onSubmit={handleSubmit}>
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
                  placeholder="••••••••"
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
              <div className="flex justify-end mt-2">
                <Link href="/auth/forgot-password" className="text-xs text-neutral-400 hover:text-[#e02020] transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 ${loading ? "bg-neutral-300 text-neutral-500" : "bg-[#e02020] hover:bg-[#c01a1a] text-white"} font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group`}
            >
              {loading ? "Signing in…" : "Sign in"} {!loading && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-neutral-950 px-3 text-xs text-neutral-400">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["Google", "Apple"].map((p) => (
              <button
                key={p}
                type="button"
                className="flex items-center justify-center gap-2 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
