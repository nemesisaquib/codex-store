"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Check } from "lucide-react";

interface Address { id: string; name: string; street: string; city: string; state: string; zip: string; country: string; phone: string; is_default: number }

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", street: "", city: "", state: "", zip: "", country: "United States", phone: "", isDefault: false });

  useEffect(() => {
    fetch("/api/addresses").then(r => r.json()).then(d => { setAddresses(d.addresses ?? []); setLoading(false); });
  }, []);

  const add = async () => {
    const res = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.ok) {
      setAddresses(p => [...p, { id: data.id, ...form, is_default: form.isDefault ? 1 : 0 }]);
      setForm({ name: "", street: "", city: "", state: "", zip: "", country: "United States", phone: "", isDefault: false });
      setModal(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses(p => p.filter(a => a.id !== id));
  };

  if (loading) return <div className="py-16 text-center text-neutral-400">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Saved Addresses</h1>
        <button onClick={() => setModal(!modal)} className="flex items-center gap-2 px-4 py-2 bg-[#e02020] text-white rounded-xl text-sm font-medium hover:bg-[#c01a1a] transition-colors">
          <Plus size={14}/> Add New
        </button>
      </div>

      {modal && (
        <div className="mb-6 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-3">
          {[{k:"name",l:"Name"},{k:"street",l:"Street"},{k:"city",l:"City"},{k:"state",l:"State"},{k:"zip",l:"Zip"},{k:"phone",l:"Phone"}].map(({k,l})=>(
            <input key={k} type="text" value={(form as Record<string,string>)[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={l} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
          ))}
          <select value={form.country} onChange={e=>setForm(p=>({...p,country:e.target.value}))} className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]">
            <option>United States</option><option>United Kingdom</option><option>Canada</option>
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isDefault} onChange={e=>setForm(p=>({...p,isDefault:e.target.checked}))} className="accent-[#e02020]"/><span className="text-xs">Set as default</span></label>
          <div className="flex gap-2">
            <button onClick={add} className="flex-1 px-3 py-2 bg-[#e02020] text-white rounded-lg text-sm font-medium hover:bg-[#c01a1a]">Save</button>
            <button onClick={()=>setModal(false)} className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-16"><MapPin size={40} className="mx-auto text-neutral-200 mb-3"/><p className="text-neutral-500">No addresses yet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map(a => (
            <div key={a.id} className={`p-4 border-2 rounded-xl ${a.is_default?"border-[#e02020] bg-[#e02020]/5":"border-neutral-200 dark:border-neutral-700"}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-sm text-neutral-900 dark:text-white">{a.name}</p>
                {a.is_default && <span className="flex items-center gap-1 text-[10px] font-bold text-[#e02020]"><Check size={10}/>Default</span>}
              </div>
              <p className="text-xs text-neutral-500">{a.street}, {a.city}, {a.state} {a.zip}</p>
              <div className="flex gap-2 mt-3">
                <button className="text-[#e02020] text-xs font-medium hover:underline"><Edit2 size={12}/></button>
                <button onClick={()=>remove(a.id)} className="text-red-500 text-xs font-medium hover:underline"><Trash2 size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
