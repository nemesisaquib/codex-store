"use client";
import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle"|"loading"|"done"|"error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="text-sm text-green-400 font-medium py-2.5">
        ✓ Subscribed — welcome to CODEX.
      </p>
    );
  }

  return (
    <form className="flex w-full md:w-auto gap-2.5" onSubmit={submit}>
      <div className="relative flex-1 md:w-64">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          suppressHydrationWarning
          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#e02020] transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={state === "loading"}
        className="px-5 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
      >
        {state === "loading" ? "…" : "Subscribe"}
      </button>
    </form>
  );
}
