"use client";
import { useState, useEffect } from "react";
import { Search, MapPin, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Country {
  code: string;
  name: string;
  is_active: number;
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function AdminCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/countries");
      const data = await res.json();
      setCountries(data);
    } catch (err) {
      toast.error("Failed to load countries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const toggleStatus = async (code: string, currentStatus: number) => {
    setUpdating(code);
    const nextStatus = currentStatus === 1 ? 0 : 1;
    try {
      const res = await fetch("/api/admin/countries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, is_active: nextStatus }),
      });
      if (!res.ok) throw new Error();
      
      setCountries(prev => prev.map(c => 
        c.code === code ? { ...c, is_active: nextStatus } : c
      ));
      toast.success(nextStatus ? "Country activated" : "Country deactivated");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = countries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <MapPin className="text-[#e02020]" />
            Manage Countries
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Enable or disable countries available for checkout and global selection.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:border-[#e02020] transition-colors"
            />
          </div>
          <button 
            onClick={fetchCountries} 
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {loading && countries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-3 opacity-50" />
                    Loading countries...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                    No countries found matching "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.code} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{getFlagEmoji(c.code)}</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md text-xs font-medium border border-neutral-200 dark:border-neutral-700">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {c.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                          <Check size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                          <X size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => toggleStatus(c.code, c.is_active)}
                        disabled={updating === c.code}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          c.is_active
                            ? "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-[#e02020]"
                            : "bg-[#e02020] hover:bg-[#c01a1a] text-white shadow-[#e02020]/20"
                        } ${updating === c.code ? "opacity-50 cursor-wait" : ""}`}
                      >
                        {updating === c.code ? "Saving..." : c.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
