"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Check, Copy } from "lucide-react";

interface Promo { id:string;code:string;type:string;value:number;min_order:number;max_uses:number|null;used_count:number;valid_from:string;valid_until:string|null;is_active:number;description:string|null }

const TYPE_LABEL: Record<string,string> = { percentage:"% Off", fixed:"$ Off", free_shipping:"Free Shipping" };

const EMPTY_FORM = { code:"",type:"percentage",value:"",min_order:"0",max_uses:"",valid_from:new Date().toISOString().split("T")[0],valid_until:"",description:"" };

export default function AdminPromotionsPage() {
  const [promos,   setPromos]  = useState<Promo[]>([]);
  const [modal,    setModal]   = useState(false);
  const [form,     setForm]    = useState(EMPTY_FORM);
  const [saving,   setSaving]  = useState(false);
  const [saved,    setSaved]   = useState(false);
  const [copied,   setCopied]  = useState("");

  const load = () => fetch("/api/promotions").then(r=>r.json()).then(d=>setPromos(d.promotions??[]));
  useEffect(() => { load(); }, []);

  const toggle = async (p: Promo) => {
    await fetch(`/api/promotions/${p.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_active:p.is_active?0:1})});
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this promo?")) return;
    await fetch(`/api/promotions/${id}`,{method:"DELETE"});
    load();
  };

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(()=>setCopied(""),1500);
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/promotions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,value:parseFloat(form.value),min_order:parseFloat(form.min_order||"0"),max_uses:form.max_uses?parseInt(form.max_uses):null})});
    setSaving(false); setSaved(true);
    setTimeout(()=>{setSaved(false);setModal(false);setForm(EMPTY_FORM);load();},700);
  };

  const activePromos = promos.filter(p=>p.is_active);
  const totalSavings = promos.reduce((s,p)=>s+p.used_count*(p.type==="percentage"?p.value*2:p.value),0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Promotions</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{activePromos.length} active codes</p>
        </div>
        <button onClick={()=>setModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={15}/> Create Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[{label:"Active Codes",value:String(activePromos.length),color:"#22c55e"},{label:"Total Uses",value:String(promos.reduce((s,p)=>s+p.used_count,0)),color:"#3b82f6"},{label:"Total Codes",value:String(promos.length),color:"#e02020"}].map(({label,value,color})=>(
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl p-4 text-center">
            <p className="font-display font-black text-3xl" style={{color}}>{value}</p>
            <p className="text-xs text-neutral-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr>{["Code","Type","Value","Min Order","Uses","Valid Until","Status","Actions"].map(h=>
              <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {promos.map(p => (
              <tr key={p.id} className={`transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${!p.is_active?"opacity-50":""}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-black text-[#e02020] bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-lg">{p.code}</code>
                    <button onClick={()=>copy(p.code)} className="p-1 text-neutral-400 hover:text-[#e02020] transition-colors">
                      {copied===p.code ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                    </button>
                  </div>
                  {p.description && <p className="text-[10px] text-neutral-400 mt-1">{p.description}</p>}
                </td>
                <td className="px-5 py-4"><span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{TYPE_LABEL[p.type]??p.type}</span></td>
                <td className="px-5 py-4 text-sm font-bold text-neutral-900 dark:text-white">
                  {p.type==="percentage"?`${p.value}%`:p.type==="fixed"?`$${p.value}`:"FREE"}
                </td>
                <td className="px-5 py-4 text-xs text-neutral-500">{p.min_order>0?`$${p.min_order}`:"—"}</td>
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{p.used_count}</p>
                    {p.max_uses && <p className="text-[10px] text-neutral-400">/ {p.max_uses}</p>}
                  </div>
                  {p.max_uses && (
                    <div className="w-16 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-1">
                      <div className="h-full bg-[#e02020] rounded-full" style={{width:`${Math.min(100,(p.used_count/p.max_uses)*100)}%`}}/>
                    </div>
                  )}
                </td>
                <td className="px-5 py-4 text-xs text-neutral-500">{p.valid_until ?? "∞ No expiry"}</td>
                <td className="px-5 py-4">
                  <button onClick={()=>toggle(p)} className="flex items-center gap-1.5 text-xs font-semibold transition-colors">
                    {p.is_active ? <ToggleRight size={20} className="text-green-500"/> : <ToggleLeft size={20} className="text-neutral-400"/>}
                    <span className={p.is_active?"text-green-600":"text-neutral-400"}>{p.is_active?"Active":"Off"}</span>
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button onClick={()=>del(p.id)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setModal(false)}/>
          <div style={{maxWidth:"1140px"}} className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="font-semibold text-neutral-900 dark:text-white">Create Promo Code</h2>
              <button onClick={()=>setModal(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Code</label>
                  <input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="SUMMER25"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Type</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]">
                    <option value="percentage">% Off</option>
                    <option value="fixed">$ Fixed Off</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                {form.type !== "free_shipping" && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Value</label>
                    <input type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:e.target.value}))} placeholder={form.type==="percentage"?"10":"50"}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Min Order ($)</label>
                  <input type="number" value={form.min_order} onChange={e=>setForm(p=>({...p,min_order:e.target.value}))}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e=>setForm(p=>({...p,max_uses:e.target.value}))} placeholder="Unlimited"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Expires</label>
                  <input type="date" value={form.valid_until} onChange={e=>setForm(p=>({...p,valid_until:e.target.value}))}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Description</label>
                <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Internal note…"
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
              </div>
              <button onClick={save} disabled={saving||saved||!form.code}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${saved?"bg-green-500 text-white":saving||!form.code?"bg-neutral-200 text-neutral-400 cursor-not-allowed":"bg-[#e02020] hover:bg-[#c01a1a] text-white"}`}>
                {saved?<><Check size={15}/>Created!</>:saving?"Creating…":"Create Promo Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
