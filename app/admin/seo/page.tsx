"use client";
import { useEffect, useState } from "react";
import { Globe, Search, Check, Edit2, ExternalLink, RefreshCw, Image, Sparkles } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

interface SeoPage { id:string;page:string;title:string;description:string;og_title:string;og_desc:string;og_image:string;canonical:string;robots:string }
interface SeoProduct { id:string;name:string;slug:string;meta_title:string|null;meta_desc:string|null;og_image:string|null;image_url:string|null }

const SCORE_COLOR = (s:number) => s>=80?"text-green-600":s>=50?"text-yellow-600":"text-red-500";
const seoScore = (title:string|null, desc:string|null) => {
  let s = 0;
  if (title && title.length >= 30 && title.length <= 70) s += 40;
  else if (title) s += 20;
  if (desc && desc.length >= 100 && desc.length <= 160) s += 40;
  else if (desc) s += 20;
  return s;
};

export default function AdminSeoPage() {
  const [pages,    setPages]    = useState<SeoPage[]>([]);
  const [products, setProducts] = useState<SeoProduct[]>([]);
  const [tab,      setTab]      = useState<"pages"|"products">("pages");
  const [editing,  setEditing]  = useState<SeoPage|SeoProduct|null>(null);
  const [form,     setForm]     = useState<Record<string,string>>({});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [search,   setSearch]   = useState("");

  const load = () => {
    fetch("/api/seo").then(r=>r.json()).then(d => { setPages(d.pages??[]); setProducts(d.products??[]); });
  };
  useEffect(load, []);

  const openEdit = (item: SeoPage|SeoProduct) => {
    setEditing(item);
    setForm("page" in item
      ? {title:item.title??"",description:item.description??"",og_title:item.og_title??"",og_desc:item.og_desc??"",og_image:item.og_image??"",robots:item.robots??"index,follow"}
      : {meta_title:item.meta_title??"",meta_desc:item.meta_desc??"",og_image:item.og_image??""});
  };

  const generateAiSeo = async () => {
    if (!editing) return;
    setAiGenerating(true);
    const itemTitle = "page" in editing ? editing.page : (editing as SeoProduct).name;
    try {
      const res = await fetch("/api/admin/ai-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: itemTitle })
      });
      const data = await res.json();
      if (data.ok) {
        if ("page" in editing) {
          setForm(p => ({ ...p, title: data.metaTitle, description: data.metaDesc, og_title: data.ogTitle, og_desc: data.ogDesc }));
        } else {
          setForm(p => ({ ...p, meta_title: data.metaTitle, meta_desc: data.metaDesc }));
        }
      }
    } catch {}
    setAiGenerating(false);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const body = "page" in editing
      ? { type:"page",   page: editing.page, ...form }
      : { type:"product", id: editing.id,    ...form };
    await fetch("/api/seo", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(null); load(); }, 700);
  };

  const filteredPages    = pages.filter(p => p.page.includes(search));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">SEO Manager</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage meta titles, descriptions, OG tags for all pages and products</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm hover:border-[#e02020] transition-colors">
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* SEO score overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"Pages with SEO",    value:`${pages.filter(p=>p.title&&p.description).length}/${pages.length}`,  color:"#22c55e"},
          {label:"Products with SEO", value:`${products.filter(p=>p.meta_title&&p.meta_desc).length}/${products.length}`, color:"#3b82f6"},
          {label:"Missing meta desc", value:String(pages.filter(p=>!p.description).length+products.filter(p=>!p.meta_desc).length), color:"#f59e0b"},
        ].map(({label,value,color}) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}18`}}>
              <Globe size={18} style={{color}}/>
            </div>
            <div><p className="font-display font-black text-xl text-neutral-900 dark:text-white">{value}</p><p className="text-xs text-neutral-400">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 items-center flex-wrap">
        {(["pages","products"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${tab===t?"bg-[#e02020] text-white":"bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-700 hover:text-[#e02020]"}`}>
            {t} ({t==="pages"?pages.length:products.length})
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            className="pl-8 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#e02020] w-48"/>
        </div>
      </div>

      {/* Pages table */}
      {tab === "pages" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>{["Page","Title","Description","Score","Robots","Actions"].map(h =>
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredPages.map(p => {
                const score = seoScore(p.title,p.description);
                return (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-[#e02020] bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">{p.page}</code>
                        <a href={p.page} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-[#e02020]"><ExternalLink size={12}/></a>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]"><p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{p.title||<span className="text-red-400 italic">Missing</span>}</p><p className="text-[10px] text-neutral-400">{p.title?.length??0}/70 chars</p></td>
                    <td className="px-5 py-4 max-w-[200px]"><p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{p.description||<span className="text-red-400 italic">Missing</span>}</p><p className="text-[10px] text-neutral-400">{p.description?.length??0}/160 chars</p></td>
                    <td className="px-5 py-4"><span className={`text-sm font-black ${SCORE_COLOR(score)}`}>{score}</span><span className="text-neutral-400 text-[10px]">/80</span></td>
                    <td className="px-5 py-4"><span className="text-[10px] font-mono text-neutral-500">{p.robots}</span></td>
                    <td className="px-5 py-4"><button onClick={()=>openEdit(p)} className="p-1.5 text-neutral-400 hover:text-[#e02020] transition-colors"><Edit2 size={14}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Products SEO table */}
      {tab === "products" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>{["Product","Meta Title","Meta Description","OG Image","Score","Edit"].map(h =>
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProducts.map(p => {
                const score = seoScore(p.meta_title, p.meta_desc);
                return (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.image_url && <img src={getOptimizedImageUrl(p.image_url, { width: 150, quality: 80 })} alt={p.name} className="w-8 h-10 rounded-lg object-contain p-0.5 bg-neutral-100 dark:bg-neutral-800 flex-shrink-0" loading="lazy"/>}
                        <div><p className="text-sm font-medium text-neutral-900 dark:text-white">{p.name}</p><code className="text-[10px] text-neutral-400">/product/{p.slug}</code></div>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]"><p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{p.meta_title||<span className="text-red-400 italic">Missing</span>}</p></td>
                    <td className="px-5 py-4 max-w-[200px]"><p className="text-xs text-neutral-500 truncate">{p.meta_desc||<span className="text-red-400 italic">Missing</span>}</p></td>
                    <td className="px-5 py-4">
                      {p.og_image ? <span className="text-[10px] text-green-600 flex items-center gap-1"><Image size={10}/>Set</span> : <span className="text-[10px] text-neutral-400 italic">None</span>}
                    </td>
                    <td className="px-5 py-4"><span className={`text-sm font-black ${SCORE_COLOR(score)}`}>{score}</span><span className="text-neutral-400 text-[10px]">/80</span></td>
                    <td className="px-5 py-4"><button onClick={()=>openEdit(p)} className="p-1.5 text-neutral-400 hover:text-[#e02020] transition-colors"><Edit2 size={14}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setEditing(null)}/>
          <div style={{maxWidth:"1140px"}} className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h2 className="font-semibold text-neutral-900 dark:text-white">Edit SEO</h2>
                <p className="text-xs text-neutral-400 mt-0.5">{"page" in editing ? editing.page : (editing as SeoProduct).name}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={generateAiSeo}
                  disabled={aiGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e02020]/10 text-[#e02020] hover:bg-[#e02020] hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Sparkles size={13} /> {aiGenerating ? "Generating..." : "✨ AI Generate SEO"}
                </button>
                <button onClick={()=>setEditing(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {"page" in editing ? (
                <>
                  {[["title","Meta Title (30–70 chars)"],["description","Meta Description (100–160 chars)"],["og_title","OG Title"],["og_desc","OG Description"],["og_image","OG Image URL"],["canonical","Canonical URL"]].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{l}</label>
                      {k==="description"||k==="og_desc" ? (
                        <textarea value={form[k]??""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                          className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] resize-none" rows={3}/>
                      ) : (
                        <input value={form[k]??""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                          className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                      )}
                      {(k==="title"||k==="description") && (
                        <p className={`text-[10px] mt-1 ${(form[k]?.length??0)>0&&(form[k]?.length??0)<(k==="title"?30:100)?"text-red-400":(form[k]?.length??0)>(k==="title"?70:160)?"text-red-400":"text-green-600"}`}>
                          {form[k]?.length??0}/{k==="title"?"70":"160"}
                        </p>
                      )}
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Robots</label>
                    <select value={form.robots??""} onChange={e=>setForm(p=>({...p,robots:e.target.value}))}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]">
                      <option>index,follow</option><option>noindex,follow</option><option>noindex,nofollow</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {[["meta_title","Meta Title (30–70 chars)"],["meta_desc","Meta Description (100–160 chars)"],["og_image","OG Image URL"]].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{l}</label>
                      {k==="meta_desc" ? (
                        <textarea value={form[k]??""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                          className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] resize-none" rows={3}/>
                      ) : (
                        <input value={form[k]??""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                          className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                      )}
                    </div>
                  ))}
                </>
              )}
              <button onClick={save} disabled={saving||saved}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${saved?"bg-green-500 text-white":saving?"bg-neutral-200 text-neutral-400 cursor-not-allowed":"bg-[#e02020] hover:bg-[#c01a1a] text-white"}`}>
                {saved?<><Check size={15}/>Saved!</>:saving?"Saving…":"Save SEO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
