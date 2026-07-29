"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Settings {
  store_name?: string;
  currency?: string;
  store_email?: string;
  store_phone?: string;
  store_address?: string;
  free_shipping_threshold?: string;
  [key: string]: any;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  formatPrice: (price: number) => string;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    store_name: "E-shop",
    currency: "EUR",
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const d = await res.json();
      if (d.flat) {
        setSettings(prev => ({ ...prev, ...d.flat }));
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 4000); // Live poll for dynamic Admin updates
    const handleUpdate = () => fetchSettings();
    window.addEventListener("settings-updated", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("settings-updated", handleUpdate);
    };
  }, [fetchSettings]);

  const formatPrice = (price: number) => {
    const rawCurr = (settings.currency || "EUR").trim().toUpperCase();
    const num = Number(price || 0);

    const SYMBOLS: Record<string, string> = {
      EUR: "€",
      GBP: "£",
      USD: "$",
      CAD: "CA$",
      AUD: "A$",
      JPY: "¥",
      INR: "₹",
      AED: "AED ",
      CNY: "¥",
    };

    const symbol = SYMBOLS[rawCurr] || `${rawCurr} `;
    return `${symbol}${num.toFixed(2)}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, formatPrice, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
