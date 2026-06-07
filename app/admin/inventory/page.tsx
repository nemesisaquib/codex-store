"use client";
import { useEffect, useState } from "react";
import { Search, Save, AlertTriangle, Package, RefreshCw } from "lucide-react";

interface InvProduct { id:string;name:string;slug:string;brand:string;category:string;stock:number;status:string;image_url:string|null;price:number }

export default function AdminInventoryPage() {
  const [products, setProducts]  = useState<InvProduct[]>([]);
  const [lowStock, setLowStock]  = useState(0);
  const [outStock, setOutStock]  = useState(0);
  const [edits,    setEdits]     = useState<Record<string,number>>({});
  const [saving,   setSaving]    = useState(false);
  const [saved,    setSaved]     = useState(false);
  const [filter,   setFilter]    = useState("all");
  const [search,   setSearch]    = useState("");

  const load = () => {
    fetch("/api/inventory").then(r=>r.json()).then(d => {
      setProducts(d.products ?? []);
      setLowStock(d.lowStock ?? 0);
      setOutStock(d.outOfStock ?? 0);
    });
  };
  useEffect(load, []);

  const change = (id: string, val: number) => setEdits(p => ({...p, [id]: val}));

  const saveAll = async () => {
    if (!Object.keys(edits).length) return;
    setSaving(true);
    const bulk = Object.entries(edits).map(([id,stock]) => ({id,stock}));
    await fetch("/api/inventory", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({bulk}) });
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); setEdits({}); load(); }, 800);
  };

  const filtered = products.filter(p => {
    if (filter==="low" && p.stock>10) return false;
    if (filter==="out" && p.stock!==0) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Inventory</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage stock levels · {Object.keys(edits).length > 0 && <span className="text-orange-500">{Object.keys(edits).length} unsaved change{Object.keys(edits).length>1?"s":""}</span>}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm hover:border-neutral-400 transition-colors">
            <RefreshCw size={13}/>
          </button>
          <button onClick={saveAll} disabled={saving||!Object.keys(edits).length}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${saved?"bg-green-500 text-white":Object.keys(edits).length?"bg-[#e02020] hover:bg-[#c01a1a] text-white":"bg-neutral-200 text-neutral-400 cursor-not-allowed"}`}>
            <Save size={14}/>{saved?"Saved!":saving?"Saving…":"Save Changes"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><Package size={18} className="text-green-600"/></div>
          <div><p className="font-display font-black text-xl text-neutral-900 dark:text-white">{products.length}</p><p className="text-xs text-neutral-400">Total Products</p></div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center"><AlertTriangle size={18} className="text-orange-500"/></div>
          <div><p className="font-display font-black text-xl text-orange-500">{lowStock}</p><p className="text-xs text-neutral-400">Low Stock (≤10)</p></div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle size={18} className="text-red-500"/></div>
          <div><p className="font-display font-black text-xl text-red-500">{outStock}</p><p className="text-xs text-neutral-400">Out of Stock</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        {[["all","All"],["low","Low Stock"],["out","Out of Stock"]].map(([v,l]) => (
          <button key={v} onClick={()=>setFilter(v)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${filter===v?"bg-[#e02020] text-white":"bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-700 hover:text-[#e02020]"}`}>
            {l}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…"
            className="pl-8 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#e02020] w-48"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr>{["Product","Category","Price","Current Stock","New Stock","Status"].map(h =>
              <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filtered.map(p => {
              const currentVal = edits[p.id] !== undefined ? edits[p.id] : p.stock;
              const changed = edits[p.id] !== undefined;
              return (
                <tr key={p.id} className={`transition-colors ${changed?"bg-blue-50/50 dark:bg-blue-950/20":"hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy"/> : <div className="w-full h-full bg-neutral-200"/>}
                      </div>
                      <div><p className="text-sm font-medium text-neutral-900 dark:text-white">{p.name}</p><p className="text-[10px] text-neutral-400">{p.brand}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-500">{p.category}</td>
                  <td className="px-5 py-3 text-sm font-bold text-neutral-900 dark:text-white">${p.price}</td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-bold ${p.stock===0?"text-red-500":p.stock<=10?"text-orange-500":"text-neutral-900 dark:text-white"}`}>
                      {p.stock} {p.stock===0?"⚠️":p.stock<=10?"⚠":""}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number" min="0" value={currentVal}
                      onChange={e => change(p.id, parseInt(e.target.value)||0)}
                      className={`w-24 px-3 py-1.5 border rounded-lg text-sm focus:outline-none transition-colors ${changed?"border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600":"border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:border-[#e02020]"}`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status==="active"?"bg-green-100 text-green-700":"bg-neutral-100 text-neutral-500"}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
          {filtered.length} products shown
        </div>
      </div>
    </div>
  );
}
