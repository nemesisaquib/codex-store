"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Eye, X, Check, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import CloudinaryUpload from "@/components/admin/CloudinaryUpload";
import { safeJsonArray } from "@/lib/api";
import { toast } from "sonner";
import { useSettings } from "@/lib/SettingsContext";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

interface Option { name: string; values: string[]; }
interface Attribute { key: string; value: string; }
interface Variant { id: string; stock: number; }

interface Product {
  id:string;name:string;slug:string;brand:string;category:string;
  price:number;compare_price:number|null;color:string|null;
  image_url:string|null;image_url2:string|null;gallery:string|null;
  stock:number;status:string;badge:string|null;
  is_new:number;rating:number;reviews:number;description:string|null;
  sizes:string|null;colors:string|null;variants:string|null;options:string|null;attributes:string|null;weight:number|null;length:number|null;width:number|null;height:number|null;meta_title:string|null;meta_desc:string|null;meta_keywords:string|null;
}

interface DBCategory { id: string; name: string; slug: string; parent_id: string | null; children?: DBCategory[] }
interface DBBrand { id: string; name: string; slug: string }

const CATS = ["Women","Men","Kids","Accessories", "Electronics", "Shoes"];
const EMPTY = {name:"",brand:"Codex",category:"Women",parent_category_id:"",subcategory_id:"",price:"",compare_price:"",color:"#c4a882",image_url:"",image_url2:"",gallery:[] as string[],stock:"100",badge:"",description:"",status:"active",is_new:false,sizes:[] as string[],colors:[] as string[],variants:[] as Variant[],options:[] as Option[],attributes:[] as Attribute[],weight:"",length:"",width:"",height:"",meta_title:"",meta_desc:"",meta_keywords:""};

export default function AdminProductsPage() {
  const { formatPrice } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"add"|"edit"|null>(null);
  const [editing, setEditing]   = useState<Product|null>(null);
  const [form, setForm]         = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [dbBrands, setDbBrands]         = useState<DBBrand[]>([]);

  const load = () => {
    setLoading(true);
    fetch(`/api/products?q=${search}&limit=50&status=`)
      .then(r=>r.json())
      .then(d => { setProducts(d.products ?? []); setTotal(d.total ?? 0); setLoading(false); });
    fetch("/api/categories?format=tree").then(r => r.json()).then(d => setDbCategories(d.categories || [])).catch(()=>null);
    fetch("/api/brands").then(r => r.json()).then(d => setDbBrands(d.brands || [])).catch(()=>null);
  };
  useEffect(load, [search]);

  const openEdit = (p: Product) => {
    const gal: string[] = safeJsonArray(p.gallery);
    const siz: string[] = safeJsonArray(p.sizes);
    const cols: string[] = safeJsonArray(p.colors);
    const vars: Variant[] = safeJsonArray(p.variants);
    const opts: Option[] = safeJsonArray(p.options);
    const attrs: Attribute[] = safeJsonArray(p.attributes);

    if (opts.length === 0) {
      if (cols.length > 0) opts.push({ name: "Color", values: cols });
      if (siz.length > 0) opts.push({ name: "Size", values: siz });
    }

    let matchedParentId = (p as any).category_id || "";
    let matchedSubId = (p as any).subcategory_id || "";

    if (!matchedParentId && p.category) {
      const catLower = p.category.toLowerCase().trim();
      for (const parent of dbCategories) {
        if (parent.name.toLowerCase() === catLower || parent.slug.toLowerCase() === catLower) {
          matchedParentId = parent.id;
          break;
        }
        if (parent.children) {
          for (const sub of parent.children) {
            if (sub.name.toLowerCase() === catLower || sub.slug.toLowerCase() === catLower) {
              matchedParentId = parent.id;
              matchedSubId = sub.id;
              break;
            }
          }
        }
      }
    }

    setForm({name:p.name,brand:p.brand || "Codex",category:p.category,parent_category_id:matchedParentId,subcategory_id:matchedSubId,price:String(p.price),compare_price:String(p.compare_price??""),color:p.color??"#c4a882",image_url:p.image_url??"",image_url2:p.image_url2??"",gallery:gal,stock:String(p.stock),badge:p.badge??"",description:p.description??"",status:p.status,is_new:p.is_new===1,sizes:siz,colors:cols,variants:vars,options:opts,attributes:attrs,weight:String(p.weight??""),length:String(p.length??""),width:String(p.width??""),height:String(p.height??""),meta_title:p.meta_title??"",meta_desc:p.meta_desc??"",meta_keywords:p.meta_keywords??""});
    setEditing(p);
    setModal("edit");
  };

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal("add"); };

  const save = async () => {
    setSaving(true);
    const body = {
      name:form.name, brand:form.brand, category:form.category,
      category_id:form.parent_category_id||null,
      subcategory_id:form.subcategory_id||null,
      price:parseFloat(form.price), comparePrice:form.compare_price?parseFloat(form.compare_price):null,
      color:form.color, stock:parseInt(form.stock), badge:form.badge||null,
      description:form.description, status:form.status, isNew:form.is_new,
      image_url:form.image_url||null, image_url2:form.image_url2||null,
      gallery:JSON.stringify(form.gallery||[]),
      sizes:form.sizes,
      colors:form.colors,
      variants:form.variants,
      options:form.options,
      attributes:form.attributes,
      weight:form.weight?parseFloat(form.weight):null,
      length:form.length?parseFloat(form.length):null,
      width:form.width?parseFloat(form.width):null,
      height:form.height?parseFloat(form.height):null,
      meta_title:form.meta_title||null,
      meta_desc:form.meta_desc||null,
      meta_keywords:form.meta_keywords||null,
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
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading} className="p-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl transition-colors" title="Refresh Products">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={15}/> Add Product
          </button>
        </div>
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
                      <div className="w-10 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        {p.image_url ? <img src={getOptimizedImageUrl(p.image_url, { width: 150, quality: 80 })} alt={p.name} className="w-full h-full object-contain p-0.5" loading="lazy"/> : <div className="w-full h-full" style={{background:`linear-gradient(160deg,${p.color??"#c4a882"},${p.color??"#c4a882"}88)`}}/>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{p.name}</p>
                        <p className="text-[10px] text-neutral-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-500">{p.category}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">{formatPrice(p.price)}</p>
                    {p.compare_price && <p className="text-[10px] text-neutral-400 line-through">{formatPrice(p.compare_price)}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${p.stock<=10?"text-red-500":"text-neutral-600 dark:text-neutral-400"}`}>
                        {p.stock}
                      </span>
                      {p.stock<=10 && (
                        <span title="Low Stock Warning (10 or fewer remaining)" className="inline-flex items-center text-amber-500">
                          <AlertTriangle size={14} />
                        </span>
                      )}
                    </div>
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
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Product Name</label>
                <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] resize-none" rows={3}/>
              </div>

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

              {/* ── Taxonomy & Classification Card ── */}
              <div className="bg-slate-50/90 dark:bg-neutral-800/60 p-6 md:p-7 rounded-2xl border border-slate-200/80 dark:border-neutral-700/60 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-neutral-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#e02020] animate-ping" />
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">
                      Category & Brand Classification
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500">Auto-routes product to storefront menus</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Parent Category Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-2">
                      Parent Category
                    </label>
                    <select
                      value={form.parent_category_id || (dbCategories.find(c => c.name.toLowerCase() === form.category.toLowerCase() || c.children?.some(s => s.name.toLowerCase() === form.category.toLowerCase()))?.id || "")}
                      onChange={e => {
                        const selectedParent = dbCategories.find(c => c.id === e.target.value);
                        setForm(p => ({
                          ...p,
                          parent_category_id: e.target.value,
                          subcategory_id: "",
                          category: selectedParent?.name || p.category
                        }));
                      }}
                      className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/20 focus:border-[#e02020] transition-all"
                    >
                      <option value="">Select Parent Category...</option>
                      {dbCategories.map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                        Subcategory
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const catName = form.category.toLowerCase();
                          let newOpts = [...form.options];
                          let newAttrs = [...form.attributes];

                          if (catName.includes("shoe") || catName.includes("footwear") || catName.includes("sneaker")) {
                            if (!newOpts.find(o => o.name === "Shoe Size (UK)")) newOpts.push({ name: "Shoe Size (UK)", values: ["6", "7", "8", "9", "10", "11"] });
                            if (!newOpts.find(o => o.name === "Color")) newOpts.push({ name: "Color", values: ["Black", "White", "Red"] });
                            if (!newAttrs.find(a => a.key === "Outer Material")) newAttrs.push({ key: "Outer Material", value: "Leather / Mesh" });
                            if (!newAttrs.find(a => a.key === "Sole")) newAttrs.push({ key: "Sole", value: "Rubber Traction" });
                          } else if (catName.includes("electronic") || catName.includes("laptop") || catName.includes("audio")) {
                            if (!newOpts.find(o => o.name === "Color")) newOpts.push({ name: "Color", values: ["Space Gray", "Silver"] });
                            if (!newAttrs.find(a => a.key === "Processor")) newAttrs.push({ key: "Processor", value: "" });
                            if (!newAttrs.find(a => a.key === "RAM")) newAttrs.push({ key: "RAM", value: "16GB" });
                            if (!newAttrs.find(a => a.key === "Storage")) newAttrs.push({ key: "Storage", value: "512GB SSD" });
                          } else {
                            if (!newOpts.find(o => o.name === "Size")) newOpts.push({ name: "Size", values: ["S", "M", "L", "XL"] });
                            if (!newOpts.find(o => o.name === "Color")) newOpts.push({ name: "Color", values: ["Black", "Navy", "White"] });
                            if (!newAttrs.find(a => a.key === "Material")) newAttrs.push({ key: "Material", value: "100% Cotton" });
                          }
                          setForm(p => ({ ...p, options: newOpts, attributes: newAttrs }));
                          toast.success("Loaded Category Presets!");
                        }}
                        className="text-[11px] font-bold text-[#e02020] bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 px-2 py-0.5 rounded transition-colors"
                      >
                        ⚡ Load Presets
                      </button>
                    </div>
                    <select
                      value={form.subcategory_id}
                      onChange={e => {
                        const activeParent = dbCategories.find(c => c.id === form.parent_category_id);
                        const selectedSub = activeParent?.children?.find(s => s.id === e.target.value);
                        setForm(p => ({
                          ...p,
                          subcategory_id: e.target.value,
                          category: selectedSub?.name || activeParent?.name || p.category
                        }));
                      }}
                      className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/20 focus:border-[#e02020] transition-all"
                    >
                      <option value="">(Optional) Select Subcategory...</option>
                      {dbCategories
                        .find(c => c.id === form.parent_category_id)?.children
                        ?.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Brand Dynamic Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-2">
                      Brand
                    </label>
                    <select
                      value={form.brand}
                      onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e02020]/20 focus:border-[#e02020] transition-all"
                    >
                      {(() => {
                        const brandList = Array.from(new Set([
                          ...(form.brand ? [form.brand] : []),
                          ...dbBrands.map(b => b.name),
                          "Codex", "Nike", "Adidas", "Apple", "Casual Comfort", "Urban Chic"
                        ])).filter(Boolean);
                        return brandList.map(b => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              {/* ── Dynamic Specifications (Attributes) ── */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Specifications (Dynamic)</label>
                  <button type="button" onClick={() => setForm(p => ({...p, attributes: [...p.attributes, {key: "", value: ""}]}))} className="text-xs font-bold text-[#e02020] hover:underline flex items-center gap-1"><Plus size={12}/> Add Spec</button>
                </div>
                {form.attributes.length === 0 ? (
                  <p className="text-xs text-neutral-400">No custom specifications added.</p>
                ) : (
                  <div className="space-y-3">
                    {form.attributes.map((attr, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="text" placeholder="Key (e.g. Material)" value={attr.key}
                          onChange={e => {
                            const newAttrs = [...form.attributes];
                            newAttrs[i].key = e.target.value;
                            setForm(p => ({...p, attributes: newAttrs}));
                          }} className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                        <input type="text" placeholder="Value (e.g. Cotton)" value={attr.value}
                          onChange={e => {
                            const newAttrs = [...form.attributes];
                            newAttrs[i].value = e.target.value;
                            setForm(p => ({...p, attributes: newAttrs}));
                          }} className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                        <button type="button" onClick={() => setForm(p => ({...p, attributes: p.attributes.filter((_, idx) => idx !== i)}))} className="p-2 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Dynamic Variant Options Builder ── */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Variant Options</label>
                  <button type="button" onClick={() => setForm(p => ({...p, options: [...p.options, {name: "", values: []}]}))} className="text-xs font-bold text-[#e02020] hover:underline flex items-center gap-1"><Plus size={12}/> Add Option Type</button>
                </div>
                {form.options.length === 0 && <p className="text-xs text-neutral-400">No variant options configured. Add options like "Size" or "Color" to generate combinations.</p>}
                
                {form.options.map((opt, i) => (
                  <div key={i} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-3 mb-3">
                      <input type="text" placeholder="Option Name (e.g. Shoe Size, Color, RAM)" value={opt.name}
                        onChange={e => {
                          const newOpts = [...form.options];
                          newOpts[i].name = e.target.value;
                          setForm(p => ({...p, options: newOpts}));
                        }} className="flex-1 px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                      <button type="button" onClick={() => {
                        const newOpts = form.options.filter((_, idx) => idx !== i);
                        setForm(p => ({...p, options: newOpts}));
                      }} className="text-neutral-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                    
                    {opt.values.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {opt.values.map((v, vIdx) => (
                          <span key={vIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm font-medium shadow-sm">
                            {v}
                            <button type="button" onClick={() => {
                              const newOpts = [...form.options];
                              newOpts[i].values = newOpts[i].values.filter((_, idx) => idx !== vIdx);
                              setForm(p => ({...p, options: newOpts}));
                            }} className="text-neutral-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input type="text" placeholder="Add value (e.g. UK 8) & press Enter"
                      list={`suggestions-${i}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (!opt.values.includes(val)) {
                            const newOpts = [...form.options];
                            newOpts[i].values.push(val);
                            
                            // Rebuild variants matrix
                            let combinations: string[][] = [[]];
                            for (const o of newOpts) {
                              const nextCombos: string[][] = [];
                              if (o.values.length === 0) continue;
                              for (const c of combinations) {
                                for (const v of o.values) nextCombos.push([...c, v]);
                              }
                              combinations = nextCombos;
                            }
                            
                            const newVars = combinations.map(c => {
                              const id = c.join(" / ");
                              const existing = form.variants.find(v => v.id === id);
                              return { id, stock: existing ? existing.stock : 10 };
                            }).filter(v => v.id !== ""); // remove empty
                            
                            setForm(p => ({...p, options: newOpts, variants: newVars}));
                          }
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] transition-colors"/>
                    <datalist id={`suggestions-${i}`}>
                      {opt.name.toLowerCase().includes("size") && ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "US 8", "US 9", "US 10"].map(s => <option key={s} value={s} />)}
                      {(opt.name.toLowerCase().includes("color") || opt.name.toLowerCase().includes("colour")) && ["Black", "White", "Red", "Blue", "Green", "Navy", "Grey", "Beige", "Brown", "Yellow", "Pink", "Purple"].map(s => <option key={s} value={s} />)}
                      {opt.name.toLowerCase().includes("material") && ["Cotton", "Polyester", "Wool", "Silk", "Linen", "Leather", "Denim", "Suede"].map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                ))}

                {/* Variants Matrix */}
                {form.variants.length > 0 && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Variant Stock Levels</label>
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-neutral-600 dark:text-neutral-300">Variant Combination</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-neutral-600 dark:text-neutral-300 w-32">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {form.variants.map((v, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2 font-medium text-neutral-900 dark:text-white">
                                {v.id}
                              </td>
                              <td className="px-4 py-2">
                                <input type="number" min="0" value={v.stock}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    setForm(p => {
                                      const nv = [...p.variants];
                                      nv[i] = {...nv[i], stock: val};
                                      return {...p, variants: nv};
                                    });
                                  }}
                                  className="w-full px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] text-right"/>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SEO & Metadata ── */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Search Engine Optimization (SEO)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const brandName = form.brand || "Codex";
                      const catName = form.category || "Fashion";
                      const optVals = form.options.flatMap(o => o.values);
                      const attrVals = form.attributes.map(a => `${a.key} ${a.value}`);
                      
                      const generatedTitle = `${form.name || "Product"} by ${brandName} | Shop ${catName}`;
                      const generatedDesc = `Buy ${form.name || "this product"} online at the best price. ${form.description ? form.description.slice(0, 120) + "..." : `Explore top quality ${catName} items at ${brandName}.`} Fast shipping & 30-day easy returns!`;
                      
                      const kwSet = new Set<string>();
                      if (form.name) form.name.toLowerCase().split(/\s+/).forEach(w => w.length > 2 && kwSet.add(w));
                      if (form.brand) kwSet.add(form.brand.toLowerCase());
                      if (form.category) kwSet.add(form.category.toLowerCase());
                      optVals.forEach(v => kwSet.add(String(v).toLowerCase()));
                      attrVals.forEach(v => kwSet.add(String(v).toLowerCase()));
                      ["buy online", "shop now", "best price", "free shipping", brandName.toLowerCase()].forEach(k => kwSet.add(k));

                      setForm(p => ({
                        ...p,
                        meta_title: generatedTitle,
                        meta_desc: generatedDesc,
                        meta_keywords: Array.from(kwSet).join(", ")
                      }));
                    }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles size={13} className="text-amber-500 animate-pulse" />
                    AI Auto-Generate SEO
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Meta Title (SEO Title)</label>
                    <input type="text" value={form.meta_title} onChange={e=>setForm(p=>({...p,meta_title:e.target.value}))} placeholder={`Default: ${form.name || "Product Name"}`}
                      className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#e02020]"/>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Meta Description (SEO Snippet)</label>
                    <textarea value={form.meta_desc} onChange={e=>setForm(p=>({...p,meta_desc:e.target.value}))} placeholder="Leave blank to auto-generate from product description..." rows={2}
                      className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#e02020] resize-none"/>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Meta Keywords (Comma-Separated)</label>
                    <input type="text" value={form.meta_keywords} onChange={e=>setForm(p=>({...p,meta_keywords:e.target.value}))} placeholder="e.g. shoes, nike, sneakers, mens fashion, buy online"
                      className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#e02020]"/>
                  </div>
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
