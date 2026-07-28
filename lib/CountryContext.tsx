"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export type Country = { code: string; name: string };

interface CountryContextType {
  country: Country | null;
  setCountry: (country: Country) => void;
  countries: Country[];
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountryState] = useState<Country | null>(null);

  useEffect(() => {
    fetch("/api/countries").then(r => r.json()).then(data => {
      setCountries(data);
      const saved = localStorage.getItem("selectedCountry");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (data.some((c: Country) => c.code === parsed.code)) {
             setCountryState(parsed);
             return;
          }
        } catch (e) {}
      }
      if (data.length > 0) {
        setCountryState(data[0]);
      }
    }).catch(console.error);
  }, []);

  const setCountry = (c: Country) => {
    setCountryState(c);
    localStorage.setItem("selectedCountry", JSON.stringify(c));
  };

  return (
    <CountryContext.Provider value={{ country, setCountry, countries }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return context;
}
