"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    store_name: "E-shop",
    currency: "USD",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        if (d.flat) {
          setSettings(prev => ({ ...prev, ...d.flat }));
        }
        setLoading(false);
      })
      .catch(e => {
        console.error("Failed to load settings", e);
        setLoading(false);
      });
  }, []);

  const formatPrice = (price: number) => {
    const curr = settings.currency || "USD";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, formatPrice }}>
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
