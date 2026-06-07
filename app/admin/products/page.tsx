"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Eye, X, Check } from "lucide-react";
import CloudinaryUpload from "@/components/admin/CloudinaryUpload";

interface Product {
  id:string;name:string;slug:string;brand:string;category:string;
  price:number;compare_price:number|null;color:string|null;
  image_url:string|null;image_url2:string|null;gallery:string|null;
  stock:number;status:string;badge:string|null;
  is_new:number;rating:number;reviews:number;description:string|null;
}

const CATS = ["Women","Men","Kids","Accessories"];
const EMPTY = {name:"",brand:"",category:"Women",price:"",compare_price:"",color:"#c4a882",image_url:"",image_url2:"",gallery:[] as string[],stock:"100",badge:"",description:"",status:"active",is_new:false};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"add"|"edit"|null>(null);
  const [editing, setEditing]   = useState<Product|null>(null);
  const [form, setForm]         = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/products?q=${search}&limit=50&status=`)
      .then(r=>r.json())
      .then(d => { setProducts(d.products ?? []); setTotal(d.total ?? 0); setLoading(false); });
  };
  useEffect(load, [search]);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal("add"); };
  const openEdit = (p: Product) => {
    let gal: string[] = [];
    try { gal = p.gallery ? JSON.parse(p.gallery) : []; } catch { gal = []; }
    setForm({name:p.name,brand:p.brand,category:p.category,price:String(p.price),compare_price:String(p.compare_price??""),color:p.color??"#c4a882",image_url:p.image_url??"",image_url2:p.image_url2??"",gallery:gal,stock:String(p.stock),badge:p.badge??"",description:p.description??"",status:p.status,is_new:p.is_new===1});
    setEditing(p);
    setModal("edit");
  };

  const save = async () => {
    setSaving(true);
    const body = {
      name:form.name, brand:form.brand, category:form.category,
      price:parseFloat(form.price), comparePrice:form.compare_price?parseFloat(form.compare_price):null,
      color:form.color, stock:parseInt(form.stock), badge:form.badge||null,
      description:form.description, status:form.status, isNew:form.is_new,
      image_url:form.image_url||null, image_url2:form.image_url2||null,
      gallery:JSON.stringify(form.gallery||[]),
    };
    if (modal === "add") {
      await fetch("/api/products", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    } else if (editing) {
      await fetch(`/api/products/${editing.slug}`, {method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    }
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); setModal(null); load(); }, 800);
  };

  const del = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await fetch(`/api/products/${p.slug}`, {method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status:"deleted"})});
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Products</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{total} total · SQLite</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={15}/> Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…"
              className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 w-8"><input type="checkbox" className="accent-[#e02020]"/></th>
                {["Product","Category","Price","Stock","Status","Actions"].map(h=>
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? Array.from({length:6}).map((_,i)=>(
                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"/></td></tr>
              )) : products.filter(p=>p.status!=="deleted").map(p => (
                <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-4"><input type="checkbox" className="accent-[#e02020]"/></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-neutral-100">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy"/> : <div className="w-full h-full" style={{background:`linear-gradient(160deg,${p.color??"#c4a882"},${p.color??"#c4a882"}88)`}}/>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{p.name}</p>
                        <p className="text-[10px] text-neutral-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-500">{p.category}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">${p.price}</p>
                    {p.compare_price && <p className="text-[10px] text-neutral-400 line-through">${p.compare_price}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold ${p.stock<=10?"text-red-500":"text-neutral-600 dark:text-neutral-400"}`}>
                      {p.stock}{p.stock<=10?" ⚠️":""}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status==="active"?"bg-green-100 text-green-700":"bg-neutral-100 text-neutral-500"}`}>
                      {p.status==="active"?"Active":"Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-neutral-400 hover:text-[#e02020] transition-colors"><Eye size={14}/></a>
                      <button onClick={()=>openEdit(p)} className="p-1.5 text-neutral-400 hover:text-[#3b82f6] transition-colors"><Edit2 size={14}/></button>
                      <button onClick={()=>del(p)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
          Showing {products.filter(p=>p.status!=="deleted").length} of {total} products
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setModal(null)}/>
          <div style={{maxWidth:"1140px"}} className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900">
              <h2 className="font-semibold text-neutral-900 dark:text-white">{modal==="add"?"Add Product":"Edit Product"}</h2>
              <button onClick={()=>setModal(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              {[["Product Name","name","text"],["Brand","brand","text"],["Description","description","text"]].map(([l,k,t]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{l}</label>
                  {k==="description" ? (
                    <textarea value={String(form[k as keyof typeof form])} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] resize-none" rows={3}/>
                  ) : (
                    <input type={t} value={String(form[k as keyof typeof form])} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                  )}
                </div>
              ))}

              {/* ── Main image upload (Cloudinary) ── */}
              <CloudinaryUpload
                mode="single"
                label="Main Product Image"
                value={form.image_url}
                onChange={(v) => setForm(p => ({ ...p, image_url: v as string }))}
              />

              {/* ── Hover image (optional 2nd) ── */}
              <CloudinaryUpload
                mode="single"
                label="Hover Image (optional)"
                value={form.image_url2}
                onChange={(v) => setForm(p => ({ ...p, image_url2: v as string }))}
              />

              {/* ── Product gallery (multiple) ── */}
              <CloudinaryUpload
                mode="multiple"
                label="Product Gallery (extra angles)"
                value={form.gallery}
                onChange={(v) => setForm(p => ({ ...p, gallery: v as string[] }))}
              />

              {/* Compact guidance */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-600 dark:text-blue-300 space-y-0.5">
                <p className="font-bold text-blue-700 dark:text-blue-400">📸 Best results</p>
                <p>Upload <strong>4:5 portrait</strong> (e.g. 800×1000px). WebP/PNG/JPG accepted — Cloudinary auto-converts to WebP/AVIF + compresses on delivery.</p>
                <p>Files upload straight from your computer to the CDN. No manual URL needed.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]">
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]">
                    <option value="active">Active</option><option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Price ($)</label>
                  <input type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Compare Price ($)</label>
                  <input type="number" value={form.compare_price} onChange={e=>setForm(p=>({...p,compare_price:e.target.value}))}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Stock</label>
                  <input type="number" value={form.stock} onChange={e=>setForm(p=>({...p,stock:e.target.value}))}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Badge</label>
                  <input type="text" value={form.badge} onChange={e=>setForm(p=>({...p,badge:e.target.value}))} placeholder="Bestseller, Limited…"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_new as boolean} onChange={e=>setForm(p=>({...p,is_new:e.target.checked}))} className="accent-[#e02020] w-4 h-4"/>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Mark as New Arrival</span>
              </label>

              <button onClick={save} disabled={saving||saved}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${saved?"bg-green-500 text-white":saving?"bg-neutral-300 text-neutral-500 cursor-not-allowed":"bg-[#e02020] hover:bg-[#c01a1a] text-white"}`}>
                {saved ? <><Check size={16}/>Saved!</> : saving ? "Saving…" : modal==="add"?"Add Product":"Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
