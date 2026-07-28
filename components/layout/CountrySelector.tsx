"use client";
import { useState, useRef, useEffect } from "react";
import { useCountry, Country } from "@/lib/CountryContext";
import { ChevronDown } from "lucide-react";

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function CountrySelector() {
  const { country, setCountry, countries } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!country) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        <span className="text-base leading-none">{getFlagEmoji(country.code)}</span>
        <span className="hidden lg:block text-xs uppercase tracking-wide">{country.code}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 max-h-96 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 py-1">
          {countries.map((c: Country) => (
            <button
              key={c.code}
              onClick={() => {
                setCountry(c);
                setOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                country.code === c.code ? "bg-neutral-50 dark:bg-neutral-800 font-semibold" : ""
              }`}
            >
              <span className="text-base">{getFlagEmoji(c.code)}</span>
              <span className="text-neutral-900 dark:text-white truncate">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
