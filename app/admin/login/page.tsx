"use client";
import { useState } from "react";
import { Eye, EyeOff, Store, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [email,    setEmail]    = useState("admin@codex.com");
  const [password, setPassword] = useState("admin123");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const r = await fetch("/api/auth/admin", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) { window.location.href = "/admin"; }
    else { const d = await r.json(); setError(d.error ?? "Invalid credentials"); setLoading(false); }
  };

  return (
    <div className="admin-scope min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{backgroundImage:"repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 50px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 50px)"}}/>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#e02020] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#e02020]/30">
            <Store size={28} className="text-white"/>
          </div>
          <h1 className="font-display font-black text-white text-2xl">CODEX Admin</h1>
          <p className="text-neutral-500 text-sm mt-1">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#e02020] transition-colors placeholder:text-neutral-600"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#e02020] transition-colors pr-11"/>
                <button type="button" onClick={()=>setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                  {show?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <ShieldCheck size={14}/>{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#e02020] hover:bg-[#c01a1a] disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 group">
              {loading ? "Signing in…" : <><ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform"/> Sign in</>}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-5 p-3 bg-neutral-800/60 rounded-xl border border-neutral-700/50">
            <p className="text-[10px] text-neutral-500 text-center font-mono">
              Demo: admin@codex.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
