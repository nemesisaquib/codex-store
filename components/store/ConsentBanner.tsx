"use client";
import { useState, useEffect } from "react";
import { ShieldAlert, Cookie, X } from "lucide-react";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("eshop_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (type: "all" | "essential") => {
    localStorage.setItem("eshop_cookie_consent", type);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[9999] animate-[slideUp_0.4s_ease-out]">
      <div className="bg-neutral-950/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-800 dark:border-neutral-800 text-white rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#e02020]/20 flex items-center justify-center text-[#e02020] flex-shrink-0">
            <Cookie size={20} className="animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-wide">Cookie & Privacy Settings</h4>
              <button 
                onClick={() => setVisible(false)}
                className="text-neutral-500 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We use cookies to enhance your shopping experience, analyze site traffic, and deliver personalized content. By continuing, you agree to our use of cookies.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button 
            onClick={() => handleConsent("essential")}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors border border-neutral-800 hover:border-neutral-700"
          >
            Essential Only
          </button>
          <button 
            onClick={() => handleConsent("all")}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#e02020] hover:bg-[#c01a1a] text-white transition-colors shadow-lg shadow-[#e02020]/20"
          >
            Accept All
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
