"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success (don't reveal if email exists — security)
      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-10">
        <Link href="/" className="font-display font-black text-xl text-[#e02020] block mb-8">CODEX</Link>
        {!sent ? (
          <>
            <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-2">Forgot password?</h1>
            <p className="text-neutral-500 text-sm mb-8">Enter your email and we'll send a reset link.</p>

            {error && (
              <div className="mb-4 flex gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/30 focus:border-[#e02020] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 ${loading ? "bg-neutral-300 text-neutral-500" : "bg-[#e02020] hover:bg-[#c01a1a] text-white"} font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group`}
              >
                {loading ? "Sending…" : "Send reset link"} {!loading && <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-green-600" />
            </div>
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white mb-2">Check your inbox</h2>
            <p className="text-neutral-500 text-sm mb-6">
              If <strong>{email}</strong> exists in our system, we sent a password reset link. It expires in 15 minutes.
            </p>
            <button onClick={() => setSent(false)} className="text-sm text-neutral-400 hover:text-[#e02020] transition-colors">
              Didn't receive it? Try again
            </button>
          </div>
        )}
        <Link href="/auth/login" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 mt-6 transition-colors">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
